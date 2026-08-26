import React, { useMemo, useState } from 'react';
import type { BackupMetadata, LocationDetail, LocationCategoryType } from '../lib/types';
import { filterAndSortLocations } from '../lib/locations';
import { exportSubset, createSubsetBackup, type SubsetSelection, type SubsetCounts } from '../lib/subset';
import {
  Search,
  Share2,
  Download,
  Layers,
  Highlighter,
  MessageSquare,
  Bookmark,
  PenLine,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface SelectiveExportViewProps {
  backup: BackupMetadata;
  locations: LocationDetail[];
  loading?: boolean;
  /** Adds the freshly built partial backup to the shared merge queue. */
  onSubsetCreated: (subset: BackupMetadata) => void;
}

type KindKey = 'includeNotes' | 'includeHighlights' | 'includeBookmarks' | 'includeInputFields';

const KINDS: Array<{ key: KindKey; label: string; icon: React.ElementType }> = [
  { key: 'includeNotes', label: 'Notes', icon: MessageSquare },
  { key: 'includeHighlights', label: 'Highlights', icon: Highlighter },
  { key: 'includeBookmarks', label: 'Bookmarks', icon: Bookmark },
  { key: 'includeInputFields', label: 'Study answers', icon: PenLine }
];

export const SelectiveExportView: React.FC<SelectiveExportViewProps> = ({
  backup,
  locations,
  loading = false,
  onSubsetCreated
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | LocationCategoryType | 'annotated'>('annotated');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [kinds, setKinds] = useState<Record<KindKey, boolean>>({
    includeNotes: true,
    includeHighlights: true,
    includeBookmarks: true,
    includeInputFields: true
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string; counts: SubsetCounts } | null>(null);

  const filtered = useMemo(
    () => filterAndSortLocations(locations, searchQuery, categoryFilter, 'all', 'density_desc'),
    [locations, searchQuery, categoryFilter]
  );
  const visible = filtered.slice(0, 200);

  const toggleLocation = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setResult(null);
  };

  const selectAllVisible = () => {
    setSelectedIds(prev => new Set([...prev, ...visible.map(l => l.locationId)]));
    setResult(null);
  };

  const selection: SubsetSelection = { locationIds: Array.from(selectedIds), ...kinds };
  const noKind = KINDS.every(k => !kinds[k.key]);
  const canExport = selectedIds.size > 0 && !noKind && !busy;

  const run = async (mode: 'download' | 'merge') => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      if (mode === 'download') {
        const subset = await exportSubset(backup, selection);
        const url = URL.createObjectURL(subset.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = subset.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setResult({ message: `Downloaded ${subset.fileName}`, counts: subset.counts });
      } else {
        const subsetBackup = await createSubsetBackup(backup, selection);
        onSubsetCreated(subsetBackup);
        setResult({
          message: `Added ${subsetBackup.fileName} to the merge queue`,
          counts: {
            locations: subsetBackup.counts.Location || 0,
            notes: subsetBackup.counts.Note || 0,
            highlights: subsetBackup.counts.UserMark || 0,
            blockRanges: subsetBackup.counts.BlockRange || 0,
            bookmarks: subsetBackup.counts.Bookmark || 0,
            inputFields: subsetBackup.counts.InputField || 0,
            tags: subsetBackup.counts.Tag || 0,
            tagMaps: subsetBackup.counts.TagMap || 0
          }
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build the partial backup.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="inline-block animate-spin text-theocratic-600 dark:text-theocratic-400">
          <Layers className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Loading locations for selective export...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">

      <div className="p-5 rounded-2xl bg-gradient-to-br from-theocratic-50 via-white to-slate-50 dark:from-slate-900 dark:via-theocratic-950/20 dark:to-slate-900 border border-theocratic-200/80 dark:border-theocratic-900/60 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-theocratic-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Share only part of this backup
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Pick the publications, Bible chapters or Watchtower issues you want to share. The result is a
              real <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.jwlibrary</code> file
              containing <strong>only</strong> those annotations, so the person you send it to can merge it into their
              own backup without receiving anything else. Everything stays in your browser.
            </p>
          </div>
        </div>
      </div>

      {/* Content kind toggles */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">What to include</h4>
        <div className="flex flex-wrap gap-2">
          {KINDS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setKinds(prev => ({ ...prev, [key]: !prev[key] })); setResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                kinds[key]
                  ? 'bg-theocratic-600 border-theocratic-600 text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Location picker */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search a book, brochure or Watchtower issue..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-theocratic-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="annotated">With annotations</option>
            <option value="all">All locations</option>
            <option value="bible">Bible</option>
            <option value="publication">Publications</option>
            <option value="media">Media</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {selectedIds.size} selected of {filtered.length} shown
            {filtered.length > visible.length && ` (listing first ${visible.length} — refine your search)`}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={selectAllVisible} className="font-semibold text-theocratic-600 dark:text-theocratic-400 hover:underline">
              Select listed
            </button>
            <button
              onClick={() => { setSelectedIds(new Set()); setResult(null); }}
              className="font-semibold text-slate-500 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
          {visible.length === 0 && (
            <p className="p-6 text-center text-xs text-slate-500">No locations match this search.</p>
          )}
          {visible.map(loc => (
            <label
              key={loc.locationId}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(loc.locationId)}
                onChange={() => toggleLocation(loc.locationId)}
                className="w-4 h-4 accent-theocratic-600 flex-shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {loc.resolvedTitle}
                </span>
                <span className="block text-[11px] text-slate-500 font-mono">
                  {loc.categoryLabel} · {loc.highlightsCount} highlights · {loc.notesCount} notes · {loc.bookmarksCount} bookmarks
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {noKind && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Select at least one kind of content to include.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>
            {result.message} — {result.counts.notes} notes, {result.counts.highlights} highlights,{' '}
            {result.counts.bookmarks} bookmarks, {result.counts.inputFields} study answers across{' '}
            {result.counts.locations} location(s).
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => run('download')}
          disabled={!canExport}
          className="px-4 py-2.5 rounded-xl bg-theocratic-600 hover:bg-theocratic-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{busy ? 'Building...' : 'Download partial backup'}</span>
        </button>
        <button
          onClick={() => run('merge')}
          disabled={!canExport}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1.5 transition-colors"
          title="Merge only this slice into the other loaded backups"
        >
          <Layers className="w-4 h-4" />
          <span>Add selection to merge queue</span>
        </button>
      </div>
    </div>
  );
};
