import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck, 
  Zap, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Download, 
  RotateCcw,
  Terminal
} from 'lucide-react';
import type { MergeProgressState } from '../lib/types';

interface MergeProgressProps {
  progress: MergeProgressState;
  logs: string[];
  onRetry?: () => void;
}

export const MergeProgress: React.FC<MergeProgressProps> = ({ progress, logs, onRetry }) => {
  const [showLogs, setShowLogs] = useState(true);
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const stages = [
    { key: 'reading', label: 'WASM SQLite Init' },
    { key: 'merging', label: 'Merging Databases' },
    { key: 'healing', label: 'Healing Highlights' },
    { key: 'hashing', label: 'SHA-256 Checksum' },
    { key: 'repacking', label: 'Manifest Repack' }
  ];

  const isError = progress.stage === 'error' || !!progress.error;

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopyLogs = () => {
    if (logs.length === 0) return;
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    if (logs.length === 0) return;
    const blob = new Blob([logs.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jwlibrary-merge-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rounded-2xl border ${
      isError 
        ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/20' 
        : 'border-theocratic-200 dark:border-theocratic-800 bg-white dark:bg-slate-900'
    } p-6 shadow-xl shadow-theocratic-500/5 space-y-6 animate-in fade-in duration-200`}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            isError
              ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
              : progress.stage === 'complete'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
              : 'bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-600 dark:text-theocratic-400'
          }`}>
            {isError ? (
              <AlertCircle className="w-6 h-6 text-rose-500" />
            ) : progress.stage === 'complete' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              {isError ? 'Merge Encountered an Error' : progress.stage === 'complete' ? 'Merge Complete!' : 'Merging Backups...'}
            </h3>
            <p className={`text-xs sm:text-sm ${isError ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
              {progress.message || (isError ? 'An unexpected error occurred during database merging.' : 'Processing...')}
            </p>
          </div>
        </div>
        
        {!isError && (
          <span className="font-bold font-mono text-lg text-theocratic-600 dark:text-theocratic-400">
            {progress.percent}%
          </span>
        )}
      </div>

      {/* Progress Bar (Only during active merge) */}
      {!isError && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <div 
            className="bg-gradient-to-r from-theocratic-500 to-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}

      {/* Steps breakdown (Only during active merge) */}
      {!isError && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {stages.map((st) => (
            <div
              key={st.key}
              className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-colors ${
                progress.stage === st.key
                  ? 'bg-theocratic-50 dark:bg-theocratic-950/80 border-theocratic-400 dark:border-theocratic-600 text-theocratic-700 dark:text-theocratic-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {progress.stage === st.key ? (
                <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 opacity-50" />
              )}
              <span>{st.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error Callout if failed */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3">
          <div className="text-xs text-rose-700 dark:text-rose-300">
            <strong>Error details:</strong> {progress.error || progress.message}
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Back to Backups List / Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Verbose Terminal Logs Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-theocratic-500" />
            <span>Verbose Log Console ({logs.length} events)</span>
            {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {logs.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLogs}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Copy all logs to clipboard"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Logs'}</span>
              </button>

              <button
                onClick={handleDownloadLogs}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Download log file (.txt)"
              >
                <Download className="w-3 h-3" />
                <span>Save Log</span>
              </button>
            </div>
          )}
        </div>

        {showLogs && (
          <div 
            ref={logContainerRef}
            className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 max-h-64 overflow-y-auto space-y-1 border border-slate-800 shadow-inner"
          >
            {logs.length === 0 ? (
              <div className="text-slate-500 italic">Waiting for merge events...</div>
            ) : (
              logs.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-theocratic-400 select-none">&gt;</span>
                  <span className={line.includes('ERROR') || line.includes('Failed') ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                    {line}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Executing in WebAssembly — zero bytes sent to external servers.</span>
      </div>
    </div>
  );
};
