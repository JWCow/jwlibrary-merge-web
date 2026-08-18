import { getSql, hasTable, getTableColumns } from './sqlite';
import { 
  getLanguageInfo, 
  getBibleBookInfo, 
  getBibleBookName, 
  getPublicationInfo 
} from './constants';
import { parseIssueTagNumber } from './analytics';
import type { 
  LocationDetail, 
  LocationCategoryType, 
  LocationSummaryStats 
} from './types';

export interface RawLocationRecord {
  locationId: number;
  bookNumber?: number | null;
  chapterNumber?: number | null;
  documentId?: number | null;
  track?: number | null;
  issueTagNumber?: number | null;
  keySymbol?: string | null;
  mepsLanguage?: number | null;
  type?: number | null;
  title?: string | null;
}

/**
 * Resolves raw database Location columns into human-friendly titles,
 * publication metadata, Bible chapters, and categories.
 */
export function resolveLocationMetadata(raw: RawLocationRecord): {
  resolvedTitle: string;
  shortTitle: string;
  category: LocationCategoryType;
  categoryLabel: string;
  issueTagFormatted?: string;
} {
  const {
    locationId,
    bookNumber,
    chapterNumber,
    documentId,
    track,
    issueTagNumber,
    keySymbol,
    type,
    title
  } = raw;

  // 1. Bible Chapter Location
  const isBible = 
    (bookNumber !== null && bookNumber !== undefined && bookNumber >= 1 && bookNumber <= 66) ||
    (keySymbol && ['nwt', 'nwtsty', 'bi12', 'int'].includes(keySymbol.toLowerCase().trim())) ||
    type === 0;

  if (isBible) {
    if (bookNumber && bookNumber >= 1 && bookNumber <= 66) {
      const bookInfo = getBibleBookInfo(bookNumber);
      const bName = bookInfo?.name || getBibleBookName(bookNumber);
      const bShort = bookInfo?.shortName || bName;

      if (chapterNumber && chapterNumber > 0) {
        return {
          resolvedTitle: `${bName} ${chapterNumber}`,
          shortTitle: `${bShort} ${chapterNumber}`,
          category: 'bible',
          categoryLabel: 'Bible Chapter'
        };
      }

      return {
        resolvedTitle: bName,
        shortTitle: bShort,
        category: 'bible',
        categoryLabel: 'Bible Book'
      };
    }

    if (title && title.trim()) {
      return {
        resolvedTitle: title.trim(),
        shortTitle: title.trim(),
        category: 'bible',
        categoryLabel: 'Bible Chapter'
      };
    }

    return {
      resolvedTitle: 'The Holy Scriptures',
      shortTitle: 'Bible',
      category: 'bible',
      categoryLabel: 'Bible Chapter'
    };
  }

  // 2. Media Track Location
  const isMedia = 
    (track !== null && track !== undefined && track > 0) ||
    type === 2 ||
    (keySymbol && ['sjj', 'sn', 'sb', 'mrt'].includes(keySymbol.toLowerCase().trim()) && track !== null && track !== undefined);

  if (isMedia) {
    if (title && title.trim()) {
      const trimmed = title.trim();
      return {
        resolvedTitle: track && track > 0 && !trimmed.toLowerCase().includes('track') ? `${trimmed} (Track ${track})` : trimmed,
        shortTitle: trimmed,
        category: 'media',
        categoryLabel: 'Media Track'
      };
    }

    if (keySymbol && keySymbol.trim()) {
      const pub = getPublicationInfo(keySymbol);
      if (track && track > 0) {
        return {
          resolvedTitle: `${pub.title} (Track ${track})`,
          shortTitle: `${pub.shortTitle} (Trk ${track})`,
          category: 'media',
          categoryLabel: 'Media Track'
        };
      }
      return {
        resolvedTitle: pub.title,
        shortTitle: pub.shortTitle,
        category: 'media',
        categoryLabel: 'Media Track'
      };
    }

    if (track && track > 0) {
      return {
        resolvedTitle: `Media Track #${track}`,
        shortTitle: `Track #${track}`,
        category: 'media',
        categoryLabel: 'Media Track'
      };
    }

    return {
      resolvedTitle: `Media Item #${locationId}`,
      shortTitle: `Media #${locationId}`,
      category: 'media',
      categoryLabel: 'Media Track'
    };
  }

  // 3. Publication Document Location
  const hasPubSymbol = Boolean(keySymbol && keySymbol.trim());
  const hasDocId = documentId !== null && documentId !== undefined;
  const hasIssueTag = issueTagNumber !== null && issueTagNumber !== undefined && issueTagNumber > 0;
  const isPub = hasPubSymbol || hasDocId || hasIssueTag || type === 1 || (title && title.trim());

  if (isPub) {
    const issueTagParsed = hasIssueTag ? parseIssueTagNumber(issueTagNumber, keySymbol) : undefined;
    const issueFormatted = issueTagParsed?.formatted;

    if (title && title.trim()) {
      return {
        resolvedTitle: title.trim(),
        shortTitle: title.trim(),
        category: 'publication',
        categoryLabel: 'Publication Document',
        issueTagFormatted: issueFormatted
      };
    }

    if (hasPubSymbol) {
      const pub = getPublicationInfo(keySymbol);
      let titleStr = pub.title;
      let shortStr = pub.shortTitle;

      if (issueFormatted && issueFormatted !== 'Unknown Issue') {
        titleStr = `${pub.title} (${issueFormatted})`;
        shortStr = `${pub.shortTitle} (${issueFormatted})`;
      }

      if (hasDocId) {
        titleStr = `${titleStr} — Doc #${documentId}`;
      }

      return {
        resolvedTitle: titleStr,
        shortTitle: shortStr,
        category: 'publication',
        categoryLabel: 'Publication Document',
        issueTagFormatted: issueFormatted
      };
    }

    if (hasDocId) {
      return {
        resolvedTitle: `Publication Document #${documentId}`,
        shortTitle: `Doc #${documentId}`,
        category: 'publication',
        categoryLabel: 'Publication Document',
        issueTagFormatted: issueFormatted
      };
    }
  }

  // 4. Other / Unspecified Location
  return {
    resolvedTitle: title && title.trim() ? title.trim() : `Location #${locationId}`,
    shortTitle: `Loc #${locationId}`,
    category: 'other',
    categoryLabel: 'Location'
  };
}

/**
 * Extracts and decorates all Location records from a JW Library SQLite database with
 * resolved titles, publication symbols, MEPS languages, and attached annotation counts.
 */
export async function extractLocationDetails(dbBytes: Uint8Array): Promise<LocationDetail[]> {
  const SQL = await getSql();
  const db = new SQL.Database(dbBytes);
  const locations: LocationDetail[] = [];

  try {
    if (!hasTable(db, 'Location')) return [];

    const hasUserMark = hasTable(db, 'UserMark');
    const hasNote = hasTable(db, 'Note');
    const hasBookmark = hasTable(db, 'Bookmark');
    const hasInputField = hasTable(db, 'InputField');

    // 1. Fetch all raw Locations
    const locRes = db.exec('SELECT * FROM Location ORDER BY LocationId ASC');
    if (locRes.length === 0 || locRes[0].values.length === 0) {
      return [];
    }

    const { columns, values } = locRes[0];
    const colVal = (row: any[], name: string) => {
      const idx = columns.indexOf(name);
      return idx !== -1 ? row[idx] : null;
    };

    // 2. Aggregate UserMark highlights by LocationId
    const markCounts = new Map<number, number>();
    if (hasUserMark) {
      try {
        const umCols = getTableColumns(db, 'UserMark');
        if (umCols.has('LocationId')) {
          const res = db.exec('SELECT LocationId, count(*) as cnt FROM UserMark WHERE LocationId IS NOT NULL GROUP BY LocationId');
          if (res.length > 0) {
            for (const row of res[0].values) {
              markCounts.set(row[0] as number, row[1] as number);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to count UserMarks by location:', e);
      }
    }

    // 3. Aggregate Notes by resolved LocationId and track latest modification date
    const noteCounts = new Map<number, number>();
    const lastModifiedByLoc = new Map<number, string>();

    if (hasNote) {
      try {
        const noteCols = getTableColumns(db, 'Note');
        const umCols = hasUserMark ? getTableColumns(db, 'UserMark') : new Set<string>();
        const hasNoteLoc = noteCols.has('LocationId');
        const hasNoteUm = noteCols.has('UserMarkId') && hasUserMark && umCols.has('LocationId');
        const hasLastMod = noteCols.has('LastModified');

        if (hasNoteLoc || hasNoteUm) {
          const locExpr = hasNoteLoc && hasNoteUm
            ? 'COALESCE(n.LocationId, u.LocationId)'
            : (hasNoteLoc ? 'n.LocationId' : 'u.LocationId');
          const modExpr = hasLastMod ? 'max(n.LastModified)' : 'NULL';

          const query = `
            SELECT 
              ${locExpr} as ResolvedLocId,
              count(*) as cnt,
              ${modExpr} as MaxModified
            FROM Note n
            ${hasNoteUm ? 'LEFT JOIN UserMark u ON u.UserMarkId = n.UserMarkId' : ''}
            WHERE ${locExpr} IS NOT NULL
            GROUP BY ${locExpr}
          `;
          const res = db.exec(query);
          if (res.length > 0) {
            for (const row of res[0].values) {
              const locId = row[0] as number;
              const cnt = row[1] as number;
              const maxMod = row[2] as string | null;
              noteCounts.set(locId, cnt);
              if (maxMod) {
                lastModifiedByLoc.set(locId, maxMod);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to count Notes by location:', e);
      }
    }

    // 4. Aggregate Bookmarks by LocationId
    const bookmarkCounts = new Map<number, number>();
    if (hasBookmark) {
      try {
        const bmCols = getTableColumns(db, 'Bookmark');
        if (bmCols.has('LocationId')) {
          const res = db.exec('SELECT LocationId, count(*) as cnt FROM Bookmark WHERE LocationId IS NOT NULL GROUP BY LocationId');
          if (res.length > 0) {
            for (const row of res[0].values) {
              bookmarkCounts.set(row[0] as number, row[1] as number);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to count Bookmarks by location:', e);
      }
    }

    // 5. Aggregate InputFields by LocationId
    const inputFieldCounts = new Map<number, number>();
    if (hasInputField) {
      try {
        const inpCols = getTableColumns(db, 'InputField');
        if (inpCols.has('LocationId')) {
          const res = db.exec('SELECT LocationId, count(*) as cnt FROM InputField WHERE LocationId IS NOT NULL GROUP BY LocationId');
          if (res.length > 0) {
            for (const row of res[0].values) {
              inputFieldCounts.set(row[0] as number, row[1] as number);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to count InputFields by location:', e);
      }
    }


    // 6. Build decorated LocationDetail objects
    for (const row of values) {
      const locationId = colVal(row, 'LocationId') as number;
      if (!locationId) continue;

      const bookNumber = colVal(row, 'BookNumber') as number | null;
      const chapterNumber = colVal(row, 'ChapterNumber') as number | null;
      const documentId = colVal(row, 'DocumentId') as number | null;
      const track = colVal(row, 'Track') as number | null;
      const issueTagNumber = colVal(row, 'IssueTagNumber') as number | null;
      const keySymbol = colVal(row, 'KeySymbol') as string | null;
      const mepsLangRaw = colVal(row, 'MepsLanguage') as number | null;
      const mepsLanguage = mepsLangRaw !== null && !isNaN(mepsLangRaw) ? mepsLangRaw : 0;
      const type = colVal(row, 'Type') as number | null;
      const rawTitle = colVal(row, 'Title') as string | null;

      const meta = resolveLocationMetadata({
        locationId,
        bookNumber,
        chapterNumber,
        documentId,
        track,
        issueTagNumber,
        keySymbol,
        mepsLanguage,
        type,
        title: rawTitle
      });

      const langInfo = getLanguageInfo(mepsLanguage);
      const highlights = markCounts.get(locationId) || 0;
      const notes = noteCounts.get(locationId) || 0;
      const bookmarks = bookmarkCounts.get(locationId) || 0;
      const inputFields = inputFieldCounts.get(locationId) || 0;
      const totalAnnotations = highlights + notes + bookmarks + inputFields;
      const lastModified = lastModifiedByLoc.get(locationId) || null;

      locations.push({
        locationId,
        bookNumber,
        chapterNumber,
        documentId,
        track,
        issueTagNumber,
        keySymbol,
        mepsLanguage,
        type,
        rawTitle,
        resolvedTitle: meta.resolvedTitle,
        shortTitle: meta.shortTitle,
        category: meta.category,
        categoryLabel: meta.categoryLabel,
        languageName: langInfo.formattedName,
        languageCode: langInfo.code,
        issueTagFormatted: meta.issueTagFormatted,
        highlightsCount: highlights,
        notesCount: notes,
        bookmarksCount: bookmarks,
        inputFieldsCount: inputFields,
        totalAnnotations,
        lastModified
      });
    }
  } catch (err) {
    console.error('Failed to extract location details:', err);
  } finally {
    db.close();
  }

  return locations;
}

/**
 * Calculates high-level summary counts and density statistics across all extracted locations.
 */
export function getLocationSummaryStats(locations: LocationDetail[]): LocationSummaryStats {
  let bibleLocationsCount = 0;
  let publicationLocationsCount = 0;
  let mediaLocationsCount = 0;
  let otherLocationsCount = 0;
  let annotatedLocationsCount = 0;
  let totalHighlights = 0;
  let totalNotes = 0;
  let totalBookmarks = 0;
  let totalInputFields = 0;

  for (const loc of locations) {
    if (loc.category === 'bible') {
      bibleLocationsCount++;
    } else if (loc.category === 'media') {
      mediaLocationsCount++;
    } else if (loc.category === 'publication') {
      publicationLocationsCount++;
    } else {
      otherLocationsCount++;
    }

    if (loc.totalAnnotations > 0) {
      annotatedLocationsCount++;
    }

    totalHighlights += loc.highlightsCount;
    totalNotes += loc.notesCount;
    totalBookmarks += loc.bookmarksCount;
    totalInputFields += loc.inputFieldsCount;
  }

  return {
    totalLocations: locations.length,
    bibleLocationsCount,
    publicationLocationsCount,
    mediaLocationsCount,
    otherLocationsCount,
    annotatedLocationsCount,
    totalHighlights,
    totalNotes,
    totalBookmarks,
    totalInputFields,
    totalAnnotations: totalHighlights + totalNotes + totalBookmarks + totalInputFields
  };
}

/**
 * Filters and sorts a list of LocationDetail items based on search query,
 * category filter, MEPS language, and sort criteria.
 */
export function filterAndSortLocations(
  locations: LocationDetail[],
  query: string,
  categoryFilter: 'all' | LocationCategoryType | 'annotated',
  languageFilter: number | 'all',
  sortBy: 'density_desc' | 'highlights_desc' | 'notes_desc' | 'title_asc' | 'title_desc' | 'id_asc' | 'id_desc' | 'modified_desc'
): LocationDetail[] {
  const cleanQuery = query.trim().toLowerCase();

  const filtered = locations.filter(loc => {
    // Category filtering
    if (categoryFilter === 'annotated') {
      if (loc.totalAnnotations === 0) return false;
    } else if (categoryFilter !== 'all' && loc.category !== categoryFilter) {
      return false;
    }

    // Language filtering
    if (languageFilter !== 'all' && loc.mepsLanguage !== languageFilter) {
      return false;
    }

    // Search query matching
    if (cleanQuery) {
      const matchTitle = loc.resolvedTitle.toLowerCase().includes(cleanQuery);
      const matchShort = loc.shortTitle.toLowerCase().includes(cleanQuery);
      const matchRaw = loc.rawTitle ? loc.rawTitle.toLowerCase().includes(cleanQuery) : false;
      const matchSymbol = loc.keySymbol ? loc.keySymbol.toLowerCase().includes(cleanQuery) : false;
      const matchLang = loc.languageName.toLowerCase().includes(cleanQuery);
      const matchLocId = `location #${loc.locationId}`.includes(cleanQuery) || `${loc.locationId}` === cleanQuery;
      const matchDocId = loc.documentId !== null && `${loc.documentId}`.includes(cleanQuery);
      const matchIssue = loc.issueTagFormatted ? loc.issueTagFormatted.toLowerCase().includes(cleanQuery) : false;
      
      let matchBibleBook = false;
      if (loc.bookNumber) {
        const bInfo = getBibleBookInfo(loc.bookNumber);
        if (bInfo) {
          matchBibleBook = bInfo.name.toLowerCase().includes(cleanQuery) || 
                           bInfo.shortName.toLowerCase().includes(cleanQuery);
        }
      }

      if (!matchTitle && !matchShort && !matchRaw && !matchSymbol && !matchLang && !matchLocId && !matchDocId && !matchIssue && !matchBibleBook) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'density_desc':
        if (b.totalAnnotations !== a.totalAnnotations) {
          return b.totalAnnotations - a.totalAnnotations;
        }
        return a.locationId - b.locationId;
      case 'highlights_desc':
        if (b.highlightsCount !== a.highlightsCount) {
          return b.highlightsCount - a.highlightsCount;
        }
        return b.totalAnnotations - a.totalAnnotations;
      case 'notes_desc':
        if (b.notesCount !== a.notesCount) {
          return b.notesCount - a.notesCount;
        }
        return b.totalAnnotations - a.totalAnnotations;
      case 'title_asc':
        return a.resolvedTitle.localeCompare(b.resolvedTitle);
      case 'title_desc':
        return b.resolvedTitle.localeCompare(a.resolvedTitle);
      case 'id_asc':
        return a.locationId - b.locationId;
      case 'id_desc':
        return b.locationId - a.locationId;
      case 'modified_desc':
        if (a.lastModified && b.lastModified) {
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        }
        if (b.lastModified) return 1;
        if (a.lastModified) return -1;
        return b.totalAnnotations - a.totalAnnotations;
      default:
        return a.locationId - b.locationId;
    }
  });

  return filtered;
}
