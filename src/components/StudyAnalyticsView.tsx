import React, { useState } from 'react';
import type { BackupAnalytics } from '../lib/types';
import { 
  BookOpen, 
  Languages, 
  FileText, 
  Highlighter, 
  Layers, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Calendar,
  Award
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { getPublicationCategoryBadge } from '../lib/constants';

interface StudyAnalyticsViewProps {
  analytics: BackupAnalytics | null;
  loading?: boolean;
}

const LANGUAGE_COLORS = [
  'bg-theocratic-500 text-white',
  'bg-emerald-500 text-white',
  'bg-purple-500 text-white',
  'bg-amber-500 text-white',
  'bg-sky-500 text-white',
  'bg-rose-500 text-white',
  'bg-indigo-500 text-white',
  'bg-teal-500 text-white',
  'bg-slate-500 text-white'
];

export const StudyAnalyticsView: React.FC<StudyAnalyticsViewProps> = ({ analytics, loading }) => {
  const [expandedWtYears, setExpandedWtYears] = useState<Record<number, boolean>>({});
  const [topPubsLimit, setTopPubsLimit] = useState(10);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  if (loading || !analytics) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-theocratic-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Analyzing language distribution and publication annotations...
        </p>
      </div>
    );
  }

  const toggleWtYear = (year: number) => {
    setExpandedWtYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const filteredTopPubs = selectedCategoryFilter 
    ? analytics.topPublications.filter(p => p.category === selectedCategoryFilter)
    : analytics.topPublications;

  const maxPubAnnotations = analytics.topPublications[0]?.totalAnnotations || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Hero Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Activity</span>
            <div className="w-7 h-7 rounded-lg bg-theocratic-50 dark:bg-theocratic-950 text-theocratic-600 dark:text-theocratic-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {analytics.totalAnnotations.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <span>All study annotations</span>
              <InfoTooltip content="Combined total of all highlights, personal study notes, bookmarks, and interactive answers." />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Highlights</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Highlighter className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {analytics.totalHighlights.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <span>UserMark items</span>
              <InfoTooltip term="UserMark" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Study Notes</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {analytics.totalNotes.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <span>{analytics.totalIndependentNotes} independent</span>
              <InfoTooltip term="Note" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Languages</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Languages className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {analytics.languages.length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              MEPS Language {analytics.languages.length === 1 ? 'edition' : 'editions'}
            </div>
          </div>
        </div>

      </div>

      {/* 2. MEPS Language Distribution Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>MEPS Language Distribution</span>
                <InfoTooltip content="Language editions indexed by MEPS Language ID across all publications, Bible chapters, and study notes." />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Breakdown of notes and highlights by publication language
              </p>
            </div>
          </div>
        </div>

        {analytics.languages.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No language-linked annotations found in this backup.
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Multi-segment Proportional Visual Bar */}
            <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              {analytics.languages.map((lang, idx) => {
                const color = LANGUAGE_COLORS[idx % LANGUAGE_COLORS.length].split(' ')[0];
                return (
                  <div
                    key={lang.mepsLanguage}
                    style={{ width: `${Math.max(lang.percentage, 1)}%` }}
                    className={`${color} h-full transition-all duration-300 relative group`}
                    title={`${lang.languageName}: ${lang.percentage}% (${lang.totalAnnotations} annotations)`}
                  />
                );
              })}
            </div>

            {/* Language Breakdown Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {analytics.languages.map((lang, idx) => {
                const colorBadge = LANGUAGE_COLORS[idx % LANGUAGE_COLORS.length];
                return (
                  <div
                    key={lang.mepsLanguage}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorBadge.split(' ')[0]}`} />
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {lang.languageName}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                        {lang.percentage}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-mono pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="p-1 rounded bg-white/60 dark:bg-slate-900/60">
                        <span className="block text-[9px] uppercase tracking-wider text-slate-400">Marks</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{lang.highlightsCount}</span>
                      </div>
                      <div className="p-1 rounded bg-white/60 dark:bg-slate-900/60">
                        <span className="block text-[9px] uppercase tracking-wider text-slate-400">Notes</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{lang.notesCount}</span>
                      </div>
                      <div className="p-1 rounded bg-white/60 dark:bg-slate-900/60">
                        <span className="block text-[9px] uppercase tracking-wider text-slate-400">Marks+Bms</span>
                        <span className="font-bold text-theocratic-600 dark:text-theocratic-400">{lang.bookmarksCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

      {/* 3. Publication Categories Breakdown */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-600 dark:text-theocratic-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Publication Category Breakdown</span>
                <InfoTooltip content="Activity differentiated across Bibles, Watchtowers, Meeting Workbooks, Books/Brochures, and unattached Notes." />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Annotations categorized into 5 primary publication types
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {analytics.categories.map((cat) => {
            const badge = getPublicationCategoryBadge(cat.category === 'books_brochures' ? 'book' : (cat.category === 'independent_notes' ? 'other' : cat.category as any));
            return (
              <div
                key={cat.category}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.color} ${badge.border}`}>
                      {cat.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {cat.totalAnnotations.toLocaleString()} ({cat.percentage}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(cat.percentage, cat.totalAnnotations > 0 ? 3 : 0)}%` }}
                      className="h-full bg-theocratic-600 dark:bg-theocratic-500 rounded-full transition-all duration-300"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{cat.highlightsCount} marks</span>
                    <span>{cat.notesCount} notes</span>
                    <span>{cat.bookmarksCount} bookmarks</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Top Studied Publications Leaderboard */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Top Studied Publications & Documents</span>
                <InfoTooltip content="Ranked ranking of Bible books, Watchtower issues, workbooks, and publications with the highest density of highlights and notes." />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Documents with the highest concentration of personal annotations
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategoryFilter(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategoryFilter === null
                  ? 'bg-theocratic-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All ({analytics.topPublications.length})
            </button>
            <button
              onClick={() => setSelectedCategoryFilter('bible')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategoryFilter === 'bible'
                  ? 'bg-theocratic-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Bible
            </button>
            <button
              onClick={() => setSelectedCategoryFilter('watchtower')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategoryFilter === 'watchtower'
                  ? 'bg-theocratic-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Watchtower
            </button>
            <button
              onClick={() => setSelectedCategoryFilter('workbook')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategoryFilter === 'workbook'
                  ? 'bg-theocratic-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Workbook
            </button>
            <button
              onClick={() => setSelectedCategoryFilter('books_brochures')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategoryFilter === 'books_brochures'
                  ? 'bg-theocratic-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Books
            </button>
          </div>
        </div>

        {filteredTopPubs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No publications match the selected filter.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTopPubs.slice(0, topPubsLimit).map((pub, idx) => {
              const relativePercent = Math.max(Math.round((pub.totalAnnotations / maxPubAnnotations) * 100), 4);
              const badge = getPublicationCategoryBadge(pub.category === 'books_brochures' ? 'book' : (pub.category === 'independent_notes' ? 'other' : pub.category as any));

              return (
                <div
                  key={pub.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3"
                >
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs font-mono flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate max-w-full">
                          {pub.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.color} ${badge.border} flex-shrink-0`}>
                          {pub.categoryLabel}
                        </span>
                        {pub.languageName && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0">
                            {pub.languageName}
                          </span>
                        )}
                      </div>
                      
                      {/* Relative concentration bar */}
                      <div className="w-full max-w-xs h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-1.5 overflow-hidden">
                        <div
                          style={{ width: `${relativePercent}%` }}
                          className="h-full bg-theocratic-600 dark:bg-theocratic-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center font-mono text-xs text-slate-600 dark:text-slate-400 flex-shrink-0 flex-wrap">
                    <span className="text-amber-600 dark:text-amber-400 font-bold" title="Highlights">
                      {pub.highlightsCount}h
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold" title="Notes">
                      {pub.notesCount}n
                    </span>
                    {pub.bookmarksCount > 0 && (
                      <span className="text-purple-600 dark:text-purple-400 font-bold" title="Bookmarks">
                        {pub.bookmarksCount}bm
                      </span>
                    )}
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-700 dark:text-theocratic-300 font-bold text-xs">
                      {pub.totalAnnotations.toLocaleString()} total
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTopPubs.length > topPubsLimit && (
              <button
                onClick={() => setTopPubsLimit(prev => prev + 15)}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Show More Publications ({filteredTopPubs.length - topPubsLimit} remaining)
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. The Watchtower Deep Dive (Grouped by Year & Monthly Issues) */}
      {analytics.watchtowerByYear.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-600 dark:text-theocratic-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>The Watchtower Study Archive</span>
                  <InfoTooltip content="Study Edition Watchtowers grouped by publication year and expandable by individual monthly study issue tag." />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Organized by year and expandable by issue month
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-theocratic-50 dark:bg-theocratic-950 text-theocratic-700 dark:text-theocratic-300 border border-theocratic-200 dark:border-theocratic-800">
              {analytics.watchtowerByYear.length} Years Studied
            </span>
          </div>

          <div className="space-y-3">
            {analytics.watchtowerByYear.map((wtYear) => {
              const isExpanded = !!expandedWtYears[wtYear.year];
              return (
                <div
                  key={wtYear.year}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/40 transition-all"
                >
                  <button
                    onClick={() => toggleWtYear(wtYear.year)}
                    className="w-full p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="text-slate-400 flex-shrink-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                        The Watchtower {wtYear.year > 0 ? wtYear.year : 'Special / Undated'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                        ({wtYear.issues.length} {wtYear.issues.length === 1 ? 'issue' : 'issues'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs self-end sm:self-center flex-shrink-0">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] sm:text-xs">
                        {wtYear.highlightsCount} marks, {wtYear.notesCount} notes
                      </span>
                      <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-theocratic-100 dark:bg-theocratic-950 text-theocratic-700 dark:text-theocratic-300 font-bold text-[11px] sm:text-xs">
                        {wtYear.totalAnnotations} total
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {wtYear.issues.map((issue) => (
                          <div
                            key={issue.issueTagNumber}
                            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                {issue.issueTitle}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                Tag: {issue.issueTagNumber}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 font-mono text-xs">
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                {issue.highlightsCount}h
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                {issue.notesCount}n
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {issue.totalAnnotations}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Holy Scriptures (Bible) Activity */}
      {analytics.bibleByBook.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Holy Scriptures Study Activity</span>
                  <InfoTooltip content="Highlights and study notes across the 66 Bible books, split by Hebrew-Aramaic Scriptures (OT) and Christian Greek Scriptures (NT)." />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {analytics.bibleByBook.length} Bible books with recorded study annotations
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {analytics.bibleByBook.map((b) => (
              <div
                key={b.bookNumber}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {b.shortName}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    b.testament === 'OT' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {b.testament}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{b.highlightsCount}h / {b.notesCount}n</span>
                  <span className="font-bold text-theocratic-600 dark:text-theocratic-400">
                    {b.totalAnnotations}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
