import { getSql, getTableColumns, hasTable } from './sqlite';
import { unpackJWLibrary } from './zip';
import { 
  getLanguageName, 
  resolvePublicationCategory, 
  PUBLICATION_CATEGORY_DEFINITIONS 
} from './constants';
import { resolveLocationMetadata, type RawLocationRecord } from './locations';
import type { 
  BackupMetadata, 
  TableCounts, 
  NoteDetail, 
  BookmarkDetail,
  PublicationCategoryKey 
} from './types';

const KNOWN_TABLES = [
  'Location',
  'Tag',
  'TagMap',
  'UserMark',
  'BlockRange',
  'Note',
  'Bookmark',
  'InputField',
  'IndependentMedia',
  'PlaylistItem'
];

export async function inspectBackupFile(file: File): Promise<BackupMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);
  
  const { manifest, userDataDbBytes, extraFiles } = await unpackJWLibrary(rawBytes);

  const SQL = await getSql();
  const db = new SQL.Database(userDataDbBytes);

  const counts: TableCounts = {
    Location: 0,
    Tag: 0,
    TagMap: 0,
    UserMark: 0,
    BlockRange: 0,
    Note: 0,
    Bookmark: 0,
    InputField: 0,
    IndependentMedia: 0,
    PlaylistItem: 0
  };

  try {
    for (const table of KNOWN_TABLES) {
      try {
        if (hasTable(db, table)) {
          const res = db.exec(`SELECT count(*) as count FROM "${table}"`);
          if (res.length > 0 && res[0].values.length > 0) {
            counts[table] = res[0].values[0][0] as number;
          }
        }
      } catch (e) {
        // Table might not exist in older schemas
        counts[table] = 0;
      }
    }

    let lastModifiedFromDb = manifest.userDataBackup?.lastModifiedDate || '';
    try {
      if (hasTable(db, 'LastModified')) {
        const res = db.exec('SELECT LastModified FROM LastModified LIMIT 1');
        if (res.length > 0 && res[0].values.length > 0) {
          lastModifiedFromDb = res[0].values[0][0] as string;
        }
      }
    } catch (e) {
      // ignore
    }

    const deviceName = manifest.userDataBackup?.deviceName || 'Unknown Device';
    const schemaVersion = manifest.userDataBackup?.schemaVersion || 0;

    return {
      id: crypto.randomUUID(),
      fileName: file.name,
      fileSize: file.size,
      deviceName,
      lastModifiedDate: lastModifiedFromDb,
      creationDate: manifest.creationDate || '',
      schemaVersion,
      counts,
      file,
      rawZipBytes: rawBytes,
      userDataDbBytes,
      manifest,
      extraFiles
    };
  } finally {
    db.close();
  }
}

export async function extractNoteDetails(dbBytes: Uint8Array, limit?: number): Promise<NoteDetail[]> {
  const SQL = await getSql();
  const db = new SQL.Database(dbBytes);
  const notes: NoteDetail[] = [];

  try {
    if (!hasTable(db, 'Note')) return [];

    const hasLocation = hasTable(db, 'Location');
    const hasUserMark = hasTable(db, 'UserMark');

    // 1. Index Locations in memory
    const locationMap = new Map<number, RawLocationRecord>();
    if (hasLocation) {
      const locRes = db.exec('SELECT * FROM Location');
      if (locRes.length > 0) {
        const { columns, values } = locRes[0];
        const colVal = (row: any[], name: string) => {
          const idx = columns.indexOf(name);
          return idx !== -1 ? row[idx] : null;
        };
        for (const row of values) {
          const locId = colVal(row, 'LocationId') as number;
          if (!locId) continue;
          const mepsLang = (colVal(row, 'MepsLanguage') ?? 0) as number;
          locationMap.set(locId, {
            locationId: locId,
            bookNumber: colVal(row, 'BookNumber') as number | null,
            chapterNumber: colVal(row, 'ChapterNumber') as number | null,
            documentId: colVal(row, 'DocumentId') as number | null,
            track: colVal(row, 'Track') as number | null,
            issueTagNumber: colVal(row, 'IssueTagNumber') as number | null,
            keySymbol: colVal(row, 'KeySymbol') as string | null,
            mepsLanguage: isNaN(mepsLang) ? 0 : mepsLang,
            type: colVal(row, 'Type') as number | null,
            title: colVal(row, 'Title') as string | null
          });
        }
      }
    }

    // 2. Index UserMark -> LocationId & ColorIndex in memory
    const userMarkMap = new Map<number, { locationId: number | null; colorIndex: number | null }>();
    if (hasUserMark) {
      const umRes = db.exec('SELECT * FROM UserMark');
      if (umRes.length > 0) {
        const { columns, values } = umRes[0];
        const colVal = (row: any[], name: string) => {
          const idx = columns.indexOf(name);
          return idx !== -1 ? row[idx] : null;
        };
        for (const row of values) {
          const umId = colVal(row, 'UserMarkId') as number;
          if (!umId) continue;
          userMarkMap.set(umId, {
            locationId: colVal(row, 'LocationId') as number | null,
            colorIndex: colVal(row, 'ColorIndex') as number | null
          });
        }
      }
    }

    // 3. Query Notes
    const noteCols = getTableColumns(db, 'Note');
    const hasLastMod = noteCols.has('LastModified');
    const orderClause = hasLastMod ? 'ORDER BY LastModified DESC' : 'ORDER BY NoteId DESC';
    const limitClause = limit && limit > 0 ? `LIMIT ${limit}` : '';

    const noteRes = db.exec(`SELECT * FROM Note ${orderClause} ${limitClause}`);
    if (noteRes.length > 0) {
      const { columns, values } = noteRes[0];
      const colVal = (row: any[], name: string) => {
        const idx = columns.indexOf(name);
        return idx !== -1 ? row[idx] : null;
      };

      for (const row of values) {
        const noteId = colVal(row, 'NoteId') as number;
        const guid = (colVal(row, 'Guid') || `note-${noteId}`) as string;
        const title = colVal(row, 'Title') as string | null;
        const content = colVal(row, 'Content') as string | null;
        const lastModified = (colVal(row, 'LastModified') || new Date().toISOString()) as string;
        const created = (colVal(row, 'Created') || lastModified) as string;

        const rawLocId = colVal(row, 'LocationId') as number | null;
        const userMarkId = colVal(row, 'UserMarkId') as number | null;
        const umData = userMarkId ? userMarkMap.get(userMarkId) : undefined;
        const resolvedLocId = rawLocId || umData?.locationId || null;
        const colorIndex = (umData?.colorIndex ?? undefined) as number | undefined;

        let locRecord = resolvedLocId ? locationMap.get(resolvedLocId) : undefined;
        let mepsLanguage: number | undefined = undefined;
        let languageName: string | undefined = undefined;
        let category: PublicationCategoryKey = 'independent_notes';
        let categoryLabel: string = 'Independent Notes';
        let locationTitle: string | undefined = undefined;

        if (locRecord) {
          mepsLanguage = locRecord.mepsLanguage ?? 0;
          languageName = getLanguageName(mepsLanguage);
          category = resolvePublicationCategory(locRecord);
          categoryLabel = PUBLICATION_CATEGORY_DEFINITIONS[category]?.shortLabel || 'General';
          const meta = resolveLocationMetadata(locRecord);
          locationTitle = meta.resolvedTitle;
        }

        notes.push({
          noteId,
          guid,
          title,
          content,
          lastModified,
          created,
          locationTitle,
          colorIndex,
          locationId: resolvedLocId,
          mepsLanguage,
          languageName,
          publicationCategory: category,
          publicationCategoryLabel: categoryLabel,
          keySymbol: locRecord?.keySymbol ?? null,
          bookNumber: locRecord?.bookNumber ?? null,
          chapterNumber: locRecord?.chapterNumber ?? null,
          documentId: locRecord?.documentId ?? null,
          issueTagNumber: locRecord?.issueTagNumber ?? null
        });
      }
    }
  } catch (err) {
    console.error('Failed to extract notes:', err);
  } finally {
    db.close();
  }

  return notes;
}

export async function extractBookmarkDetails(dbBytes: Uint8Array): Promise<BookmarkDetail[]> {
  const SQL = await getSql();
  const db = new SQL.Database(dbBytes);
  const bookmarks: BookmarkDetail[] = [];

  try {
    if (!hasTable(db, 'Bookmark')) return [];

    const hasLocation = hasTable(db, 'Location');

    // Index Locations in memory
    const locationMap = new Map<number, RawLocationRecord>();
    if (hasLocation) {
      const locRes = db.exec('SELECT * FROM Location');
      if (locRes.length > 0) {
        const { columns, values } = locRes[0];
        const colVal = (row: any[], name: string) => {
          const idx = columns.indexOf(name);
          return idx !== -1 ? row[idx] : null;
        };
        for (const row of values) {
          const locId = colVal(row, 'LocationId') as number;
          if (!locId) continue;
          const mepsLang = (colVal(row, 'MepsLanguage') ?? 0) as number;
          locationMap.set(locId, {
            locationId: locId,
            bookNumber: colVal(row, 'BookNumber') as number | null,
            chapterNumber: colVal(row, 'ChapterNumber') as number | null,
            documentId: colVal(row, 'DocumentId') as number | null,
            track: colVal(row, 'Track') as number | null,
            issueTagNumber: colVal(row, 'IssueTagNumber') as number | null,
            keySymbol: colVal(row, 'KeySymbol') as string | null,
            mepsLanguage: isNaN(mepsLang) ? 0 : mepsLang,
            type: colVal(row, 'Type') as number | null,
            title: colVal(row, 'Title') as string | null
          });
        }
      }
    }

    const bmCols = getTableColumns(db, 'Bookmark');
    const orderClause = bmCols.has('Slot') ? 'ORDER BY Slot ASC' : 'ORDER BY BookmarkId ASC';
    const bmRes = db.exec(`SELECT * FROM Bookmark ${orderClause}`);

    if (bmRes.length > 0) {
      const { columns, values } = bmRes[0];
      const colVal = (row: any[], name: string) => {
        const idx = columns.indexOf(name);
        return idx !== -1 ? row[idx] : null;
      };

      for (const row of values) {
        const bookmarkId = colVal(row, 'BookmarkId') as number;
        const title = (colVal(row, 'Title') || `Bookmark #${bookmarkId}`) as string;
        const snippet = colVal(row, 'Snippet') as string | null;
        const slot = (colVal(row, 'Slot') ?? 0) as number;
        const locId = (colVal(row, 'LocationId') || colVal(row, 'PublicationLocationId')) as number | null;

        let locRecord = locId ? locationMap.get(locId) : undefined;
        let mepsLanguage: number | undefined = undefined;
        let languageName: string | undefined = undefined;
        let category: PublicationCategoryKey = 'independent_notes';
        let categoryLabel: string = 'Independent Notes';
        let locationTitle: string | undefined = undefined;

        if (locRecord) {
          mepsLanguage = locRecord.mepsLanguage ?? 0;
          languageName = getLanguageName(mepsLanguage);
          category = resolvePublicationCategory(locRecord);
          categoryLabel = PUBLICATION_CATEGORY_DEFINITIONS[category]?.shortLabel || 'General';
          const meta = resolveLocationMetadata(locRecord);
          locationTitle = meta.resolvedTitle;
        }

        bookmarks.push({
          bookmarkId,
          title,
          snippet,
          slot,
          locationTitle,
          locationId: locId,
          mepsLanguage,
          languageName,
          publicationCategory: category,
          publicationCategoryLabel: categoryLabel,
          keySymbol: locRecord?.keySymbol ?? null,
          bookNumber: locRecord?.bookNumber ?? null,
          chapterNumber: locRecord?.chapterNumber ?? null,
          documentId: locRecord?.documentId ?? null,
          issueTagNumber: locRecord?.issueTagNumber ?? null
        });
      }
    }
  } catch (err) {
    console.error('Failed to extract bookmarks:', err);
  } finally {
    db.close();
  }

  return bookmarks;
}

export interface NotesFilterOptions {
  searchQuery?: string;
  language?: number | 'all';
  category?: PublicationCategoryKey | 'all';
  sortBy?: 'modified_desc' | 'modified_asc' | 'created_desc' | 'created_asc' | 'title_asc' | 'title_desc';
}

export interface BookmarksFilterOptions {
  searchQuery?: string;
  language?: number | 'all';
  category?: PublicationCategoryKey | 'all';
  sortBy?: 'slot_asc' | 'slot_desc' | 'title_asc' | 'title_desc';
}

export function filterAndSortNotes(notes: NoteDetail[], options: NotesFilterOptions = {}): NoteDetail[] {
  const {
    searchQuery = '',
    language = 'all',
    category = 'all',
    sortBy = 'modified_desc'
  } = options;

  const query = searchQuery.trim().toLowerCase();

  const filtered = notes.filter(note => {
    // 1. Text Search Filter
    if (query) {
      const matchTitle = note.title?.toLowerCase().includes(query) ?? false;
      const matchContent = note.content?.toLowerCase().includes(query) ?? false;
      const matchLoc = note.locationTitle?.toLowerCase().includes(query) ?? false;
      const matchCat = note.publicationCategoryLabel?.toLowerCase().includes(query) ?? false;
      const matchLang = note.languageName?.toLowerCase().includes(query) ?? false;
      const matchSym = note.keySymbol?.toLowerCase().includes(query) ?? false;

      if (!matchTitle && !matchContent && !matchLoc && !matchCat && !matchLang && !matchSym) {
        return false;
      }
    }

    // 2. Language Filter
    if (language !== 'all') {
      if (note.mepsLanguage !== language) {
        return false;
      }
    }

    // 3. Category Filter
    if (category !== 'all') {
      if (note.publicationCategory !== category) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  return filtered.sort((a, b) => {
    switch (sortBy) {
      case 'modified_asc':
        return (a.lastModified || '').localeCompare(b.lastModified || '');
      case 'created_desc':
        return (b.created || '').localeCompare(a.created || '');
      case 'created_asc':
        return (a.created || '').localeCompare(b.created || '');
      case 'title_asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'title_desc':
        return (b.title || '').localeCompare(a.title || '');
      case 'modified_desc':
      default:
        return (b.lastModified || '').localeCompare(a.lastModified || '');
    }
  });
}

export function filterAndSortBookmarks(bookmarks: BookmarkDetail[], options: BookmarksFilterOptions = {}): BookmarkDetail[] {
  const {
    searchQuery = '',
    language = 'all',
    category = 'all',
    sortBy = 'slot_asc'
  } = options;

  const query = searchQuery.trim().toLowerCase();

  const filtered = bookmarks.filter(bm => {
    // 1. Text Search Filter
    if (query) {
      const matchTitle = bm.title?.toLowerCase().includes(query) ?? false;
      const matchSnippet = bm.snippet?.toLowerCase().includes(query) ?? false;
      const matchLoc = bm.locationTitle?.toLowerCase().includes(query) ?? false;
      const matchCat = bm.publicationCategoryLabel?.toLowerCase().includes(query) ?? false;
      const matchLang = bm.languageName?.toLowerCase().includes(query) ?? false;
      const matchSym = bm.keySymbol?.toLowerCase().includes(query) ?? false;

      if (!matchTitle && !matchSnippet && !matchLoc && !matchCat && !matchLang && !matchSym) {
        return false;
      }
    }

    // 2. Language Filter
    if (language !== 'all') {
      if (bm.mepsLanguage !== language) {
        return false;
      }
    }

    // 3. Category Filter
    if (category !== 'all') {
      if (bm.publicationCategory !== category) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  return filtered.sort((a, b) => {
    switch (sortBy) {
      case 'slot_desc':
        return b.slot - a.slot;
      case 'title_asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'title_desc':
        return (b.title || '').localeCompare(a.title || '');
      case 'slot_asc':
      default:
        return a.slot - b.slot;
    }
  });
}

export function getAvailableNoteLanguages(notes: NoteDetail[]): Array<{ id: number; name: string; count: number }> {
  const map = new Map<number, { name: string; count: number }>();
  for (const n of notes) {
    if (n.mepsLanguage !== undefined) {
      const existing = map.get(n.mepsLanguage);
      if (existing) {
        existing.count++;
      } else {
        map.set(n.mepsLanguage, { name: n.languageName || `Language #${n.mepsLanguage}`, count: 1 });
      }
    }
  }
  return Array.from(map.entries())
    .map(([id, data]) => ({ id, name: data.name, count: data.count }))
    .sort((a, b) => b.count - a.count);
}

export function getAvailableBookmarkLanguages(bookmarks: BookmarkDetail[]): Array<{ id: number; name: string; count: number }> {
  const map = new Map<number, { name: string; count: number }>();
  for (const b of bookmarks) {
    if (b.mepsLanguage !== undefined) {
      const existing = map.get(b.mepsLanguage);
      if (existing) {
        existing.count++;
      } else {
        map.set(b.mepsLanguage, { name: b.languageName || `Language #${b.mepsLanguage}`, count: 1 });
      }
    }
  }
  return Array.from(map.entries())
    .map(([id, data]) => ({ id, name: data.name, count: data.count }))
    .sort((a, b) => b.count - a.count);
}

export function getAvailableNoteCategories(notes: NoteDetail[]): Array<{ key: PublicationCategoryKey; label: string; shortLabel: string; count: number }> {
  const map = new Map<PublicationCategoryKey, number>();
  for (const n of notes) {
    const cat = n.publicationCategory || 'independent_notes';
    map.set(cat, (map.get(cat) || 0) + 1);
  }
  const allCatKeys: PublicationCategoryKey[] = ['bible', 'watchtower', 'workbook', 'books_brochures', 'independent_notes'];
  return allCatKeys.map(key => {
    const def = PUBLICATION_CATEGORY_DEFINITIONS[key];
    return {
      key,
      label: def.label,
      shortLabel: def.shortLabel,
      count: map.get(key) || 0
    };
  });
}

export function getAvailableBookmarkCategories(bookmarks: BookmarkDetail[]): Array<{ key: PublicationCategoryKey; label: string; shortLabel: string; count: number }> {
  const map = new Map<PublicationCategoryKey, number>();
  for (const b of bookmarks) {
    const cat = b.publicationCategory || 'independent_notes';
    map.set(cat, (map.get(cat) || 0) + 1);
  }
  const allCatKeys: PublicationCategoryKey[] = ['bible', 'watchtower', 'workbook', 'books_brochures', 'independent_notes'];
  return allCatKeys.map(key => {
    const def = PUBLICATION_CATEGORY_DEFINITIONS[key];
    return {
      key,
      label: def.label,
      shortLabel: def.shortLabel,
      count: map.get(key) || 0
    };
  });
}

export { extractLocationDetails, getLocationSummaryStats } from './locations';


