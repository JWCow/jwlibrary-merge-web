export type PublicationCategory = 
  | 'bible'
  | 'watchtower'
  | 'workbook'
  | 'book'
  | 'brochure'
  | 'tract'
  | 'reference'
  | 'periodical'
  | 'songbook'
  | 'other';

export interface LanguageInfo {
  name: string;
  nativeName?: string;
  code?: string;
  formattedName: string;
}

export interface BibleBookInfo {
  bookNumber: number;
  name: string;
  shortName: string;
  testament: 'OT' | 'NT';
  chapters: number;
  division: 'Pentateuch' | 'Historical' | 'Poetic' | 'Prophetic' | 'Gospels' | 'Acts' | 'Epistles' | 'Apocalyptic';
}

export interface PublicationInfo {
  symbol: string;
  title: string;
  shortTitle: string;
  category: PublicationCategory;
}

export interface SchemaDefinition {
  term: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
}

/**
 * Standard MEPS (Multilanguage Electronic Publishing System) Language IDs
 * used throughout JW Library databases.
 */
export const MEPS_LANGUAGES: Record<number, { name: string; nativeName?: string; code?: string }> = {
  0: { name: 'English', nativeName: 'English', code: 'en' },
  1: { name: 'Spanish', nativeName: 'Español', code: 'es' },
  2: { name: 'French', nativeName: 'Français', code: 'fr' },
  3: { name: 'Dutch', nativeName: 'Nederlands', code: 'nl' },
  4: { name: 'German', nativeName: 'Deutsch', code: 'de' },
  5: { name: 'Swedish', nativeName: 'Svenska', code: 'sv' },
  6: { name: 'Danish', nativeName: 'Dansk', code: 'da' },
  7: { name: 'Portuguese', nativeName: 'Português', code: 'pt' },
  8: { name: 'Polish', nativeName: 'Polski', code: 'pl' },
  9: { name: 'Norwegian', nativeName: 'Norsk', code: 'no' },
  10: { name: 'Italian', nativeName: 'Italiano', code: 'it' },
  11: { name: 'Finnish', nativeName: 'Suomi', code: 'fi' },
  12: { name: 'Greek', nativeName: 'Ελληνική', code: 'el' },
  13: { name: 'Tagalog', nativeName: 'Tagalog', code: 'tl' },
  14: { name: 'Japanese', nativeName: '日本語', code: 'ja' },
  15: { name: 'Russian', nativeName: 'Русский', code: 'ru' },
  16: { name: 'Cebuano', nativeName: 'Cebuano', code: 'ceb' },
  17: { name: 'Iloko', nativeName: 'Iloko', code: 'ilo' },
  18: { name: 'Hiligaynon', nativeName: 'Hiligaynon', code: 'hil' },
  19: { name: 'Arabic', nativeName: 'العربية', code: 'ar' },
  20: { name: 'Romanian', nativeName: 'Română', code: 'ro' },
  21: { name: 'Hindi', nativeName: 'हिन्दी', code: 'hi' },
  22: { name: 'Hungarian', nativeName: 'Magyar', code: 'hu' },
  23: { name: 'Czech', nativeName: 'Čeština', code: 'cs' },
  24: { name: 'Korean', nativeName: '한국어', code: 'ko' },
  25: { name: 'Bulgarian', nativeName: 'Български', code: 'bg' },
  26: { name: 'Slovak', nativeName: 'Slovenčina', code: 'sk' },
  27: { name: 'Thai', nativeName: 'ภาษาไทย', code: 'th' },
  28: { name: 'Turkish', nativeName: 'Türkçe', code: 'tr' },
  29: { name: 'Ukrainian', nativeName: 'Українська', code: 'uk' },
  30: { name: 'Swahili', nativeName: 'Kiswahili', code: 'sw' },
  31: { name: 'Croatian', nativeName: 'Hrvatski', code: 'hr' },
  32: { name: 'Serbian', nativeName: 'Српски', code: 'sr' },
  33: { name: 'Afrikaans', nativeName: 'Afrikaans', code: 'af' },
  34: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', code: 'id' },
  35: { name: 'Chinese Simplified (Pinyin)', code: 'zh-pinyin' },
  36: { name: 'Chinese Traditional (Yale)', code: 'zh-yale' },
  37: { name: 'Albanian', nativeName: 'Shqip', code: 'sq' },
  38: { name: 'Armenian', nativeName: 'Հայերեն', code: 'hy' },
  39: { name: 'Vietnamese', nativeName: 'Tiếng Việt', code: 'vi' },
  40: { name: 'Malagasy', nativeName: 'Malagasy', code: 'mg' },
  41: { name: 'Chinese Simplified', nativeName: '简体中文', code: 'chs' },
  42: { name: 'Chinese Traditional', nativeName: '繁體中文', code: 'cht' },
  43: { name: 'Georgian', nativeName: 'ქართული', code: 'ka' },
  44: { name: 'Lithuanian', nativeName: 'Lietuvių', code: 'lt' },
  45: { name: 'Latvian', nativeName: 'Latviešu', code: 'lv' },
  46: { name: 'Estonian', nativeName: 'Eesti', code: 'et' },
  47: { name: 'Slovenian', nativeName: 'Slovenščina', code: 'sl' },
  48: { name: 'Maltese', nativeName: 'Malti', code: 'mt' },
  49: { name: 'Icelandic', nativeName: 'Íslenska', code: 'is' },
  50: { name: 'Tamil', nativeName: 'தமிழ்', code: 'ta' },
  51: { name: 'Telugu', nativeName: 'తెలుగు', code: 'te' },
  52: { name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml' },
  53: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn' },
  54: { name: 'Bengali', nativeName: 'বাংলা', code: 'bn' },
  55: { name: 'Marathi', nativeName: 'मराठी', code: 'mr' },
  56: { name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu' },
  57: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', code: 'pa' },
  58: { name: 'Urdu', nativeName: 'اردو', code: 'ur' },
  59: { name: 'Nepali', nativeName: 'नेपाली', code: 'ne' },
  60: { name: 'Sinhala', nativeName: 'සිංහල', code: 'si' },
  61: { name: 'Burmese', nativeName: 'မြန်မာစာ', code: 'my' },
  62: { name: 'Khmer', nativeName: 'ភាសាខ្មែរ', code: 'km' },
  63: { name: 'Lao', nativeName: 'ພາສາລາວ', code: 'lo' },
  64: { name: 'Persian', nativeName: 'فارسی', code: 'fa' },
  65: { name: 'Hebrew', nativeName: 'עברית', code: 'he' },
  66: { name: 'Amharic', nativeName: 'አማርኛ', code: 'am' },
  67: { name: 'Tigrinya', nativeName: 'ትግርኛ', code: 'ti' },
  68: { name: 'Oromo', nativeName: 'Afaan Oromoo', code: 'om' },
  69: { name: 'Somali', nativeName: 'Soomaali', code: 'so' },
  70: { name: 'Yoruba', nativeName: 'Èdè Yorùbá', code: 'yo' },
  71: { name: 'Igbo', nativeName: 'Asụsụ Igbo', code: 'ig' },
  72: { name: 'Zulu', nativeName: 'isiZulu', code: 'zu' },
  73: { name: 'Xhosa', nativeName: 'isiXhosa', code: 'xh' },
  74: { name: 'Shona', nativeName: 'chiShona', code: 'sn' },
  75: { name: 'Tswana', nativeName: 'Setswana', code: 'tn' },
  76: { name: 'Sotho', nativeName: 'Sesotho', code: 'st' },
  77: { name: 'Lingala', nativeName: 'Lingála', code: 'ln' },
  78: { name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', code: 'rw' },
  79: { name: 'Kirundi', nativeName: 'Ikirundi', code: 'rn' },
  80: { name: 'Tsonga', nativeName: 'Xitsonga', code: 'ts' },
  81: { name: 'Venda', nativeName: 'Tshivenḓa', code: 've' },
  82: { name: 'Ewe', nativeName: 'Eʋegbe', code: 'ee' },
  83: { name: 'Twi', nativeName: 'Twi', code: 'tw' },
  84: { name: 'Chichewa', nativeName: 'Chichewa', code: 'ny' },
  85: { name: 'Papiamento', nativeName: 'Papiamento', code: 'pap' },
  86: { name: 'Haitian Creole', nativeName: 'Kreyòl ayisyen', code: 'ht' },
  87: { name: 'Samoan', nativeName: 'Gagana Sāmoa', code: 'sm' },
  88: { name: 'Tongan', nativeName: 'Lea Faka-Tonga', code: 'to' },
  89: { name: 'Fijian', nativeName: 'Na Vosa Vakaviti', code: 'fj' },
  90: { name: 'Bislama', nativeName: 'Bislama', code: 'bi' },
  91: { name: 'Tok Pisin', nativeName: 'Tok Pisin', code: 'tpi' },
  92: { name: 'Tahitian', nativeName: 'Reo Tahiti', code: 'ty' },
  93: { name: 'Pangasinan', nativeName: 'Pangasinan', code: 'pag' },
  94: { name: 'Bikol', nativeName: 'Bikol', code: 'bcl' },
  95: { name: 'Waray-Waray', nativeName: 'Waray-Waray', code: 'war' },
  96: { name: 'Pampanga', nativeName: 'Kapampangan', code: 'pam' },
  97: { name: 'Ibanag', nativeName: 'Ibanag', code: 'iba' },
  100: { name: 'American Sign Language', nativeName: 'ASL', code: 'ase' },
  101: { name: 'Brazilian Sign Language', nativeName: 'Libras', code: 'bzs' },
  102: { name: 'British Sign Language', nativeName: 'BSL', code: 'bfi' },
  104: { name: 'French Sign Language', nativeName: 'LSF', code: 'fsl' },
  105: { name: 'German Sign Language', nativeName: 'DGS', code: 'gsg' },
  106: { name: 'Italian Sign Language', nativeName: 'LIS', code: 'ise' },
  107: { name: 'Japanese Sign Language', nativeName: 'JSL', code: 'jsl' },
  108: { name: 'Korean Sign Language', nativeName: 'KSL', code: 'kvk' },
  109: { name: 'Mexican Sign Language', nativeName: 'LSM', code: 'mfs' },
  110: { name: 'Russian Sign Language', nativeName: 'RSL', code: 'rsl' },
  111: { name: 'Spanish Sign Language', nativeName: 'LSE', code: 'ssp' }
};

/**
 * Returns structured language information for a given MEPS Language ID.
 */
export function getLanguageInfo(mepsLanguageId?: number | null): LanguageInfo {
  if (mepsLanguageId === null || mepsLanguageId === undefined || isNaN(mepsLanguageId)) {
    return {
      name: 'Unknown Language',
      formattedName: 'Unknown Language'
    };
  }

  const lang = MEPS_LANGUAGES[mepsLanguageId];
  if (lang) {
    const formatted = lang.nativeName && lang.nativeName !== lang.name
      ? `${lang.name} (${lang.nativeName})`
      : lang.name;
    return {
      name: lang.name,
      nativeName: lang.nativeName,
      code: lang.code,
      formattedName: formatted
    };
  }

  return {
    name: `Language #${mepsLanguageId}`,
    formattedName: `Language #${mepsLanguageId}`
  };
}

/**
 * Convenience helper to return human-readable language name.
 */
export function getLanguageName(mepsLanguageId?: number | null, includeNative = true): string {
  const info = getLanguageInfo(mepsLanguageId);
  return includeNative ? info.formattedName : info.name;
}

/**
 * Standard Canon of 66 Bible Books with metadata
 */
export const BIBLE_BOOKS: Record<number, Omit<BibleBookInfo, 'bookNumber'>> = {
  1: { name: 'Genesis', shortName: 'Gen', testament: 'OT', chapters: 50, division: 'Pentateuch' },
  2: { name: 'Exodus', shortName: 'Ex', testament: 'OT', chapters: 40, division: 'Pentateuch' },
  3: { name: 'Leviticus', shortName: 'Lev', testament: 'OT', chapters: 27, division: 'Pentateuch' },
  4: { name: 'Numbers', shortName: 'Num', testament: 'OT', chapters: 36, division: 'Pentateuch' },
  5: { name: 'Deuteronomy', shortName: 'Deut', testament: 'OT', chapters: 34, division: 'Pentateuch' },
  6: { name: 'Joshua', shortName: 'Josh', testament: 'OT', chapters: 24, division: 'Historical' },
  7: { name: 'Judges', shortName: 'Judg', testament: 'OT', chapters: 21, division: 'Historical' },
  8: { name: 'Ruth', shortName: 'Ruth', testament: 'OT', chapters: 4, division: 'Historical' },
  9: { name: '1 Samuel', shortName: '1 Sam', testament: 'OT', chapters: 31, division: 'Historical' },
  10: { name: '2 Samuel', shortName: '2 Sam', testament: 'OT', chapters: 24, division: 'Historical' },
  11: { name: '1 Kings', shortName: '1 Kgs', testament: 'OT', chapters: 22, division: 'Historical' },
  12: { name: '2 Kings', shortName: '2 Kgs', testament: 'OT', chapters: 25, division: 'Historical' },
  13: { name: '1 Chronicles', shortName: '1 Chr', testament: 'OT', chapters: 29, division: 'Historical' },
  14: { name: '2 Chronicles', shortName: '2 Chr', testament: 'OT', chapters: 36, division: 'Historical' },
  15: { name: 'Ezra', shortName: 'Ezra', testament: 'OT', chapters: 10, division: 'Historical' },
  16: { name: 'Nehemiah', shortName: 'Neh', testament: 'OT', chapters: 13, division: 'Historical' },
  17: { name: 'Esther', shortName: 'Esth', testament: 'OT', chapters: 10, division: 'Historical' },
  18: { name: 'Job', shortName: 'Job', testament: 'OT', chapters: 42, division: 'Poetic' },
  19: { name: 'Psalms', shortName: 'Ps', testament: 'OT', chapters: 150, division: 'Poetic' },
  20: { name: 'Proverbs', shortName: 'Prov', testament: 'OT', chapters: 31, division: 'Poetic' },
  21: { name: 'Ecclesiastes', shortName: 'Eccl', testament: 'OT', chapters: 12, division: 'Poetic' },
  22: { name: 'Song of Solomon', shortName: 'Song', testament: 'OT', chapters: 8, division: 'Poetic' },
  23: { name: 'Isaiah', shortName: 'Isa', testament: 'OT', chapters: 66, division: 'Prophetic' },
  24: { name: 'Jeremiah', shortName: 'Jer', testament: 'OT', chapters: 52, division: 'Prophetic' },
  25: { name: 'Lamentations', shortName: 'Lam', testament: 'OT', chapters: 5, division: 'Prophetic' },
  26: { name: 'Ezekiel', shortName: 'Ezek', testament: 'OT', chapters: 48, division: 'Prophetic' },
  27: { name: 'Daniel', shortName: 'Dan', testament: 'OT', chapters: 12, division: 'Prophetic' },
  28: { name: 'Hosea', shortName: 'Hos', testament: 'OT', chapters: 14, division: 'Prophetic' },
  29: { name: 'Joel', shortName: 'Joel', testament: 'OT', chapters: 3, division: 'Prophetic' },
  30: { name: 'Amos', shortName: 'Amos', testament: 'OT', chapters: 9, division: 'Prophetic' },
  31: { name: 'Obadiah', shortName: 'Obad', testament: 'OT', chapters: 1, division: 'Prophetic' },
  32: { name: 'Jonah', shortName: 'Jonah', testament: 'OT', chapters: 4, division: 'Prophetic' },
  33: { name: 'Micah', shortName: 'Mic', testament: 'OT', chapters: 7, division: 'Prophetic' },
  34: { name: 'Nahum', shortName: 'Nah', testament: 'OT', chapters: 3, division: 'Prophetic' },
  35: { name: 'Habakkuk', shortName: 'Hab', testament: 'OT', chapters: 3, division: 'Prophetic' },
  36: { name: 'Zephaniah', shortName: 'Zeph', testament: 'OT', chapters: 3, division: 'Prophetic' },
  37: { name: 'Haggai', shortName: 'Hag', testament: 'OT', chapters: 2, division: 'Prophetic' },
  38: { name: 'Zechariah', shortName: 'Zech', testament: 'OT', chapters: 14, division: 'Prophetic' },
  39: { name: 'Malachi', shortName: 'Mal', testament: 'OT', chapters: 4, division: 'Prophetic' },
  40: { name: 'Matthew', shortName: 'Matt', testament: 'NT', chapters: 28, division: 'Gospels' },
  41: { name: 'Mark', shortName: 'Mark', testament: 'NT', chapters: 16, division: 'Gospels' },
  42: { name: 'Luke', shortName: 'Luke', testament: 'NT', chapters: 24, division: 'Gospels' },
  43: { name: 'John', shortName: 'John', testament: 'NT', chapters: 21, division: 'Gospels' },
  44: { name: 'Acts', shortName: 'Acts', testament: 'NT', chapters: 28, division: 'Acts' },
  45: { name: 'Romans', shortName: 'Rom', testament: 'NT', chapters: 16, division: 'Epistles' },
  46: { name: '1 Corinthians', shortName: '1 Cor', testament: 'NT', chapters: 16, division: 'Epistles' },
  47: { name: '2 Corinthians', shortName: '2 Cor', testament: 'NT', chapters: 13, division: 'Epistles' },
  48: { name: 'Galatians', shortName: 'Gal', testament: 'NT', chapters: 6, division: 'Epistles' },
  49: { name: 'Ephesians', shortName: 'Eph', testament: 'NT', chapters: 6, division: 'Epistles' },
  50: { name: 'Philippians', shortName: 'Phil', testament: 'NT', chapters: 4, division: 'Epistles' },
  51: { name: 'Colossians', shortName: 'Col', testament: 'NT', chapters: 4, division: 'Epistles' },
  52: { name: '1 Thessalonians', shortName: '1 Thess', testament: 'NT', chapters: 5, division: 'Epistles' },
  53: { name: '2 Thessalonians', shortName: '2 Thess', testament: 'NT', chapters: 3, division: 'Epistles' },
  54: { name: '1 Timothy', shortName: '1 Tim', testament: 'NT', chapters: 6, division: 'Epistles' },
  55: { name: '2 Timothy', shortName: '2 Tim', testament: 'NT', chapters: 4, division: 'Epistles' },
  56: { name: 'Titus', shortName: 'Titus', testament: 'NT', chapters: 3, division: 'Epistles' },
  57: { name: 'Philemon', shortName: 'Phlm', testament: 'NT', chapters: 1, division: 'Epistles' },
  58: { name: 'Hebrews', shortName: 'Heb', testament: 'NT', chapters: 13, division: 'Epistles' },
  59: { name: 'James', shortName: 'Jas', testament: 'NT', chapters: 5, division: 'Epistles' },
  60: { name: '1 Peter', shortName: '1 Pet', testament: 'NT', chapters: 5, division: 'Epistles' },
  61: { name: '2 Peter', shortName: '2 Pet', testament: 'NT', chapters: 3, division: 'Epistles' },
  62: { name: '1 John', shortName: '1 John', testament: 'NT', chapters: 5, division: 'Epistles' },
  63: { name: '2 John', shortName: '2 John', testament: 'NT', chapters: 1, division: 'Epistles' },
  64: { name: '3 John', shortName: '3 John', testament: 'NT', chapters: 1, division: 'Epistles' },
  65: { name: 'Jude', shortName: 'Jude', testament: 'NT', chapters: 1, division: 'Epistles' },
  66: { name: 'Revelation', shortName: 'Rev', testament: 'NT', chapters: 22, division: 'Apocalyptic' }
};

/**
 * Returns Bible book name and metadata for book numbers 1..66.
 */
export function getBibleBookInfo(bookNumber?: number | null): BibleBookInfo | null {
  if (!bookNumber || bookNumber < 1 || bookNumber > 66) {
    return null;
  }
  const book = BIBLE_BOOKS[bookNumber];
  if (!book) return null;
  return {
    bookNumber,
    ...book
  };
}

/**
 * Returns Bible book name or graceful fallback.
 */
export function getBibleBookName(bookNumber?: number | null): string {
  const info = getBibleBookInfo(bookNumber);
  if (info) return info.name;
  return bookNumber ? `Bible Book #${bookNumber}` : 'The Holy Scriptures';
}

/**
 * Common JW publication abbreviations and key symbols.
 */
export const PUBLICATION_SYMBOLS: Record<string, { title: string; shortTitle?: string; category: PublicationCategory }> = {
  w: { title: 'The Watchtower', shortTitle: 'Watchtower', category: 'watchtower' },
  wp: { title: 'The Watchtower (Public Edition)', shortTitle: 'Watchtower (Public)', category: 'watchtower' },
  ws: { title: 'The Watchtower (Simplified)', shortTitle: 'Watchtower (Simplified)', category: 'watchtower' },
  g: { title: 'Awake!', shortTitle: 'Awake!', category: 'periodical' },
  mwb: { title: 'Our Christian Life and Ministry Meeting Workbook', shortTitle: 'Meeting Workbook', category: 'workbook' },
  km: { title: 'Our Kingdom Ministry', shortTitle: 'Kingdom Ministry', category: 'periodical' },
  nwt: { title: 'New World Translation of the Holy Scriptures', shortTitle: 'NWT Bible', category: 'bible' },
  nwtsty: { title: 'New World Translation of the Holy Scriptures (Study Edition)', shortTitle: 'NWT Study Bible', category: 'bible' },
  bi12: { title: 'New World Translation of the Holy Scriptures (1984 Edition)', shortTitle: 'NWT 1984', category: 'bible' },
  int: { title: 'The Kingdom Interlinear Translation of the Greek Scriptures', shortTitle: 'Kingdom Interlinear', category: 'bible' },
  lff: { title: 'Enjoy Life Forever!—An Interactive Bible Course', shortTitle: 'Enjoy Life Forever!', category: 'book' },
  bt: { title: '“Bearing Thorough Witness” About God’s Kingdom', shortTitle: 'Bearing Thorough Witness', category: 'book' },
  rr: { title: 'Pure Worship of Jehovah—Restored At Last!', shortTitle: 'Pure Worship', category: 'book' },
  th: { title: 'Apply Yourself to Reading and Teaching', shortTitle: 'Reading and Teaching', category: 'brochure' },
  it: { title: 'Insight on the Scriptures', shortTitle: 'Insight on Scriptures', category: 'reference' },
  'it-1': { title: 'Insight on the Scriptures, Volume 1', shortTitle: 'Insight Vol. 1', category: 'reference' },
  'it-2': { title: 'Insight on the Scriptures, Volume 2', shortTitle: 'Insight Vol. 2', category: 'reference' },
  cl: { title: 'Draw Close to Jehovah', shortTitle: 'Draw Close to Jehovah', category: 'book' },
  jr: { title: 'Jeremiah and God’s Word for Us', shortTitle: 'Jeremiah', category: 'book' },
  ia: { title: 'Imitate Their Faith', shortTitle: 'Imitate Their Faith', category: 'book' },
  jy: { title: 'Jesus—The Way, the Truth, the Life', shortTitle: 'Jesus—The Way', category: 'book' },
  bhs: { title: 'What Can the Bible Teach Us?', shortTitle: 'Bible Teach (bhs)', category: 'book' },
  bh: { title: 'What Does the Bible Really Teach?', shortTitle: 'Bible Teach (bh)', category: 'book' },
  od: { title: 'Organized to Do Jehovah’s Will', shortTitle: 'Organized', category: 'book' },
  sjj: { title: '“Sing Out Joyfully” to Jehovah', shortTitle: 'Sing Out Joyfully', category: 'songbook' },
  sn: { title: 'Sing to Jehovah', shortTitle: 'Sing to Jehovah', category: 'songbook' },
  sb: { title: 'Sing Praises to Jehovah', shortTitle: 'Sing Praises', category: 'songbook' },
  es: { title: 'Examining the Scriptures Daily', shortTitle: 'Daily Text', category: 'book' },
  scl: { title: 'Scriptures for Christian Living', shortTitle: 'Scriptures for Living', category: 'reference' },
  kr: { title: 'God’s Kingdom Rules!', shortTitle: 'God’s Kingdom Rules!', category: 'book' },
  cf: { title: '“Come Be My Follower”', shortTitle: 'Come Be My Follower', category: 'book' },
  yc: { title: 'Your Family Can Be Happy', shortTitle: 'Happy Family', category: 'brochure' },
  fg: { title: 'Good News From God!', shortTitle: 'Good News', category: 'brochure' },
  ll: { title: 'Listen to God and Live Forever', shortTitle: 'Listen to God', category: 'brochure' },
  ld: { title: 'Listen to God', shortTitle: 'Listen to God', category: 'brochure' },
  rj: { title: 'Return to Jehovah', shortTitle: 'Return to Jehovah', category: 'brochure' },
  hf: { title: 'Your Family Can Be Happy', shortTitle: 'Happy Family', category: 'brochure' },
  jl: { title: 'Who Are Doing Jehovah’s Will Today?', shortTitle: 'Jehovah’s Will Today', category: 'brochure' },
  lf: { title: 'Was Life Created?', shortTitle: 'Was Life Created?', category: 'brochure' },
  lc: { title: 'The Origin of Life—Five Questions Worth Asking', shortTitle: 'Origin of Life', category: 'brochure' },
  gl: { title: '“See the Good Land”', shortTitle: 'See the Good Land', category: 'brochure' },
  bm: { title: 'The Bible—What Is Its Message?', shortTitle: 'Bible Message', category: 'brochure' },
  ypq: { title: '10 Questions Young People Ask—Answers That Work', shortTitle: 'Young People Ask (Questions)', category: 'brochure' },
  yp1: { title: 'Questions Young People Ask—Answers That Work, Volume 1', shortTitle: 'Young People Ask Vol. 1', category: 'book' },
  yp2: { title: 'Questions Young People Ask—Answers That Work, Volume 2', shortTitle: 'Young People Ask Vol. 2', category: 'book' },
  fy: { title: 'The Secret of Family Happiness', shortTitle: 'Family Happiness', category: 'book' },
  ct: { title: 'Is There a Creator Who Cares About You?', shortTitle: 'Creator', category: 'book' },
  kl: { title: 'Knowledge That Leads to Everlasting Life', shortTitle: 'Knowledge', category: 'book' },
  pe: { title: 'You Can Live Forever in Paradise on Earth', shortTitle: 'Live Forever (pe)', category: 'book' },
  dx: { title: 'Watch Tower Publications Index', shortTitle: 'Publications Index', category: 'reference' },
  's-34': { title: 'Public Talk Outline', shortTitle: 'Public Talk Outline', category: 'reference' },
  's-140': { title: 'Our Christian Life and Ministry Meeting Instructions', shortTitle: 'Meeting Instructions', category: 'reference' },
  mrt: { title: 'Media Release / Meeting Research Topics', shortTitle: 'Research Topics', category: 'reference' },
  thp: { title: 'Apply Yourself to Reading and Teaching (Progress Sheet)', shortTitle: 'Teaching Progress', category: 'brochure' },
  ijw: { title: 'JW.ORG Web Articles', shortTitle: 'Web Articles', category: 'reference' },
  ijwfq: { title: 'Frequently Asked Questions (JW.ORG)', shortTitle: 'JW FAQ', category: 'reference' },
  ijwyp: { title: 'Young People Ask Web Articles', shortTitle: 'Young People Ask (Web)', category: 'reference' },
  ijwbq: { title: 'Bible Questions Answered', shortTitle: 'Bible Q&A', category: 'reference' },
  ijwia: { title: 'Imitate Their Faith Web Articles', shortTitle: 'Imitate Faith (Web)', category: 'reference' }
};

/**
 * Resolves publication symbol into friendly titles and category.
 */
export function getPublicationInfo(symbol?: string | null): PublicationInfo {
  if (!symbol || !symbol.trim()) {
    return {
      symbol: '',
      title: 'General / Independent Note',
      shortTitle: 'General Note',
      category: 'other'
    };
  }

  const rawSymbol = symbol.trim();
  const cleanSymbol = rawSymbol.toLowerCase();

  if (PUBLICATION_SYMBOLS[cleanSymbol]) {
    const entry = PUBLICATION_SYMBOLS[cleanSymbol];
    return {
      symbol: rawSymbol,
      title: entry.title,
      shortTitle: entry.shortTitle || entry.title,
      category: entry.category
    };
  }

  // Handle Watchtower issue tags like w24, w23, w202401
  if (/^w\d+/i.test(cleanSymbol)) {
    return {
      symbol: rawSymbol,
      title: `The Watchtower (${rawSymbol})`,
      shortTitle: `Watchtower (${rawSymbol})`,
      category: 'watchtower'
    };
  }

  // Handle Awake! issue tags like g24, g23
  if (/^g\d+/i.test(cleanSymbol)) {
    return {
      symbol: rawSymbol,
      title: `Awake! (${rawSymbol})`,
      shortTitle: `Awake! (${rawSymbol})`,
      category: 'periodical'
    };
  }

  // Handle Meeting Workbook issue tags like mwb24, mwb23
  if (/^mwb\d+/i.test(cleanSymbol)) {
    return {
      symbol: rawSymbol,
      title: `Life and Ministry Workbook (${rawSymbol})`,
      shortTitle: `Workbook (${rawSymbol})`,
      category: 'workbook'
    };
  }

  // Default fallback for unknown symbols
  return {
    symbol: rawSymbol,
    title: rawSymbol.toUpperCase(),
    shortTitle: rawSymbol.toUpperCase(),
    category: 'other'
  };
}

/**
 * Category styling badges for visual categorization in UI.
 */
export function getPublicationCategoryBadge(category: PublicationCategory): { label: string; color: string; bg: string; border: string } {
  switch (category) {
    case 'bible':
      return {
        label: 'Bible',
        color: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        border: 'border-amber-200 dark:border-amber-800'
      };
    case 'watchtower':
      return {
        label: 'Watchtower',
        color: 'text-theocratic-700 dark:text-theocratic-300',
        bg: 'bg-theocratic-50 dark:bg-theocratic-950/60',
        border: 'border-theocratic-200 dark:border-theocratic-800'
      };
    case 'workbook':
      return {
        label: 'Meeting Workbook',
        color: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        border: 'border-emerald-200 dark:border-emerald-800'
      };
    case 'book':
      return {
        label: 'Book',
        color: 'text-indigo-700 dark:text-indigo-300',
        bg: 'bg-indigo-50 dark:bg-indigo-950/60',
        border: 'border-indigo-200 dark:border-indigo-800'
      };
    case 'brochure':
      return {
        label: 'Brochure',
        color: 'text-sky-700 dark:text-sky-300',
        bg: 'bg-sky-50 dark:bg-sky-950/60',
        border: 'border-sky-200 dark:border-sky-800'
      };
    case 'reference':
      return {
        label: 'Reference',
        color: 'text-purple-700 dark:text-purple-300',
        bg: 'bg-purple-50 dark:bg-purple-950/60',
        border: 'border-purple-200 dark:border-purple-800'
      };
    case 'songbook':
      return {
        label: 'Songbook',
        color: 'text-rose-700 dark:text-rose-300',
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        border: 'border-rose-200 dark:border-rose-800'
      };
    case 'periodical':
      return {
        label: 'Periodical',
        color: 'text-cyan-700 dark:text-cyan-300',
        bg: 'bg-cyan-50 dark:bg-cyan-950/60',
        border: 'border-cyan-200 dark:border-cyan-800'
      };
    default:
      return {
        label: 'General / Other',
        color: 'text-slate-700 dark:text-slate-300',
        bg: 'bg-slate-100 dark:bg-slate-800/60',
        border: 'border-slate-200 dark:border-slate-700'
      };
  }
}

/**
 * Canonical descriptions and definitions for JW Library SQLite schema tables,
 * counters, and merge engine mechanisms.
 */
export const SCHEMA_DEFINITIONS: Record<string, SchemaDefinition> = {
  UserMark: {
    term: 'UserMark',
    title: 'UserMark (Highlight Container)',
    shortDescription: 'Represents a user-created highlight or underline, recording color and style.',
    detailedDescription: 'In the JW Library database, a UserMark defines the high-level highlight entity (with unique UserMarkId, color index 1–6, style index, and unique GUID). The actual text spans covered by this highlight are stored in one or more associated BlockRange records.'
  },
  BlockRange: {
    term: 'BlockRange',
    title: 'BlockRange (Highlighted Text Spans)',
    shortDescription: 'The exact paragraph, verse, or token text spans covered by a highlight.',
    detailedDescription: 'Each BlockRange stores the BlockType, paragraph/verse Identifier, and StartToken/EndToken offsets. If a single highlight spans multiple paragraphs or Bible verses, JW Library creates a separate BlockRange for each block under the same UserMarkId.'
  },
  Location: {
    term: 'Location',
    title: 'Location (Content Pointer)',
    shortDescription: 'A pointer connecting notes, bookmarks, or highlights to specific publications or Bible chapters.',
    detailedDescription: 'Location records reference where notes, bookmarks, and highlights exist in JW publications or the Bible (using BookNumber, ChapterNumber, KeySymbol, IssueTagNumber, DocumentId, and MepsLanguage).'
  },
  Tag: {
    term: 'Tag',
    title: 'Tag (Topic Label)',
    shortDescription: 'A user-defined tag name (e.g. "Spiritual Gems", "Ministry") used to categorize notes.',
    detailedDescription: 'Tags allow organizing personal study notes into custom topics. Tag records store the tag name, type, and last modified date.'
  },
  TagMap: {
    term: 'TagMap',
    title: 'TagMap (Tag Associations & Ordering)',
    shortDescription: 'Links notes or locations to tags, preserving custom user sorting positions.',
    detailedDescription: 'TagMap maintains the many-to-many relationship between tags and study notes/locations, including the exact Position index for custom list ordering.'
  },
  InputField: {
    term: 'InputField',
    title: 'InputField (Interactive Answers)',
    shortDescription: 'User-entered text responses in publication study questions and meeting worksheets.',
    detailedDescription: 'Stores freeform user input text entered into publication worksheets, study guide questions (such as in Enjoy Life Forever!), and meeting workbooks.'
  },
  Bookmark: {
    term: 'Bookmark',
    title: 'Bookmark (Quick-Access Marker)',
    shortDescription: 'Reading bookmarks pinned to specific Bible chapters or publication paragraphs (slots 0–9).',
    detailedDescription: 'Stores user bookmarks pinned to specific reading locations, preserving the bookmark title, slot number, snippet, and location reference.'
  },
  Note: {
    term: 'Note',
    title: 'Note (Personal Study Annotation)',
    shortDescription: 'A personal study note, research thought, or meeting annotation.',
    detailedDescription: 'Stores user-authored notes with titles, rich content, created/modified timestamps, and links to UserMarks or Locations.'
  },
  IndependentMedia: {
    term: 'IndependentMedia',
    title: 'IndependentMedia (Attached Media Files)',
    shortDescription: 'Custom images, audio, or media files attached to personal study notes.',
    detailedDescription: 'References custom audio, image, or media files associated with notes or personal study entries.'
  },
  PlaylistItem: {
    term: 'PlaylistItem',
    title: 'PlaylistItem (Media Playlist Track)',
    shortDescription: 'Media tracks and items saved in custom audio/video playlists.',
    detailedDescription: 'Stores references to audio and video tracks, meeting recordings, and custom playlists configured in the media player.'
  },
  SchemaVersion: {
    term: 'SchemaVersion',
    title: 'Database Schema Version',
    shortDescription: 'The internal SQLite schema version of the JW Library backup (e.g. v5 to v16+).',
    detailedDescription: 'As JW Library evolves, new columns and tables are introduced. The merger engine intelligently normalizes and migrates older schemas (e.g. legacy TagMap columns) into modern structures.'
  },
  ManifestHash: {
    term: 'ManifestHash',
    title: 'Manifest SHA-256 Checksum',
    shortDescription: 'Cryptographic SHA-256 digest of userData.db, validated by JW Library during restore.',
    detailedDescription: 'JW Library verifies this hash against the unpacked userData.db file inside the .jwlibrary archive. If the hash does not match or manifest.json is not the first file in the ZIP, the restore fails.'
  }
};

/**
 * Case-insensitive lookup for schema definitions.
 */
export function getSchemaDefinition(term?: string | null): SchemaDefinition | undefined {
  if (!term) return undefined;
  const clean = term.replace(/[\s_\-]/g, '').toLowerCase();

  for (const [key, def] of Object.entries(SCHEMA_DEFINITIONS)) {
    const cleanKey = key.replace(/[\s_\-]/g, '').toLowerCase();
    if (cleanKey === clean) {
      return def;
    }
  }

  // Check aliases
  if (clean === 'usermarks' || clean === 'highlights' || clean === 'highlight') {
    return SCHEMA_DEFINITIONS.UserMark;
  }
  if (clean === 'blockranges' || clean === 'ranges') {
    return SCHEMA_DEFINITIONS.BlockRange;
  }
  if (clean === 'locations') {
    return SCHEMA_DEFINITIONS.Location;
  }
  if (clean === 'tags') {
    return SCHEMA_DEFINITIONS.Tag;
  }
  if (clean === 'tagmaps' || clean === 'tagmappings') {
    return SCHEMA_DEFINITIONS.TagMap;
  }
  if (clean === 'inputfields' || clean === 'inputs') {
    return SCHEMA_DEFINITIONS.InputField;
  }
  if (clean === 'bookmarks') {
    return SCHEMA_DEFINITIONS.Bookmark;
  }
  if (clean === 'notes') {
    return SCHEMA_DEFINITIONS.Note;
  }
  if (clean === 'schema' || clean === 'version') {
    return SCHEMA_DEFINITIONS.SchemaVersion;
  }
  if (clean === 'hash' || clean === 'sha256' || clean === 'integrity') {
    return SCHEMA_DEFINITIONS.ManifestHash;
  }

  return undefined;
}
