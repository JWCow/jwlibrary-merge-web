import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
import JSZip from 'jszip';
import { buildSubsetDb, exportSubset, createSubsetBackup } from '../src/lib/subset.ts';
import { mergeBackups } from '../src/lib/merge.ts';

async function getSQL() {
  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  return await initSqlJs({ wasmBinary });
}

const SCHEMA = `
  CREATE TABLE Location (
    LocationId INTEGER PRIMARY KEY AUTOINCREMENT,
    BookNumber INTEGER, ChapterNumber INTEGER, DocumentId INTEGER, Track INTEGER,
    IssueTagNumber INTEGER, KeySymbol TEXT, MepsLanguage INTEGER, Type INTEGER,
    Title TEXT, Specialty INTEGER, Edition INTEGER
  );
  CREATE TABLE Tag (TagId INTEGER PRIMARY KEY AUTOINCREMENT, Type INTEGER, Name TEXT, LastModified TEXT);
  CREATE TABLE TagMap (
    TagMapId INTEGER PRIMARY KEY AUTOINCREMENT, PlaylistItemId INTEGER, LocationId INTEGER,
    NoteId INTEGER, TagId INTEGER NOT NULL, Position INTEGER NOT NULL,
    CONSTRAINT TagMap_TagId_Position_unique UNIQUE (TagId, Position)
  );
  CREATE TABLE UserMark (
    UserMarkId INTEGER PRIMARY KEY AUTOINCREMENT, ColorIndex INTEGER, LocationId INTEGER,
    StyleIndex INTEGER, UserMarkGuid TEXT UNIQUE, Version INTEGER
  );
  CREATE TABLE BlockRange (
    BlockRangeId INTEGER PRIMARY KEY AUTOINCREMENT, BlockType INTEGER, Identifier INTEGER,
    StartToken INTEGER, EndToken INTEGER, UserMarkId INTEGER NOT NULL
  );
  CREATE TABLE Note (
    NoteId INTEGER PRIMARY KEY AUTOINCREMENT, Guid TEXT UNIQUE, UserMarkId INTEGER,
    LocationId INTEGER, Title TEXT, Content TEXT, Created TEXT, LastModified TEXT,
    BlockType INTEGER, BlockIdentifier INTEGER
  );
  CREATE TABLE Bookmark (
    BookmarkId INTEGER PRIMARY KEY AUTOINCREMENT, LocationId INTEGER NOT NULL,
    PublicationLocationId INTEGER, Slot INTEGER NOT NULL, Title TEXT NOT NULL,
    Snippet TEXT, BlockType INTEGER, BlockIdentifier INTEGER
  );
  CREATE TABLE InputField (
    LocationId INTEGER NOT NULL, TextTag TEXT NOT NULL, Value TEXT,
    PRIMARY KEY (LocationId, TextTag)
  );
  CREATE TABLE LastModified (LastModified TEXT);
`;

/**
 * Location 1 = Genesis 1 (the "shared" study), Location 2 = private Watchtower study.
 */
async function createTestBackup({
  fileName = 'wife-backup.jwlibrary',
  deviceName = 'Wife Phone',
  schemaVersion = 8,
  lastModifiedDate = '2024-03-01T10:00:00Z'
} = {}) {
  const SQL = await getSQL();
  const db = new SQL.Database();
  db.run(SCHEMA);
  db.run('INSERT INTO LastModified (LastModified) VALUES (?)', [lastModifiedDate]);

  db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, KeySymbol, MepsLanguage, Type) VALUES (1, 1, 1, 'nwtsty', 0, 0)");
  db.run("INSERT INTO Location (LocationId, DocumentId, IssueTagNumber, KeySymbol, MepsLanguage, Type) VALUES (2, 500, 20240100, 'w24', 0, 0)");

  db.run("INSERT INTO UserMark (UserMarkId, ColorIndex, LocationId, StyleIndex, UserMarkGuid, Version) VALUES (1, 1, 1, 0, 'mark-gen-1', 1)");
  db.run("INSERT INTO UserMark (UserMarkId, ColorIndex, LocationId, StyleIndex, UserMarkGuid, Version) VALUES (2, 2, 2, 0, 'mark-wt-1', 1)");
  db.run("INSERT INTO BlockRange (BlockType, Identifier, StartToken, EndToken, UserMarkId) VALUES (2, 10, 0, 5, 1)");
  db.run("INSERT INTO BlockRange (BlockType, Identifier, StartToken, EndToken, UserMarkId) VALUES (2, 11, 0, 9, 1)");
  db.run("INSERT INTO BlockRange (BlockType, Identifier, StartToken, EndToken, UserMarkId) VALUES (2, 20, 0, 3, 2)");

  db.run("INSERT INTO Note (NoteId, Guid, UserMarkId, LocationId, Title, Content, LastModified) VALUES (1, 'note-gen-1', 1, 1, 'Genesis 1', 'Family worship note', '2024-03-01T09:00:00Z')");
  db.run("INSERT INTO Note (NoteId, Guid, UserMarkId, LocationId, Title, Content, LastModified) VALUES (2, 'note-wt-1', 2, 2, 'WT study', 'Private note', '2024-03-01T09:30:00Z')");

  db.run("INSERT INTO Tag (TagId, Type, Name) VALUES (1, 1, 'Family Worship')");
  db.run("INSERT INTO Tag (TagId, Type, Name) VALUES (2, 1, 'Private')");
  db.run('INSERT INTO TagMap (TagId, NoteId, Position) VALUES (1, 1, 0)');
  db.run('INSERT INTO TagMap (TagId, NoteId, Position) VALUES (2, 2, 0)');

  db.run("INSERT INTO Bookmark (LocationId, PublicationLocationId, Slot, Title) VALUES (1, 1, 0, 'Genesis bookmark')");
  db.run("INSERT INTO Bookmark (LocationId, PublicationLocationId, Slot, Title) VALUES (2, 2, 1, 'WT bookmark')");

  db.run("INSERT INTO InputField (LocationId, TextTag, Value) VALUES (1, 'tag-a', 'answer A')");
  db.run("INSERT INTO InputField (LocationId, TextTag, Value) VALUES (2, 'tag-b', 'answer B')");

  const dbBytes = db.export();
  db.close();

  return {
    id: fileName,
    fileName,
    fileSize: dbBytes.length,
    deviceName,
    lastModifiedDate,
    creationDate: lastModifiedDate,
    schemaVersion,
    counts: { Location: 2, Tag: 2, TagMap: 2, UserMark: 2, BlockRange: 3, Note: 2, Bookmark: 2, InputField: 2 },
    file: new File([dbBytes], fileName),
    rawZipBytes: new Uint8Array(),
    userDataDbBytes: dbBytes,
    manifest: {
      name: fileName,
      creationDate: lastModifiedDate,
      version: 1,
      type: 0,
      userDataBackup: {
        lastModifiedDate,
        deviceName,
        databaseName: 'userData.db',
        hash: 'test-hash',
        schemaVersion
      }
    },
    extraFiles: new Map()
  };
}

async function openDb(bytes) {
  const SQL = await getSQL();
  return new SQL.Database(bytes);
}

function rows(db, sql) {
  const res = db.exec(sql);
  return res.length > 0 ? res[0].values : [];
}

test('buildSubsetDb keeps only annotations of the selected locations', async () => {
  const backup = await createTestBackup();
  const { bytes, counts } = await buildSubsetDb(backup.userDataDbBytes, { locationIds: [1] });

  const db = await openDb(bytes);
  try {
    assert.deepEqual(rows(db, 'SELECT Guid FROM Note').flat(), ['note-gen-1']);
    assert.deepEqual(rows(db, 'SELECT UserMarkGuid FROM UserMark').flat(), ['mark-gen-1']);
    // Both spans of the multi-paragraph highlight survive
    assert.equal(rows(db, 'SELECT BlockRangeId FROM BlockRange').length, 2);
    assert.deepEqual(rows(db, 'SELECT Title FROM Bookmark').flat(), ['Genesis bookmark']);
    assert.deepEqual(rows(db, 'SELECT Value FROM InputField').flat(), ['answer A']);
    assert.deepEqual(rows(db, 'SELECT LocationId FROM Location').flat(), [1]);
    // Orphaned tag and its link are gone
    assert.deepEqual(rows(db, 'SELECT Name FROM Tag').flat(), ['Family Worship']);
    assert.equal(rows(db, 'SELECT TagMapId FROM TagMap').length, 1);
  } finally {
    db.close();
  }

  assert.deepEqual(counts, {
    locations: 1, notes: 1, highlights: 1, blockRanges: 2,
    bookmarks: 1, inputFields: 1, tags: 1, tagMaps: 1
  });
});

test('buildSubsetDb honours per-kind toggles (notes only)', async () => {
  const backup = await createTestBackup();
  const { bytes, counts } = await buildSubsetDb(backup.userDataDbBytes, {
    locationIds: [1],
    includeNotes: true,
    includeHighlights: false,
    includeBookmarks: false,
    includeInputFields: false
  });

  assert.equal(counts.notes, 1);
  assert.equal(counts.highlights, 0);
  assert.equal(counts.blockRanges, 0);
  assert.equal(counts.bookmarks, 0);
  assert.equal(counts.inputFields, 0);

  const db = await openDb(bytes);
  try {
    // The note is kept but no longer points at a deleted highlight
    assert.deepEqual(rows(db, 'SELECT UserMarkId FROM Note').flat(), [null]);
    assert.deepEqual(rows(db, 'SELECT LocationId FROM Location').flat(), [1]);
  } finally {
    db.close();
  }
});

test('buildSubsetDb rejects an empty selection', async () => {
  const backup = await createTestBackup();
  await assert.rejects(() => buildSubsetDb(backup.userDataDbBytes, { locationIds: [] }), /at least one location/i);
});

test('exportSubset produces a manifest-first .jwlibrary with a valid hash', async () => {
  const backup = await createTestBackup();
  const result = await exportSubset(backup, { locationIds: [1] });

  assert.equal(result.fileName, 'wife-backup-partial.jwlibrary');

  const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
  const names = Object.keys(zip.files);
  assert.equal(names[0], 'manifest.json');
  assert.ok(names.includes('userData.db'));

  const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  assert.equal(manifest.userDataBackup.schemaVersion, backup.schemaVersion);
  assert.match(manifest.userDataBackup.hash, /^[0-9a-f]{64}$/);

  const dbBytes = await zip.file('userData.db').async('uint8array');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', dbBytes));
  const hex = Array.from(digest).map(b => b.toString(16).padStart(2, '0')).join('');
  assert.equal(manifest.userDataBackup.hash, hex);
});

test('a subset backup merges into another backup without pulling private data', async () => {
  const husband = await createTestBackup({
    fileName: 'husband.jwlibrary',
    deviceName: 'Husband Phone',
    lastModifiedDate: '2024-04-01T10:00:00Z'
  });
  const wife = await createTestBackup();

  const shared = await createSubsetBackup(wife, { locationIds: [1] }, 'wife-genesis.jwlibrary');
  assert.equal(shared.fileName, 'wife-genesis.jwlibrary');
  assert.equal(shared.counts.Note, 1);

  const result = await mergeBackups([husband, shared], 'merged.jwlibrary');
  const db = await openDb(result.mergedBytes);
  try {
    const guids = rows(db, 'SELECT Guid FROM Note ORDER BY Guid').flat();
    // Husband keeps both of his own notes; nothing new leaks in from the wife's WT study
    assert.deepEqual(guids, ['note-gen-1', 'note-wt-1']);
    const marks = rows(db, 'SELECT UserMarkGuid FROM UserMark ORDER BY UserMarkGuid').flat();
    assert.deepEqual(marks, ['mark-gen-1', 'mark-wt-1']);
  } finally {
    db.close();
  }
});
