export interface FaqSection {
  heading?: string;
  body: string;
  codeSnippet?: string;
  bulletPoints?: string[];
  callout?: {
    type: 'info' | 'tip' | 'warning' | 'success';
    title?: string;
    text: string;
  };
}

export interface FaqTopic {
  id: string;
  title: string;
  shortTitle: string;
  category: 'highlights' | 'repair' | 'telemetry' | 'offsets' | 'locations' | 'schema';
  categoryLabel: string;
  summary: string;
  iconName: 'Highlighter' | 'Sparkles' | 'Terminal' | 'Sliders' | 'MapPin' | 'Database';
  sections: FaqSection[];
  keywords: string[];
}

export const FAQ_TOPICS: FaqTopic[] = [
  {
    id: 'usermark-vs-blockrange',
    title: 'UserMark vs. BlockRange: Why Highlights Have Two Tables',
    shortTitle: 'UserMark vs. BlockRange',
    category: 'highlights',
    categoryLabel: 'Highlight Entities',
    summary: 'Explains why UserMark is the master highlight entity (color, style, GUID) while BlockRange stores individual paragraph/verse text spans, clarifying why BlockRange counts always exceed UserMark counts.',
    iconName: 'Highlighter',
    keywords: [
      'usermark', 'blockrange', 'highlight', 'colorindex', 'styleindex', 'usermarkguid',
      'blocktype', 'identifier', 'paragraph', 'verse', 'count', 'why blockrange exceeds usermark'
    ],
    sections: [
      {
        heading: 'Master Entity vs. Paragraph Text Spans',
        body: 'In JW Library SQLite databases, highlights are split into a parent-child relational architecture across two separate tables: UserMark and BlockRange.',
        bulletPoints: [
          'UserMark (Parent): Stores highlight identity, color index (1=Yellow, 2=Green, 3=Blue, 4=Pink, 5=Orange, 6=Purple), style index, unique UserMarkGuid, and version.',
          'BlockRange (Child): Stores the physical paragraph or verse span covered by that highlight, referencing the parent via UserMarkId.',
          'BlockType: Distinguishes publication paragraphs (0), Bible verses (1), and headings (2).',
          'Identifier: The paragraph index within the document or the Bible verse number.'
        ]
      },
      {
        heading: 'Why is the BlockRange count higher than the UserMark count?',
        body: 'When a user highlights text across multiple paragraphs or multiple Bible verses in a single continuous gesture, JW Library creates ONE UserMark entity and MULTIPLE BlockRange records—one for each paragraph or verse crossed.',
        callout: {
          type: 'info',
          title: 'Concrete Example',
          text: 'If you highlight from paragraph 4 through paragraph 6 of a Watchtower article in one swipe, the database stores 1 UserMark record and 3 BlockRange records (Block 4, Block 5, Block 6). That is why total BlockRange counts are always 1.2× to 2× higher than UserMark counts.'
        }
      },
      {
        heading: 'Database Schema Columns',
        body: 'Here is how the two tables link together in SQLite:',
        codeSnippet: `-- Parent Table: Logical Highlight Entity
CREATE TABLE UserMark (
  UserMarkId INTEGER PRIMARY KEY AUTOINCREMENT,
  ColorIndex INTEGER NOT NULL,  -- 1:Yellow, 2:Green, 3:Blue, 4:Pink, 5:Orange, 6:Purple
  Position INTEGER NOT NULL,
  BookmarkId INTEGER,
  StyleIndex INTEGER NOT NULL,
  UserMarkGuid TEXT NOT NULL UNIQUE,
  Version INTEGER NOT NULL
);

-- Child Table: Physical Text Spans
CREATE TABLE BlockRange (
  BlockRangeId INTEGER PRIMARY KEY AUTOINCREMENT,
  BlockType INTEGER NOT NULL,    -- 0:Paragraph, 1:Bible Verse, 2:Heading
  Identifier INTEGER NOT NULL,   -- Paragraph Index or Verse Number
  StartToken INTEGER,            -- Starting word/token offset
  EndToken INTEGER,              -- Ending word/token offset
  UserMarkId INTEGER NOT NULL,   -- Foreign Key -> UserMark.UserMarkId
  FOREIGN KEY (UserMarkId) REFERENCES UserMark(UserMarkId)
);`
      }
    ]
  },
  {
    id: 'multi-block-healing',
    title: 'Multi-Block Highlight Healing: Preventing Truncation Bugs',
    shortTitle: 'Multi-Block Healing',
    category: 'repair',
    categoryLabel: 'Smart Auto-Repair',
    summary: 'Explains why cross-paragraph/verse highlights create multiple BlockRange records, how legacy merge tools truncated them, and how the smart auto-repair engine preserves all contiguous spans.',
    iconName: 'Sparkles',
    keywords: [
      'multi-block', 'healing', 'smart auto-repair', 'truncation', 'jwlmerge', 'cross-paragraph',
      'cross-verse', 'corruption', 'contiguous', 'deduplication', 'span preservation'
    ],
    sections: [
      {
        heading: 'The Legacy Truncation Bug',
        body: 'Early community merge scripts and legacy tools frequently suffered from a subtle data corruption bug: when merging backups from two devices, they assumed each UserMark only had a single BlockRange, or they arbitrarily took only the first matching span. As a result, cross-paragraph and cross-verse highlights were permanently cut off after the first paragraph.',
        callout: {
          type: 'warning',
          title: 'What Went Wrong in Legacy Mergers',
          text: 'If you highlighted Genesis 1:1 through 1:3 on iPad and merged it with an iPhone backup using older tools, only Genesis 1:1 would remain highlighted. Verses 1:2 and 1:3 were dropped silently because their child BlockRanges were discarded.'
        }
      },
      {
        heading: 'How Smart Auto-Repair Preserves Every Span',
        body: 'Our client-side merger engine uses an intelligent, non-destructive multi-block healing pipeline:',
        bulletPoints: [
          'GUID Resolution: Correlates UserMarks across all uploaded backups using immutable UserMarkGuid strings.',
          'Comprehensive Span Enumeration: Queries and aggregates every associated BlockRange from every input backup.',
          'Exact Duplicate Detection: Matches BlockType, Identifier, StartToken, and EndToken to prevent duplicate highlights.',
          'Contiguous Appending: Inserts all missing or secondary paragraph spans under the unified UserMarkId, fully restoring multi-paragraph highlights.'
        ],
        codeSnippet: `// Smart Auto-Repair Matching Engine in src/lib/merge.ts
const findRange = destDb.prepare(\`
  SELECT BlockRangeId FROM BlockRange 
  WHERE UserMarkId = ? AND BlockType = ? AND Identifier = ? 
    AND (StartToken IS ? OR (StartToken IS NULL AND ? IS NULL))
    AND (EndToken IS ? OR (EndToken IS NULL AND ? IS NULL))
  LIMIT 1
\`);
// If not found in destination, insert the healed block range span!`
      },
      {
        heading: 'Zero Data Loss Guarantee',
        body: 'With Smart Auto-Repair, whether you studied on iPad, phone, or laptop, 100% of your highlighted paragraphs, multi-verse scripture chains, and study guide answers are retained intact.'
      }
    ]
  },
  {
    id: 'audit-telemetry',
    title: 'Merge Audit Log Telemetry: Understanding `Unified X (+Y new/healed)`',
    shortTitle: 'Audit Log Telemetry',
    category: 'telemetry',
    categoryLabel: 'Merge Telemetry',
    summary: 'Explains the audit log line "Unified X block range(s) (+Y new/healed)", clarifying what X (source ranges) and Y (newly unified non-duplicate spans) mean.',
    iconName: 'Terminal',
    keywords: [
      'telemetry', 'audit log', 'unified x', 'new/healed', 'healedblockranges', 'totalsrcranges',
      'log output', 'metrics', 'events', 'diagnostics'
    ],
    sections: [
      {
        heading: 'Deconstructing the Telemetry Line',
        body: 'During the merge process, the engine outputs real-time audit log events. The most crucial line regarding highlights is:',
        codeSnippet: `> Unified 412 block range(s) (+38 new/healed)`
      },
      {
        heading: 'What do X and Y mean?',
        body: 'Here is the precise mathematical breakdown of the telemetry values:',
        bulletPoints: [
          'X (412): The total number of BlockRange rows inspected and processed in that incoming backup file.',
          '+Y (+38): The count of newly unified, non-duplicate block range spans inserted into the destination database.',
          'Why X is larger than Y: If 374 of the 412 block ranges were already identical to highlights in the base file, only the 38 missing or healed spans are inserted to prevent duplicate overlapping highlights.'
        ],
        callout: {
          type: 'success',
          title: 'Key Takeaway',
          text: 'A positive +Y number indicates that the smart engine successfully discovered highlights or multi-block pieces on your other device and safely unified them into your combined backup!'
        }
      },
      {
        heading: 'Other Common Audit Log Lines',
        body: 'The audit log records all database operations:',
        bulletPoints: [
          'Mapped N location(s) (+M new): Resolves Bible book & publication records, adding new location rows for publications studied on only one device.',
          'Mapped N user note(s): Merges study notes by GUID, retaining the newest content when notes were edited simultaneously.',
          'Unified N tag mapping(s): Merges custom tag folders and normalizes older schema columns (NoteId/LocationId) into modern Type/TypeId structures.'
        ]
      }
    ]
  },
  {
    id: 'token-offsets',
    title: 'Character vs. Word Highlighting: `StartToken` & `EndToken`',
    shortTitle: 'Token Offsets',
    category: 'offsets',
    categoryLabel: 'Text Offsets',
    summary: 'Explains how StartToken and EndToken in BlockRange store precise character and token offset positions within paragraphs and verses.',
    iconName: 'Sliders',
    keywords: [
      'starttoken', 'endtoken', 'token offset', 'character offset', 'word highlighting',
      'partial highlight', 'full paragraph', 'blocktype', 'identifier'
    ],
    sections: [
      {
        heading: 'How JW Library Indexes Words and Tokens',
        body: 'Instead of storing raw extracted string snippets in the database, JW Library tokenizes each publication paragraph into an indexed array of words and punctuation marks.',
        bulletPoints: [
          'StartToken: The 0-based token index where the highlight begins within that specific paragraph or verse.',
          'EndToken: The token index where the highlight terminates.',
          'Whole-Paragraph Highlighting: When an entire paragraph or verse is highlighted, StartToken and EndToken are either set to NULL or 0 and the total token length.',
          'Partial Word/Phrase Highlighting: When a specific clause is highlighted (e.g. "Draw close to God"), StartToken and EndToken isolate those specific token boundaries.'
        ]
      },
      {
        heading: 'Token Indexing in Action',
        body: 'Consider paragraph 5 of a publication containing 20 words. If you highlight words 4 through 10:',
        codeSnippet: `-- Highlighting words 4 through 10 in Paragraph 5:
INSERT INTO BlockRange (
  BlockType,      -- 0 (Publication Paragraph)
  Identifier,     -- 5 (Paragraph #5)
  StartToken,     -- 4 (Starting at 4th word/token)
  EndToken,       -- 10 (Ending at 10th word/token)
  UserMarkId      -- 142 (Foreign key to UserMark)
);`
      },
      {
        heading: 'BlockType Enum Values',
        body: 'The BlockType column dictates how JW Library renders and anchors the highlight:',
        bulletPoints: [
          'BlockType = 0: Publication paragraph, study article body, or caption text.',
          'BlockType = 1: Bible verse (Identifier represents the verse number in the chapter).',
          'BlockType = 2: Section title, article heading, or subheading.'
        ]
      }
    ]
  },
  {
    id: 'locations-and-tagmap',
    title: 'Publications, Locations & TagMap Study Folders',
    shortTitle: 'Locations & TagMap',
    category: 'locations',
    categoryLabel: 'Content Pointers',
    summary: 'Explains how Locations link notes and highlights to publications and Bible chapters, and how TagMap creates study folders with custom manual ordering.',
    iconName: 'MapPin',
    keywords: [
      'location', 'tagmap', 'tag', 'keysymbol', 'issuetagnumber', 'booknumber', 'chapternumber',
      'documentid', 'mepslanguage', 'position', 'study folders', 'schema migration', 'typeid'
    ],
    sections: [
      {
        heading: 'The Location Table (Universal Content Address)',
        body: 'Notes, bookmarks, and highlights do not store duplicate publication text. Instead, they store a foreign key to the Location table, which acts as a universal content address:',
        bulletPoints: [
          'BookNumber & ChapterNumber: References Bible books (1=Genesis to 66=Revelation) and chapters.',
          'KeySymbol: Publication symbol (e.g. "w" for Watchtower, "mwb" for Meeting Workbook, "nwt" for Bible).',
          'IssueTagNumber: Publication issue date (e.g. 20240500 for May 2024 Watchtower).',
          'DocumentId: Specific article/chapter document ID inside the publication.',
          'MepsLanguage: MEPS language code (0=English, 39=Vietnamese, 1=Spanish, etc.).'
        ]
      },
      {
        heading: 'The Tag & TagMap System (Custom Study Folders)',
        body: 'Tags allow organizing personal study notes into custom topics (e.g., "Field Ministry", "Spiritual Gems", "Assembly Review"):',
        bulletPoints: [
          'Tag Table: Stores user-defined tag names and modified dates.',
          'TagMap Table: Creates the many-to-many relationship linking notes or locations to tags.',
          'Position Column: Preserves custom manual drag-and-drop ordering of notes inside each tag folder.'
        ]
      },
      {
        heading: 'Schema Migration: Legacy vs. Modern TagMap',
        body: 'JW Library has evolved its TagMap structure across database schema versions:',
        bulletPoints: [
          'Legacy Schema (< v5): Used separate NoteId, LocationId, and PlaylistItemId columns.',
          'Modern Schema (v5+): Uses a unified Type (0=Location, 1=Note, 2=Playlist) and TypeId column pair.',
          'Our Engine Guarantee: Automatically detects and migrates older schema entries into modern structures so backups from older JW Library versions merge flawlessly without SQLite constraint errors.'
        ],
        codeSnippet: `-- Modern Schema 5+ TagMap:
CREATE TABLE TagMap (
  TagMapId INTEGER PRIMARY KEY AUTOINCREMENT,
  PlaylistItemId INTEGER,
  LocationId INTEGER,
  NoteId INTEGER,
  TagId INTEGER NOT NULL,
  Position INTEGER NOT NULL,
  Type INTEGER NOT NULL,      -- 0:Location, 1:Note, 2:PlaylistItem
  TypeId INTEGER NOT NULL,    -- ID of the associated item
  UNIQUE(TagId, Position)
);`
      }
    ]
  },
  {
    id: 'sqlite-tables-overview',
    title: 'Complete SQLite Tables & Database Dictionary',
    shortTitle: 'SQLite Tables Dictionary',
    category: 'schema',
    categoryLabel: 'Database Schema',
    summary: 'Comprehensive dictionary covering all core tables (UserMark, BlockRange, Note, Location, Tag, TagMap, Bookmark, InputField, IndependentMedia, PlaylistItem) plus schema metadata.',
    iconName: 'Database',
    keywords: [
      'sqlite', 'tables', 'schema', 'usermark', 'blockrange', 'note', 'location', 'tag', 'tagmap',
      'bookmark', 'inputfield', 'independentmedia', 'playlistitem', 'schemaversion', 'manifesthash'
    ],
    sections: [
      {
        heading: 'All 10 Core Tables at a Glance',
        body: 'Every JW Library .jwlibrary backup archive contains an internal SQLite database named userData.db. Here is the complete list of tables and their roles:'
      }
    ]
  }
];

/**
 * Find FAQ topic by ID or alias.
 */
export function getFaqTopicById(id?: string | null): FaqTopic | undefined {
  if (!id) return undefined;
  const clean = id.trim().toLowerCase().replace(/[\s_\-]/g, '');

  for (const topic of FAQ_TOPICS) {
    const topicClean = topic.id.replace(/[\s_\-]/g, '').toLowerCase();
    if (topicClean === clean) return topic;
  }

  // Alias lookup
  if (clean === 'usermark' || clean === 'blockrange' || clean === 'highlight' || clean === 'highlights') {
    return FAQ_TOPICS.find(t => t.id === 'usermark-vs-blockrange');
  }
  if (clean === 'healing' || clean === 'multiblock' || clean === 'repair' || clean === 'autorepair') {
    return FAQ_TOPICS.find(t => t.id === 'multi-block-healing');
  }
  if (clean === 'telemetry' || clean === 'audit' || clean === 'log' || clean === 'logs') {
    return FAQ_TOPICS.find(t => t.id === 'audit-telemetry');
  }
  if (clean === 'token' || clean === 'tokens' || clean === 'offset' || clean === 'offsets' || clean === 'starttoken' || clean === 'endtoken') {
    return FAQ_TOPICS.find(t => t.id === 'token-offsets');
  }
  if (clean === 'location' || clean === 'locations' || clean === 'tag' || clean === 'tags' || clean === 'tagmap') {
    return FAQ_TOPICS.find(t => t.id === 'locations-and-tagmap');
  }
  if (clean === 'tables' || clean === 'schema' || clean === 'dictionary' || clean === 'database') {
    return FAQ_TOPICS.find(t => t.id === 'sqlite-tables-overview');
  }

  return undefined;
}

/**
 * Instant search across FAQ topics, headings, text, and keywords.
 */
export function searchFaqTopics(query?: string | null): FaqTopic[] {
  if (!query || !query.trim()) {
    return FAQ_TOPICS;
  }

  const q = query.trim().toLowerCase();

  return FAQ_TOPICS.filter(topic => {
    if (topic.title.toLowerCase().includes(q)) return true;
    if (topic.summary.toLowerCase().includes(q)) return true;
    if (topic.categoryLabel.toLowerCase().includes(q)) return true;
    if (topic.keywords.some(k => k.toLowerCase().includes(q))) return true;

    return topic.sections.some(s => {
      if (s.heading && s.heading.toLowerCase().includes(q)) return true;
      if (s.body && s.body.toLowerCase().includes(q)) return true;
      if (s.bulletPoints && s.bulletPoints.some(bp => bp.toLowerCase().includes(q))) return true;
      if (s.callout && (s.callout.title?.toLowerCase().includes(q) || s.callout.text.toLowerCase().includes(q))) return true;
      if (s.codeSnippet && s.codeSnippet.toLowerCase().includes(q)) return true;
      return false;
    });
  });
}
