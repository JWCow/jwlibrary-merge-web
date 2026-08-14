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
