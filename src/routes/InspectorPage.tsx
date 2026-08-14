import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { extractNoteDetails, extractBookmarkDetails } from '../lib/inspect';
import { repackJWLibrary } from '../lib/zip';
import type { BackupMetadata, NoteDetail, BookmarkDetail } from '../lib/types';
import { 
  Search, 
  FileText, 
  Bookmark, 
  Database, 
  Wrench, 
  CheckCircle2
} from 'lucide-react';

export const InspectorPage: React.FC = () => {
  const [backup, setBackup] = useState<BackupMetadata | null>(null);
  const [notes, setNotes] = useState<NoteDetail[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks' | 'tables'>('notes');
  const [repairSuccess, setRepairSuccess] = useState(false);

  const handleFileLoaded = async (loaded: BackupMetadata[]) => {
    if (loaded.length === 0) return;
    const b = loaded[0];
    setBackup(b);
    setRepairSuccess(false);

    try {
      const extractedNotes = await extractNoteDetails(b.userDataDbBytes, 200);
      setNotes(extractedNotes);

      const extractedBookmarks = await extractBookmarkDetails(b.userDataDbBytes);
      setBookmarks(extractedBookmarks);
    } catch (e) {
      console.error('Failed to extract backup details:', e);
    }
  };

  const handleRepairAndDownload = async () => {
    if (!backup) return;
    try {
      const blob = await repackJWLibrary(backup.manifest, backup.userDataDbBytes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repaired-${backup.fileName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setRepairSuccess(true);
    } catch (e) {
      console.error('Repair failed:', e);
    }
  };

  const filteredNotes = notes.filter(n => 
    (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (n.locationTitle && n.locationTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Backup Explorer & Inspector
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Inspect, search notes, view bookmarks, and verify database integrity for any single <code className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.jwlibrary</code> file.
        </p>
      </div>

      {!backup ? (
        <DropZone onFilesLoaded={handleFileLoaded} />
      ) : (
        <div className="space-y-6">
          
          {/* Top Backup Overview Header */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-600 dark:text-theocratic-400 flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate">
                    {backup.fileName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-theocratic-50 dark:bg-theocratic-950 text-theocratic-700 dark:text-theocratic-300 border border-theocratic-200 dark:border-theocratic-800">
                    {backup.deviceName}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-mono">
                  <span>Modified: {new Date(backup.lastModifiedDate).toLocaleDateString()}</span>
                  <span>Schema: v{backup.schemaVersion}</span>
                  <span>Hash: {backup.manifest.userDataBackup?.hash.slice(0, 12)}...</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleRepairAndDownload}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                title="Recalculate SHA-256 hash and fix ZIP manifest ordering"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Fix & Rehash</span>
              </button>
              <button
                onClick={() => { setBackup(null); setNotes([]); setBookmarks([]); }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                Change File
              </button>
            </div>
          </div>

          {repairSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Manifest hash and ZIP structure verified & downloaded! Ready for JW Library restore.</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'notes'
                  ? 'bg-theocratic-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes ({backup.counts.Note || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'bookmarks'
                  ? 'bg-theocratic-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Bookmarks ({backup.counts.Bookmark || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'tables'
                  ? 'bg-theocratic-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Database Tables</span>
            </button>
          </div>

          {/* Notes Tab View */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes by title, content, or publication..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-theocratic-500"
                />
              </div>

              <div className="space-y-3">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No notes match your query.
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <div
                      key={note.guid || note.noteId}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {note.title || 'Untitled Note'}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(note.lastModified).toLocaleDateString()}
                        </span>
                      </div>
                      {note.locationTitle && (
                        <div className="text-xs text-theocratic-600 dark:text-theocratic-400 font-medium">
                          {note.locationTitle}
                        </div>
                      )}
                      {note.content && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-line">
                          {note.content}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Bookmarks Tab View */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-3">
              {bookmarks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No bookmarks found in this backup.
                </div>
              ) : (
                bookmarks.map((bm) => (
                  <div
                    key={bm.bookmarkId}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                        #{bm.slot}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {bm.title || 'Bookmark Slot ' + bm.slot}
                        </h4>
                        {bm.snippet && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {bm.snippet}
                          </p>
                        )}
                      </div>
                    </div>
                    {bm.locationTitle && (
                      <span className="text-xs font-semibold text-theocratic-600 dark:text-theocratic-400">
                        {bm.locationTitle}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Raw Tables Count View */}
          {activeTab === 'tables' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-4">
                SQLite Database Table Record Counts
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                {Object.entries(backup.counts).map(([tbl, count]) => (
                  <div key={tbl} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{tbl}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{count?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
