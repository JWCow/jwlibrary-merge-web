import React, { useState } from 'react';
import { 
  FileText, 
  Highlighter, 
  Bookmark, 
  Tag, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Smartphone, 
  Tablet,
  Monitor,
  Laptop,
  Calendar, 
  HardDrive, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Search
} from 'lucide-react';
import type { BackupMetadata } from '../lib/types';
import { InfoTooltip } from './InfoTooltip';

interface BackupCardProps {
  backup: BackupMetadata;
  index: number;
  totalBackups: number;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  /** Opens this backup in the Backup Explorer without losing the loaded set. */
  onInspect?: (id: string) => void;
}

export const BackupCard: React.FC<BackupCardProps> = ({
  backup,
  index,
  totalBackups,
  onRemove,
  onMoveUp,
  onMoveDown,
  onInspect
}) => {
  const [expanded, setExpanded] = useState(false);
  const isPrimary = index === 0;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getDeviceDetails = (name: string, filename: string) => {
    const combined = `${name} ${filename}`.toLowerCase();
    if (combined.includes('ipad')) {
      return { icon: Tablet, label: 'iPad', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300' };
    }
    if (combined.includes('iphone') || combined.includes('ios')) {
      return { icon: Smartphone, label: 'iPhone', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300' };
    }
    if (combined.includes('mac') || combined.includes('macbook')) {
      return { icon: Laptop, label: 'Mac', color: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300' };
    }
    if (combined.includes('pc') || combined.includes('desktop') || combined.includes('icevube') || combined.includes('windows')) {
      return { icon: Monitor, label: 'Windows PC', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300' };
    }
    if (combined.includes('android') || combined.includes('samsung') || combined.includes('pixel')) {
      return { icon: Smartphone, label: 'Android', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300' };
    }
    return { icon: Smartphone, label: 'Device', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' };
  };

  const devInfo = getDeviceDetails(backup.deviceName, backup.fileName);
  const DeviceIcon = devInfo.icon;

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      isPrimary
        ? 'bg-white dark:bg-slate-900 border-theocratic-300 dark:border-theocratic-700/80 shadow-md shadow-theocratic-500/5'
        : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
    }`}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* File info */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isPrimary
                ? 'bg-theocratic-100 dark:bg-theocratic-950/80 text-theocratic-600 dark:text-theocratic-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              <DeviceIcon className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                  {backup.deviceName || 'JW Library Device'}
                </span>
                
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border border-current/20 ${devInfo.color}`}>
                  {devInfo.label}
                </span>

                {isPrimary ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-theocratic-100 dark:bg-theocratic-950/90 text-theocratic-700 dark:text-theocratic-300 border border-theocratic-200 dark:border-theocratic-800/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Base Template
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Source #{index + 1}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title={backup.fileName}>
                {backup.fileName}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 self-end sm:self-center">
            {totalBackups > 1 && (
              <>
                <button
                  onClick={() => onMoveUp(index)}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Move Up"
                  aria-label="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onMoveDown(index)}
                  disabled={index === totalBackups - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Move Down"
                  aria-label="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </>
            )}
            {onInspect && (
              <button
                onClick={() => onInspect(backup.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-theocratic-600 dark:hover:text-theocratic-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Inspect this backup in the Backup Explorer"
                aria-label="Inspect this backup"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onRemove(backup.id)}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
              title="Remove backup"
              aria-label="Remove backup"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Highlighter className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>Highlights</span>
                <InfoTooltip term="UserMark" />
              </div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {backup.counts.UserMark?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-theocratic-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>Notes</span>
                <InfoTooltip term="Note" />
              </div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {backup.counts.Note?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>Tags</span>
                <InfoTooltip term="Tag" />
              </div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {backup.counts.Tag?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>Bookmarks</span>
                <InfoTooltip term="Bookmark" />
              </div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {backup.counts.Bookmark?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Expand/Collapse extra metadata */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(backup.lastModifiedDate)}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              {formatBytes(backup.fileSize)}
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 font-medium text-theocratic-600 dark:text-theocratic-400 hover:underline"
          >
            {expanded ? 'Less info' : 'More info'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 text-xs font-mono text-slate-600 dark:text-slate-300 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-semibold">
                Schema Version
                <InfoTooltip term="Schema Version" />
              </span>
              <span>v{backup.schemaVersion}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-semibold">
                Block Ranges
                <InfoTooltip term="BlockRange" />
              </span>
              <span>{backup.counts.BlockRange?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-semibold">
                Tag Mappings
                <InfoTooltip term="TagMap" />
              </span>
              <span>{backup.counts.TagMap?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-semibold">
                Input Fields
                <InfoTooltip term="InputField" />
              </span>
              <span>{backup.counts.InputField?.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-semibold">
                Locations
                <InfoTooltip term="Location" />
              </span>
              <span>{backup.counts.Location?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
              <span className="flex items-center gap-1 font-semibold">
                Manifest Hash
                <InfoTooltip term="Manifest Hash" />
              </span>
              <span className="truncate max-w-[160px] sm:max-w-[220px]" title={backup.manifest.userDataBackup?.hash}>
                {backup.manifest.userDataBackup?.hash}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

