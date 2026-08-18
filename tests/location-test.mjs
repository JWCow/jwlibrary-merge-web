import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
import { 
  extractLocationDetails, 
  getLocationSummaryStats, 
  filterAndSortLocations, 
  resolveLocationMetadata 
} from '../src/lib/locations.ts';

async function createTestDb(setupFn) {
  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();

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

    CREATE TABLE UserMark (
      UserMarkId INTEGER PRIMARY KEY AUTOINCREMENT,
      ColorIndex INTEGER,
      LocationId INTEGER,
      StyleIndex INTEGER,
      UserMarkGuid TEXT UNIQUE,
      Version INTEGER
    );

    CREATE TABLE Note (
      NoteId INTEGER PRIMARY KEY AUTOINCREMENT,
      Guid TEXT UNIQUE,
      UserMarkId INTEGER,
      LocationId INTEGER,
      Title TEXT,
      Content TEXT,
      LastModified TEXT,
      Created TEXT,
      BlockType INTEGER,
      BlockIdentifier INTEGER
    );

    CREATE TABLE Bookmark (
      BookmarkId INTEGER PRIMARY KEY AUTOINCREMENT,
      LocationId INTEGER,
      PublicationLocationId INTEGER,
      Slot INTEGER,
      Title TEXT,
      Snippet TEXT,
      BlockType INTEGER,
      BlockIdentifier INTEGER
    );

    CREATE TABLE InputField (
      LocationId INTEGER,
      Text TEXT,
      Value TEXT
    );
  `);

  if (setupFn) {
    setupFn(db);
  }

  const bytes = db.export();
  db.close();
  return bytes;
}

test('Locations: Empty database returns empty array and zeroed summary stats', async () => {
  const dbBytes = await createTestDb(() => {});
  const locations = await extractLocationDetails(dbBytes);
  const summary = getLocationSummaryStats(locations);

  assert.equal(locations.length, 0);
  assert.equal(summary.totalLocations, 0);
  assert.equal(summary.bibleLocationsCount, 0);
  assert.equal(summary.publicationLocationsCount, 0);
  assert.equal(summary.mediaLocationsCount, 0);
  assert.equal(summary.annotatedLocationsCount, 0);
  assert.equal(summary.totalAnnotations, 0);
});

test('Locations: Bible chapters resolution & categorization', async () => {
  const dbBytes = await createTestDb((db) => {
    // Genesis 1 (English, MEPS 0)
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (1, 1, 1, 0)`);
    // Matthew 24 (Vietnamese, MEPS 39)
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (2, 40, 24, 39)`);
    // Revelation whole book (Spanish, MEPS 1)
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (3, 66, NULL, 1)`);
  });

  const locations = await extractLocationDetails(dbBytes);
  assert.equal(locations.length, 3);

  // 1. Genesis 1
  const gen = locations.find(l => l.locationId === 1);
  assert.ok(gen);
  assert.equal(gen.category, 'bible');
  assert.equal(gen.categoryLabel, 'Bible Chapter');
  assert.equal(gen.resolvedTitle, 'Genesis 1');
  assert.equal(gen.shortTitle, 'Gen 1');
  assert.equal(gen.languageName, 'English');

  // 2. Matthew 24
  const matt = locations.find(l => l.locationId === 2);
  assert.ok(matt);
  assert.equal(matt.category, 'bible');
  assert.equal(matt.categoryLabel, 'Bible Chapter');
  assert.equal(matt.resolvedTitle, 'Matthew 24');
  assert.equal(matt.shortTitle, 'Matt 24');
  assert.equal(matt.languageName, 'Vietnamese (Tiếng Việt)');

  // 3. Revelation
  const rev = locations.find(l => l.locationId === 3);
  assert.ok(rev);
  assert.equal(rev.category, 'bible');
  assert.equal(rev.categoryLabel, 'Bible Book');
  assert.equal(rev.resolvedTitle, 'Revelation');
  assert.equal(rev.shortTitle, 'Rev');
  assert.equal(rev.languageName, 'Spanish (Español)');
});

test('Locations: Publication documents & Watchtower issue tag resolution', async () => {
  const dbBytes = await createTestDb((db) => {
    // Watchtower Jan 2024 (IssueTagNumber 20240100)
    db.run(`INSERT INTO Location (LocationId, KeySymbol, IssueTagNumber, MepsLanguage) VALUES (1, 'w', 20240100, 0)`);
    // Enjoy Life Forever with DocumentId
    db.run(`INSERT INTO Location (LocationId, KeySymbol, DocumentId, MepsLanguage) VALUES (2, 'lff', 1001061123, 0)`);
    // Life and Ministry Workbook Mar 2024
    db.run(`INSERT INTO Location (LocationId, KeySymbol, IssueTagNumber, MepsLanguage) VALUES (3, 'mwb', 20240300, 0)`);
  });

  const locations = await extractLocationDetails(dbBytes);
  assert.equal(locations.length, 3);

  // 1. Watchtower Jan 2024
  const wt = locations.find(l => l.locationId === 1);
  assert.ok(wt);
  assert.equal(wt.category, 'publication');
  assert.equal(wt.categoryLabel, 'Publication Document');
  assert.equal(wt.resolvedTitle, 'The Watchtower (January 2024)');
  assert.equal(wt.shortTitle, 'Watchtower (January 2024)');
  assert.equal(wt.issueTagFormatted, 'January 2024');

  // 2. Enjoy Life Forever
  const lff = locations.find(l => l.locationId === 2);
  assert.ok(lff);
  assert.equal(lff.category, 'publication');
  assert.equal(lff.resolvedTitle, 'Enjoy Life Forever!—An Interactive Bible Course — Doc #1001061123');

  // 3. Meeting Workbook
  const mwb = locations.find(l => l.locationId === 3);
  assert.ok(mwb);
  assert.equal(mwb.category, 'publication');
  assert.equal(mwb.resolvedTitle, 'Our Christian Life and Ministry Meeting Workbook (March 2024)');
});

test('Locations: Media tracks resolution', async () => {
  const dbBytes = await createTestDb((db) => {
    // Sing Out Joyfully track 12
    db.run(`INSERT INTO Location (LocationId, KeySymbol, Track, MepsLanguage) VALUES (1, 'sjj', 12, 0)`);
    // Media Track with custom title
    db.run(`INSERT INTO Location (LocationId, Track, Title, MepsLanguage) VALUES (2, 5, 'Convention Drama Part 1', 0)`);
  });

  const locations = await extractLocationDetails(dbBytes);
  assert.equal(locations.length, 2);

  const sjj = locations.find(l => l.locationId === 1);
  assert.ok(sjj);
  assert.equal(sjj.category, 'media');
  assert.equal(sjj.categoryLabel, 'Media Track');
  assert.equal(sjj.resolvedTitle, '“Sing Out Joyfully” to Jehovah (Track 12)');

  const vid = locations.find(l => l.locationId === 2);
  assert.ok(vid);
  assert.equal(vid.category, 'media');
  assert.equal(vid.categoryLabel, 'Media Track');
  assert.equal(vid.resolvedTitle, 'Convention Drama Part 1 (Track 5)');
});

test('Locations: Attached Highlights, Notes, Bookmarks & InputFields aggregation', async () => {
  const dbBytes = await createTestDb((db) => {
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (1, 19, 23, 0)`); // Psalms 23
    db.run(`INSERT INTO Location (LocationId, KeySymbol, IssueTagNumber, MepsLanguage) VALUES (2, 'w', 20240100, 0)`); // WT Jan 2024
    db.run(`INSERT INTO Location (LocationId, KeySymbol, MepsLanguage) VALUES (3, 'lff', 0)`); // LFF

    // Location 1: 3 Highlights, 2 Notes (1 direct, 1 via UserMark), 1 Bookmark
    db.run(`INSERT INTO UserMark (UserMarkId, LocationId, UserMarkGuid) VALUES (10, 1, 'um1'), (11, 1, 'um2'), (12, 1, 'um3')`);
    db.run(`INSERT INTO Note (Guid, LocationId, Title, LastModified) VALUES ('n1', 1, 'Psalm 23 direct note', '2024-01-10T10:00:00Z')`);
    db.run(`INSERT INTO Note (Guid, UserMarkId, LocationId, Title, LastModified) VALUES ('n2', 10, NULL, 'Psalm 23 mark note', '2024-01-15T12:00:00Z')`);
    db.run(`INSERT INTO Bookmark (LocationId, Slot, Title) VALUES (1, 1, 'Psalm 23 Bookmark')`);

    // Location 2: 1 Highlight, 1 Bookmark
    db.run(`INSERT INTO UserMark (UserMarkId, LocationId, UserMarkGuid) VALUES (20, 2, 'um-wt')`);
    db.run(`INSERT INTO Bookmark (LocationId, Slot, Title) VALUES (2, 2, 'WT Bookmark')`);

    // Location 3: 2 InputFields
    db.run(`INSERT INTO InputField (LocationId, Text) VALUES (3, 'Answer 1'), (3, 'Answer 2')`);
  });

  const locations = await extractLocationDetails(dbBytes);
  const summary = getLocationSummaryStats(locations);

  // Verify Location 1 (Psalms 23)
  const ps23 = locations.find(l => l.locationId === 1);
  assert.ok(ps23);
  assert.equal(ps23.highlightsCount, 3);
  assert.equal(ps23.notesCount, 2);
  assert.equal(ps23.bookmarksCount, 1);
  assert.equal(ps23.inputFieldsCount, 0);
  assert.equal(ps23.totalAnnotations, 6);
  assert.equal(ps23.lastModified, '2024-01-15T12:00:00Z');

  // Verify Location 2 (WT)
  const wt = locations.find(l => l.locationId === 2);
  assert.ok(wt);
  assert.equal(wt.highlightsCount, 1);
  assert.equal(wt.notesCount, 0);
  assert.equal(wt.bookmarksCount, 1);
  assert.equal(wt.inputFieldsCount, 0);
  assert.equal(wt.totalAnnotations, 2);

  // Verify Location 3 (LFF)
  const lff = locations.find(l => l.locationId === 3);
  assert.ok(lff);
  assert.equal(lff.inputFieldsCount, 2);
  assert.equal(lff.totalAnnotations, 2);

  // Verify summary statistics
  assert.equal(summary.totalLocations, 3);
  assert.equal(summary.bibleLocationsCount, 1);
  assert.equal(summary.publicationLocationsCount, 2);
  assert.equal(summary.annotatedLocationsCount, 3);
  assert.equal(summary.totalHighlights, 4);
  assert.equal(summary.totalNotes, 2);
  assert.equal(summary.totalBookmarks, 2);
  assert.equal(summary.totalInputFields, 2);
  assert.equal(summary.totalAnnotations, 10);
});

test('Locations: Search and filter logic', async () => {
  const dbBytes = await createTestDb((db) => {
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (1, 1, 1, 0)`); // Genesis 1 (English)
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (2, 40, 24, 39)`); // Matthew 24 (Vietnamese)
    db.run(`INSERT INTO Location (LocationId, KeySymbol, IssueTagNumber, MepsLanguage) VALUES (3, 'w', 20240100, 0)`); // Watchtower Jan 2024
    db.run(`INSERT INTO Location (LocationId, KeySymbol, Track, MepsLanguage) VALUES (4, 'sjj', 12, 0)`); // Sing Out Joyfully Track 12
    db.run(`INSERT INTO Location (LocationId, KeySymbol, DocumentId, MepsLanguage) VALUES (5, 'lff', 1001061123, 0)`); // LFF Doc 1001061123

    // Add annotation to Location 1 and Location 3
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (1, 'um1'), (3, 'um2')`);
  });

  const locations = await extractLocationDetails(dbBytes);

  // 1. Search by Bible book name
  const mattSearch = filterAndSortLocations(locations, 'Matthew', 'all', 'all', 'id_asc');
  assert.equal(mattSearch.length, 1);
  assert.equal(mattSearch[0].locationId, 2);

  // 2. Search by publication symbol
  const wtSearch = filterAndSortLocations(locations, 'w', 'all', 'all', 'id_asc');
  assert.ok(wtSearch.some(l => l.locationId === 3));

  // 3. Search by doc ID
  const docSearch = filterAndSortLocations(locations, '1001061123', 'all', 'all', 'id_asc');
  assert.equal(docSearch.length, 1);
  assert.equal(docSearch[0].locationId, 5);

  // 4. Filter by Category 'bible'
  const bibleFilter = filterAndSortLocations(locations, '', 'bible', 'all', 'id_asc');
  assert.equal(bibleFilter.length, 2);

  // 5. Filter by Category 'media'
  const mediaFilter = filterAndSortLocations(locations, '', 'media', 'all', 'id_asc');
  assert.equal(mediaFilter.length, 1);
  assert.equal(mediaFilter[0].locationId, 4);

  // 6. Filter by 'annotated' only
  const annotatedFilter = filterAndSortLocations(locations, '', 'annotated', 'all', 'id_asc');
  assert.equal(annotatedFilter.length, 2);

  // 7. Filter by MEPS Language 39 (Vietnamese)
  const langFilter = filterAndSortLocations(locations, '', 'all', 39, 'id_asc');
  assert.equal(langFilter.length, 1);
  assert.equal(langFilter[0].locationId, 2);
});

test('Locations: Sorting controls', async () => {
  const dbBytes = await createTestDb((db) => {
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (1, 1, 1, 0)`); // Genesis 1
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (2, 40, 24, 0)`); // Matthew 24
    db.run(`INSERT INTO Location (LocationId, KeySymbol, MepsLanguage) VALUES (3, 'w', 0)`); // Watchtower

    // Location 2 has 5 highlights, Location 1 has 2 highlights, Location 3 has 0
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (2, 'u1'), (2, 'u2'), (2, 'u3'), (2, 'u4'), (2, 'u5')`);
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (1, 'u6'), (1, 'u7')`);
  });

  const locations = await extractLocationDetails(dbBytes);

  // Sort by density_desc (Location 2 -> 5, Location 1 -> 2, Location 3 -> 0)
  const densitySort = filterAndSortLocations(locations, '', 'all', 'all', 'density_desc');
  assert.equal(densitySort[0].locationId, 2);
  assert.equal(densitySort[1].locationId, 1);
  assert.equal(densitySort[2].locationId, 3);

  // Sort by title_asc ("Genesis 1", "Matthew 24", "The Watchtower")
  const titleSort = filterAndSortLocations(locations, '', 'all', 'all', 'title_asc');
  assert.equal(titleSort[0].resolvedTitle, 'Genesis 1');
  assert.equal(titleSort[1].resolvedTitle, 'Matthew 24');
  assert.equal(titleSort[2].resolvedTitle, 'The Watchtower');
});

test('Locations: Resilience against missing tables in older SQLite schemas', async () => {
  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();

  // Minimal legacy DB without UserMark, Bookmark, or InputField
  db.run(`
    CREATE TABLE Location (
      LocationId INTEGER PRIMARY KEY AUTOINCREMENT,
      BookNumber INTEGER,
      ChapterNumber INTEGER,
      KeySymbol TEXT,
      MepsLanguage INTEGER
    );
    CREATE TABLE Note (
      NoteId INTEGER PRIMARY KEY AUTOINCREMENT,
      Guid TEXT,
      LocationId INTEGER,
      Title TEXT
    );
    INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (1, 19, 23, 0);
    INSERT INTO Note (Guid, LocationId, Title) VALUES ('n1', 1, 'Psalm 23 note');
  `);

  const bytes = db.export();
  db.close();

  const locations = await extractLocationDetails(bytes);
  assert.equal(locations.length, 1);
  assert.equal(locations[0].resolvedTitle, 'Psalms 23');
  assert.equal(locations[0].notesCount, 1);
  assert.equal(locations[0].highlightsCount, 0);
  assert.equal(locations[0].bookmarksCount, 0);
  assert.equal(locations[0].inputFieldsCount, 0);
  assert.equal(locations[0].totalAnnotations, 1);
});
