import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import JSZip from 'jszip';
import { extractBookmarkDetails, extractNoteDetails } from '../src/lib/inspect.ts';

test('Real Backup Verification: iPad2 (German & English) Bookmarks and Categories', async () => {
  const ipadData = fs.readFileSync('./tests/UserDataBackup_2019-03-10_iPad2.jwlibrary');
  const ipadZip = await JSZip.loadAsync(ipadData);
  const ipadDb = ipadZip.file('userData.db') || ipadZip.file(/^.*\.db$/)[0];
  const ipadDbBuf = await ipadDb.async('nodebuffer');

  const bookmarks = await extractBookmarkDetails(ipadDbBuf);
  assert.ok(bookmarks.length > 0);

  // Bookmark 1: "23 ‘Er hat uns zuerst geliebt’" in cl (Book)
  const bm1 = bookmarks.find(b => b.title.includes('Er hat uns zuerst geliebt'));
  assert.ok(bm1);
  assert.equal(bm1.languageName, 'German (Deutsch)');
  assert.equal(bm1.publicationCategory, 'books_brochures');
  assert.equal(bm1.publicationCategoryLabel, 'Books & Brochures');

  // Bookmark 2: "7/15 Programm für die Woche vom 13. Juli" in km (Kingdom Ministry)
  const bm2 = bookmarks.find(b => b.title.includes('Programm für die Woche'));
  assert.ok(bm2);
  assert.equal(bm2.languageName, 'German (Deutsch)');
  assert.equal(bm2.publicationCategory, 'books_brochures');

  // Bookmark 5: "3 „Der Vater all derer, die Glauben haben“" in ia (Book)
  const bm5 = bookmarks.find(b => b.title.includes('Der Vater all derer'));
  assert.ok(bm5);
  assert.equal(bm5.languageName, 'German (Deutsch)');
  assert.equal(bm5.publicationCategory, 'books_brochures');

  // Bookmark 7: "5/16 Das geht mit der JW Library" in mwb (Meeting Workbook)
  const bm7 = bookmarks.find(b => b.title.includes('Das geht mit der JW Library'));
  assert.ok(bm7);
  assert.equal(bm7.languageName, 'German (Deutsch)');
  assert.equal(bm7.publicationCategory, 'workbook');
  assert.equal(bm7.publicationCategoryLabel, 'Meeting Workbook');

  // Bookmark 9: "1. Mose 2:8" in Rbi8 (Bible, Genesis 2)
  const bm9 = bookmarks.find(b => b.title.includes('1. Mose 2:8'));
  assert.ok(bm9);
  assert.equal(bm9.languageName, 'German (Deutsch)');
  assert.equal(bm9.publicationCategory, 'bible');
  assert.equal(bm9.publicationCategoryLabel, 'Bible');
  assert.equal(bm9.locationTitle, 'Genesis 2');
});

test('Real Backup Verification: iPhone (Vietnamese & English) Notes and Language Tagging', async () => {
  const iphoneData = fs.readFileSync('./tests/UserdataBackup_2026-08-14_iPhone.jwlibrary');
  const iphoneZip = await JSZip.loadAsync(iphoneData);
  const iphoneDb = iphoneZip.file('userData.db') || iphoneZip.file(/^.*\.db$/)[0];
  const iphoneDbBuf = await iphoneDb.async('nodebuffer');

  const notes = await extractNoteDetails(iphoneDbBuf);
  assert.ok(notes.length > 0);

  // Verify Vietnamese notes have languageName = "Vietnamese (Tiếng Việt)"
  const viNotes = notes.filter(n => n.mepsLanguage === 258);
  assert.ok(viNotes.length > 0);
  for (const n of viNotes) {
    assert.equal(n.languageName, 'Vietnamese (Tiếng Việt)');
  }

  // Verify English notes have languageName = "English"
  const enNotes = notes.filter(n => n.mepsLanguage === 0);
  assert.ok(enNotes.length > 0);
  for (const n of enNotes) {
    assert.equal(n.languageName, 'English');
  }
});
