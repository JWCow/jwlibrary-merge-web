import { getSql, hasTable } from './sqlite';
import { 
  getLanguageInfo, 
  getBibleBookInfo, 
  getPublicationInfo,
  resolvePublicationCategory
} from './constants';
import type { 
  BackupAnalytics, 
  LanguageStat, 
  CategorySummaryStat, 
  WatchtowerYearStat, 
  WatchtowerIssueStat, 
  BibleBookStat, 
  TopStudiedPublication,
  PublicationCategoryKey
} from './types';

interface LocationRecord {
  locationId: number;
  bookNumber?: number | null;
  chapterNumber?: number | null;
  documentId?: number | null;
  track?: number | null;
  issueTagNumber?: number | null;
  keySymbol?: string | null;
  mepsLanguage: number;
  type?: number | null;
  title?: string | null;
}

const MONTH_NAMES = [
  'Annual / Special Issue',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

/**
 * Parses a JW Library IssueTagNumber (e.g. 20240100 -> Year 2024, Month 1).
 */
export function parseIssueTagNumber(
  issueTag?: number | null,
  keySymbol?: string | null
): { year: number; month: number; monthName: string; formatted: string } {
  let year = 0;
  let month = 0;

  if (issueTag && issueTag > 0) {
    if (issueTag >= 10000000) {
      year = Math.floor(issueTag / 10000);
      month = Math.floor((issueTag % 10000) / 100);
    } else if (issueTag >= 100000) {
      year = Math.floor(issueTag / 100);
      month = issueTag % 100;
    } else if (issueTag >= 1900 && issueTag <= 2100) {
      year = issueTag;
      month = 0;
    }
  }

  if (year === 0 && keySymbol) {
    const clean = keySymbol.toLowerCase();
    const match = clean.match(/(?:w|mwb|g)(\d{2,4})/);
    if (match) {
      const num = parseInt(match[1], 10);
      year = num < 100 ? (num > 50 ? 1900 + num : 2000 + num) : num;
    }
  }

  const safeMonth = month >= 1 && month <= 12 ? month : 0;
  const monthName = MONTH_NAMES[safeMonth];
  const formatted = year > 0 
    ? (safeMonth > 0 ? `${monthName} ${year}` : `${year}`) 
    : 'Unknown Issue';

  return { year, month: safeMonth, monthName, formatted };
}

export { resolvePublicationCategory };

/**
 * Extracts and aggregates comprehensive study analytics from a JW Library database.
 */
export async function extractBackupAnalytics(dbBytes: Uint8Array): Promise<BackupAnalytics> {
  const SQL = await getSql();
  const db = new SQL.Database(dbBytes);

  try {
    const hasLocation = hasTable(db, 'Location');
    const hasUserMark = hasTable(db, 'UserMark');
    const hasNote = hasTable(db, 'Note');
    const hasBookmark = hasTable(db, 'Bookmark');
    const hasInputField = hasTable(db, 'InputField');

    // 1. Index all Location records in memory
    const locationMap = new Map<number, LocationRecord>();

    if (hasLocation) {
      const locRes = db.exec('SELECT * FROM Location');
      if (locRes.length > 0) {
        const { columns, values } = locRes[0];
        const colVal = (row: any[], name: string) => {
          const idx = columns.indexOf(name);
          return idx !== -1 ? row[idx] : null;
        };

        for (const row of values) {
          const locId = colVal(row, 'LocationId') as number;
          if (!locId) continue;
          const mepsLang = (colVal(row, 'MepsLanguage') ?? 0) as number;
          locationMap.set(locId, {
            locationId: locId,
            bookNumber: colVal(row, 'BookNumber') as number | null,
            chapterNumber: colVal(row, 'ChapterNumber') as number | null,
            documentId: colVal(row, 'DocumentId') as number | null,
            track: colVal(row, 'Track') as number | null,
            issueTagNumber: colVal(row, 'IssueTagNumber') as number | null,
            keySymbol: colVal(row, 'KeySymbol') as string | null,
            mepsLanguage: isNaN(mepsLang) ? 0 : mepsLang,
            type: colVal(row, 'Type') as number | null,
            title: colVal(row, 'Title') as string | null
          });
        }
      }
    }

    // 2. Count Highlights (UserMark) by LocationId
    const markCountsByLoc = new Map<number, number>();
    let totalHighlights = 0;
    if (hasUserMark) {
      const markRes = db.exec('SELECT LocationId, count(*) as cnt FROM UserMark GROUP BY LocationId');
      if (markRes.length > 0) {
        for (const row of markRes[0].values) {
          const locId = (row[0] ?? 0) as number;
          const count = (row[1] ?? 0) as number;
          markCountsByLoc.set(locId, count);
          totalHighlights += count;
        }
      }
    }

    // 3. Count Bookmarks by LocationId
    const bookmarkCountsByLoc = new Map<number, number>();
    let totalBookmarks = 0;
    if (hasBookmark) {
      const bmRes = db.exec('SELECT LocationId, count(*) as cnt FROM Bookmark GROUP BY LocationId');
      if (bmRes.length > 0) {
        for (const row of bmRes[0].values) {
          const locId = (row[0] ?? 0) as number;
          const count = (row[1] ?? 0) as number;
          bookmarkCountsByLoc.set(locId, count);
          totalBookmarks += count;
        }
      }
    }

    // 4. Count InputFields by LocationId
    const inputFieldCountsByLoc = new Map<number, number>();
    let totalInputFields = 0;
    if (hasInputField) {
      const inputRes = db.exec('SELECT LocationId, count(*) as cnt FROM InputField GROUP BY LocationId');
      if (inputRes.length > 0) {
        for (const row of inputRes[0].values) {
          const locId = (row[0] ?? 0) as number;
          const count = (row[1] ?? 0) as number;
          inputFieldCountsByLoc.set(locId, count);
          totalInputFields += count;
        }
      }
    }

    // 5. Count Notes by resolved LocationId (or 0 for independent)
    const noteCountsByLoc = new Map<number, number>();
    let totalNotes = 0;
    let totalIndependentNotes = 0;

    if (hasNote) {
      const noteQuery = `
        SELECT 
          COALESCE(n.LocationId, ${hasUserMark ? 'u.LocationId' : 'NULL'}) as ResolvedLocId,
          count(*) as cnt
        FROM Note n
        ${hasUserMark ? 'LEFT JOIN UserMark u ON u.UserMarkId = n.UserMarkId' : ''}
        GROUP BY COALESCE(n.LocationId, ${hasUserMark ? 'u.LocationId' : 'NULL'})
      `;
      const noteRes = db.exec(noteQuery);
      if (noteRes.length > 0) {
        for (const row of noteRes[0].values) {
          const rawLocId = row[0];
          const count = (row[1] ?? 0) as number;
          totalNotes += count;

          if (rawLocId === null || rawLocId === undefined || rawLocId === 0) {
            totalIndependentNotes += count;
          } else {
            const locId = rawLocId as number;
            // If location doesn't exist or is empty, consider as independent note
            if (!locationMap.has(locId)) {
              totalIndependentNotes += count;
            } else {
              noteCountsByLoc.set(locId, (noteCountsByLoc.get(locId) || 0) + count);
            }
          }
        }
      }
    }

    const totalAnnotations = totalHighlights + totalNotes + totalBookmarks + totalInputFields;

    // 6. Aggregate by MEPS Language
    const languageAgg = new Map<number, {
      notes: number;
      highlights: number;
      bookmarks: number;
      inputFields: number;
    }>();

    const getOrInitLang = (langId: number) => {
      let entry = languageAgg.get(langId);
      if (!entry) {
        entry = { notes: 0, highlights: 0, bookmarks: 0, inputFields: 0 };
        languageAgg.set(langId, entry);
      }
      return entry;
    };

    // 7. Aggregate by Category
    const categoryAgg: Record<PublicationCategoryKey, {
      notes: number;
      highlights: number;
      bookmarks: number;
      inputFields: number;
    }> = {
      bible: { notes: 0, highlights: 0, bookmarks: 0, inputFields: 0 },
      watchtower: { notes: 0, highlights: 0, bookmarks: 0, inputFields: 0 },
      workbook: { notes: 0, highlights: 0, bookmarks: 0, inputFields: 0 },
      books_brochures: { notes: 0, highlights: 0, bookmarks: 0, inputFields: 0 },
      independent_notes: { notes: totalIndependentNotes, highlights: 0, bookmarks: 0, inputFields: 0 }
    };

    // 8. Watchtower Aggregations (Year -> Issues)
    const wtYearMap = new Map<number, {
      year: number;
      notes: number;
      highlights: number;
      bookmarks: number;
      inputFields: number;
      issues: Map<number, WatchtowerIssueStat>;
    }>();

    // 9. Bible Book Aggregations
    const bibleBookMap = new Map<number, {
      notes: number;
      highlights: number;
      bookmarks: number;
    }>();

    // 10. Publication Documents Aggregations (for Top Studied list)
    const pubDocsMap = new Map<string, TopStudiedPublication>();

    // Process all locations with annotations
    const allActiveLocationIds = new Set<number>([
      ...markCountsByLoc.keys(),
      ...noteCountsByLoc.keys(),
      ...bookmarkCountsByLoc.keys(),
      ...inputFieldCountsByLoc.keys()
    ]);

    for (const locId of allActiveLocationIds) {
      const loc = locationMap.get(locId);
      const marks = markCountsByLoc.get(locId) || 0;
      const nts = noteCountsByLoc.get(locId) || 0;
      const bms = bookmarkCountsByLoc.get(locId) || 0;
      const inputs = inputFieldCountsByLoc.get(locId) || 0;
      const totalLoc = marks + nts + bms + inputs;

      if (totalLoc === 0) continue;

      const langId = loc ? loc.mepsLanguage : 0;
      const langEntry = getOrInitLang(langId);
      langEntry.highlights += marks;
      langEntry.notes += nts;
      langEntry.bookmarks += bms;
      langEntry.inputFields += inputs;

      const category = resolvePublicationCategory(loc);
      const catEntry = categoryAgg[category];
      catEntry.highlights += marks;
      catEntry.notes += nts;
      catEntry.bookmarks += bms;
      catEntry.inputFields += inputs;

      // Watchtower deep breakdown
      if (category === 'watchtower' && loc) {
        const { year, month, monthName, formatted } = parseIssueTagNumber(loc.issueTagNumber, loc.keySymbol);
        const targetYear = year > 0 ? year : 0;
        
        let yEntry = wtYearMap.get(targetYear);
        if (!yEntry) {
          yEntry = {
            year: targetYear,
            notes: 0,
            highlights: 0,
            bookmarks: 0,
            inputFields: 0,
            issues: new Map()
          };
          wtYearMap.set(targetYear, yEntry);
        }

        yEntry.highlights += marks;
        yEntry.notes += nts;
        yEntry.bookmarks += bms;
        yEntry.inputFields += inputs;

        const issueKey = loc.issueTagNumber || (month > 0 ? targetYear * 100 + month : targetYear);
        let issueEntry = yEntry.issues.get(issueKey);
        if (!issueEntry) {
          const issueTitle = loc.title || (month > 0 ? `${monthName} ${targetYear}` : formatted);
          issueEntry = {
            issueTagNumber: loc.issueTagNumber || issueKey,
            year: targetYear,
            month: month > 0 ? month : undefined,
            monthName: month > 0 ? monthName : undefined,
            issueTitle,
            notesCount: 0,
            highlightsCount: 0,
            bookmarksCount: 0,
            inputFieldsCount: 0,
            totalAnnotations: 0
          };
          yEntry.issues.set(issueKey, issueEntry);
        }

        issueEntry.highlightsCount += marks;
        issueEntry.notesCount += nts;
        issueEntry.bookmarksCount += bms;
        issueEntry.inputFieldsCount += inputs;
        issueEntry.totalAnnotations += totalLoc;
      }

      // Bible book breakdown
      if (category === 'bible' && loc && loc.bookNumber && loc.bookNumber >= 1 && loc.bookNumber <= 66) {
        let bEntry = bibleBookMap.get(loc.bookNumber);
        if (!bEntry) {
          bEntry = { notes: 0, highlights: 0, bookmarks: 0 };
          bibleBookMap.set(loc.bookNumber, bEntry);
        }
        bEntry.highlights += marks;
        bEntry.notes += nts;
        bEntry.bookmarks += bms;
      }

      // Top Studied Publications grouping
      let docKey = '';
      let docTitle = '';
      let docShortTitle = '';
      let docCategoryLabel = 'General';

      if (category === 'bible' && loc && loc.bookNumber && loc.bookNumber >= 1 && loc.bookNumber <= 66) {
        const bInfo = getBibleBookInfo(loc.bookNumber);
        docKey = `bible_${loc.bookNumber}`;
        docTitle = bInfo?.name || `Bible Book #${loc.bookNumber}`;
        docShortTitle = bInfo?.shortName || docTitle;
        docCategoryLabel = 'Holy Scriptures';
      } else if (category === 'watchtower' && loc) {
        const { formatted } = parseIssueTagNumber(loc.issueTagNumber, loc.keySymbol);
        const tag = loc.issueTagNumber ? `${loc.issueTagNumber}` : (loc.keySymbol || 'w');
        docKey = `wt_${tag}_${langId}`;
        docTitle = loc.title || `The Watchtower (${formatted})`;
        docShortTitle = `Watchtower (${formatted})`;
        docCategoryLabel = 'The Watchtower';
      } else if (category === 'workbook' && loc) {
        const { formatted } = parseIssueTagNumber(loc.issueTagNumber, loc.keySymbol);
        const tag = loc.issueTagNumber ? `${loc.issueTagNumber}` : (loc.keySymbol || 'mwb');
        docKey = `mwb_${tag}_${langId}`;
        docTitle = loc.title || `Meeting Workbook (${formatted})`;
        docShortTitle = `Workbook (${formatted})`;
        docCategoryLabel = 'Meeting Workbook';
      } else if (loc && (loc.keySymbol || loc.title)) {
        const pubInfo = getPublicationInfo(loc.keySymbol);
        docKey = `pub_${(loc.keySymbol || loc.title || '').toLowerCase()}_${langId}`;
        docTitle = loc.title || pubInfo.title;
        docShortTitle = pubInfo.shortTitle || docTitle;
        docCategoryLabel = pubInfo.category === 'book' ? 'Book' : (pubInfo.category === 'brochure' ? 'Brochure' : 'Publication');
      } else {
        docKey = `loc_${locId}`;
        docTitle = loc?.title || 'Document';
        docShortTitle = docTitle;
        docCategoryLabel = 'Publication';
      }

      let docEntry = pubDocsMap.get(docKey);
      if (!docEntry) {
        const langInfo = getLanguageInfo(langId);
        docEntry = {
          id: docKey,
          keySymbol: loc?.keySymbol || undefined,
          title: docTitle,
          shortTitle: docShortTitle,
          category,
          categoryLabel: docCategoryLabel,
          bookNumber: loc?.bookNumber || undefined,
          issueTagNumber: loc?.issueTagNumber || undefined,
          mepsLanguage: langId,
          languageName: langInfo.formattedName,
          notesCount: 0,
          highlightsCount: 0,
          bookmarksCount: 0,
          inputFieldsCount: 0,
          totalAnnotations: 0
        };
        pubDocsMap.set(docKey, docEntry);
      }

      docEntry.highlightsCount += marks;
      docEntry.notesCount += nts;
      docEntry.bookmarksCount += bms;
      docEntry.inputFieldsCount += inputs;
      docEntry.totalAnnotations += totalLoc;
    }

    // Add Independent Notes to Top Studied if present
    if (totalIndependentNotes > 0) {
      pubDocsMap.set('independent_notes', {
        id: 'independent_notes',
        title: 'General / Independent Notes',
        shortTitle: 'Independent Notes',
        category: 'independent_notes',
        categoryLabel: 'Independent Notes',
        notesCount: totalIndependentNotes,
        highlightsCount: 0,
        bookmarksCount: 0,
        inputFieldsCount: 0,
        totalAnnotations: totalIndependentNotes
      });
    }

    // Format Languages list
    const languages: LanguageStat[] = Array.from(languageAgg.entries())
      .map(([langId, counts]) => {
        const info = getLanguageInfo(langId);
        const total = counts.highlights + counts.notes + counts.bookmarks + counts.inputFields;
        const percentage = totalAnnotations > 0 
          ? Math.round((total / totalAnnotations) * 1000) / 10 
          : 0;

        return {
          mepsLanguage: langId,
          languageName: info.formattedName,
          nativeName: info.nativeName,
          code: info.code,
          notesCount: counts.notes,
          highlightsCount: counts.highlights,
          bookmarksCount: counts.bookmarks,
          inputFieldsCount: counts.inputFields,
          totalAnnotations: total,
          percentage
        };
      })
      .sort((a, b) => b.totalAnnotations - a.totalAnnotations);

    // Format 5 Categories summary
    const categoryMetadata: Record<PublicationCategoryKey, { label: string; description: string }> = {
      bible: {
        label: 'Holy Scriptures',
        description: 'New World Translation Bible books (Genesis to Revelation)'
      },
      watchtower: {
        label: 'The Watchtower',
        description: 'Study and Public Editions organized by year and month'
      },
      workbook: {
        label: 'Meeting Workbooks',
        description: 'Our Christian Life and Ministry Workbooks and schedules'
      },
      books_brochures: {
        label: 'Books & Brochures',
        description: 'Study books, brochures, reference publications, and songbooks'
      },
      independent_notes: {
        label: 'Independent Notes',
        description: 'Unattached personal study notes, thoughts, and meeting outlines'
      }
    };

    const categoryOrder: PublicationCategoryKey[] = [
      'bible',
      'watchtower',
      'workbook',
      'books_brochures',
      'independent_notes'
    ];

    const categories: CategorySummaryStat[] = categoryOrder.map(catKey => {
      const counts = categoryAgg[catKey];
      const meta = categoryMetadata[catKey];
      const total = counts.highlights + counts.notes + counts.bookmarks + counts.inputFields;
      const percentage = totalAnnotations > 0 
        ? Math.round((total / totalAnnotations) * 1000) / 10 
        : 0;

      return {
        category: catKey,
        label: meta.label,
        description: meta.description,
        notesCount: counts.notes,
        highlightsCount: counts.highlights,
        bookmarksCount: counts.bookmarks,
        inputFieldsCount: counts.inputFields,
        totalAnnotations: total,
        percentage
      };
    });

    // Format Watchtower by Year & Issue Month
    const watchtowerByYear: WatchtowerYearStat[] = Array.from(wtYearMap.values())
      .map(yEntry => {
        const issues = Array.from(yEntry.issues.values()).sort((a, b) => {
          if (b.month && a.month) return b.month - a.month;
          return b.issueTagNumber - a.issueTagNumber;
        });

        const total = yEntry.highlights + yEntry.notes + yEntry.bookmarks + yEntry.inputFields;

        return {
          year: yEntry.year,
          notesCount: yEntry.notes,
          highlightsCount: yEntry.highlights,
          bookmarksCount: yEntry.bookmarks,
          inputFieldsCount: yEntry.inputFields,
          totalAnnotations: total,
          issues
        };
      })
      .sort((a, b) => b.year - a.year);

    // Format Bible Books list
    const bibleByBook: BibleBookStat[] = Array.from(bibleBookMap.entries())
      .map(([bookNum, counts]) => {
        const bInfo = getBibleBookInfo(bookNum);
        const total = counts.highlights + counts.notes + counts.bookmarks;

        return {
          bookNumber: bookNum,
          bookName: bInfo?.name || `Book #${bookNum}`,
          shortName: bInfo?.shortName || `${bookNum}`,
          testament: bInfo?.testament || (bookNum <= 39 ? 'OT' : 'NT'),
          division: bInfo?.division || 'Historical',
          chapters: bInfo?.chapters || 1,
          notesCount: counts.notes,
          highlightsCount: counts.highlights,
          bookmarksCount: counts.bookmarks,
          totalAnnotations: total
        };
      })
      .sort((a, b) => a.bookNumber - b.bookNumber);

    // Format Top Studied Publications
    const topPublications: TopStudiedPublication[] = Array.from(pubDocsMap.values())
      .sort((a, b) => b.totalAnnotations - a.totalAnnotations);

    return {
      totalAnnotations,
      totalNotes,
      totalHighlights,
      totalBookmarks,
      totalInputFields,
      totalIndependentNotes,
      languages,
      categories,
      watchtowerByYear,
      bibleByBook,
      topPublications
    };
  } finally {
    db.close();
  }
}
