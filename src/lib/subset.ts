import { getSql, getTableColumns, hasTable } from './sqlite';
import { repackJWLibrary } from './zip';
import type { BackupMetadata, JWLibraryManifest, TableCounts } from './types';

/**
 * Describes which slice of a backup should be kept: a set of LocationIds
 * (a book, a Watchtower issue, a brochure...) plus which annotation kinds to carry over.
 */
export interface SubsetSelection {
  locationIds: number[];
  includeNotes?: boolean;
  includeHighlights?: boolean;
  includeBookmarks?: boolean;
  includeInputFields?: boolean;
}

export interface SubsetCounts {
  locations: number;
  notes: number;
  highlights: number;
  blockRanges: number;
  bookmarks: number;
  inputFields: number;
  tags: number;
  tagMaps: number;
}

export interface SubsetResult {
  blob: Blob;
  fileName: string;
  dbBytes: Uint8Array;
  manifest: JWLibraryManifest;
  counts: SubsetCounts;
}

const defaults = (s: SubsetSelection) => ({
  includeNotes: s.includeNotes !== false,
  includeHighlights: s.includeHighlights !== false,
  includeBookmarks: s.includeBookmarks !== false,
  includeInputFields: s.includeInputFields !== false
});

function countRows(db: any, table: string): number {
  if (!hasTable(db, table)) return 0;
  try {
    return (db.exec(`SELECT count(*) FROM "${table}"`)[0]?.values[0][0] as number) || 0;
  } catch {
    return 0;
  }
}

/**
 * Prunes a userData.db down to the selected locations and annotation kinds.
 * Everything that is not reachable from the selection is deleted, so the result is a
 * valid but minimal database that JW Library (and this merge engine) can consume.
 */
export async function buildSubsetDb(
  dbBytes: Uint8Array,
  selection: SubsetSelection
): Promise<{ bytes: Uint8Array; counts: SubsetCounts }> {
  const locationIds = Array.from(new Set(selection.locationIds));
  if (locationIds.length === 0) {
    throw new Error('Select at least one location to export.');
  }

  const opts = defaults(selection);
  const SQL = await getSql();
  const db = new SQL.Database(new Uint8Array(dbBytes));

  try {
    const idList = locationIds.map(id => Number(id)).filter(n => Number.isFinite(n)).join(', ');

    // 1. Annotation tables: keep only rows anchored to a selected location.
    const scopedTables: Array<{ table: string; keep: boolean }> = [
      { table: 'Note', keep: opts.includeNotes },
      { table: 'UserMark', keep: opts.includeHighlights },
      { table: 'Bookmark', keep: opts.includeBookmarks },
      { table: 'InputField', keep: opts.includeInputFields }
    ];

    for (const { table, keep } of scopedTables) {
      if (!hasTable(db, table)) continue;
      if (!keep) {
        db.run(`DELETE FROM "${table}"`);
      } else if (getTableColumns(db, table).has('LocationId')) {
        db.run(`DELETE FROM "${table}" WHERE LocationId IS NULL OR LocationId NOT IN (${idList})`);
      }
    }

    // 2. Repair references left dangling by the deletions above.
    if (hasTable(db, 'Note') && hasTable(db, 'UserMark') && getTableColumns(db, 'Note').has('UserMarkId')) {
      db.run('UPDATE Note SET UserMarkId = NULL WHERE UserMarkId IS NOT NULL AND UserMarkId NOT IN (SELECT UserMarkId FROM UserMark)');
    }
    if (hasTable(db, 'BlockRange')) {
      db.run(
        hasTable(db, 'UserMark')
          ? 'DELETE FROM BlockRange WHERE UserMarkId NOT IN (SELECT UserMarkId FROM UserMark)'
          : 'DELETE FROM BlockRange'
      );
    }

    // 3. TagMap / Tag: drop links whose target no longer exists, then orphaned tags.
    if (hasTable(db, 'TagMap')) {
      const tmCols = getTableColumns(db, 'TagMap');
      const noteExists = hasTable(db, 'Note') ? 'SELECT NoteId FROM Note' : 'SELECT NULL WHERE 0';
      if (tmCols.has('Type') && tmCols.has('TypeId')) {
        // Schema 5+: Type 0 = Location, 1 = Note, 2 = PlaylistItem
        db.run(`DELETE FROM TagMap WHERE Type = 1 AND TypeId NOT IN (${noteExists})`);
        db.run(`DELETE FROM TagMap WHERE Type = 0 AND TypeId NOT IN (${idList})`);
      } else {
        if (tmCols.has('NoteId')) {
          db.run(`DELETE FROM TagMap WHERE NoteId IS NOT NULL AND NoteId NOT IN (${noteExists})`);
        }
        if (tmCols.has('LocationId')) {
          db.run(`DELETE FROM TagMap WHERE LocationId IS NOT NULL AND LocationId NOT IN (${idList})`);
        }
      }
      if (hasTable(db, 'Tag')) {
        db.run('DELETE FROM Tag WHERE TagId NOT IN (SELECT TagId FROM TagMap WHERE TagId IS NOT NULL)');
      }
    }

    // 4. Prune every Location that nothing references anymore. Referencing tables are
    //    discovered from the schema so playlist/media maps keep their locations intact.
    const referenced = new Set<number>();
    const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    for (const row of tablesRes[0]?.values ?? []) {
      const table = row[0] as string;
      if (table === 'Location' || table.startsWith('sqlite_')) continue;
      const cols = getTableColumns(db, table);
      for (const col of ['LocationId', 'PublicationLocationId']) {
        if (!cols.has(col)) continue;
        try {
          const res = db.exec(`SELECT DISTINCT "${col}" FROM "${table}" WHERE "${col}" IS NOT NULL`);
          for (const r of res[0]?.values ?? []) referenced.add(r[0] as number);
        } catch {
          // ignore unreadable table
        }
      }
    }
    if (hasTable(db, 'Location')) {
      const keepList = Array.from(referenced).join(', ') || 'NULL';
      db.run(`DELETE FROM Location WHERE LocationId NOT IN (${keepList})`);
    }

    try {
      db.run('VACUUM');
    } catch {
      // VACUUM is best-effort only
    }

    const counts: SubsetCounts = {
      locations: countRows(db, 'Location'),
      notes: countRows(db, 'Note'),
      highlights: countRows(db, 'UserMark'),
      blockRanges: countRows(db, 'BlockRange'),
      bookmarks: countRows(db, 'Bookmark'),
      inputFields: countRows(db, 'InputField'),
      tags: countRows(db, 'Tag'),
      tagMaps: countRows(db, 'TagMap')
    };

    return { bytes: db.export(), counts };
  } finally {
    db.close();
  }
}

function subsetFileName(backup: BackupMetadata): string {
  const base = backup.fileName.replace(/\.jwlibrary$/i, '');
  return `${base}-partial.jwlibrary`;
}

/**
 * Produces a small, shareable .jwlibrary containing only the selected slice of a backup.
 * The recipient merges it like any other backup file.
 */
export async function exportSubset(
  backup: BackupMetadata,
  selection: SubsetSelection,
  outputFileName?: string
): Promise<SubsetResult> {
  const fileName = outputFileName || subsetFileName(backup);
  const { bytes, counts } = await buildSubsetDb(backup.userDataDbBytes, selection);

  const manifest: JWLibraryManifest = {
    ...backup.manifest,
    name: fileName,
    creationDate: new Date().toISOString(),
    userDataBackup: {
      ...backup.manifest.userDataBackup,
      deviceName: `Partial (${backup.deviceName})`.slice(0, 100),
      hash: ''
    }
  };

  const blob = await repackJWLibrary(manifest, bytes);
  return { blob, fileName, dbBytes: bytes, manifest, counts };
}

/**
 * Same pruning as {@link exportSubset}, but returns an in-memory backup that can be
 * dropped straight into the merge queue — i.e. a selective merge without a round trip
 * through the file system.
 */
export async function createSubsetBackup(
  backup: BackupMetadata,
  selection: SubsetSelection,
  outputFileName?: string
): Promise<BackupMetadata> {
  const result = await exportSubset(backup, selection, outputFileName);
  const rawZipBytes = new Uint8Array(await result.blob.arrayBuffer());

  const counts: TableCounts = {
    ...backup.counts,
    Location: result.counts.locations,
    Note: result.counts.notes,
    UserMark: result.counts.highlights,
    BlockRange: result.counts.blockRanges,
    Bookmark: result.counts.bookmarks,
    InputField: result.counts.inputFields,
    Tag: result.counts.tags,
    TagMap: result.counts.tagMaps
  };

  return {
    ...backup,
    id: crypto.randomUUID(),
    fileName: result.fileName,
    fileSize: rawZipBytes.byteLength,
    deviceName: result.manifest.userDataBackup.deviceName,
    creationDate: result.manifest.creationDate,
    counts,
    file: new File([rawZipBytes as unknown as BlobPart], result.fileName, { type: 'application/zip' }),
    rawZipBytes,
    userDataDbBytes: result.dbBytes,
    manifest: result.manifest,
    extraFiles: new Map()
  };
}
