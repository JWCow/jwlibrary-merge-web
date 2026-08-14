import { getSql } from './sqlite';
import { unpackJWLibrary } from './zip';
import type { BackupMetadata, TableCounts, NoteDetail, BookmarkDetail } from './types';

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
  
  const { manifest, userDataDbBytes } = await unpackJWLibrary(rawBytes);

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
        const res = db.exec(`SELECT count(*) as count FROM "${table}"`);
        if (res.length > 0 && res[0].values.length > 0) {
          counts[table] = res[0].values[0][0] as number;
        }
      } catch (e) {
        // Table might not exist in older schemas
        counts[table] = 0;
      }
    }

    let lastModifiedFromDb = manifest.userDataBackup?.lastModifiedDate || '';
    try {
      const res = db.exec('SELECT LastModified FROM LastModified LIMIT 1');
      if (res.length > 0 && res[0].values.length > 0) {
        lastModifiedFromDb = res[0].values[0][0] as string;
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
      manifest
    };
  } finally {
    db.close();
  }
}

export async function extractNoteDetails(dbBytes: Uint8Array, limit = 100): Promise<NoteDetail[]> {
  const SQL = await getSql();
  const db = new SQL.Database(dbBytes);
  const notes: NoteDetail[] = [];

  try {
    const query = `
      SELECT 
        n.NoteId, 
        n.Guid, 
        n.Title, 
        n.Content, 
        n.LastModified, 
        n.Created,
        l.Title as LocationTitle,
        u.ColorIndex
      FROM Note n
      LEFT JOIN Location l ON l.LocationId = n.LocationId
      LEFT JOIN UserMark u ON u.UserMarkId = n.UserMarkId
      ORDER BY n.LastModified DESC
      LIMIT ${limit}
    `;

    const res = db.exec(query);
    if (res.length > 0) {
      const { columns, values } = res[0];
      const colIndex = (col: string) => columns.indexOf(col);

      for (const row of values) {
        notes.push({
          noteId: row[colIndex('NoteId')] as number,
          guid: row[colIndex('Guid')] as string,
          title: row[colIndex('Title')] as string | null,
          content: row[colIndex('Content')] as string | null,
          lastModified: row[colIndex('LastModified')] as string,
          created: row[colIndex('Created')] as string,
          locationTitle: row[colIndex('LocationTitle')] as string | undefined,
          colorIndex: row[colIndex('ColorIndex')] as number | undefined
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
    const query = `
      SELECT 
        b.BookmarkId,
        b.Title,
        b.Snippet,
        b.Slot,
        l.Title as LocationTitle
      FROM Bookmark b
      LEFT JOIN Location l ON l.LocationId = b.LocationId
      ORDER BY b.Slot ASC
    `;

    const res = db.exec(query);
    if (res.length > 0) {
      const { columns, values } = res[0];
      const colIndex = (col: string) => columns.indexOf(col);

      for (const row of values) {
        bookmarks.push({
          bookmarkId: row[colIndex('BookmarkId')] as number,
          title: row[colIndex('Title')] as string,
          snippet: row[colIndex('Snippet')] as string | null,
          slot: row[colIndex('Slot')] as number,
          locationTitle: row[colIndex('LocationTitle')] as string | undefined
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
