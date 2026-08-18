import React, { useState, useMemo } from 'react';
import type { LocationDetail, LocationCategoryType } from '../lib/types';
import { getLocationSummaryStats, filterAndSortLocations } from '../lib/locations';
import { InfoTooltip } from './InfoTooltip';
import { 
  MapPin, 
  BookOpen, 
  FileText, 
  Music, 
  Layers, 
  Search, 
  Highlighter, 
  MessageSquare, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  X,
  Compass,
  CheckCircle2,
  Globe,
  FolderOpen
} from 'lucide-react';


interface LocationExplorerViewProps {
  locations: LocationDetail[];
  loading?: boolean;
}

export const LocationExplorerView: React.FC<LocationExplorerViewProps> = ({ 
  locations, 
  loading = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | LocationCategoryType | 'annotated'>('all');
  const [languageFilter, setLanguageFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<
    'density_desc' | 'highlights_desc' | 'notes_desc' | 'title_asc' | 'title_desc' | 'id_asc' | 'id_desc' | 'modified_desc'
  >('density_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [expandedLocationId, setExpandedLocationId] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);

  // Compute overall summary statistics
  const summary = useMemo(() => getLocationSummaryStats(locations), [locations]);

  // Extract unique languages available in this dataset
  const uniqueLanguages = useMemo(() => {
    const map = new Map<number, { name: string; count: number }>();
    for (const loc of locations) {
      const existing = map.get(loc.mepsLanguage);
      if (existing) {
        existing.count++;
      } else {
        map.set(loc.mepsLanguage, { name: loc.languageName, count: 1 });
      }
    }
    return Array.from(map.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count
    })).sort((a, b) => b.count - a.count);
  }, [locations]);

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    return filterAndSortLocations(locations, searchQuery, categoryFilter, languageFilter, sortBy);
  }, [locations, searchQuery, categoryFilter, languageFilter, sortBy]);

  // Pagination calculation
  const totalItems = filteredLocations.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Reset to page 1 if search/filter changes cause current page to exceed total pages
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedLocations = useMemo(() => {
    if (pageSize === -1) return filteredLocations;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLocations.slice(startIndex, startIndex + pageSize);
  }, [filteredLocations, currentPage, pageSize]);

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setLanguageFilter('all');
    setSortBy('density_desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || categoryFilter !== 'all' || languageFilter !== 'all';

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="inline-block animate-spin text-theocratic-600 dark:text-theocratic-400">
          <Layers className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Analyzing database locations, titles, and annotation mappings...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Introductory Explanation Card: What is a Location? */}
      {showExplanation ? (
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-theocratic-50 via-white to-slate-50 dark:from-slate-900 dark:via-theocratic-950/20 dark:to-slate-900 border border-theocratic-200/80 dark:border-theocratic-900/60 shadow-sm">
          <button 
            onClick={() => setShowExplanation(false)}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors"
            title="Dismiss explanation"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-theocratic-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div className="space-y-2 pr-6">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  What is a Location in JW Library?
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-theocratic-100 dark:bg-theocratic-900 text-theocratic-700 dark:text-theocratic-300">
                  Database Schema Coordinate
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                In the JW Library database, the <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-theocratic-600 dark:text-theocratic-400">Location</code> table acts as a normalized spatial coordinate system. Rather than repeating full publication details on every single highlight or note, all annotations anchor to a unique <code className="font-mono text-xs px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">LocationId</code>.
              </p>

              {/* 3 Coordinate Types Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Bible Chapters</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">BookNumber (1–66) + Chapter</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Publication Docs</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">KeySymbol + DocId / IssueTag</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    <Music className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Media Tracks</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Audio / Video Track numbers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button 
            onClick={() => setShowExplanation(true)}
            className="text-xs font-semibold text-theocratic-600 dark:text-theocratic-400 hover:underline flex items-center gap-1"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Show "What is a Location?" Guide</span>
          </button>
        </div>
      )}

      {/* 2. Summary KPI Cards Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Total Locations */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Locations</span>
            <MapPin className="w-4 h-4 text-theocratic-600 dark:text-theocratic-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {summary.totalLocations.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">records</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>{summary.annotatedLocationsCount.toLocaleString()} annotated ({summary.totalLocations > 0 ? Math.round((summary.annotatedLocationsCount / summary.totalLocations) * 100) : 0}%)</span>
            <InfoTooltip term="Location" />
          </div>
        </div>

        {/* Bible Chapters */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Bible Chapters</span>
            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {summary.bibleLocationsCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">chapters</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across 66 Bible books
          </div>
        </div>

        {/* Publication Documents */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Publication Docs</span>
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {summary.publicationLocationsCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">documents</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Articles, lessons & issues
          </div>
        </div>

        {/* Media Tracks & Other */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Media Tracks</span>
            <Music className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {summary.mediaLocationsCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">tracks</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Audio & video items
          </div>
        </div>

      </div>

      {/* 3. Search, Category Tabs & Sort Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        
        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search locations by title, symbol (e.g. w, mwb, nwt), Bible book, doc ID..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-theocratic-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            
            {/* Language Selector */}
            {uniqueLanguages.length > 1 && (
              <div className="relative flex-shrink-0">
                <select
                  value={languageFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLanguageFilter(val === 'all' ? 'all' : parseInt(val, 10));
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by Language"
                  className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-theocratic-500 cursor-pointer"
                >
                  <option value="all">All Languages ({locations.length})</option>
                  {uniqueLanguages.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.count})
                    </option>
                  ))}
                </select>
                <Globe className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* Sort Selector */}
            <div className="relative flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                aria-label="Sort Locations"
                className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-theocratic-500 cursor-pointer"
              >
                <option value="density_desc">Most Annotations (Density)</option>
                <option value="highlights_desc">Most Highlights</option>
                <option value="notes_desc">Most Notes</option>
                <option value="title_asc">Title (A → Z)</option>
                <option value="title_desc">Title (Z → A)</option>
                <option value="id_asc">Location ID (1 → N)</option>
                <option value="id_desc">Location ID (N → 1)</option>
                <option value="modified_desc">Recently Modified</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
            </div>

          </div>
        </div>

        {/* Category Filter Pills & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => { setCategoryFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-theocratic-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({summary.totalLocations})
            </button>

            <button
              onClick={() => { setCategoryFilter('bible'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                categoryFilter === 'bible'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Bible Chapters ({summary.bibleLocationsCount})</span>
            </button>

            <button
              onClick={() => { setCategoryFilter('publication'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                categoryFilter === 'publication'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Publications ({summary.publicationLocationsCount})</span>
            </button>

            <button
              onClick={() => { setCategoryFilter('media'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                categoryFilter === 'media'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Music className="w-3 h-3" />
              <span>Media Tracks ({summary.mediaLocationsCount})</span>
            </button>

            <button
              onClick={() => { setCategoryFilter('annotated'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                categoryFilter === 'annotated'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Annotated Only ({summary.annotatedLocationsCount})</span>
            </button>
          </div>

          {/* Results count & reset */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{filteredLocations.length}</strong> of {locations.length}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-theocratic-600 dark:text-theocratic-400 font-bold hover:underline ml-1"
              >
                Reset
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 4. Locations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {filteredLocations.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              No matching locations found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No locations match your current search query or category filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-xl bg-theocratic-600 text-white text-xs font-bold shadow-sm hover:bg-theocratic-700 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Location & Title</th>
                  <th className="py-3.5 px-3">Symbol / Tag</th>
                  <th className="py-3.5 px-3">Language</th>
                  <th className="py-3.5 px-3 text-center">Highlights</th>
                  <th className="py-3.5 px-3 text-center">Notes</th>
                  <th className="py-3.5 px-3 text-right">Annotations</th>
                  <th className="py-3.5 px-3 text-center w-12">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedLocations.map((loc) => {
                  const isExpanded = expandedLocationId === loc.locationId;

                  return (

                    <React.Fragment key={loc.locationId}>
                      <tr 
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-50 dark:bg-slate-800/40' : ''
                        }`}
                        onClick={() => setExpandedLocationId(isExpanded ? null : loc.locationId)}
                      >
                        {/* Title & Coordinate */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">
                              {loc.category === 'bible' && (
                                <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 inline-block">
                                  <BookOpen className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {loc.category === 'media' && (
                                <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 inline-block">
                                  <Music className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {loc.category === 'publication' && (
                                <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 inline-block">
                                  <FileText className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {loc.category === 'other' && (
                                <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 inline-block">
                                  <MapPin className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                                {loc.resolvedTitle}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                                <span>ID: #{loc.locationId}</span>
                                {loc.bookNumber && (
                                  <span>· Book {loc.bookNumber}{loc.chapterNumber ? `, Ch. ${loc.chapterNumber}` : ''}</span>
                                )}
                                {loc.documentId && (
                                  <span>· Doc #{loc.documentId}</span>
                                )}
                                {loc.track && (
                                  <span>· Track #{loc.track}</span>
                                )}
                                {loc.issueTagFormatted && (
                                  <span className="text-theocratic-600 dark:text-theocratic-400">· {loc.issueTagFormatted}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Symbol Badge */}
                        <td className="py-3 px-3">
                          {loc.keySymbol ? (
                            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {loc.keySymbol}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>

                        {/* Language */}
                        <td className="py-3 px-3">
                          <span className="text-slate-600 dark:text-slate-300 text-xs font-medium truncate max-w-[130px] block" title={loc.languageName}>
                            {loc.languageName}
                          </span>
                        </td>

                        {/* Highlights Count */}
                        <td className="py-3 px-3 text-center">
                          {loc.highlightsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                              <Highlighter className="w-3 h-3" />
                              <span>{loc.highlightsCount}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 font-mono">0</span>
                          )}
                        </td>

                        {/* Notes Count */}
                        <td className="py-3 px-3 text-center">
                          {loc.notesCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-theocratic-100 dark:bg-theocratic-950/80 text-theocratic-800 dark:text-theocratic-300 border border-theocratic-200/80 dark:border-theocratic-800/80">
                              <MessageSquare className="w-3 h-3" />
                              <span>{loc.notesCount}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 font-mono">0</span>
                          )}
                        </td>

                        {/* Total Density Pill */}
                        <td className="py-3 px-3 text-right">
                          {loc.totalAnnotations > 0 ? (
                            <span className="inline-block px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {loc.totalAnnotations}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>

                        {/* Expand / Details Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLocationId(isExpanded ? null : loc.locationId);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors"
                            aria-label={isExpanded ? "Collapse Details" : "Expand Details"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Location Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-slate-800/30">
                          <td colSpan={7} className="p-4 sm:p-5 border-y border-slate-200/80 dark:border-slate-800">
                            <div className="space-y-4 max-w-3xl">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                                  Raw SQLite Location Record Schema Values
                                </h4>
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  LocationId: {loc.locationId}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-sans">BookNumber</div>
                                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {loc.bookNumber ?? 'NULL'}
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-sans">ChapterNumber</div>
                                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {loc.chapterNumber ?? 'NULL'}
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-sans">DocumentId</div>
                                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {loc.documentId ?? 'NULL'}
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-sans">Track</div>
                                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {loc.track ?? 'NULL'}
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-sans">KeySymbol</div>
                                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {loc.keySymbol ? `"${loc.keySymbol}"` : 'NULL'}
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-sans">IssueTagNumber</div>
                                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {loc.issueTagNumber ?? 'NULL'}
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-sans">MepsLanguage</div>
                                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {loc.mepsLanguage} ({loc.languageName})
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <div className="text-[10px] text-slate-400 uppercase font-sans">Type</div>
                                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {loc.type ?? 'NULL'}
                                  </div>
                                </div>
                              </div>

                              {/* Attached Annotations Summary Pill Row */}
                              <div className="flex items-center gap-3 pt-1 text-xs">
                                <span className="font-bold text-slate-600 dark:text-slate-400">
                                  Attached Annotations:
                                </span>
                                <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold">
                                  {loc.highlightsCount} Highlights
                                </span>
                                <span className="px-2 py-0.5 rounded bg-theocratic-50 dark:bg-theocratic-950/50 text-theocratic-700 dark:text-theocratic-300 font-semibold">
                                  {loc.notesCount} Notes
                                </span>
                                <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold">
                                  {loc.bookmarksCount} Bookmarks
                                </span>
                                <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold">
                                  {loc.inputFieldsCount} InputFields
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Controls Footer */}
        {filteredLocations.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                aria-label="Rows per page"
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-theocratic-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={-1}>All ({filteredLocations.length})</option>
              </select>
              <span className="text-slate-400 ml-1">
                Showing {pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}–{pageSize === -1 ? filteredLocations.length : Math.min(currentPage * pageSize, filteredLocations.length)} of {filteredLocations.length}
              </span>
            </div>

            {/* Page Navigation */}
            {pageSize !== -1 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
