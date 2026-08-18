import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  MEPS_LANGUAGES, 
  getLanguageInfo, 
  getLanguageName, 
  BIBLE_BOOKS, 
  getBibleBookInfo, 
  getBibleBookName, 
  PUBLICATION_SYMBOLS, 
  getPublicationInfo, 
  getPublicationCategoryBadge, 
  resolvePublicationCategory,
  SCHEMA_DEFINITIONS, 
  getSchemaDefinition 
} from '../src/lib/constants.ts';

test('Domain Constants: MEPS Language mapping and graceful fallbacks', () => {
  // Common core languages
  assert.equal(getLanguageName(0), 'English');
  assert.equal(getLanguageName(0, false), 'English');
  
  assert.equal(getLanguageName(1), 'Spanish (Español)');
  assert.equal(getLanguageName(2), 'German (Deutsch)');
  assert.equal(getLanguageName(3), 'French (Français)');
  assert.equal(getLanguageName(4), 'Italian (Italiano)');
  assert.equal(getLanguageName(5), 'Portuguese (Brazil) (Português (Brasil))');
  assert.equal(getLanguageName(6), 'Dutch (Nederlands)');
  assert.equal(getLanguageName(7), 'Polish (Polski)');
  assert.equal(getLanguageName(8), 'Russian (Русский)');
  assert.equal(getLanguageName(9), 'Japanese (日本語)');
  assert.equal(getLanguageName(10), 'Swedish (Svenska)');
  assert.equal(getLanguageName(15), 'Korean (한국어)');
  assert.equal(getLanguageName(16), 'Tagalog');
  assert.equal(getLanguageName(258), 'Vietnamese (Tiếng Việt)');
  assert.equal(getLanguageName(258, false), 'Vietnamese');
  assert.equal(getLanguageName(207), 'Russian (Русский)');
  assert.equal(getLanguageName(785), 'Portuguese (Brazil) (Português (Brasil))');
  assert.equal(getLanguageName(100), 'American Sign Language (ASL)');

  // Language info object structure
  const viInfo = getLanguageInfo(258);
  assert.equal(viInfo.name, 'Vietnamese');
  assert.equal(viInfo.nativeName, 'Tiếng Việt');
  assert.equal(viInfo.code, 'vi');
  assert.equal(viInfo.formattedName, 'Vietnamese (Tiếng Việt)');

  // Legacy/alias MEPS ID 39 support
  assert.equal(getLanguageName(39), 'Vietnamese (Tiếng Việt)');

  // Unknown MEPS Language ID fallback
  assert.equal(getLanguageName(9999), 'Language #9999');
  assert.equal(getLanguageInfo(9999).formattedName, 'Language #9999');

  // Null, undefined, or NaN safety
  assert.equal(getLanguageName(null), 'Unknown Language');
  assert.equal(getLanguageName(undefined), 'Unknown Language');
  assert.equal(getLanguageName(NaN), 'Unknown Language');
  assert.equal(getLanguageInfo(null).formattedName, 'Unknown Language');
});

test('Domain Constants: 66 Bible Books mapping and boundary checks', () => {
  // Check exact 66 books
  const bookNumbers = Object.keys(BIBLE_BOOKS).map(Number);
  assert.equal(bookNumbers.length, 66);
  assert.equal(Math.min(...bookNumbers), 1);
  assert.equal(Math.max(...bookNumbers), 66);

  // Pentateuch / OT start
  const gen = getBibleBookInfo(1);
  assert.ok(gen);
  assert.equal(gen.name, 'Genesis');
  assert.equal(gen.shortName, 'Gen');
  assert.equal(gen.testament, 'OT');
  assert.equal(gen.chapters, 50);
  assert.equal(gen.division, 'Pentateuch');

  // Psalms
  const ps = getBibleBookInfo(19);
  assert.ok(ps);
  assert.equal(ps.name, 'Psalms');
  assert.equal(ps.chapters, 150);
  assert.equal(ps.division, 'Poetic');

  // OT End: Malachi (39)
  const mal = getBibleBookInfo(39);
  assert.ok(mal);
  assert.equal(mal.name, 'Malachi');
  assert.equal(mal.testament, 'OT');
  assert.equal(mal.chapters, 4);

  // NT Start: Matthew (40)
  const matt = getBibleBookInfo(40);
  assert.ok(matt);
  assert.equal(matt.name, 'Matthew');
  assert.equal(matt.testament, 'NT');
  assert.equal(matt.chapters, 28);
  assert.equal(matt.division, 'Gospels');

  // NT End: Revelation (66)
  const rev = getBibleBookInfo(66);
  assert.ok(rev);
  assert.equal(rev.name, 'Revelation');
  assert.equal(rev.testament, 'NT');
  assert.equal(rev.chapters, 22);
  assert.equal(rev.division, 'Apocalyptic');

  // getBibleBookName checks
  assert.equal(getBibleBookName(1), 'Genesis');
  assert.equal(getBibleBookName(44), 'Acts');
  assert.equal(getBibleBookName(66), 'Revelation');

  // Boundary & Fallback checks
  assert.equal(getBibleBookInfo(0), null);
  assert.equal(getBibleBookInfo(67), null);
  assert.equal(getBibleBookInfo(-5), null);
  assert.equal(getBibleBookInfo(undefined), null);

  assert.equal(getBibleBookName(0), 'The Holy Scriptures');
  assert.equal(getBibleBookName(67), 'Bible Book #67');
  assert.equal(getBibleBookName(null), 'The Holy Scriptures');
});

test('Domain Constants: JW publication symbols and category resolution', () => {
  // Core symbols
  const wt = getPublicationInfo('w');
  assert.equal(wt.title, 'The Watchtower');
  assert.equal(wt.category, 'watchtower');

  const mwb = getPublicationInfo('mwb');
  assert.equal(mwb.title, 'Our Christian Life and Ministry Meeting Workbook');
  assert.equal(mwb.category, 'workbook');

  const nwt = getPublicationInfo('nwt');
  assert.equal(nwt.title, 'New World Translation of the Holy Scriptures');
  assert.equal(nwt.category, 'bible');

  const nwtsty = getPublicationInfo('nwtsty');
  assert.equal(nwtsty.category, 'bible');

  const lff = getPublicationInfo('lff');
  assert.equal(lff.title, 'Enjoy Life Forever!—An Interactive Bible Course');
  assert.equal(lff.category, 'book');

  const bt = getPublicationInfo('bt');
  assert.equal(bt.category, 'book');

  const rr = getPublicationInfo('rr');
  assert.equal(rr.category, 'book');

  const th = getPublicationInfo('th');
  assert.equal(th.category, 'brochure');

  const it = getPublicationInfo('it');
  assert.equal(it.category, 'reference');

  const sjj = getPublicationInfo('sjj');
  assert.equal(sjj.category, 'songbook');

  const g = getPublicationInfo('g');
  assert.equal(g.category, 'periodical');

  // Numbered issue symbols (e.g. w24, g23, mwb24)
  const w24 = getPublicationInfo('w24');
  assert.equal(w24.category, 'watchtower');
  assert.equal(w24.title, 'The Watchtower (w24)');

  const g23 = getPublicationInfo('g23');
  assert.equal(g23.category, 'periodical');

  const mwb24 = getPublicationInfo('mwb24');
  assert.equal(mwb24.category, 'workbook');

  // Unknown publication symbol fallback
  const custom = getPublicationInfo('xyz123');
  assert.equal(custom.symbol, 'xyz123');
  assert.equal(custom.title, 'XYZ123');
  assert.equal(custom.category, 'other');

  // Null, empty, or whitespace fallback
  const empty = getPublicationInfo('');
  assert.equal(empty.title, 'General / Independent Note');
  assert.equal(empty.category, 'other');

  const nullSym = getPublicationInfo(null);
  assert.equal(nullSym.title, 'General / Independent Note');

  // Category badges
  const badgeBible = getPublicationCategoryBadge('bible');
  assert.equal(badgeBible.label, 'Bible');
  assert.ok(badgeBible.color);

  const badgeWt = getPublicationCategoryBadge('watchtower');
  assert.equal(badgeWt.label, 'Watchtower');

  const badgeOther = getPublicationCategoryBadge('other');
  assert.equal(badgeOther.label, 'General / Other');

  // resolvePublicationCategory with legacy Type=0 rows
  assert.equal(resolvePublicationCategory({ keySymbol: 'cl', type: 0 }), 'books_brochures');
  assert.equal(resolvePublicationCategory({ keySymbol: 'ia', type: 0 }), 'books_brochures');
  assert.equal(resolvePublicationCategory({ keySymbol: 'bh', type: 0 }), 'books_brochures');
  assert.equal(resolvePublicationCategory({ keySymbol: 'km', issueTagNumber: 20150700, type: 0 }), 'books_brochures');
  assert.equal(resolvePublicationCategory({ keySymbol: 'mwb', issueTagNumber: 20160500, type: 0 }), 'workbook');
  assert.equal(resolvePublicationCategory({ keySymbol: 'w', issueTagNumber: 20160400, type: 0 }), 'watchtower');
  assert.equal(resolvePublicationCategory({ keySymbol: 'rbi8', bookNumber: 1, type: 0 }), 'bible');
  assert.equal(resolvePublicationCategory({ keySymbol: 'nwt', bookNumber: 40, type: 0 }), 'bible');
  assert.equal(resolvePublicationCategory({ bookNumber: 66, type: 0 }), 'bible');
  assert.equal(resolvePublicationCategory(null), 'independent_notes');
});

test('Domain Constants: Schema Definitions & Tooltip dictionary lookup', () => {
  // Exact match
  const userMarkDef = getSchemaDefinition('UserMark');
  assert.ok(userMarkDef);
  assert.equal(userMarkDef.term, 'UserMark');
  assert.ok(userMarkDef.title.includes('UserMark'));
  assert.ok(userMarkDef.detailedDescription.includes('UserMarkId'));

  const blockRangeDef = getSchemaDefinition('BlockRange');
  assert.ok(blockRangeDef);
  assert.ok(blockRangeDef.detailedDescription.includes('BlockType'));

  const locDef = getSchemaDefinition('Location');
  assert.ok(locDef);

  const tagMapDef = getSchemaDefinition('TagMap');
  assert.ok(tagMapDef);

  const inputFieldDef = getSchemaDefinition('InputField');
  assert.ok(inputFieldDef);

  const bookmarkDef = getSchemaDefinition('Bookmark');
  assert.ok(bookmarkDef);

  const hashDef = getSchemaDefinition('Manifest Hash');
  assert.ok(hashDef);
  assert.equal(hashDef.term, 'ManifestHash');

  const versionDef = getSchemaDefinition('Schema Version');
  assert.ok(versionDef);
  assert.equal(versionDef.term, 'SchemaVersion');

  // Case-insensitive & symbol variations
  assert.equal(getSchemaDefinition('usermark')?.term, 'UserMark');
  assert.equal(getSchemaDefinition('user_mark')?.term, 'UserMark');
  assert.equal(getSchemaDefinition('USERMARK')?.term, 'UserMark');
  assert.equal(getSchemaDefinition('block-range')?.term, 'BlockRange');
  assert.equal(getSchemaDefinition('tag_map')?.term, 'TagMap');
  assert.equal(getSchemaDefinition('input_field')?.term, 'InputField');
  assert.equal(getSchemaDefinition('ManifestHash')?.term, 'ManifestHash');

  // Aliases
  assert.equal(getSchemaDefinition('highlights')?.term, 'UserMark');
  assert.equal(getSchemaDefinition('ranges')?.term, 'BlockRange');
  assert.equal(getSchemaDefinition('bookmarks')?.term, 'Bookmark');
  assert.equal(getSchemaDefinition('notes')?.term, 'Note');

  // Unknown term safety
  assert.equal(getSchemaDefinition('NonExistentTable'), undefined);
  assert.equal(getSchemaDefinition(null), undefined);
  assert.equal(getSchemaDefinition(undefined), undefined);
});
