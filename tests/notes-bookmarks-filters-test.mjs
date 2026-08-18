import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
import { 
  extractNoteDetails, 
  extractBookmarkDetails,
  filterAndSortNotes,
  filterAndSortBookmarks,
  getAvailableNoteLanguages,
  getAvailableBookmarkLanguages,
  getAvailableNoteCategories,
  getAvailableBookmarkCategories
} from '../src/lib/inspect.ts';
import { 
  resolvePublicationCategory, 
  PUBLICATION_CATEGORY_DEFINITIONS,
  HIGHLIGHT_COLORS 
} from '../src/lib/constants.ts';

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
  `);

  if (setupFn) {
    setupFn(db);
  }

  const bytes = db.export();
  db.close();
  return bytes;
}

test('Notes & Bookmarks: Empty database returns empty arrays and default available filters', async () => {
  const dbBytes = await createTestDb();

  const notes = await extractNoteDetails(dbBytes);
  const bookmarks = await extractBookmarkDetails(dbBytes);

  assert.equal(notes.length, 0);
  assert.equal(bookmarks.length, 0);

  const noteLangs = getAvailableNoteLanguages(notes);
  const bookmarkLangs = getAvailableBookmarkLanguages(bookmarks);
  assert.equal(noteLangs.length, 0);
  assert.equal(bookmarkLangs.length, 0);

  const noteCats = getAvailableNoteCategories(notes);
  assert.equal(noteCats.length, 5);
  assert.ok(noteCats.every(c => c.count === 0));

  const filteredNotes = filterAndSortNotes(notes);
  assert.equal(filteredNotes.length, 0);
});

test('Notes & Bookmarks: Multilingual notes and publication category resolution', async () => {
  const dbBytes = await createTestDb((db) => {
    // Locations across multiple languages & categories
    // 1: English Genesis 1 (Bible)
    db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage, KeySymbol, Type) VALUES (1, 1, 1, 0, 'nwt', 0)");
    // 2: Vietnamese Romans 8 (Bible)
    db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage, KeySymbol, Type) VALUES (2, 45, 8, 39, 'nwt', 0)");
    // 3: English Watchtower 2024-01 (Watchtower)
    db.run("INSERT INTO Location (LocationId, IssueTagNumber, KeySymbol, MepsLanguage, Type) VALUES (3, 20240100, 'w24', 0, 1)");
    // 4: Vietnamese Meeting Workbook 2024-03 (Workbook)
    db.run("INSERT INTO Location (LocationId, IssueTagNumber, KeySymbol, MepsLanguage, Type) VALUES (4, 20240300, 'mwb24', 39, 1)");
    // 5: Spanish Enjoy Life Forever! (Books/Brochures)
    db.run("INSERT INTO Location (LocationId, DocumentId, KeySymbol, MepsLanguage, Type) VALUES (5, 1001, 'lff', 1, 1)");

    // UserMark for highlight attachment
    db.run("INSERT INTO UserMark (UserMarkId, ColorIndex, LocationId, UserMarkGuid, Version) VALUES (10, 2, 2, 'mark-guid-1', 1)");

    // Notes
    // Note 1: Direct Bible note (EN)
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, LastModified, Created) VALUES (1, 'n-1', 1, 'Creation Days', 'God created the heavens and earth', '2024-01-15T10:00:00Z', '2024-01-10T10:00:00Z')");
    // Note 2: Note attached via UserMark in Vietnamese Romans 8 (VI, Green highlight)
    db.run("INSERT INTO Note (NoteId, Guid, UserMarkId, Title, Content, LastModified, Created) VALUES (2, 'n-2', 10, 'Tình yêu thương của Đức Chúa Trời', 'Không điều gì có thể tách rời chúng ta', '2024-02-20T12:00:00Z', '2024-02-15T12:00:00Z')");
    // Note 3: Watchtower Note (EN)
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, LastModified, Created) VALUES (3, 'n-3', 3, 'Watchtower Gem', 'Study article paragraph 5 insight', '2024-03-01T08:00:00Z', '2024-03-01T08:00:00Z')");
    // Note 4: Workbook Note (VI)
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, LastModified, Created) VALUES (4, 'n-4', 4, 'Bài học thánh chức', 'Chuẩn bị phần thực tập thánh chức', '2024-03-10T14:00:00Z', '2024-03-08T14:00:00Z')");
    // Note 5: Book Note (ES)
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, LastModified, Created) VALUES (5, 'n-5', 5, 'Disfrute de la vida', 'Lección 1 preguntas', '2024-04-05T09:00:00Z', '2024-04-01T09:00:00Z')");
    // Note 6: Independent General Note (No Location)
    db.run("INSERT INTO Note (NoteId, Guid, Title, Content, LastModified, Created) VALUES (6, 'n-6', 'Ministry Goals', 'Reach 50 hours this month', '2024-05-01T16:00:00Z', '2024-05-01T16:00:00Z')");

    // Bookmarks
    // Bookmark 1: Slot 1 on Genesis 1 (EN)
    db.run("INSERT INTO Bookmark (BookmarkId, LocationId, Slot, Title, Snippet) VALUES (1, 1, 1, 'Genesis Daily Reading', 'In the beginning God created...')");
    // Bookmark 2: Slot 2 on Romans 8 (VI)
    db.run("INSERT INTO Bookmark (BookmarkId, LocationId, Slot, Title, Snippet) VALUES (2, 2, 2, 'Rô-ma 8 Đoạn Đọc', 'Vì tôi tin chắc rằng cả sự chết...')");
    // Bookmark 3: Slot 3 on Watchtower (EN)
    db.run("INSERT INTO Bookmark (BookmarkId, LocationId, Slot, Title, Snippet) VALUES (3, 3, 3, 'Watchtower Current Study', 'Keep on the watch...')");
  });

  const notes = await extractNoteDetails(dbBytes);
  const bookmarks = await extractBookmarkDetails(dbBytes);

  assert.equal(notes.length, 6);
  assert.equal(bookmarks.length, 3);

  // Verify Note 1 (Bible EN)
  const n1 = notes.find(n => n.guid === 'n-1');
  assert.ok(n1);
  assert.equal(n1.publicationCategory, 'bible');
  assert.equal(n1.mepsLanguage, 0);
  assert.equal(n1.languageName, 'English');
  assert.equal(n1.locationTitle, 'Genesis 1');

  // Verify Note 2 (Bible VI via UserMark + Green highlight)
  const n2 = notes.find(n => n.guid === 'n-2');
  assert.ok(n2);
  assert.equal(n2.publicationCategory, 'bible');
  assert.equal(n2.mepsLanguage, 39);
  assert.equal(n2.languageName, 'Vietnamese (Tiếng Việt)');
  assert.equal(n2.colorIndex, 2);
  assert.equal(n2.locationTitle, 'Romans 8');

  // Verify Note 3 (Watchtower EN)
  const n3 = notes.find(n => n.guid === 'n-3');
  assert.ok(n3);
  assert.equal(n3.publicationCategory, 'watchtower');
  assert.equal(n3.mepsLanguage, 0);

  // Verify Note 4 (Workbook VI)
  const n4 = notes.find(n => n.guid === 'n-4');
  assert.ok(n4);
  assert.equal(n4.publicationCategory, 'workbook');
  assert.equal(n4.mepsLanguage, 39);

  // Verify Note 5 (Books ES)
  const n5 = notes.find(n => n.guid === 'n-5');
  assert.ok(n5);
  assert.equal(n5.publicationCategory, 'books_brochures');
  assert.equal(n5.mepsLanguage, 1);
  assert.equal(n5.languageName, 'Spanish (Español)');

  // Verify Note 6 (Independent Note)
  const n6 = notes.find(n => n.guid === 'n-6');
  assert.ok(n6);
  assert.equal(n6.publicationCategory, 'independent_notes');
  assert.equal(n6.mepsLanguage, undefined);

  // Verify Bookmarks
  const bm1 = bookmarks.find(b => b.slot === 1);
  assert.ok(bm1);
  assert.equal(bm1.publicationCategory, 'bible');
  assert.equal(bm1.mepsLanguage, 0);
  assert.equal(bm1.locationTitle, 'Genesis 1');

  const bm2 = bookmarks.find(b => b.slot === 2);
  assert.ok(bm2);
  assert.equal(bm2.publicationCategory, 'bible');
  assert.equal(bm2.mepsLanguage, 39);
  assert.equal(bm2.locationTitle, 'Romans 8');
});

test('Notes Filter: Dynamic language and category availability helpers', async () => {
  const dbBytes = await createTestDb((db) => {
    db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage, KeySymbol, Type) VALUES (1, 1, 1, 0, 'nwt', 0)");
    db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage, KeySymbol, Type) VALUES (2, 45, 8, 39, 'nwt', 0)");
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, LastModified) VALUES (1, 'n-1', 1, 'Note EN 1', '2024-01-01T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, LastModified) VALUES (2, 'n-2', 1, 'Note EN 2', '2024-01-02T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, LastModified) VALUES (3, 'n-3', 2, 'Note VI 1', '2024-01-03T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, Title, LastModified) VALUES (4, 'n-4', 'Independent Note', '2024-01-04T00:00:00Z')");
  });

  const notes = await extractNoteDetails(dbBytes);

  // Available languages should dynamically contain only English (count: 2) and Vietnamese (count: 1)
  const langs = getAvailableNoteLanguages(notes);
  assert.equal(langs.length, 2);
  assert.equal(langs[0].id, 0);
  assert.equal(langs[0].name, 'English');
  assert.equal(langs[0].count, 2);
  assert.equal(langs[1].id, 39);
  assert.equal(langs[1].name, 'Vietnamese (Tiếng Việt)');
  assert.equal(langs[1].count, 1);

  // Available categories
  const cats = getAvailableNoteCategories(notes);
  const bibleCat = cats.find(c => c.key === 'bible');
  const indepCat = cats.find(c => c.key === 'independent_notes');
  assert.equal(bibleCat?.count, 3);
  assert.equal(indepCat?.count, 1);
});

test('Notes Filter: Language dropdown filtering', async () => {
  const dbBytes = await createTestDb((db) => {
    db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage, KeySymbol, Type) VALUES (1, 1, 1, 0, 'nwt', 0)");
    db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage, KeySymbol, Type) VALUES (2, 45, 8, 39, 'nwt', 0)");
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, LastModified) VALUES (1, 'n-1', 1, 'English Note 1', '2024-01-01T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, LastModified) VALUES (2, 'n-2', 1, 'English Note 2', '2024-01-02T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, LastModified) VALUES (3, 'n-3', 2, 'Vietnamese Note', '2024-01-03T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, Title, LastModified) VALUES (4, 'n-4', 'Independent Note', '2024-01-04T00:00:00Z')");
  });

  const notes = await extractNoteDetails(dbBytes);

  // Filter 'all' -> 4 notes
  const allNotes = filterAndSortNotes(notes, { language: 'all' });
  assert.equal(allNotes.length, 4);

  // Filter English (0) -> 2 notes
  const enNotes = filterAndSortNotes(notes, { language: 0 });
  assert.equal(enNotes.length, 2);
  assert.ok(enNotes.every(n => n.mepsLanguage === 0));

  // Filter Vietnamese (39) -> 1 note
  const viNotes = filterAndSortNotes(notes, { language: 39 });
  assert.equal(viNotes.length, 1);
  assert.equal(viNotes[0].guid, 'n-3');

  // Filter non-existent language (e.g. 5 = Swedish) -> 0 notes
  const svNotes = filterAndSortNotes(notes, { language: 5 });
  assert.equal(svNotes.length, 0);
});

test('Notes Filter: Publication category dropdown filtering', async () => {
  const dbBytes = await createTestDb((db) => {
    db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage, KeySymbol, Type) VALUES (1, 1, 1, 0, 'nwt', 0)");
    db.run("INSERT INTO Location (LocationId, IssueTagNumber, KeySymbol, MepsLanguage, Type) VALUES (2, 20240100, 'w24', 0, 1)");
    db.run("INSERT INTO Location (LocationId, IssueTagNumber, KeySymbol, MepsLanguage, Type) VALUES (3, 20240300, 'mwb24', 0, 1)");
    db.run("INSERT INTO Location (LocationId, DocumentId, KeySymbol, MepsLanguage, Type) VALUES (4, 10, 'lff', 0, 1)");
    
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, LastModified) VALUES (1, 'n-1', 1, 'Bible Note', '2024-01-01T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, LastModified) VALUES (2, 'n-2', 2, 'Watchtower Note', '2024-01-02T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, LastModified) VALUES (3, 'n-3', 3, 'Workbook Note', '2024-01-03T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, LastModified) VALUES (4, 'n-4', 4, 'Book Note', '2024-01-04T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, Title, LastModified) VALUES (5, 'n-5', 'Independent Note', '2024-01-05T00:00:00Z')");
  });

  const notes = await extractNoteDetails(dbBytes);

  assert.equal(filterAndSortNotes(notes, { category: 'bible' }).length, 1);
  assert.equal(filterAndSortNotes(notes, { category: 'watchtower' }).length, 1);
  assert.equal(filterAndSortNotes(notes, { category: 'workbook' }).length, 1);
  assert.equal(filterAndSortNotes(notes, { category: 'books_brochures' }).length, 1);
  assert.equal(filterAndSortNotes(notes, { category: 'independent_notes' }).length, 1);
  assert.equal(filterAndSortNotes(notes, { category: 'all' }).length, 5);
});

test('Notes Filter: Seamless combination of text search, language, and publication category', async () => {
  const dbBytes = await createTestDb((db) => {
    db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage, KeySymbol, Type) VALUES (1, 1, 1, 0, 'nwt', 0)");
    db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage, KeySymbol, Type) VALUES (2, 45, 8, 39, 'nwt', 0)");
    db.run("INSERT INTO Location (LocationId, IssueTagNumber, KeySymbol, MepsLanguage, Type) VALUES (3, 20240100, 'w24', 0, 1)");

    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, LastModified) VALUES (1, 'n-1', 1, 'Gods Love', 'Reflecting divine love in daily life', '2024-01-01T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, LastModified) VALUES (2, 'n-2', 2, 'Tình Yêu Thương', 'Tình yêu thương không bao giờ suy tàn', '2024-01-02T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, LocationId, Title, Content, LastModified) VALUES (3, 'n-3', 3, 'Faith and Love', 'Watchtower study on enduring love', '2024-01-03T00:00:00Z')");
  });

  const notes = await extractNoteDetails(dbBytes);

  // 1. Text search 'love' across all -> 3 notes
  const searchLove = filterAndSortNotes(notes, { searchQuery: 'love' });
  assert.equal(searchLove.length, 2); // 'Gods Love' and 'Faith and Love'

  // 2. Text search 'love' + Category 'bible' -> 1 note ('Gods Love' in Genesis 1)
  const bibleLove = filterAndSortNotes(notes, { searchQuery: 'love', category: 'bible' });
  assert.equal(bibleLove.length, 1);
  assert.equal(bibleLove[0].guid, 'n-1');

  // 3. Text search 'love' + Language 0 (English) + Category 'watchtower' -> 1 note ('Faith and Love')
  const wtLove = filterAndSortNotes(notes, { searchQuery: 'love', language: 0, category: 'watchtower' });
  assert.equal(wtLove.length, 1);
  assert.equal(wtLove[0].guid, 'n-3');

  // 4. Vietnamese text search 'tình yêu' + Language 39 -> 1 note
  const viSearch = filterAndSortNotes(notes, { searchQuery: 'tình yêu', language: 39 });
  assert.equal(viSearch.length, 1);
  assert.equal(viSearch[0].guid, 'n-2');

  // 5. Mismatched query combination -> 0 notes
  const mismatch = filterAndSortNotes(notes, { searchQuery: 'tình yêu', language: 0 });
  assert.equal(mismatch.length, 0);
});

test('Notes Sorting: Sorting controls modified_desc, modified_asc, created_desc, created_asc, title_asc, title_desc', async () => {
  const dbBytes = await createTestDb((db) => {
    db.run("INSERT INTO Note (NoteId, Guid, Title, Created, LastModified) VALUES (1, 'n-1', 'B Note', '2023-01-01T00:00:00Z', '2024-03-01T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, Title, Created, LastModified) VALUES (2, 'n-2', 'A Note', '2023-06-01T00:00:00Z', '2024-01-01T00:00:00Z')");
    db.run("INSERT INTO Note (NoteId, Guid, Title, Created, LastModified) VALUES (3, 'n-3', 'C Note', '2023-03-01T00:00:00Z', '2024-02-01T00:00:00Z')");
  });

  const notes = await extractNoteDetails(dbBytes);

  // Modified desc (B -> C -> A)
  const modDesc = filterAndSortNotes(notes, { sortBy: 'modified_desc' });
  assert.deepEqual(modDesc.map(n => n.guid), ['n-1', 'n-3', 'n-2']);

  // Modified asc (A -> C -> B)
  const modAsc = filterAndSortNotes(notes, { sortBy: 'modified_asc' });
  assert.deepEqual(modAsc.map(n => n.guid), ['n-2', 'n-3', 'n-1']);

  // Title asc (A -> B -> C)
  const titleAsc = filterAndSortNotes(notes, { sortBy: 'title_asc' });
  assert.deepEqual(titleAsc.map(n => n.guid), ['n-2', 'n-1', 'n-3']);

  // Title desc (C -> B -> A)
  const titleDesc = filterAndSortNotes(notes, { sortBy: 'title_desc' });
  assert.deepEqual(titleDesc.map(n => n.guid), ['n-3', 'n-1', 'n-2']);
});

test('Bookmarks Filter & Sort: Language, category, search, and slot ordering', async () => {
  const dbBytes = await createTestDb((db) => {
    db.run("INSERT INTO Location (LocationId, BookNumber, ChapterNumber, MepsLanguage, KeySymbol, Type) VALUES (1, 19, 23, 0, 'nwt', 0)");
    db.run("INSERT INTO Location (LocationId, IssueTagNumber, KeySymbol, MepsLanguage, Type) VALUES (2, 20240100, 'w24', 39, 1)");

    db.run("INSERT INTO Bookmark (BookmarkId, LocationId, Slot, Title, Snippet) VALUES (1, 1, 3, 'Psalm 23 Shepherd', 'Jehovah is my Shepherd...')");
    db.run("INSERT INTO Bookmark (BookmarkId, LocationId, Slot, Title, Snippet) VALUES (2, 2, 1, 'Tháp Canh Tháng 1', 'Bài học số 1...')");
  });

  const bookmarks = await extractBookmarkDetails(dbBytes);
  assert.equal(bookmarks.length, 2);

  // Available languages
  const langs = getAvailableBookmarkLanguages(bookmarks);
  assert.equal(langs.length, 2);

  // Filter by English -> 1 bookmark
  const enBms = filterAndSortBookmarks(bookmarks, { language: 0 });
  assert.equal(enBms.length, 1);
  assert.equal(enBms[0].title, 'Psalm 23 Shepherd');

  // Filter by Watchtower -> 1 bookmark
  const wtBms = filterAndSortBookmarks(bookmarks, { category: 'watchtower' });
  assert.equal(wtBms.length, 1);
  assert.equal(wtBms[0].title, 'Tháp Canh Tháng 1');

  // Search snippet 'shepherd' -> 1 bookmark
  const snipSearch = filterAndSortBookmarks(bookmarks, { searchQuery: 'shepherd' });
  assert.equal(snipSearch.length, 1);

  // Sort by slot asc (Slot 1 then Slot 3)
  const slotAsc = filterAndSortBookmarks(bookmarks, { sortBy: 'slot_asc' });
  assert.equal(slotAsc[0].slot, 1);
  assert.equal(slotAsc[1].slot, 3);

  // Sort by slot desc (Slot 3 then Slot 1)
  const slotDesc = filterAndSortBookmarks(bookmarks, { sortBy: 'slot_desc' });
  assert.equal(slotDesc[0].slot, 3);
  assert.equal(slotDesc[1].slot, 1);
});

test('Schema Compatibility: extractNoteDetails and extractBookmarkDetails on minimal/older schemas', async () => {
  const wasmPath = path.resolve('node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();

  // Minimal Note table without Location, UserMark, or Created column
  db.run(`
    CREATE TABLE Note (
      NoteId INTEGER PRIMARY KEY,
      Guid TEXT,
      Title TEXT,
      Content TEXT,
      LastModified TEXT
    );
    INSERT INTO Note (NoteId, Guid, Title, Content, LastModified) VALUES (1, 'g1', 'Legacy Title', 'Legacy Content', '2019-01-01T00:00:00Z');
  `);

  const bytes = db.export();
  db.close();

  const notes = await extractNoteDetails(bytes);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].title, 'Legacy Title');
  assert.equal(notes[0].publicationCategory, 'independent_notes');
  assert.equal(notes[0].created, '2019-01-01T00:00:00Z');

  // Bookmarks on schema without Bookmark table returns empty array
  const bookmarks = await extractBookmarkDetails(bytes);
  assert.equal(bookmarks.length, 0);
});
