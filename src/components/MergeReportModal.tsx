import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, 
  CheckCircle2, 
  Highlighter, 
  FileText, 
  Tag, 
  Bookmark, 
  Sparkles, 
  RotateCcw, 
  HelpCircle,
  Search,
  Terminal,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import type { MergeResult } from '../lib/merge';
import type { BackupMetadata } from '../lib/types';

interface MergeReportModalProps {
  result: MergeResult;
  backups: BackupMetadata[];
  onReset: () => void;
}

export const MergeReportModal: React.FC<MergeReportModalProps> = ({
  result,
  backups,
  onReset
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const url = URL.createObjectURL(result.mergedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLogs = () => {
    if (!result.log || result.log.length === 0) return;
    navigator.clipboard.writeText(result.log.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    if (!result.log || result.log.length === 0) return;
    const blob = new Blob([result.log.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.fileName.replace(/\.jwlibrary$/i, '')}-log.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Merged Backup Ready!
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Successfully unified <strong>{backups.length} backups</strong> with zero data loss. All multi-paragraph highlights healed and SHA-256 integrity verified.
        </p>
      </div>

      {/* Main Download Button & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={handleDownload}
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-theocratic-600 via-theocratic-500 to-emerald-600 hover:from-theocratic-700 hover:to-emerald-700 text-white font-bold text-base shadow-xl shadow-theocratic-500/25 flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Download className="w-5 h-5" />
          <span>Download {result.fileName}</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
            {formatMB(result.mergedBlob.size)} MB
          </span>
        </button>

        <Link
          to="/inspect"
          className="w-full sm:w-auto px-5 py-4 rounded-xl border border-theocratic-200 dark:border-theocratic-800 bg-theocratic-50/50 dark:bg-theocratic-950/40 hover:bg-theocratic-100 dark:hover:bg-theocratic-900/60 text-theocratic-700 dark:text-theocratic-300 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Inspect Database</span>
        </Link>

        <button
          onClick={onReset}
          className="w-full sm:w-auto px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Merge More Files</span>
        </button>
      </div>

      {/* Unified Metrics Grid */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
          Merged Database Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Highlighter className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Highlights</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {result.stats.totalMarks.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-600 dark:text-theocratic-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Notes</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {result.stats.totalNotes.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tags</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {result.stats.totalTags.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Bookmarks</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {result.stats.totalBookmarks.toLocaleString()}
              </div>
            </div>
          </div>

        </div>

        {/* Highlights Healed and Conflicts Resolved */}
        {(result.stats.healedBlockRanges > 0 || result.stats.notesUpdatedOnConflict > 0 || result.stats.locationsAdded > 0) && (
          <div className="mt-3 p-3 rounded-xl bg-theocratic-50 dark:bg-theocratic-950/60 border border-theocratic-200 dark:border-theocratic-800 text-xs text-theocratic-800 dark:text-theocratic-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-theocratic-600 flex-shrink-0" />
            <span>
              <strong>Smart Auto-Repair:</strong> Restored {result.stats.healedBlockRanges} multi-block highlight ranges, mapped {result.stats.locationsAdded} new biblical/publication locations, and updated {result.stats.notesUpdatedOnConflict} newer note versions.
            </span>
          </div>
        )}
      </div>

      {/* Verbose Logs Drawer */}
      {result.log && result.log.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-theocratic-500" />
              <span>View Detailed Merge Audit Log ({result.log.length} events)</span>
              {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showLogs && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogs}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownloadLogs}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download .txt</span>
                </button>
              </div>
            )}
          </div>

          {showLogs && (
            <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 max-h-56 overflow-y-auto space-y-1 border border-slate-800">
              {result.log.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-theocratic-400 select-none">&gt;</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* How to restore into JW Library */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2">
        <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
          <HelpCircle className="w-4 h-4 text-theocratic-500" />
          How to restore your merged backup into JW Library:
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
          <li>Open <strong>JW Library</strong> on your device (iPad, iPhone, Android, or PC).</li>
          <li>Tap the top menu <strong>(☰)</strong> &rarr; <strong>Personal Study</strong> or <strong>Favorites</strong> &rarr; <strong>Backup and Restore</strong>.</li>
          <li>Select <strong>Restore Backup</strong> and choose your downloaded <code className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">{result.fileName}</code> file.</li>
          <li>JW Library will verify the SHA-256 hash and reload with all your combined notes and highlights!</li>
        </ol>
      </div>

    </div>
  );
};
