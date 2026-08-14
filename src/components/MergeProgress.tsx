import React from 'react';
import { Loader2, CheckCircle2, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import type { MergeProgressState } from '../lib/types';

interface MergeProgressProps {
  progress: MergeProgressState;
  logs: string[];
}

export const MergeProgress: React.FC<MergeProgressProps> = ({ progress, logs }) => {
  const stages = [
    { key: 'reading', label: 'WASM SQLite Init' },
    { key: 'merging', label: 'Merging Databases' },
    { key: 'healing', label: 'Healing Highlights' },
    { key: 'hashing', label: 'SHA-256 Checksum' },
    { key: 'repacking', label: 'Manifest Repack' }
  ];

  return (
    <div className="rounded-2xl border border-theocratic-200 dark:border-theocratic-800 bg-white dark:bg-slate-900 p-6 shadow-xl shadow-theocratic-500/5 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-600 dark:text-theocratic-400 flex items-center justify-center">
            {progress.stage === 'complete' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              {progress.stage === 'complete' ? 'Merge Complete!' : 'Merging Backups...'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {progress.message}
            </p>
          </div>
        </div>
        <span className="font-bold font-mono text-lg text-theocratic-600 dark:text-theocratic-400">
          {progress.percent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
        <div 
          className="bg-gradient-to-r from-theocratic-500 to-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* Steps breakdown */}
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

      {/* Realtime Log Ticker */}
      {logs.length > 0 && (
        <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto space-y-1">
          {logs.map((line, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-theocratic-400 select-none">&gt;</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Executing in WebAssembly — zero bytes sent to external servers.</span>
      </div>
    </div>
  );
};
