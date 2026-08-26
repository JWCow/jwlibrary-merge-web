import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DropZone } from '../components/DropZone';
import { extractNoteDetails, extractBookmarkDetails, extractLocationDetails } from '../lib/inspect';
import { extractBackupAnalytics } from '../lib/analytics';
import { repackJWLibrary } from '../lib/zip';
import type { BackupMetadata, NoteDetail, BookmarkDetail, BackupAnalytics, LocationDetail } from '../lib/types';
import { useBackupStore } from '../lib/backupStore';
import { 
  FileText, 
  Bookmark, 
  Database, 
  Wrench, 
  CheckCircle2,
  BarChart3,
  MapPin,
  BookOpen,
  Layers,
  Share2
} from 'lucide-react';
import { InfoTooltip } from '../components/InfoTooltip';
import { StudyAnalyticsView } from '../components/StudyAnalyticsView';
import { LocationExplorerView } from '../components/LocationExplorerView';
import { NotesExplorerView } from '../components/NotesExplorerView';
import { BookmarksExplorerView } from '../components/BookmarksExplorerView';
import { SchemaFaqDrawer } from '../components/SchemaFaqDrawer';
import { SelectiveExportView } from '../components/SelectiveExportView';

export const InspectorPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    backups,
    selected: backup,
    addBackups,
    promoteBackup,
    selectBackup,
    getInspection,
    setInspection
  } = useBackupStore();

  const [analytics, setAnalytics] = useState<BackupAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [locations, setLocations] = useState<LocationDetail[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [notes, setNotes] = useState<NoteDetail[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkDetail[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'locations' | 'notes' | 'bookmarks' | 'share' | 'tables'>('overview');
  const [repairSuccess, setRepairSuccess] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [faqTopic, setFaqTopic] = useState<string | undefined>(undefined);
  const [showDropZone, setShowDropZone] = useState(false);

  // Extract (or restore from cache) the derived data for whichever backup is selected.
  // The cache is what makes hopping between the Merger and the Inspector free.
  useEffect(() => {
    if (!backup) return;
    let cancelled = false;

    setRepairSuccess(false);
    setShowDropZone(false);

    const cached = getInspection(backup.id);
    if (cached) {
      setNotes(cached.notes);
      setBookmarks(cached.bookmarks);
      setAnalytics(cached.analytics);
      setLocations(cached.locations);
      setLoadingAnalytics(false);
      setLoadingLocations(false);
      return;
    }

    setLoadingAnalytics(true);
    setLoadingLocations(true);

    (async () => {
      try {
        const [extractedNotes, extractedBookmarks, extractedAnalytics, extractedLocations] = await Promise.all([
          extractNoteDetails(backup.userDataDbBytes),
          extractBookmarkDetails(backup.userDataDbBytes),
          extractBackupAnalytics(backup.userDataDbBytes),
          extractLocationDetails(backup.userDataDbBytes)
        ]);
        if (cancelled) return;
        setNotes(extractedNotes);
        setBookmarks(extractedBookmarks);
        setAnalytics(extractedAnalytics);
        setLocations(extractedLocations);
        setInspection(backup.id, {
          notes: extractedNotes,
          bookmarks: extractedBookmarks,
          analytics: extractedAnalytics,
          locations: extractedLocations
        });
      } catch (e) {
        console.error('Failed to extract backup details:', e);
      } finally {
        if (!cancelled) {
          setLoadingAnalytics(false);
          setLoadingLocations(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [backup, getInspection, setInspection]);

  /**
   * A file dropped here joins the shared set and becomes the merge base template,
   * so the Merger tab picks up exactly what is being inspected.
   */
  const handleFileLoaded = (loaded: BackupMetadata[]) => {
    if (loaded.length === 0) return;
    addBackups(loaded.slice(1));
    promoteBackup(loaded[0]);
    setActiveTab('overview');
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

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 w-full max-w-full overflow-hidden">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Backup Explorer & Inspector
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Inspect, explore study analytics, search notes, view bookmarks, and verify database integrity for any single <code className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.jwlibrary</code> file.
          </p>
        </div>

        <button
          onClick={() => { setFaqTopic(undefined); setIsFaqOpen(true); }}
          className="px-4 py-2.5 rounded-xl border border-theocratic-200 dark:border-theocratic-800 bg-theocratic-50 dark:bg-theocratic-950/60 hover:bg-theocratic-100 dark:hover:bg-theocratic-900 text-theocratic-700 dark:text-theocratic-300 font-semibold text-xs flex items-center gap-2 shadow-sm transition-colors flex-shrink-0 self-start sm:self-center"
          title="Open Database Schema & Merge Engine Guide"
        >
          <BookOpen className="w-4 h-4 text-theocratic-600 dark:text-theocratic-400" />
          <span>Database Guide & FAQ</span>
        </button>
      </div>

      {!backup || showDropZone ? (
        <div className="space-y-3">
          <DropZone onFilesLoaded={handleFileLoaded} />
          {backup && (
            <button
              onClick={() => setShowDropZone(false)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline font-medium"
            >
              Cancel and keep inspecting {backup.fileName}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top Backup Overview Header */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-600 dark:text-theocratic-400 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 truncate max-w-full">
                    {backup.fileName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-theocratic-50 dark:bg-theocratic-950 text-theocratic-700 dark:text-theocratic-300 border border-theocratic-200 dark:border-theocratic-800 flex-shrink-0">
                    {backup.deviceName}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 mt-1 flex-wrap font-mono">
                  <span>Modified: {new Date(backup.lastModifiedDate).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    Schema: v{backup.schemaVersion}
                    <InfoTooltip term="Schema Version" />
                  </span>
                  <span className="flex items-center gap-1">
                    Hash: {backup.manifest.userDataBackup?.hash.slice(0, 12)}...
                    <InfoTooltip term="Manifest Hash" />
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
              <button
                onClick={handleRepairAndDownload}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                title="Recalculate SHA-256 hash and fix ZIP manifest ordering"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Fix & Rehash</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Go to the Merger with this file kept as the base template"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Use in Merger</span>
              </button>
              <button
                onClick={() => setShowDropZone(true)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                Add File
              </button>
            </div>
          </div>

          {backups.length > 1 && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
                Loaded backups
              </span>
              {backups.map((b, idx) => (
                <button
                  key={b.id}
                  onClick={() => selectBackup(b.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors max-w-[16rem] truncate ${
                    b.id === backup.id
                      ? 'bg-theocratic-600 border-theocratic-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={b.fileName}
                >
                  {idx === 0 ? 'Base: ' : `#${idx + 1}: `}{b.fileName}
                </button>
              ))}
            </div>
          )}

          {repairSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Manifest hash and ZIP structure verified & downloaded! Ready for JW Library restore.</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-theocratic-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Study Overview & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 ${
                activeTab === 'locations'
                  ? 'bg-theocratic-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Locations ({backup.counts.Location || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 ${
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
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 ${
                activeTab === 'bookmarks'
                  ? 'bg-theocratic-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Bookmarks ({backup.counts.Bookmark || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('share')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 ${
                activeTab === 'share'
                  ? 'bg-theocratic-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Selective Export</span>
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 ${
                activeTab === 'tables'
                  ? 'bg-theocratic-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Database Tables</span>
            </button>
          </div>

          {/* 1. Overview & Analytics Tab View */}
          {activeTab === 'overview' && (
            <StudyAnalyticsView analytics={analytics} loading={loadingAnalytics} />
          )}

          {/* 2. Locations Explorer Tab View */}
          {activeTab === 'locations' && (
            <LocationExplorerView locations={locations} loading={loadingLocations} />
          )}

          {/* 3. Notes Tab View */}
          {activeTab === 'notes' && (
            <NotesExplorerView notes={notes} loading={loadingAnalytics} />
          )}

          {/* 4. Bookmarks Tab View */}
          {activeTab === 'bookmarks' && (
            <BookmarksExplorerView bookmarks={bookmarks} loading={loadingAnalytics} />
          )}

          {/* 5. Selective Export (partial backup) View */}
          {activeTab === 'share' && (
            <SelectiveExportView
              backup={backup}
              locations={locations}
              loading={loadingLocations}
              onSubsetCreated={(subset) => { addBackups([subset]); }}
            />
          )}

          {/* 6. Raw Tables Count View */}
          {activeTab === 'tables' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  SQLite Database Table Record Counts
                </h3>
                <button
                  onClick={() => { setFaqTopic('sqlite-tables-overview'); setIsFaqOpen(true); }}
                  className="text-xs text-theocratic-600 dark:text-theocratic-400 hover:underline flex items-center gap-1 font-semibold self-start sm:self-auto"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Schema Table Dictionary & Guide</span>
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                {Object.entries(backup.counts).map(([tbl, count]) => (
                  <div key={tbl} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                      <span>{tbl}</span>
                      <InfoTooltip term={tbl} />
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{count?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Database Schema & Merge Engine FAQ Drawer */}
      <SchemaFaqDrawer
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
        initialTopic={faqTopic}
      />

    </div>
  );
};
