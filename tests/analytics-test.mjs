import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
import { extractBackupAnalytics } from '../src/lib/analytics.ts';

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

test('Analytics: Empty database returns zeroed structure gracefully', async () => {
  const dbBytes = await createTestDb(() => {});
  const analytics = await extractBackupAnalytics(dbBytes);

  assert.equal(analytics.totalAnnotations, 0);
  assert.equal(analytics.totalNotes, 0);
  assert.equal(analytics.totalHighlights, 0);
  assert.equal(analytics.totalBookmarks, 0);
  assert.equal(analytics.totalInputFields, 0);
  assert.equal(analytics.totalIndependentNotes, 0);
  assert.equal(analytics.languages.length, 0);
  assert.equal(analytics.watchtowerByYear.length, 0);
  assert.equal(analytics.topPublications.length, 0);
  assert.equal(analytics.categories.length, 5);
});

test('Analytics: Multilingual aggregation across MEPS Languages', async () => {
  const dbBytes = await createTestDb((db) => {
    // English Location (0)
    db.run(`INSERT INTO Location (LocationId, KeySymbol, MepsLanguage, Title) VALUES (1, 'nwt', 0, 'English Bible')`);
    // Vietnamese Location (39)
    db.run(`INSERT INTO Location (LocationId, KeySymbol, MepsLanguage, Title) VALUES (2, 'nwt', 39, 'Kinh Thánh')`);
    // Spanish Location (1)
    db.run(`INSERT INTO Location (LocationId, KeySymbol, MepsLanguage, Title) VALUES (3, 'w', 1, 'La Atalaya')`);

    // 3 UserMarks in English, 2 in Vietnamese, 1 in Spanish
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (1, 'um-en-1'), (1, 'um-en-2'), (1, 'um-en-3')`);
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (2, 'um-vi-1'), (2, 'um-vi-2')`);
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (3, 'um-es-1')`);

    // 2 Notes in Vietnamese, 1 in English
    db.run(`INSERT INTO Note (Guid, LocationId, Title, Content, LastModified) VALUES ('n-vi-1', 2, 'Ghi chú 1', 'Nội dung', '2024-01-01T00:00:00Z')`);
    db.run(`INSERT INTO Note (Guid, LocationId, Title, Content, LastModified) VALUES ('n-vi-2', 2, 'Ghi chú 2', 'Nội dung', '2024-01-02T00:00:00Z')`);
    db.run(`INSERT INTO Note (Guid, LocationId, Title, Content, LastModified) VALUES ('n-en-1', 1, 'English Note', 'Content', '2024-01-03T00:00:00Z')`);

    // 1 Bookmark in English
    db.run(`INSERT INTO Bookmark (LocationId, Slot, Title) VALUES (1, 1, 'English Bookmark')`);
  });

  const analytics = await extractBackupAnalytics(dbBytes);

  assert.equal(analytics.totalHighlights, 6);
  assert.equal(analytics.totalNotes, 3);
  assert.equal(analytics.totalBookmarks, 1);
  assert.equal(analytics.totalAnnotations, 10);

  assert.equal(analytics.languages.length, 3);

  // English: 3 highlights + 1 note + 1 bookmark = 5 (50%)
  const en = analytics.languages.find(l => l.mepsLanguage === 0);
  assert.ok(en);
  assert.equal(en.languageName, 'English');
  assert.equal(en.highlightsCount, 3);
  assert.equal(en.notesCount, 1);
  assert.equal(en.bookmarksCount, 1);
  assert.equal(en.totalAnnotations, 5);
  assert.equal(en.percentage, 50);

  // Vietnamese: 2 highlights + 2 notes = 4 (40%)
  const vi = analytics.languages.find(l => l.mepsLanguage === 39);
  assert.ok(vi);
  assert.equal(vi.languageName, 'Vietnamese (Tiếng Việt)');
  assert.equal(vi.nativeName, 'Tiếng Việt');
  assert.equal(vi.highlightsCount, 2);
  assert.equal(vi.notesCount, 2);
  assert.equal(vi.totalAnnotations, 4);
  assert.equal(vi.percentage, 40);

  // Spanish: 1 highlight = 1 (10%)
  const es = analytics.languages.find(l => l.mepsLanguage === 1);
  assert.ok(es);
  assert.equal(es.languageName, 'Spanish (Español)');
  assert.equal(es.highlightsCount, 1);
  assert.equal(es.totalAnnotations, 1);
  assert.equal(es.percentage, 10);
});

test('Analytics: 5 distinct publication categories aggregation', async () => {
  const dbBytes = await createTestDb((db) => {
    // 1. Bible (BookNumber 1 = Genesis, BookNumber 40 = Matthew)
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (1, 1, 1, 0)`);
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (2, 40, 5, 0)`);

    // 2. Watchtower (w, IssueTagNumber 20240100)
    db.run(`INSERT INTO Location (LocationId, KeySymbol, IssueTagNumber, MepsLanguage) VALUES (3, 'w', 20240100, 0)`);

    // 3. Meeting Workbook (mwb, IssueTagNumber 20240300)
    db.run(`INSERT INTO Location (LocationId, KeySymbol, IssueTagNumber, MepsLanguage) VALUES (4, 'mwb', 20240300, 0)`);

    // 4. Books/Brochures (lff = Enjoy Life Forever, it-1 = Insight)
    db.run(`INSERT INTO Location (LocationId, KeySymbol, MepsLanguage) VALUES (5, 'lff', 0)`);
    db.run(`INSERT INTO Location (LocationId, KeySymbol, MepsLanguage) VALUES (6, 'it-1', 0)`);

    // Annotations in Bible
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (1, 'um-gen-1'), (2, 'um-mat-1')`);
    db.run(`INSERT INTO Note (Guid, LocationId, Title, LastModified) VALUES ('n-gen-1', 1, 'Gen Note', '2024-01-01T00:00:00Z')`);

    // Annotations in Watchtower
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (3, 'um-w-1')`);
    db.run(`INSERT INTO Note (Guid, LocationId, Title, LastModified) VALUES ('n-w-1', 3, 'WT Note', '2024-01-01T00:00:00Z')`);
    db.run(`INSERT INTO Bookmark (LocationId, Slot, Title) VALUES (3, 1, 'WT Bookmark')`);

    // Annotations in Workbook
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (4, 'um-mwb-1')`);
    db.run(`INSERT INTO InputField (LocationId, Text) VALUES (4, 'My answer')`);

    // Annotations in Books/Brochures
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (5, 'um-lff-1'), (6, 'um-it-1')`);

    // 5. Independent Notes (LocationId is NULL / 0)
    db.run(`INSERT INTO Note (Guid, LocationId, Title, LastModified) VALUES ('n-ind-1', NULL, 'Independent Note 1', '2024-01-01T00:00:00Z')`);
    db.run(`INSERT INTO Note (Guid, LocationId, Title, LastModified) VALUES ('n-ind-2', NULL, 'Independent Note 2', '2024-01-01T00:00:00Z')`);
  });

  const analytics = await extractBackupAnalytics(dbBytes);

  const catMap = new Map(analytics.categories.map(c => [c.category, c]));

  // 1. Bible: 2 UserMarks + 1 Note = 3
  const bible = catMap.get('bible');
  assert.ok(bible);
  assert.equal(bible.highlightsCount, 2);
  assert.equal(bible.notesCount, 1);
  assert.equal(bible.totalAnnotations, 3);

  // 2. Watchtower: 1 UserMark + 1 Note + 1 Bookmark = 3
  const wt = catMap.get('watchtower');
  assert.ok(wt);
  assert.equal(wt.highlightsCount, 1);
  assert.equal(wt.notesCount, 1);
  assert.equal(wt.bookmarksCount, 1);
  assert.equal(wt.totalAnnotations, 3);

  // 3. Workbook: 1 UserMark + 1 InputField = 2
  const mwb = catMap.get('workbook');
  assert.ok(mwb);
  assert.equal(mwb.highlightsCount, 1);
  assert.equal(mwb.inputFieldsCount, 1);
  assert.equal(mwb.totalAnnotations, 2);

  // 4. Books/Brochures: 2 UserMarks = 2
  const books = catMap.get('books_brochures');
  assert.ok(books);
  assert.equal(books.highlightsCount, 2);
  assert.equal(books.totalAnnotations, 2);

  // 5. Independent Notes: 2 Notes = 2
  const ind = catMap.get('independent_notes');
  assert.ok(ind);
  assert.equal(ind.notesCount, 2);
  assert.equal(ind.totalAnnotations, 2);
  assert.equal(analytics.totalIndependentNotes, 2);
});

test('Analytics: Multi-year Watchtower grouping and monthly issue breakdown', async () => {
  const dbBytes = await createTestDb((db) => {
    // 2024 Jan (20240100), 2024 Feb (20240200)
    db.run(`INSERT INTO Location (LocationId, KeySymbol, IssueTagNumber, MepsLanguage) VALUES (1, 'w', 20240100, 0)`);
    db.run(`INSERT INTO Location (LocationId, KeySymbol, IssueTagNumber, MepsLanguage) VALUES (2, 'w', 20240200, 0)`);
    // 2023 Nov (20231100)
    db.run(`INSERT INTO Location (LocationId, KeySymbol, IssueTagNumber, MepsLanguage) VALUES (3, 'w', 20231100, 0)`);

    // 2024 Jan: 3 UserMarks, 1 Note
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (1, 'um-24-1'), (1, 'um-24-2'), (1, 'um-24-3')`);
    db.run(`INSERT INTO Note (Guid, LocationId, Title, LastModified) VALUES ('n-24-1', 1, 'Jan Note', '2024-01-01T00:00:00Z')`);

    // 2024 Feb: 1 UserMark
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (2, 'um-24-4')`);

    // 2023 Nov: 2 UserMarks, 1 Bookmark
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (3, 'um-23-1'), (3, 'um-23-2')`);
    db.run(`INSERT INTO Bookmark (LocationId, Slot, Title) VALUES (3, 1, 'Nov BM')`);
  });

  const analytics = await extractBackupAnalytics(dbBytes);

  assert.equal(analytics.watchtowerByYear.length, 2);

  // Year 2024: 4 UserMarks + 1 Note = 5
  const y2024 = analytics.watchtowerByYear.find(y => y.year === 2024);
  assert.ok(y2024);
  assert.equal(y2024.totalAnnotations, 5);
  assert.equal(y2024.highlightsCount, 4);
  assert.equal(y2024.notesCount, 1);
  assert.equal(y2024.issues.length, 2);

  const jan = y2024.issues.find(i => i.month === 1);
  assert.ok(jan);
  assert.equal(jan.monthName, 'January');
  assert.equal(jan.totalAnnotations, 4);

  const feb = y2024.issues.find(i => i.month === 2);
  assert.ok(feb);
  assert.equal(feb.monthName, 'February');
  assert.equal(feb.totalAnnotations, 1);

  // Year 2023: 2 UserMarks + 1 Bookmark = 3
  const y2023 = analytics.watchtowerByYear.find(y => y.year === 2023);
  assert.ok(y2023);
  assert.equal(y2023.totalAnnotations, 3);
  assert.equal(y2023.issues.length, 1);
  assert.equal(y2023.issues[0].month, 11);
  assert.equal(y2023.issues[0].monthName, 'November');
});

test('Analytics: Top Studied Publications ranking', async () => {
  const dbBytes = await createTestDb((db) => {
    // #1: Enjoy Life Forever (lff) - 6 annotations
    db.run(`INSERT INTO Location (LocationId, KeySymbol, MepsLanguage) VALUES (1, 'lff', 0)`);
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (1, 'um1'), (1, 'um2'), (1, 'um3'), (1, 'um4')`);
    db.run(`INSERT INTO Note (Guid, LocationId, Title, LastModified) VALUES ('n1', 1, 'Note 1', '2024-01-01T00:00:00Z'), ('n2', 1, 'Note 2', '2024-01-01T00:00:00Z')`);

    // #2: Matthew (BookNumber 40) - 4 annotations
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (2, 40, 1, 0)`);
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (2, 'um5'), (2, 'um6'), (2, 'um7')`);
    db.run(`INSERT INTO Note (Guid, LocationId, Title, LastModified) VALUES ('n3', 2, 'Matt Note', '2024-01-01T00:00:00Z')`);

    // #3: Bearing Thorough Witness (bt) - 2 annotations
    db.run(`INSERT INTO Location (LocationId, KeySymbol, MepsLanguage) VALUES (3, 'bt', 0)`);
    db.run(`INSERT INTO UserMark (LocationId, UserMarkGuid) VALUES (3, 'um8'), (3, 'um9')`);
  });

  const analytics = await extractBackupAnalytics(dbBytes);

  assert.ok(analytics.topPublications.length >= 3);
  assert.equal(analytics.topPublications[0].shortTitle, 'Enjoy Life Forever!');
  assert.equal(analytics.topPublications[0].totalAnnotations, 6);

  assert.equal(analytics.topPublications[1].title, 'Matthew');
  assert.equal(analytics.topPublications[1].totalAnnotations, 4);

  assert.equal(analytics.topPublications[2].shortTitle, 'Bearing Thorough Witness');
  assert.equal(analytics.topPublications[2].totalAnnotations, 2);
});

test('Analytics: Note Location resolution via UserMarkId when LocationId is NULL', async () => {
  const dbBytes = await createTestDb((db) => {
    // Location for Vietnamese Bible
    db.run(`INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage) VALUES (10, 45, 8, 39)`);
    // UserMark linked to Location 10
    db.run(`INSERT INTO UserMark (UserMarkId, LocationId, UserMarkGuid) VALUES (50, 10, 'um-romans')`);
    // Note linked to UserMark 50 with NULL LocationId
    db.run(`INSERT INTO Note (Guid, UserMarkId, LocationId, Title, LastModified) VALUES ('n-romans', 50, NULL, 'Romans 8 Note', '2024-01-01T00:00:00Z')`);
  });

  const analytics = await extractBackupAnalytics(dbBytes);

  assert.equal(analytics.totalNotes, 1);
  assert.equal(analytics.totalHighlights, 1);
  assert.equal(analytics.totalIndependentNotes, 0);

  // Language should be Vietnamese (39)
  assert.equal(analytics.languages.length, 1);
  assert.equal(analytics.languages[0].mepsLanguage, 39);
  assert.equal(analytics.languages[0].notesCount, 1);
  assert.equal(analytics.languages[0].highlightsCount, 1);

  // Category should be Bible
  const bibleCat = analytics.categories.find(c => c.category === 'bible');
  assert.equal(bibleCat?.notesCount, 1);
  assert.equal(bibleCat?.highlightsCount, 1);

  // Bible book should be Romans (45)
  assert.equal(analytics.bibleByBook.length, 1);
  assert.equal(analytics.bibleByBook[0].bookNumber, 45);
  assert.equal(analytics.bibleByBook[0].bookName, 'Romans');
  assert.equal(analytics.bibleByBook[0].notesCount, 1);
});

test('Analytics: Resilience against missing tables (e.g. older schema without InputField or UserMark)', async () => {
  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();

  // Minimal legacy DB without InputField or UserMark
  db.run(`
    CREATE TABLE Location (
      LocationId INTEGER PRIMARY KEY AUTOINCREMENT,
      BookNumber INTEGER,
      KeySymbol TEXT,
      MepsLanguage INTEGER
    );
    CREATE TABLE Note (
      NoteId INTEGER PRIMARY KEY AUTOINCREMENT,
      Guid TEXT,
      LocationId INTEGER,
      Title TEXT
    );
    INSERT INTO Location (LocationId, KeySymbol, MepsLanguage) VALUES (1, 'w', 0);
    INSERT INTO Note (Guid, LocationId, Title) VALUES ('n1', 1, 'Note in WT');
  `);

  const bytes = db.export();
  db.close();

  const analytics = await extractBackupAnalytics(bytes);
  assert.equal(analytics.totalNotes, 1);
  assert.equal(analytics.totalHighlights, 0);
  assert.equal(analytics.totalBookmarks, 0);
  assert.equal(analytics.totalInputFields, 0);
  assert.equal(analytics.languages[0].languageName, 'English');
});

