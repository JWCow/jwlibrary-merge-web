import { getSql } from './sqlite';
import { repackJWLibrary } from './zip';
import type { BackupMetadata, MergeStatsChange, MergeProgressState } from './types';

export interface MergeResult {
  mergedBlob: Blob;
  mergedBytes: Uint8Array;
  fileName: string;
  stats: MergeStatsChange;
  log: string[];
}

export async function mergeBackups(
  backups: BackupMetadata[],
  outputFileName = 'merged-backup.jwlibrary',
  onProgress?: (progress: MergeProgressState) => void
): Promise<MergeResult> {
  if (backups.length < 2) {
    throw new Error('At least two .jwlibrary backup files are required to merge.');
  }

  const log: string[] = [];
  const addLog = (msg: string) => {
    log.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  onProgress?.({ stage: 'reading', percent: 10, message: 'Initializing WASM SQLite merge engine...' });
  addLog(`Starting merge of ${backups.length} backups: ${backups.map(b => b.fileName).join(', ')}`);

  const SQL = await getSql();

  // Initialize destination DB with a clone of the first backup database
  const destDbBytes = new Uint8Array(backups[0].userDataDbBytes);
  const destDb = new SQL.Database(destDbBytes);

  const stats: MergeStatsChange = {
    totalNotes: 0,
    totalMarks: 0,
    totalTags: 0,
    totalBookmarks: 0,
    totalInputFields: 0,
    healedBlockRanges: 0,
    notesUpdatedOnConflict: 0,
    locationsAdded: 0
  };

  let maxLastModified = backups[0].lastModifiedDate || new Date().toISOString();

  try {
    for (let i = 1; i < backups.length; i++) {
      const srcBackup = backups[i];
      const stepPercent = Math.floor(20 + (i / backups.length) * 60);
      onProgress?.({
        stage: 'merging',
        percent: stepPercent,
        message: `Merging data from ${srcBackup.fileName} (${srcBackup.deviceName})...`
      });
      addLog(`Processing Backup #${i + 1}: ${srcBackup.fileName} (${srcBackup.deviceName})`);

      const srcDb = new SQL.Database(srcBackup.userDataDbBytes);

      try {
        // Track latest LastModified date
        if (srcBackup.lastModifiedDate && srcBackup.lastModifiedDate > maxLastModified) {
          maxLastModified = srcBackup.lastModifiedDate;
        }

        // 1. Merge Locations & Build Map (oldLocationId -> newLocationId)
        const locationMap = new Map<number, number>();
        const srcLocationsRes = srcDb.exec(`
          SELECT LocationId, BookNumber, ChapterNumber, DocumentId, Track, IssueTagNumber, 
                 KeySymbol, MepsLanguage, Type, Title 
          FROM Location
        `);

        if (srcLocationsRes.length > 0) {
          const locCols = srcLocationsRes[0].columns;
          for (const row of srcLocationsRes[0].values) {
            const locId = row[locCols.indexOf('LocationId')] as number;
            const book = row[locCols.indexOf('BookNumber')];
            const chap = row[locCols.indexOf('ChapterNumber')];
            const doc = row[locCols.indexOf('DocumentId')];
            const track = row[locCols.indexOf('Track')];
            const issue = row[locCols.indexOf('IssueTagNumber')];
            const symbol = row[locCols.indexOf('KeySymbol')];
            const lang = row[locCols.indexOf('MepsLanguage')];
            const type = row[locCols.indexOf('Type')];
            const title = row[locCols.indexOf('Title')];

            // Match location in destination
            const findLoc = destDb.prepare(`
              SELECT LocationId FROM Location 
              WHERE (BookNumber IS ? OR (BookNumber IS NULL AND ? IS NULL))
                AND (ChapterNumber IS ? OR (ChapterNumber IS NULL AND ? IS NULL))
                AND (DocumentId IS ? OR (DocumentId IS NULL AND ? IS NULL))
                AND (Track IS ? OR (Track IS NULL AND ? IS NULL))
                AND (IssueTagNumber IS ? OR (IssueTagNumber IS NULL AND ? IS NULL))
                AND (KeySymbol IS ? OR (KeySymbol IS NULL AND ? IS NULL))
                AND (MepsLanguage IS ? OR (MepsLanguage IS NULL AND ? IS NULL))
                AND (Type IS ? OR (Type IS NULL AND ? IS NULL))
                AND (Title IS ? OR (Title IS NULL AND ? IS NULL))
              LIMIT 1
            `);
            
            findLoc.bind([book, book, chap, chap, doc, doc, track, track, issue, issue, symbol, symbol, lang, lang, type, type, title, title]);
            
            if (findLoc.step()) {
              const matchedId = findLoc.get()[0] as number;
              locationMap.set(locId, matchedId);
            } else {
              // Insert new Location
              destDb.run(`
                INSERT INTO Location (BookNumber, ChapterNumber, DocumentId, Track, IssueTagNumber, KeySymbol, MepsLanguage, Type, Title)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [book, chap, doc, track, issue, symbol, lang, type, title]);
              
              const newIdRes = destDb.exec('SELECT last_insert_rowid()');
              const newId = newIdRes[0].values[0][0] as number;
              locationMap.set(locId, newId);
              stats.locationsAdded++;
            }
            findLoc.free();
          }
        }

        // 2. Merge Tags & Build Map (oldTagId -> newTagId)
        const tagMap = new Map<number, number>();
        const srcTagsRes = srcDb.exec('SELECT TagId, Type, Name, ImageFilename FROM Tag');
        if (srcTagsRes.length > 0) {
          const tagCols = srcTagsRes[0].columns;
          for (const row of srcTagsRes[0].values) {
            const tagId = row[tagCols.indexOf('TagId')] as number;
            const type = row[tagCols.indexOf('Type')];
            const name = row[tagCols.indexOf('Name')];
            const img = row[tagCols.indexOf('ImageFilename')];

            const findTag = destDb.prepare('SELECT TagId FROM Tag WHERE Type = ? AND Name = ? LIMIT 1');
            findTag.bind([type, name]);

            if (findTag.step()) {
              tagMap.set(tagId, findTag.get()[0] as number);
            } else {
              destDb.run('INSERT INTO Tag (Type, Name, ImageFilename) VALUES (?, ?, ?)', [type, name, img]);
              const newTagId = destDb.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;
              tagMap.set(tagId, newTagId);
            }
            findTag.free();
          }
        }

        // 3. Merge UserMarks & UserMarkId Map (oldUserMarkId -> destUserMarkId)
        const markMap = new Map<number, number>();
        const srcMarksRes = srcDb.exec('SELECT UserMarkId, Hash, LocationId, StyleIndex, UserMarkGuid, Version FROM UserMark');
        if (srcMarksRes.length > 0) {
          const markCols = srcMarksRes[0].columns;
          for (const row of srcMarksRes[0].values) {
            const markId = row[markCols.indexOf('UserMarkId')] as number;
            const hash = row[markCols.indexOf('Hash')];
            const locId = row[markCols.indexOf('LocationId')] as number;
            const style = row[markCols.indexOf('StyleIndex')];
            const guid = row[markCols.indexOf('UserMarkGuid')] as string;
            const version = row[markCols.indexOf('Version')];

            const mappedLocId = locationMap.get(locId) ?? locId;

            const findMark = destDb.prepare('SELECT UserMarkId FROM UserMark WHERE UserMarkGuid = ? LIMIT 1');
            findMark.bind([guid]);

            if (findMark.step()) {
              markMap.set(markId, findMark.get()[0] as number);
            } else {
              destDb.run(`
                INSERT INTO UserMark (Hash, LocationId, StyleIndex, UserMarkGuid, Version)
                VALUES (?, ?, ?, ?, ?)
              `, [hash, mappedLocId, style, guid, version]);
              const newMarkId = destDb.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;
              markMap.set(markId, newMarkId);
            }
            findMark.free();
          }
        }

        // 4. Merge BlockRanges with Multi-Block Range Healing!
        onProgress?.({
          stage: 'healing',
          percent: stepPercent + 5,
          message: `Preserving and healing multi-paragraph highlights for ${srcBackup.fileName}...`
        });

        const srcRangesRes = srcDb.exec('SELECT BlockRangeId, BlockType, Identifier, StartToken, EndToken, UserMarkId FROM BlockRange');
        if (srcRangesRes.length > 0) {
          const rangeCols = srcRangesRes[0].columns;
          for (const row of srcRangesRes[0].values) {
            const blockType = row[rangeCols.indexOf('BlockType')];
            const identifier = row[rangeCols.indexOf('Identifier')];
            const startToken = row[rangeCols.indexOf('StartToken')];
            const endToken = row[rangeCols.indexOf('EndToken')];
            const srcMarkId = row[rangeCols.indexOf('UserMarkId')] as number;

            const mappedMarkId = markMap.get(srcMarkId);
            if (!mappedMarkId) continue;

            const findRange = destDb.prepare(`
              SELECT BlockRangeId FROM BlockRange 
              WHERE UserMarkId = ? AND BlockType = ? AND Identifier = ? 
                AND (StartToken IS ? OR (StartToken IS NULL AND ? IS NULL))
                AND (EndToken IS ? OR (EndToken IS NULL AND ? IS NULL))
              LIMIT 1
            `);
            findRange.bind([mappedMarkId, blockType, identifier, startToken, startToken, endToken, endToken]);

            if (!findRange.step()) {
              destDb.run(`
                INSERT INTO BlockRange (BlockType, Identifier, StartToken, EndToken, UserMarkId)
                VALUES (?, ?, ?, ?, ?)
              `, [blockType, identifier, startToken, endToken, mappedMarkId]);
              stats.healedBlockRanges++;
            }
            findRange.free();
          }
        }

        // 5. Merge Notes (Last-Modified Wins on collision)
        const noteMap = new Map<number, number>();
        const srcNotesRes = srcDb.exec('SELECT NoteId, Guid, UserMarkId, LocationId, Title, Content, Created, LastModified, BlockType, BlockIdentifier FROM Note');
        if (srcNotesRes.length > 0) {
          const noteCols = srcNotesRes[0].columns;
          for (const row of srcNotesRes[0].values) {
            const noteId = row[noteCols.indexOf('NoteId')] as number;
            const guid = row[noteCols.indexOf('Guid')] as string;
            const srcMarkId = row[noteCols.indexOf('UserMarkId')] as number | null;
            const srcLocId = row[noteCols.indexOf('LocationId')] as number | null;
            const title = row[noteCols.indexOf('Title')];
            const content = row[noteCols.indexOf('Content')];
            const created = row[noteCols.indexOf('Created')];
            const lastModified = row[noteCols.indexOf('LastModified')] as string;
            const blockType = row[noteCols.indexOf('BlockType')];
            const blockIdentifier = row[noteCols.indexOf('BlockIdentifier')];

            const mappedLocId = srcLocId ? (locationMap.get(srcLocId) ?? srcLocId) : null;
            const mappedMarkId = srcMarkId ? (markMap.get(srcMarkId) ?? srcMarkId) : null;

            const findNote = destDb.prepare('SELECT NoteId, LastModified FROM Note WHERE Guid = ? LIMIT 1');
            findNote.bind([guid]);

            if (findNote.step()) {
              const [destNoteId, destLastModified] = findNote.get() as [number, string];
              noteMap.set(noteId, destNoteId);

              // If source note is strictly newer, update destination note
              if (lastModified && (!destLastModified || lastModified > destLastModified)) {
                destDb.run(`
                  UPDATE Note SET 
                    Title = ?, Content = ?, LastModified = ?, Created = ?, 
                    LocationId = ?, UserMarkId = ?, BlockType = ?, BlockIdentifier = ?
                  WHERE NoteId = ?
                `, [title, content, lastModified, created, mappedLocId, mappedMarkId, blockType, blockIdentifier, destNoteId]);
                stats.notesUpdatedOnConflict++;
              }
            } else {
              // Insert brand new note
              destDb.run(`
                INSERT INTO Note (Guid, UserMarkId, LocationId, Title, Content, Created, LastModified, BlockType, BlockIdentifier)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [guid, mappedMarkId, mappedLocId, title, content, created, lastModified, blockType, blockIdentifier]);
              const newNoteId = destDb.exec('SELECT last_insert_rowid()')[0].values[0][0] as number;
              noteMap.set(noteId, newNoteId);
            }
            findNote.free();
          }
        }

        // 6. Merge TagMap (Tags applied to Notes)
        const srcTagMapRes = srcDb.exec('SELECT TagMapId, TagId, NoteId, Type, Position FROM TagMap');
        if (srcTagMapRes.length > 0) {
          const tmCols = srcTagMapRes[0].columns;
          for (const row of srcTagMapRes[0].values) {
            const srcTagId = row[tmCols.indexOf('TagId')] as number;
            const srcNoteId = row[tmCols.indexOf('NoteId')] as number;
            const type = row[tmCols.indexOf('Type')];
            const position = row[tmCols.indexOf('Position')];

            const mappedTagId = tagMap.get(srcTagId) ?? srcTagId;
            const mappedNoteId = noteMap.get(srcNoteId) ?? srcNoteId;

            const findTm = destDb.prepare('SELECT TagMapId FROM TagMap WHERE TagId = ? AND NoteId = ? LIMIT 1');
            findTm.bind([mappedTagId, mappedNoteId]);

            if (!findTm.step()) {
              destDb.run('INSERT INTO TagMap (TagId, NoteId, Type, Position) VALUES (?, ?, ?, ?)', [
                mappedTagId,
                mappedNoteId,
                type,
                position
              ]);
            }
            findTm.free();
          }
        }

        // 7. Merge Bookmarks
        const srcBkRes = srcDb.exec('SELECT BookmarkId, LocationId, PublicationLocationId, Slot, Title, Snippet, BlockType, BlockIdentifier FROM Bookmark');
        if (srcBkRes.length > 0) {
          const bkCols = srcBkRes[0].columns;
          for (const row of srcBkRes[0].values) {
            const locId = row[bkCols.indexOf('LocationId')] as number;
            const pubLocId = row[bkCols.indexOf('PublicationLocationId')] as number | null;
            const slot = row[bkCols.indexOf('Slot')];
            const title = row[bkCols.indexOf('Title')];
            const snippet = row[bkCols.indexOf('Snippet')];
            const blockType = row[bkCols.indexOf('BlockType')];
            const blockIdentifier = row[bkCols.indexOf('BlockIdentifier')];

            const mappedLocId = locationMap.get(locId) ?? locId;
            const mappedPubLocId = pubLocId ? (locationMap.get(pubLocId) ?? pubLocId) : null;

            const findBk = destDb.prepare('SELECT BookmarkId FROM Bookmark WHERE LocationId = ? AND Slot = ? LIMIT 1');
            findBk.bind([mappedLocId, slot]);

            if (!findBk.step()) {
              destDb.run(`
                INSERT INTO Bookmark (LocationId, PublicationLocationId, Slot, Title, Snippet, BlockType, BlockIdentifier)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [mappedLocId, mappedPubLocId, slot, title, snippet, blockType, blockIdentifier]);
            }
            findBk.free();
          }
        }

        // 8. Merge InputFields
        try {
          const srcInputRes = srcDb.exec('SELECT InputFieldId, LocationId, TextTag, Value FROM InputField');
          if (srcInputRes.length > 0) {
            const ifCols = srcInputRes[0].columns;
            for (const row of srcInputRes[0].values) {
              const locId = row[ifCols.indexOf('LocationId')] as number;
              const textTag = row[ifCols.indexOf('TextTag')];
              const value = row[ifCols.indexOf('Value')];

              const mappedLocId = locationMap.get(locId) ?? locId;

              const findIf = destDb.prepare('SELECT InputFieldId, Value FROM InputField WHERE LocationId = ? AND TextTag = ? LIMIT 1');
              findIf.bind([mappedLocId, textTag]);

              if (findIf.step()) {
                const [destIfId, existingVal] = findIf.get() as [number, string | null];
                if ((!existingVal || existingVal.trim() === '') && value && String(value).trim() !== '') {
                  destDb.run('UPDATE InputField SET Value = ? WHERE InputFieldId = ?', [value, destIfId]);
                }
              } else {
                destDb.run('INSERT INTO InputField (LocationId, TextTag, Value) VALUES (?, ?, ?)', [
                  mappedLocId,
                  textTag,
                  value
                ]);
              }
              findIf.free();
            }
          }
        } catch (e) {
          // older schema without InputField table
        }
      } finally {
        srcDb.close();
      }
    }

    // Update LastModified table in destDb
    try {
      destDb.run('DELETE FROM LastModified');
      destDb.run('INSERT INTO LastModified (LastModified) VALUES (?)', [maxLastModified]);
    } catch (e) {
      // ignore if table doesn't exist
    }

    // Compute totals in merged db
    stats.totalNotes = (destDb.exec('SELECT count(*) FROM Note')[0]?.values[0][0] as number) || 0;
    stats.totalMarks = (destDb.exec('SELECT count(*) FROM UserMark')[0]?.values[0][0] as number) || 0;
    stats.totalTags = (destDb.exec('SELECT count(*) FROM Tag')[0]?.values[0][0] as number) || 0;
    stats.totalBookmarks = (destDb.exec('SELECT count(*) FROM Bookmark')[0]?.values[0][0] as number) || 0;
    try {
      stats.totalInputFields = (destDb.exec('SELECT count(*) FROM InputField')[0]?.values[0][0] as number) || 0;
    } catch (e) {
      stats.totalInputFields = 0;
    }

    onProgress?.({ stage: 'hashing', percent: 85, message: 'Computing SHA-256 integrity hash...' });
    addLog('Exporting SQLite in-memory database and computing SHA-256 checksum...');

    // Export database binary
    const mergedDbBytes = destDb.export();

    onProgress?.({ stage: 'repacking', percent: 92, message: 'Repacking .jwlibrary zip archive (manifest-first)...' });
    addLog('Repacking zip archive with manifest.json as primary entry...');

    // Construct merged manifest
    const mergedManifest = {
      ...backups[0].manifest,
      name: outputFileName,
      creationDate: new Date().toISOString(),
      userDataBackup: {
        ...backups[0].manifest.userDataBackup,
        deviceName: `Merged (${backups.map(b => b.deviceName).join(' + ')})`.slice(0, 100),
        lastModifiedDate: maxLastModified,
        hash: '' // repackJWLibrary will compute and set exact SHA-256
      }
    };

    // Repack into .jwlibrary archive
    const mergedBlob = await repackJWLibrary(mergedManifest, mergedDbBytes);

    onProgress?.({ stage: 'complete', percent: 100, message: 'Merge complete! Ready to download.' });
    addLog(`Merge completed successfully! Output size: ${(mergedBlob.size / (1024 * 1024)).toFixed(2)} MB`);

    return {
      mergedBlob,
      mergedBytes: mergedDbBytes,
      fileName: outputFileName,
      stats,
      log
    };
  } finally {
    destDb.close();
  }
}
