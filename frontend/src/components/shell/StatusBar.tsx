import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useSessionStore } from '@/core/session/store';

export const StatusBar: React.FC = () => {
  const { isDirty, viewState, pageCount, setZoom, setPage } = useSessionStore();
  const zoomSteps = [25, 50, 75, 100, 125, 150, 200, 300, 400];
  const [localPageValue, setLocalPageValue] = useState('');
  const [isEditingInput, setIsEditingInput] = useState(false);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const closest = zoomSteps.reduce((prev, curr) =>
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev,
    );
    setZoom(closest);
  };

  const handleFocus = () => {
    setLocalPageValue(String(viewState.currentPage));
    setIsEditingInput(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalPageValue(e.target.value);
  };

  const commitPage = (value: string) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= pageCount) {
      setPage(parsed);
    }
    setIsEditingInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitPage(e.currentTarget.value);
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      setIsEditingInput(false);
      e.currentTarget.blur();
    }
  };

  const displayPage = isEditingInput ? localPageValue : String(viewState.currentPage ?? 1);

  return (
    <div className="flex items-center justify-between px-4 h-8 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 z-10 shrink-0">
      <div className="flex items-center space-x-4">
        <span>DocCraft Static</span>
        {isDirty && (
          <div
            title="Unsaved changes"
            style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: 'var(--color-text-warning)',
              marginLeft: 6,
              flexShrink: 0,
            }}
          />
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="font-mono flex items-center space-x-1">
          <span>Page:</span>
          {pageCount > 0 ? (
            <>
              <input
                className="w-10 text-center bg-transparent border-b border-transparent focus:border-slate-300 dark:focus:border-slate-600 focus:outline-none focus:bg-slate-200 dark:focus:bg-slate-800"
                value={displayPage}
                onFocus={handleFocus}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={(e) => commitPage(e.target.value)}
              />
              <span>/ {pageCount}</span>
            </>
          ) : (
            <span>— / —</span>
          )}
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
