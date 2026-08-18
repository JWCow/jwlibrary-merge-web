import React, { useState, useMemo } from 'react';
import type { NoteDetail, PublicationCategoryKey } from '../lib/types';
import { 
  filterAndSortNotes, 
  getAvailableNoteLanguages, 
  getAvailableNoteCategories 
} from '../lib/inspect';
import { 
  PUBLICATION_CATEGORY_DEFINITIONS, 
  HIGHLIGHT_COLORS,
  getLanguageName 
} from '../lib/constants';
import { 
  Search, 
  FileText, 
  Filter, 
  Globe, 
  BookOpen, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  ArrowUpDown
} from 'lucide-react';

interface NotesExplorerViewProps {
  notes: NoteDetail[];
  loading?: boolean;
}

export const NotesExplorerView: React.FC<NotesExplorerViewProps> = ({ 
  notes, 
  loading = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<PublicationCategoryKey | 'all'>('all');
  const [sortBy, setSortBy] = useState<
    'modified_desc' | 'modified_asc' | 'created_desc' | 'created_asc' | 'title_asc' | 'title_desc'
  >('modified_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [expandedGuids, setExpandedGuids] = useState<Record<string, boolean>>({});
  const [copiedGuid, setCopiedGuid] = useState<string | null>(null);

  // Available languages dynamically extracted only from notes in this backup
  const availableLanguages = useMemo(() => getAvailableNoteLanguages(notes), [notes]);

  // Available categories with counts
  const availableCategories = useMemo(() => getAvailableNoteCategories(notes), [notes]);

  // Filtered and sorted notes
  const filteredNotes = useMemo(() => {
    return filterAndSortNotes(notes, {
      searchQuery,
      language: selectedLanguage,
      category: selectedCategory,
      sortBy
    });
  }, [notes, searchQuery, selectedLanguage, selectedCategory, sortBy]);

  // Pagination calculation
  const totalItems = filteredNotes.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedNotes = useMemo(() => {
    if (pageSize === -1) return filteredNotes;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredNotes.slice(startIndex, startIndex + pageSize);
  }, [filteredNotes, currentPage, pageSize]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedLanguage !== 'all' || selectedCategory !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedLanguage('all');
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  const toggleExpand = (guid: string) => {
    setExpandedGuids(prev => ({
      ...prev,
      [guid]: !prev[guid]
    }));
  };

  const handleCopyContent = async (note: NoteDetail) => {
    const textToCopy = `${note.title ? `${note.title}\n\n` : ''}${note.content || ''}${note.locationTitle ? `\n\n— ${note.locationTitle}` : ''}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedGuid(note.guid);
      setTimeout(() => setCopiedGuid(null), 2000);
    } catch (e) {
      console.warn('Failed to copy to clipboard:', e);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="inline-block animate-spin text-theocratic-600 dark:text-theocratic-400">
          <FileText className="w-8 h-8" />
        </div>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Extracting personal study notes and publication mappings...
        </p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="p-12 text-center space-y-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Personal Notes Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This backup does not contain any records in the SQLite Note table.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Filter Control Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        
        {/* Search Bar and Clear Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search notes by title, text content, publication, or language..."
              className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-theocratic-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="absolute right-3 top-2.5 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors flex-shrink-0"
              title="Reset all filters and search query"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Dropdown Filters & Sorter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* 1. Language Filter Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-theocratic-600 dark:text-theocratic-400" />
              <span>Language ({availableLanguages.length})</span>
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedLanguage(val === 'all' ? 'all' : parseInt(val, 10));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-theocratic-500"
            >
              <option value="all">All Languages ({notes.length})</option>
              {availableLanguages.map(lang => (
                <option key={lang.id} value={lang.id}>
                  {lang.name} ({lang.count})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Publication Category Filter Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-theocratic-600 dark:text-theocratic-400" />
              <span>Publication Category</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value as PublicationCategoryKey | 'all');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-theocratic-500"
            >
              <option value="all">All Categories ({notes.length})</option>
              {availableCategories.filter(c => c.count > 0).map(cat => (
                <option key={cat.key} value={cat.key}>
                  {cat.shortLabel} ({cat.count})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Sort By Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-theocratic-600 dark:text-theocratic-400" />
              <span>Sort Order</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-theocratic-500"
            >
              <option value="modified_desc">Last Modified (Newest first)</option>
              <option value="modified_asc">Last Modified (Oldest first)</option>
              <option value="created_desc">Creation Date (Newest first)</option>
              <option value="created_asc">Creation Date (Oldest first)</option>
              <option value="title_asc">Title (A → Z)</option>
              <option value="title_desc">Title (Z → A)</option>
            </select>
          </div>

        </div>

        {/* Filter State Counter & Active Chips */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Showing <span className="text-theocratic-600 dark:text-theocratic-400 font-bold">{filteredNotes.length.toLocaleString()}</span> of {notes.length.toLocaleString()} notes
            </span>

            {/* Active chips */}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-theocratic-50 dark:bg-theocratic-950/70 text-theocratic-700 dark:text-theocratic-300 border border-theocratic-200 dark:border-theocratic-800 font-medium text-[11px]">
                Search: &ldquo;{searchQuery}&rdquo;
                <button onClick={() => setSearchQuery('')} className="hover:text-theocratic-900 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedLanguage !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-theocratic-50 dark:bg-theocratic-950/70 text-theocratic-700 dark:text-theocratic-300 border border-theocratic-200 dark:border-theocratic-800 font-medium text-[11px]">
                Lang: {getLanguageName(selectedLanguage)}
                <button onClick={() => setSelectedLanguage('all')} className="hover:text-theocratic-900 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-theocratic-50 dark:bg-theocratic-950/70 text-theocratic-700 dark:text-theocratic-300 border border-theocratic-200 dark:border-theocratic-800 font-medium text-[11px]">
                Cat: {PUBLICATION_CATEGORY_DEFINITIONS[selectedCategory]?.shortLabel}
                <button onClick={() => setSelectedCategory('all')} className="hover:text-theocratic-900 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2 text-slate-500">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(1); }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>All</option>
            </select>
          </div>
        </div>

      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="p-12 text-center space-y-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Filter className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No matching notes</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No notes match your current search query and filter combination.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-xl bg-theocratic-600 hover:bg-theocratic-700 text-white font-semibold text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          paginatedNotes.map((note) => {
            const catMeta = PUBLICATION_CATEGORY_DEFINITIONS[note.publicationCategory || 'independent_notes'];
            const badge = catMeta?.badge || {
              color: 'text-slate-700 dark:text-slate-300',
              bg: 'bg-slate-100 dark:bg-slate-800',
              border: 'border-slate-200 dark:border-slate-700'
            };
            const highlightColor = note.colorIndex ? HIGHLIGHT_COLORS[note.colorIndex] : undefined;
            const isExpanded = Boolean(expandedGuids[note.guid]);
            const isCopied = copiedGuid === note.guid;
            const isLongContent = (note.content?.length || 0) > 300 || ((note.content?.match(/\n/g) || []).length > 4);

            return (
              <div
                key={note.guid || note.noteId}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Top Row: Title, Highlight Color, Category, Language & Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    
                    {/* Highlight Dot Indicator */}
                    {highlightColor && (
                      <span 
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${highlightColor.dot} shadow-sm`} 
                        title={`Attached to ${highlightColor.name} highlight (Color #${note.colorIndex})`}
                      />
                    )}

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                      {note.title || 'Untitled Note'}
                    </h3>

                    {/* Publication Category Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.color} ${badge.border}`}>
                      {catMeta?.shortLabel || 'General'}
                    </span>

                    {/* Language Badge */}
                    {note.languageName && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {note.languageName}
                      </span>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 flex-shrink-0 self-start sm:self-center">
                    <span className="flex items-center gap-1" title={`Last Modified: ${note.lastModified}`}>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(note.lastModified).toLocaleDateString()}</span>
                    </span>
                    {note.created && note.created !== note.lastModified && (
                      <span className="flex items-center gap-1" title={`Created: ${note.created}`}>
                        <Calendar className="w-3 h-3" />
                        <span>Created {new Date(note.created).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Location Citation / Context */}
                {note.locationTitle && (
                  <div className="flex items-center gap-1.5 text-xs text-theocratic-600 dark:text-theocratic-400 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{note.locationTitle}</span>
                  </div>
                )}

                {/* Note Content */}
                {note.content ? (
                  <div className="space-y-2">
                    <div className={`p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed ${
                      !isExpanded && isLongContent ? 'line-clamp-4' : ''
                    }`}>
                      {note.content}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {isLongContent ? (
                        <button
                          onClick={() => toggleExpand(note.guid)}
                          className="text-[11px] text-theocratic-600 dark:text-theocratic-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              <span>Show less</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              <span>Show full note</span>
                            </>
                          )}
                        </button>
                      ) : <div />}

                      <button
                        onClick={() => handleCopyContent(note)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium transition-colors ml-auto"
                        title="Copy note text to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Note</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-400">
                    No text body in this note.
                  </p>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm text-xs">
          <div className="text-slate-500">
            Page <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({totalItems} total notes)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
