import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useSessionStore } from '@/core/session/store';

export const StatusBar: React.FC = () => {
  const { isDirty, viewState, pageCount, setZoom, setPage } = useSessionStore();

  const [visiblePage, setVisiblePage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [isEditingPage, setIsEditingPage] = useState(false);

  useEffect(() => {
    const container = document.getElementById('workspace-scroll-container');
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (mostVisible) {
          const pageAttr = (mostVisible.target as HTMLElement).dataset.page;
          if (pageAttr) {
            const num = parseInt(pageAttr, 10);
            setVisiblePage(num);
          }
        }
      },
      {
        root: container,
        threshold: [0, 0.5, 1.0],
      },
    );

    container.querySelectorAll('[data-page]').forEach(el => observer.observe(el));

    const mutationObs = new MutationObserver(() => {
      observer.disconnect();
      container.querySelectorAll('[data-page]').forEach(el => observer.observe(el));
    });
    mutationObs.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObs.disconnect();
    };
  }, []);



  const commitPageInput = (value: string) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= pageCount) {
      setPage(parsed);
      setVisiblePage(parsed);
      setInputValue(parsed.toString());
    } else {
      setInputValue(visiblePage.toString());
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

      e.currentTarget.blur();
    }
  };

  const zoomSteps = [25, 50, 75, 100, 125, 150, 200, 300, 400];

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const closest = zoomSteps.reduce((prev, curr) =>
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev,
    );
    setZoom(closest);
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
        <div className="flex items-center space-x-1">
          <span className="font-mono text-slate-500">Page</span>
          <input
            type="text"
            className="w-10 px-1 py-0.5 text-center bg-transparent border border-transparent rounded hover:border-slate-300 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors font-mono"
            value={isEditingPage ? inputValue : visiblePage.toString()}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsEditingPage(true)}
            onBlur={(e) => commitPageInput(e.target.value)}
            onKeyDown={handlePageInputKeyDown}
            disabled={pageCount === 0}
          />
          <span className="font-mono text-slate-500">of {pageCount > 0 ? pageCount : '—'}</span>
        </div>
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
