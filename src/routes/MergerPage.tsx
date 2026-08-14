import { useState } from 'react';
import { DropZone } from '../components/DropZone';
import { BackupCard } from '../components/BackupCard';
import { MergeProgress } from '../components/MergeProgress';
import { MergeReportModal } from '../components/MergeReportModal';
import { mergeBackups, type MergeResult } from '../lib/merge';
import type { BackupMetadata, MergeProgressState } from '../lib/types';
import { 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Trash2, 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Zap, 
  Info 
} from 'lucide-react';

export const MergerPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [outputFileName, setOutputFileName] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return `jwlibrary-merged-${today}.jwlibrary`;
  });
  const [progress, setProgress] = useState<MergeProgressState>({
    stage: 'idle',
    percent: 0,
    message: ''
  });
  const [mergeLogs, setMergeLogs] = useState<string[]>([]);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const handleFilesLoaded = (newBackups: BackupMetadata[]) => {
    setBackups(prev => {
      // Prevent duplicates with same name and size
      const existing = new Set(prev.map(b => `${b.fileName}-${b.fileSize}`));
      const filtered = newBackups.filter(b => !existing.has(`${b.fileName}-${b.fileSize}`));
      return [...prev, ...filtered];
    });
    setResult(null);
  };

  const handleRemoveBackup = (id: string) => {
    setBackups(prev => prev.filter(b => b.id !== id));
    setResult(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setBackups(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= backups.length - 1) return;
    setBackups(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleClearAll = () => {
    setBackups([]);
    setResult(null);
    setProgress({ stage: 'idle', percent: 0, message: '' });
  };

  const handleStartMerge = async () => {
    if (backups.length < 2) return;
    setIsMerging(true);
    setMergeLogs([]);
    setResult(null);

    try {
      const finalFileName = outputFileName.endsWith('.jwlibrary') 
        ? outputFileName 
        : `${outputFileName}.jwlibrary`;

      const res = await mergeBackups(backups, finalFileName, (prog) => {
        setProgress(prog);
      });

      setResult(res);
      setMergeLogs(res.log);
    } catch (err: any) {
      console.error('Merge failed:', err);
      setProgress({
        stage: 'error',
        percent: 0,
        message: 'Merge failed: ' + (err.message || 'Unknown error'),
        error: err.message
      });
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theocratic-100 dark:bg-theocratic-950/80 text-theocratic-700 dark:text-theocratic-300 text-xs font-semibold border border-theocratic-200 dark:border-theocratic-800/80 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> Client-Side WebAssembly SQLite Merger
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Merge JW Library Backups
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Combine notes, highlights, bookmarks, and tags from your phone, tablet, and PC into one single, unified <code className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.jwlibrary</code> file.
        </p>
      </div>

      {/* Privacy Guarantee Pill */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>
            <strong>100% Private & In-Browser:</strong> Your backups are merged directly on your device using WebAssembly. No files are uploaded to any server.
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg">
          <Lock className="w-3 h-3" /> Zero Server Transmission
        </div>
      </div>

      {/* Main Workflow Area */}
      {result ? (
        <div className="space-y-6">
          <MergeReportModal
            result={result}
            backups={backups}
            onReset={() => {
              setResult(null);
              setProgress({ stage: 'idle', percent: 0, message: '' });
            }}
          />
          <div className="pt-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 text-center">
              Want to merge another set of backups?
            </h3>
            <DropZone onFilesLoaded={handleFilesLoaded} isLoading={isMerging} />
          </div>
        </div>
      ) : isMerging ? (
        <MergeProgress progress={progress} logs={mergeLogs} />
      ) : (
        <div className="space-y-6">
          
          {/* Dropzone */}
          <DropZone onFilesLoaded={handleFilesLoaded} isLoading={isMerging} />

          {/* Uploaded Backups List */}
          {backups.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    Selected Backups ({backups.length})
                  </h2>
                  <span className="text-xs text-slate-500">
                    (Top file is used as the base template)
                  </span>
                </div>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear all
                </button>
              </div>

              <div className="space-y-3">
                {backups.map((backup, idx) => (
                  <BackupCard
                    key={backup.id}
                    backup={backup}
                    index={idx}
                    totalBackups={backups.length}
                    onRemove={handleRemoveBackup}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))}
              </div>

              {/* Output Name and Action Toolbar */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Merged Output Filename
                  </label>
                  <input
                    type="text"
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-theocratic-500"
                    placeholder="merged-backup.jwlibrary"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-theocratic-500" />
                    <span>Auto-heals multi-paragraph highlight spans & solves note timestamp collisions.</span>
                  </div>

                  <button
                    onClick={handleStartMerge}
                    disabled={backups.length < 2 || isMerging}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-theocratic-600 to-theocratic-500 hover:from-theocratic-700 hover:to-theocratic-600 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm shadow-lg shadow-theocratic-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Merge {backups.length} Backups</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* 3 Core Features Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-600 dark:text-theocratic-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">WebAssembly SQLite</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Executes native SQLite union queries directly inside your browser memory for sub-second merges.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Highlight Span Healing</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Avoids third-party truncation bugs by preserving all BlockRanges spanning multiple paragraphs or verses.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">SHA-256 Validation</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generates precise cryptographic hash and strict ZIP manifest structure required by the JW Library app.
          </p>
        </div>
      </div>

    </div>
  );
};
