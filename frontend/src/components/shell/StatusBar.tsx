import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useSessionStore } from '@/core/session/store';

interface StatusBarProps {
  workspaceRef?: React.RefObject<HTMLDivElement | null>;
}

export const StatusBar: React.FC<StatusBarProps> = ({ workspaceRef }) => {
  const { isDirty, viewState, pageCount, setPage, setZoom } = useSessionStore();
  const zoomSteps = [25, 50, 75, 100, 125, 150, 200, 300, 400];

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const closest = zoomSteps.reduce((prev, curr) =>
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev,
    );
    setZoom(closest);
  };

  const [visiblePage, setVisiblePage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [isEditingPage, setIsEditingPage] = useState(false);

  useEffect(() => {
    const container = workspaceRef?.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the page with the greatest intersection ratio
        const mostVisible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (mostVisible) {
          const pageAttr = (mostVisible.target as HTMLElement).dataset.page;
          if (pageAttr) setVisiblePage(parseInt(pageAttr, 10));
        }
      },
      {
        root: container,           // scoped to workspace scroll container
        threshold: [0, 0.5, 1.0], // fire at 0%, 50%, 100% visibility
      },
    );

    // Observe all page surface divs
    container.querySelectorAll('[data-page]').forEach(el => observer.observe(el));

    // Re-observe when pages change (use a MutationObserver for this)
    const mutationObs = new MutationObserver(() => {
      observer.disconnect();
      container.querySelectorAll('[data-page]').forEach(el => observer.observe(el));
    });
    mutationObs.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObs.disconnect();
    };
  }, [workspaceRef]);

  const commitPageInput = (value: string) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= pageCount) {
      setPage(parsed);        // ONLY called here — not on every keystroke
    }
    setIsEditingPage(false);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitPageInput(e.currentTarget.value);
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      setIsEditingPage(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 h-8 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 z-10 shrink-0">
      <div className="flex items-center space-x-4">
        <span>DocCraft Static</span>
        {isDirty && (
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Unsaved changes
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <span className="font-mono flex items-center">
          Page:
          {isEditingPage ? (
            <input
              type="text"
              autoFocus
              className="w-8 ml-1 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handlePageInputKeyDown}
              onBlur={(e) => commitPageInput(e.target.value)}
            />
          ) : (
            <span
              className="ml-1 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
              onClick={() => {
                if (pageCount > 0) {
                  setInputValue(String(visiblePage));
                  setIsEditingPage(true);
                }
              }}
            >
              {pageCount > 0 ? visiblePage : '—'}
            </span>
          )}
          <span className="mx-1">/</span>
          <span>{pageCount > 0 ? pageCount : '—'}</span>
        </span>
        <div className="flex items-center space-x-2">
          <span className="font-mono w-12 text-right">{viewState.zoom}%</span>
          <input
            type="range"
            min="25"
            max="400"
            step="1"
            value={viewState.zoom}
            onChange={handleZoomChange}
            className="w-24 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
          />
        </div>
        <Badge
          variant="success"
          className="text-[10px] px-1.5 py-0 h-4 min-h-4 leading-none inline-flex items-center"
        >
          STATIC
        </Badge>
      </div>
    </div>
  );
};
