import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
import JSZip from 'jszip';
import { mergeBackups } from '../src/lib/merge.ts';
import { extractNoteDetails, extractBookmarkDetails } from '../src/lib/inspect.ts';

// Helper to create in-memory backup objects
async function createTestBackup({
  fileName = 'backup.jwlibrary',
  deviceName = 'Test Device',
  schemaVersion = 8,
  lastModifiedDate = '2021-07-18T10:00:00Z',
  setupDb
}) {
  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();

  // Create standard JW Library tables
  db.run(`
    CREATE TABLE Location (
      LocationId INTEGER PRIMARY KEY AUTOINCREMENT,
      BookNumber INTEGER,
      ChapterNumber INTEGER,
      DocumentId INTEGER,
      Track INTEGER,
      IssueTagNumber INTEGER,
      KeySymbol TEXT,
      MepsLanguage INTEGER,
      Type INTEGER,
      Title TEXT,
      Specialty INTEGER,
      Edition INTEGER
    );

    CREATE TABLE Tag (
      TagId INTEGER PRIMARY KEY AUTOINCREMENT,
      Type INTEGER,
      Name TEXT,
      LastModified TEXT
    );

    CREATE TABLE TagMap (
      TagMapId INTEGER PRIMARY KEY AUTOINCREMENT,
      PlaylistItemId INTEGER,
      LocationId INTEGER,
      NoteId INTEGER,
      TagId INTEGER NOT NULL,
      Position INTEGER NOT NULL,
      CONSTRAINT TagMap_TagId_Position_unique UNIQUE (TagId, Position)
    );

    CREATE TABLE UserMark (
      UserMarkId INTEGER PRIMARY KEY AUTOINCREMENT,
      ColorIndex INTEGER,
      LocationId INTEGER,
      StyleIndex INTEGER,
      UserMarkGuid TEXT UNIQUE,
      Version INTEGER
    );

    CREATE TABLE BlockRange (
      BlockRangeId INTEGER PRIMARY KEY AUTOINCREMENT,
      BlockType INTEGER,
      Identifier INTEGER,
      StartToken INTEGER,
      EndToken INTEGER,
      UserMarkId INTEGER NOT NULL
    );

    CREATE TABLE Note (
      NoteId INTEGER PRIMARY KEY AUTOINCREMENT,
      Guid TEXT UNIQUE,
      UserMarkId INTEGER,
      LocationId INTEGER,
      Title TEXT,
      Content TEXT,
      Created TEXT,
      LastModified TEXT,
      BlockType INTEGER,
      BlockIdentifier INTEGER
    );

    CREATE TABLE Bookmark (
      BookmarkId INTEGER PRIMARY KEY AUTOINCREMENT,
      LocationId INTEGER NOT NULL,
      PublicationLocationId INTEGER,
      Slot INTEGER NOT NULL,
      Title TEXT NOT NULL,
      Snippet TEXT,
      BlockType INTEGER,
      BlockIdentifier INTEGER
    );

    CREATE TABLE InputField (
      LocationId INTEGER NOT NULL,
      TextTag TEXT NOT NULL,
      Value TEXT,
      PRIMARY KEY (LocationId, TextTag)
    );

    CREATE TABLE LastModified (
      LastModified TEXT
    );
  `);

  db.run('INSERT INTO LastModified (LastModified) VALUES (?)', [lastModifiedDate]);

  if (setupDb) {
    setupDb(db);
  }

  const dbBytes = db.export();
  db.close();

  const manifest = {
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
  };

  const counts = {
    Location: 0,
    Tag: 0,
    TagMap: 0,
    UserMark: 0,
    BlockRange: 0,
    Note: 0,
    Bookmark: 0,
    InputField: 0
  };

  return {
    id: fileName,
    fileName,
    fileSize: dbBytes.length,
    deviceName,
    lastModifiedDate,
    creationDate: lastModifiedDate,
    schemaVersion,
    counts,
    file: new File([dbBytes], fileName),
    rawZipBytes: new Uint8Array(),
    userDataDbBytes: dbBytes,
    manifest,
    extraFiles: new Map()
  };
}

test('Issue #3 Fix: Merge backups with overlapping TagMap Position without UNIQUE constraint error', async () => {
  // Backup 1 (iPad 2021) has Tag 1 with items at Position 0, 1
  const backup1 = await createTestBackup({
    fileName: 'UserDataBackup_2021-07-18_iPro10.jwlibrary',
    deviceName: 'iPad Pro (2021)',
    schemaVersion: 8,
    lastModifiedDate: '2021-07-18T12:00:00Z',
    setupDb: (db) => {
      db.run("INSERT INTO Tag (TagId, Type, Name) VALUES (1, 0, 'Spiritual Gems')");
      db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, KeySymbol, MepsLanguage, Type) VALUES (1, 1, 1, 'nwtsty', 0, 0)");
      db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, KeySymbol, MepsLanguage, Type) VALUES (2, 1, 2, 'nwtsty', 0, 0)");
      db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, LastModified) VALUES (1, 'note-guid-1', 1, 'Genesis 1 Gem', 'Creation notes', '2021-07-18T10:00:00Z')");
      db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, LastModified) VALUES (2, 'note-guid-2', 2, 'Genesis 2 Gem', 'Eden notes', '2021-07-18T11:00:00Z')");
      // TagMap positions 0 and 1
      db.run("INSERT INTO TagMap (TagId, NoteId, Position) VALUES (1, 1, 0)");
      db.run("INSERT INTO TagMap (TagId, NoteId, Position) VALUES (1, 2, 1)");
    }
  });

  // Backup 2 (iPad 2020) has Tag 1 with an older item ALSO at Position 0
  const backup2 = await createTestBackup({
    fileName: 'UserDataBackup_2020-05-09_iPro10.jwlibrary',
    deviceName: 'iPad Pro (2020)',
    schemaVersion: 7,
    lastModifiedDate: '2020-05-09T12:00:00Z',
    setupDb: (db) => {
      db.run("INSERT INTO Tag (TagId, Type, Name) VALUES (1, 0, 'Spiritual Gems')");
      db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, KeySymbol, MepsLanguage, Type) VALUES (1, 2, 1, 'nwtsty', 0, 0)");
      db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, LastModified) VALUES (1, 'note-guid-3', 1, 'Exodus 1 Gem', 'Moses notes', '2020-05-09T10:00:00Z')");
      // TagMap ALSO has Position 0 in backup 2!
      db.run("INSERT INTO TagMap (TagId, NoteId, Position) VALUES (1, 1, 0)");
    }
  });

  // Merge should succeed without "UNIQUE constraint failed: TagMap.TagId, TagMap.Position"
  const result = await mergeBackups([backup1, backup2], 'merged.jwlibrary');

  assert.ok(result.mergedBlob);
  assert.equal(result.stats.totalNotes, 3);
  assert.equal(result.stats.totalTags, 1);

  // Inspect merged DB TagMap positions
  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  const mergedDb = new SQL.Database(result.mergedBytes);

  const tagMapRows = mergedDb.exec('SELECT TagId, Position, NoteId FROM TagMap ORDER BY Position ASC')[0].values;
  assert.equal(tagMapRows.length, 3);
  // Positions should be 0, 1, 2 without duplicates
  assert.deepEqual(tagMapRows.map(r => r[1]), [0, 1, 2]);

  mergedDb.close();
});

test('Multi-Block Highlight Healing: Preserves all BlockRanges spanning multiple paragraphs', async () => {
  const markGuid = 'multi-block-highlight-guid-1';

  // Backup 1 with 1st block of highlight
  const backup1 = await createTestBackup({
    fileName: 'backup1.jwlibrary',
    setupDb: (db) => {
      db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber) VALUES (1, 1, 1)");
      db.run("INSERT INTO UserMark (UserMarkId, ColorIndex, LocationId, StyleIndex, UserMarkGuid, Version) VALUES (1, 1, 1, 0, ?, 1)", [markGuid]);
      db.run("INSERT INTO BlockRange (BlockType, Identifier, StartToken, EndToken, UserMarkId) VALUES (1, 10, 0, 15, 1)");
    }
  });

  // Backup 2 with 2nd block of the same highlight
  const backup2 = await createTestBackup({
    fileName: 'backup2.jwlibrary',
    setupDb: (db) => {
      db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber) VALUES (1, 1, 1)");
      db.run("INSERT INTO UserMark (UserMarkId, ColorIndex, LocationId, StyleIndex, UserMarkGuid, Version) VALUES (1, 1, 1, 0, ?, 1)", [markGuid]);
      db.run("INSERT INTO BlockRange (BlockType, Identifier, StartToken, EndToken, UserMarkId) VALUES (1, 11, 0, 20, 1)");
    }
  });

  const result = await mergeBackups([backup1, backup2]);
  assert.equal(result.stats.totalMarks, 1);
  assert.equal(result.stats.healedBlockRanges, 1);

  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  const mergedDb = new SQL.Database(result.mergedBytes);

  const ranges = mergedDb.exec('SELECT Identifier FROM BlockRange ORDER BY Identifier ASC')[0].values;
  assert.equal(ranges.length, 2);
  assert.deepEqual(ranges.map(r => r[0]), [10, 11]);

  mergedDb.close();
});

test('Note Conflict Resolution: Newer LastModified wins and Created timestamp is preserved', async () => {
  const noteGuid = 'shared-note-guid';

  // Base backup (newer overall backup date 2021-07-01) has an older edit on this specific note (2020-01-01)
  const backup1 = await createTestBackup({
    fileName: 'backup1.jwlibrary',
    lastModifiedDate: '2021-07-01T00:00:00Z',
    setupDb: (db) => {
      db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber) VALUES (1, 1, 1)");
      db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, Created, LastModified) VALUES (1, ?, 1, 'Old Title', 'Old Content', '2019-01-01T00:00:00Z', '2020-01-01T00:00:00Z')", [noteGuid]);
    }
  });

  // Source backup (backup date 2021-06-01) has a newer edit on this specific note (2021-05-01)
  const backup2 = await createTestBackup({
    fileName: 'backup2.jwlibrary',
    lastModifiedDate: '2021-06-01T00:00:00Z',
    setupDb: (db) => {
      db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber) VALUES (1, 1, 1)");
      db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, Created, LastModified) VALUES (1, ?, 1, 'New Title', 'New Content', '2019-01-01T00:00:00Z', '2021-05-01T00:00:00Z')", [noteGuid]);
    }
  });

  const result = await mergeBackups([backup1, backup2]);
  assert.equal(result.stats.notesUpdatedOnConflict, 1);

  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  const mergedDb = new SQL.Database(result.mergedBytes);

  const noteRow = mergedDb.exec('SELECT Title, Content, Created, LastModified FROM Note WHERE Guid = ?', [noteGuid])[0].values[0];
  assert.equal(noteRow[0], 'New Title');
  assert.equal(noteRow[1], 'New Content');
  assert.equal(noteRow[2], '2019-01-01T00:00:00Z');
  assert.equal(noteRow[3], '2021-05-01T00:00:00Z');

  mergedDb.close();
});

test('Schema Compatibility: extractNoteDetails works on schemas without Created column', async () => {
  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();

  // Older schema v1 Note table (NO Created column)
  db.run(`
    CREATE TABLE Location (LocationId INTEGER PRIMARY KEY, Title TEXT);
    CREATE TABLE UserMark (UserMarkId INTEGER PRIMARY KEY, ColorIndex INTEGER);
    CREATE TABLE Note (
      NoteId INTEGER PRIMARY KEY,
      Guid TEXT,
      LocationId INTEGER,
      UserMarkId INTEGER,
      Title TEXT,
      Content TEXT,
      LastModified TEXT,
      BlockType INTEGER,
      BlockIdentifier INTEGER
    );
    INSERT INTO Note (NoteId, Guid, Title, Content, LastModified) VALUES (1, 'guid-1', 'Legacy Note', 'Legacy Content', '2018-05-01T00:00:00Z');
  `);

  const bytes = db.export();
  db.close();

  const notes = await extractNoteDetails(bytes);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].title, 'Legacy Note');
  assert.equal(notes[0].created, '2018-05-01T00:00:00Z');
});

test('Schema Cross-Compatibility: Merging Older TagMap Schema (NoteId/LocationId) into Schema 5 (Type/TypeId)', async () => {
  // Base backup is Schema 8 (with TagMap Type/TypeId columns)
  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });

  const db1 = new SQL.Database();
  db1.run(`
    CREATE TABLE Location (LocationId INTEGER PRIMARY KEY, BookNumber INTEGER, ChapterNumber INTEGER);
    CREATE TABLE Tag (TagId INTEGER PRIMARY KEY, Type INTEGER, Name TEXT);
    CREATE TABLE TagMap (TagMapId INTEGER PRIMARY KEY, Type INTEGER, TypeId INTEGER, TagId INTEGER, Position INTEGER, UNIQUE(TagId, Position));
    CREATE TABLE Note (NoteId INTEGER PRIMARY KEY, Guid TEXT UNIQUE, Title TEXT, LastModified TEXT);
    CREATE TABLE UserMark (UserMarkId INTEGER PRIMARY KEY, UserMarkGuid TEXT UNIQUE);
    CREATE TABLE BlockRange (BlockRangeId INTEGER PRIMARY KEY, UserMarkId INTEGER);
    CREATE TABLE Bookmark (BookmarkId INTEGER PRIMARY KEY, Slot INTEGER);
  `);
  db1.run("INSERT INTO Tag (TagId, Type, Name) VALUES (1, 0, 'Faith')");
  db1.run("INSERT INTO Note (NoteId, Guid, Title, LastModified) VALUES (1, 'n1', 'Faith 1', '2021-01-01')");
  db1.run("INSERT INTO TagMap (Type, TypeId, TagId, Position) VALUES (1, 1, 1, 0)"); // Type 1 = Note

  const backup1 = {
    id: 'b1',
    fileName: 'b1.jwlibrary',
    fileSize: 1000,
    deviceName: 'Base iPad',
    lastModifiedDate: '2021-07-01T00:00:00Z',
    creationDate: '2021-07-01T00:00:00Z',
    schemaVersion: 8,
    counts: { Location: 0, Tag: 1, TagMap: 1, UserMark: 0, BlockRange: 0, Note: 1, Bookmark: 0, InputField: 0 },
    file: new File([], 'b1.jwlibrary'),
    rawZipBytes: new Uint8Array(),
    userDataDbBytes: db1.export(),
    manifest: { name: 'b1.jwlibrary', creationDate: '', version: 1, type: 0, userDataBackup: { lastModifiedDate: '', deviceName: 'Base iPad', databaseName: 'userData.db', hash: '', schemaVersion: 8 } },
    extraFiles: new Map()
  };
  db1.close();

  // Source backup is Schema 4 (Older TagMap with NoteId/LocationId columns)
  const db2 = new SQL.Database();
  db2.run(`
    CREATE TABLE Location (LocationId INTEGER PRIMARY KEY, BookNumber INTEGER, ChapterNumber INTEGER);
    CREATE TABLE Tag (TagId INTEGER PRIMARY KEY, Type INTEGER, Name TEXT);
    CREATE TABLE TagMap (TagMapId INTEGER PRIMARY KEY, PlaylistItemId INTEGER, LocationId INTEGER, NoteId INTEGER, TagId INTEGER, Position INTEGER, UNIQUE(TagId, Position));
    CREATE TABLE Note (NoteId INTEGER PRIMARY KEY, Guid TEXT UNIQUE, Title TEXT, LastModified TEXT);
    CREATE TABLE UserMark (UserMarkId INTEGER PRIMARY KEY, UserMarkGuid TEXT UNIQUE);
    CREATE TABLE BlockRange (BlockRangeId INTEGER PRIMARY KEY, UserMarkId INTEGER);
    CREATE TABLE Bookmark (BookmarkId INTEGER PRIMARY KEY, Slot INTEGER);
  `);
  db2.run("INSERT INTO Tag (TagId, Type, Name) VALUES (1, 0, 'Faith')");
  db2.run("INSERT INTO Note (NoteId, Guid, Title, LastModified) VALUES (1, 'n2', 'Faith 2', '2020-01-01')");
  db2.run("INSERT INTO TagMap (NoteId, TagId, Position) VALUES (1, 1, 0)"); // Position 0 in older schema

  const backup2 = {
    id: 'b2',
    fileName: 'b2.jwlibrary',
    fileSize: 1000,
    deviceName: 'Older iPhone',
    lastModifiedDate: '2020-07-01T00:00:00Z',
    creationDate: '2020-07-01T00:00:00Z',
    schemaVersion: 4,
    counts: { Location: 0, Tag: 1, TagMap: 1, UserMark: 0, BlockRange: 0, Note: 1, Bookmark: 0, InputField: 0 },
    file: new File([], 'b2.jwlibrary'),
    rawZipBytes: new Uint8Array(),
    userDataDbBytes: db2.export(),
    manifest: { name: 'b2.jwlibrary', creationDate: '', version: 1, type: 0, userDataBackup: { lastModifiedDate: '', deviceName: 'Older iPhone', databaseName: 'userData.db', hash: '', schemaVersion: 4 } },
    extraFiles: new Map()
  };
  db2.close();

  const result = await mergeBackups([backup1, backup2]);
  assert.equal(result.stats.totalNotes, 2);
  assert.equal(result.stats.totalTags, 1);

  const mergedDb = new SQL.Database(result.mergedBytes);
  const rows = mergedDb.exec('SELECT Type, TypeId, TagId, Position FROM TagMap ORDER BY Position ASC')[0].values;
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], [1, 1, 1, 0]); // First note in slot 0
  assert.deepEqual(rows[1], [1, 2, 1, 1]); // Second note safely migrated to slot 1
  mergedDb.close();
});

test('Bookmark Merging & Slot Safety: Preserves distinct slots and avoids slot collision', async () => {
  const backup1 = await createTestBackup({
    fileName: 'b1.jwlibrary',
    setupDb: (db) => {
      db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber) VALUES (1, 1, 1)");
      db.run("INSERT INTO Bookmark (LocationId, PublicationLocationId, Slot, Title) VALUES (1, NULL, 0, 'Slot 0 Base')");
    }
  });

  const backup2 = await createTestBackup({
    fileName: 'b2.jwlibrary',
    setupDb: (db) => {
      db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber) VALUES (1, 1, 2)");
      db.run("INSERT INTO Bookmark (LocationId, PublicationLocationId, Slot, Title) VALUES (1, NULL, 1, 'Slot 1 New')");
      // Slot 0 in backup2 should be ignored since Slot 0 is already occupied in base
      db.run("INSERT INTO Bookmark (LocationId, PublicationLocationId, Slot, Title) VALUES (1, NULL, 0, 'Slot 0 Duplicate')");
    }
  });

  const result = await mergeBackups([backup1, backup2]);
  assert.equal(result.stats.totalBookmarks, 2);

  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  const mergedDb = new SQL.Database(result.mergedBytes);

  const bookmarks = mergedDb.exec('SELECT Slot, Title FROM Bookmark ORDER BY Slot ASC')[0].values;
  assert.equal(bookmarks.length, 2);
  assert.equal(bookmarks[0][0], 0);
  assert.equal(bookmarks[0][1], 'Slot 0 Base');
  assert.equal(bookmarks[1][0], 1);
  assert.equal(bookmarks[1][1], 'Slot 1 New');

  mergedDb.close();
});

test('ZIP Integrity: manifest.json is the FIRST entry in ZIP and SHA-256 matches userData.db', async () => {
  const backup1 = await createTestBackup({ fileName: 'b1.jwlibrary' });
  const backup2 = await createTestBackup({ fileName: 'b2.jwlibrary' });

  const result = await mergeBackups([backup1, backup2], 'final-merged.jwlibrary');
  const buffer = await result.mergedBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const filenames = Object.keys(zip.files);
  assert.equal(filenames[0], 'manifest.json', 'manifest.json MUST be the first file entry in .jwlibrary zip');

  const manifestContent = JSON.parse(await zip.file('manifest.json').async('string'));
  const dbContent = await zip.file('userData.db').async('uint8array');

  // Verify hash calculation
  const cryptoSubtle = globalThis.crypto.subtle;
  const hashBuffer = await cryptoSubtle.digest('SHA-256', dbContent);
  const expectedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  assert.equal(manifestContent.userDataBackup.hash, expectedHash, 'manifest hash must match SHA-256 of userData.db');
});

