export interface JWLibraryManifest {
  name: string;
  creationDate: string;
  version: number;
  type: number;
  userDataBackup: {
    lastModifiedDate: string;
    deviceName: string;
    databaseName: string;
    hash: string;
    schemaVersion: number;
  };
}

export interface TableCounts {
  Location: number;
  Tag: number;
  TagMap: number;
  UserMark: number;
  BlockRange: number;
  Note: number;
  Bookmark: number;
  InputField: number;
  IndependentMedia?: number;
  PlaylistItem?: number;
  [key: string]: number | undefined;
}

export interface BackupMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  deviceName: string;
  lastModifiedDate: string;
  creationDate: string;
  schemaVersion: number;
  counts: TableCounts;
  file: File;
  rawZipBytes: Uint8Array;
  userDataDbBytes: Uint8Array;
  manifest: JWLibraryManifest;
  extraFiles: Map<string, Uint8Array>;
}

export interface MergeStatsChange {
  totalNotes: number;
  totalMarks: number;
  totalTags: number;
  totalBookmarks: number;
  totalInputFields: number;
  healedBlockRanges: number;
  notesUpdatedOnConflict: number;
  locationsAdded: number;
}

export interface MergeProgressState {
  stage: 'idle' | 'unpacking' | 'reading' | 'merging' | 'healing' | 'hashing' | 'repacking' | 'complete' | 'error';
  percent: number;
  message: string;
  error?: string;
}

export interface NoteDetail {
  noteId: number;
  guid: string;
  title: string | null;
  content: string | null;
  lastModified: string;
  created: string;
  locationTitle?: string;
  colorIndex?: number;
}

export interface BookmarkDetail {
  bookmarkId: number;
  title: string;
  snippet: string | null;
  slot: number;
  locationTitle?: string;
}

export type PublicationCategoryKey = 
  | 'bible' 
  | 'watchtower' 
  | 'workbook' 
  | 'books_brochures' 
  | 'independent_notes';

export interface LanguageStat {
  mepsLanguage: number;
  languageName: string;
  nativeName?: string;
  code?: string;
  notesCount: number;
  highlightsCount: number;
  bookmarksCount: number;
  inputFieldsCount: number;
  totalAnnotations: number;
  percentage: number;
}

export interface WatchtowerIssueStat {
  issueTagNumber: number;
  year: number;
  month?: number;
  monthName?: string;
  issueTitle: string;
  notesCount: number;
  highlightsCount: number;
  bookmarksCount: number;
  inputFieldsCount: number;
  totalAnnotations: number;
}

export interface WatchtowerYearStat {
  year: number;
  notesCount: number;
  highlightsCount: number;
  bookmarksCount: number;
  inputFieldsCount: number;
  totalAnnotations: number;
  issues: WatchtowerIssueStat[];
}

export interface BibleBookStat {
  bookNumber: number;
  bookName: string;
  shortName: string;
  testament: 'OT' | 'NT';
  division: string;
  chapters: number;
  notesCount: number;
  highlightsCount: number;
  bookmarksCount: number;
  totalAnnotations: number;
}

export interface CategorySummaryStat {
  category: PublicationCategoryKey;
  label: string;
  description: string;
  notesCount: number;
  highlightsCount: number;
  bookmarksCount: number;
  inputFieldsCount: number;
  totalAnnotations: number;
  percentage: number;
}

export interface TopStudiedPublication {
  id: string;
  keySymbol?: string;
  title: string;
  shortTitle: string;
  category: PublicationCategoryKey;
  categoryLabel: string;
  bookNumber?: number;
  issueTagNumber?: number;
  mepsLanguage?: number;
  languageName?: string;
  notesCount: number;
  highlightsCount: number;
  bookmarksCount: number;
  inputFieldsCount: number;
  totalAnnotations: number;
}

export interface BackupAnalytics {
  totalAnnotations: number;
  totalNotes: number;
  totalHighlights: number;
  totalBookmarks: number;
  totalInputFields: number;
  totalIndependentNotes: number;
  
  languages: LanguageStat[];
  categories: CategorySummaryStat[];
  
  watchtowerByYear: WatchtowerYearStat[];
  bibleByBook: BibleBookStat[];
  topPublications: TopStudiedPublication[];
}

