import React, { useState, useRef, useEffect, useId } from 'react';
import { Info, HelpCircle, X } from 'lucide-react';
import { getSchemaDefinition } from '../lib/constants';

export interface InfoTooltipProps {
  /**
   * Database term to look up automatically from schema definitions
   * (e.g., 'UserMark', 'BlockRange', 'Location', 'TagMap', 'InputField', 'Bookmark', 'Manifest Hash')
   */
  term?: string;
  /**
   * Custom title override for the tooltip popover
   */
  title?: string;
  /**
   * Custom tooltip body content
   */
  content?: React.ReactNode;
  /**
   * Preferred position of the popover relative to the trigger
   */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * Size of the default icon trigger
   */
  size?: 'xs' | 'sm' | 'md';
  /**
   * Optional custom trigger element
   */
  children?: React.ReactNode;
  /**
   * Additional classes for container
   */
  className?: string;
  /**
   * Render trigger inline with text
   */
  inline?: boolean;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  term,
  title: customTitle,
  content: customContent,
  position = 'top',
  size = 'xs',
  children,
  className = '',
  inline = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  // Resolve definition from term if provided
  const schemaDef = term ? getSchemaDefinition(term) : undefined;
  const displayTitle = customTitle || schemaDef?.title || (term ? term : undefined);
  const displayContent = customContent || schemaDef?.detailedDescription || schemaDef?.shortDescription;

  // If no content is found or specified, don't render an empty tooltip
  if (!displayContent && !displayTitle) {
    return null;
  }

  // Handle outside click & escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-800 border-b-4 border-x-transparent border-x-4 border-t-0';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-800 border-l-4 border-y-transparent border-y-4 border-r-0';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-800 border-r-4 border-y-transparent border-y-4 border-l-0';
      case 'top':
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-800 border-t-4 border-x-transparent border-x-4 border-b-0';
    }
  };

  return (
    <span className={`relative ${inline ? 'inline-flex items-center' : 'flex'} ${className}`}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={(e) => {
          // Keep open if moving focus inside popover
          if (!popoverRef.current?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
          }
        }}
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-label={displayTitle ? `Information about ${displayTitle}` : 'Help information'}
        className="p-0.5 rounded-full text-slate-400 hover:text-theocratic-600 dark:text-slate-500 dark:hover:text-theocratic-400 focus:outline-none focus:ring-2 focus:ring-theocratic-500/40 transition-colors inline-flex items-center justify-center align-middle"
      >
        {children ? (
          children
        ) : (
          <HelpCircle className={sizeClasses[size]} />
        )}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          id={tooltipId}
          role="tooltip"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={`absolute z-50 w-64 sm:w-72 p-3 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 dark:text-slate-200 border border-slate-700/80 dark:border-slate-800 shadow-xl shadow-black/20 text-xs font-normal leading-relaxed animate-in fade-in zoom-in-95 duration-150 ${getPositionClasses()}`}
        >
          {/* Arrow */}
          <div className={`absolute w-0 h-0 ${getArrowClasses()}`} />

          {/* Header */}
          {displayTitle && (
            <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-700/60 dark:border-slate-800">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-theocratic-400 flex-shrink-0" />
                <span>{displayTitle}</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors sm:hidden"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="text-slate-300 dark:text-slate-300 text-[11px] leading-relaxed space-y-1">
            {displayContent}
          </div>
        </div>
      )}
    </span>
  );
};
