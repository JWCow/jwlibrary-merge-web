import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  Highlighter, 
  Sparkles, 
  Terminal, 
  Sliders, 
  MapPin, 
  Database, 
  HelpCircle, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUp,
  ChevronRight,
  Code2,
  Copy,
  Check
} from 'lucide-react';
import { FAQ_TOPICS, searchFaqTopics } from '../lib/faq';
import { SCHEMA_DEFINITIONS } from '../lib/constants';

export interface SchemaFaqDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

export const SchemaFaqDrawer: React.FC<SchemaFaqDrawerProps> = ({
  isOpen,
  onClose,
  initialTopic
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const topicRefs = useRef<Record<string, HTMLElement | null>>({});

  // Reset or jump to initial topic on open
  useEffect(() => {
    if (isOpen) {
      if (initialTopic) {
        setSelectedCategory('all');
        setSearchQuery('');
        // Smooth scroll to initial topic after render
        setTimeout(() => {
          const el = topicRefs.current[initialTopic];
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      } else {
        // Focus search input on open if no specific initial topic
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 150);
      }
    }
  }, [isOpen, initialTopic]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTopics = searchFaqTopics(searchQuery).filter(topic => {
    if (selectedCategory === 'all') return true;
    return topic.id === selectedCategory || topic.category === selectedCategory;
  });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleJumpToTopic = (topicId: string) => {
    setSelectedCategory('all');
    setSearchQuery('');
    setTimeout(() => {
      const el = topicRefs.current[topicId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const getTopicIcon = (iconName: string) => {
    switch (iconName) {
      case 'Highlighter':
        return <Highlighter className="w-5 h-5 text-amber-500" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-theocratic-500" />;
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-emerald-500" />;
      case 'Sliders':
        return <Sliders className="w-5 h-5 text-sky-500" />;
      case 'MapPin':
        return <MapPin className="w-5 h-5 text-purple-500" />;
      case 'Database':
      default:
        return <Database className="w-5 h-5 text-theocratic-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Click outside backdrop */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Slide-over Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="faq-drawer-heading"
        className="relative w-full max-w-2xl sm:max-w-3xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        
        {/* Sticky Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm sticky top-0 z-20 space-y-3">
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-theocratic-100 dark:bg-theocratic-950/80 text-theocratic-600 dark:text-theocratic-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 
                  id="faq-drawer-heading" 
                  className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 flex items-center gap-2"
                >
                  <span>Database & Merge Engine Guide</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  SQLite tables, multi-block highlight healing, token offsets & audit telemetry
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-theocratic-500"
              aria-label="Close Database Guide & FAQ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, tables (UserMark, BlockRange), healing, telemetry..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-theocratic-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick-Jump Category Navigation Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all' && !searchQuery
                  ? 'bg-theocratic-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Topics ({FAQ_TOPICS.length})
            </button>

            {FAQ_TOPICS.map(topic => (
              <button
                key={topic.id}
                onClick={() => handleJumpToTopic(topic.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                <span>{topic.shortTitle}</span>
              </button>
            ))}
          </div>

        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 scroll-smooth">
          
          {filteredTopics.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500" />
              <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">
                No matching topics found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                We couldn&apos;t find any guide sections matching &ldquo;{searchQuery}&rdquo;. Try searching for &ldquo;UserMark&rdquo;, &ldquo;BlockRange&rdquo;, &ldquo;healing&rdquo;, or &ldquo;telemetry&rdquo;.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-theocratic-50 dark:bg-theocratic-950 text-theocratic-600 dark:text-theocratic-400 text-xs font-semibold hover:bg-theocratic-100 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const isTargeted = initialTopic === topic.id;

              return (
                <article
                  key={topic.id}
                  id={topic.id}
                  ref={(el) => { topicRefs.current[topic.id] = el; }}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                    isTargeted
                      ? 'bg-theocratic-50/40 dark:bg-theocratic-950/30 border-theocratic-400 dark:border-theocratic-700 shadow-md ring-2 ring-theocratic-500/20'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 shadow-sm'
                  } space-y-4`}
                >
                  
                  {/* Topic Header */}
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0 mt-0.5">
                      {getTopicIcon(topic.iconName)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                          {topic.categoryLabel}
                        </span>
                        {isTargeted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theocratic-500 text-white animate-pulse">
                            Selected
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-snug">
                        {topic.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {topic.summary}
                      </p>
                    </div>
                  </div>

                  {/* Topic Sections */}
                  <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {topic.sections.map((section, sIdx) => (
                      <div key={sIdx} className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {section.heading && (
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 pt-1">
                            <ChevronRight className="w-3.5 h-3.5 text-theocratic-500 flex-shrink-0" />
                            <span>{section.heading}</span>
                          </h4>
                        )}
                        <p>{section.body}</p>

                        {/* Bullet Points */}
                        {section.bulletPoints && section.bulletPoints.length > 0 && (
                          <ul className="space-y-1.5 pl-2">
                            {section.bulletPoints.map((bp, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-2 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-theocratic-500 mt-1.5 flex-shrink-0" />
                                <span className="flex-1">{bp}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Callout Box */}
                        {section.callout && (
                          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 my-2 ${
                            section.callout.type === 'warning'
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300'
                              : section.callout.type === 'success'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
                              : 'bg-theocratic-50 dark:bg-theocratic-950/40 border-theocratic-200 dark:border-theocratic-800/60 text-theocratic-900 dark:text-theocratic-300'
                          }`}>
                            {section.callout.type === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            ) : section.callout.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-4 h-4 text-theocratic-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-0.5 flex-1">
                              {section.callout.title && (
                                <strong className="block font-bold text-slate-900 dark:text-slate-100">
                                  {section.callout.title}
                                </strong>
                              )}
                              <span>{section.callout.text}</span>
                            </div>
                          </div>
                        )}

                        {/* Code / SQL Snippet */}
                        {section.codeSnippet && (
                          <div className="relative rounded-xl bg-slate-950 border border-slate-800 text-slate-200 p-3.5 font-mono text-[11px] leading-relaxed overflow-x-auto my-2 group">
                            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-slate-400 text-[10px]">
                              <span className="flex items-center gap-1 font-semibold">
                                <Code2 className="w-3 h-3 text-theocratic-400" />
                                <span>Code Reference</span>
                              </span>
                              <button
                                onClick={() => handleCopyCode(`${topic.id}-${sIdx}`, section.codeSnippet!)}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
                                aria-label="Copy snippet"
                              >
                                {copiedCodeId === `${topic.id}-${sIdx}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="text-slate-300 font-mono whitespace-pre">{section.codeSnippet}</pre>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>

                  {/* Special Embedded SQLite Table Dictionary for Topic 'sqlite-tables-overview' */}
                  {topic.id === 'sqlite-tables-overview' && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                        Interactive Schema Tables Dictionary
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(SCHEMA_DEFINITIONS).map(([term, def]) => (
                          <div
                            key={term}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-xs text-theocratic-600 dark:text-theocratic-400">
                                {def.term}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                {def.title.replace(`${def.term} `, '')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                              {def.shortDescription}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </article>
              );
            })
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-theocratic-500" />
            <span>JW Library SQLite Engine v5–v16+ Compatible</span>
          </div>

          <button
            onClick={() => {
              drawerRef.current?.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1 font-medium hover:text-theocratic-600 dark:hover:text-theocratic-400 transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Back to top</span>
          </button>
        </div>

      </div>

    </div>
  );
};
