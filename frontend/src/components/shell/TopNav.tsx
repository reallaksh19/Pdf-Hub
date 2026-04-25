import React, { useState, useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sun, Moon, Settings, Search, X } from 'lucide-react';
import { useSearchStore } from '@/core/search/store';
import { useSessionStore } from '@/core/session/store';
import { useEditorStore } from '@/core/editor/store';
import { SearchIndexer } from '@/core/search/indexer';
import { error as logError } from '@/core/logger/service';
import { useToastStore } from '@/core/toast/store';

export const TopNav: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { documentKey, fileName, isDirty } = useSessionStore();
  const { setSidebarTab, setLeftPanelWidth, leftPanelWidth } = useEditorStore();

  React.useEffect(() => {
    if (fileName) {
      document.title = `${isDirty ? '• ' : ''}${fileName} - DocCraft`;
    } else {
      document.title = 'DocCraft';
    }
  }, [fileName, isDirty]);
  const {
    query,
    setQuery,
    setHits,
    setError,
    clearSearch,
    nextHit,
    setIsSearching
  } = useSearchStore();
  const addToast = useToastStore((state) => state.addToast);

  const [localQuery, setLocalQuery] = useState(query);
  const debounceRef = useRef<number | null>(null);

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setLocalQuery(query);
  }

  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!documentKey) return;
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    try {
      const cache = SearchIndexer.getCache(documentKey);
      if (!cache) {
        setHits([]);
        return;
      }
      const results = SearchIndexer.search(cache, searchQuery, { caseSensitive: false, wholeWord: false, useRegex: false });
      setHits(results.map((r, i) => ({
        id: `hit-${i}`,
        pageNumber: r.pageNumber,
        snippet: r.text,
        rects: [r.rect]
      })));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      logError('pdf-renderer', 'Search failed from top navigation', { error: message });
      addToast({
        type: 'error',
        title: 'Search Failed',
        message,
      });
    } finally {
      setIsSearching(false);
    }
  }, [documentKey, clearSearch, setIsSearching, setHits, setError, addToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setQuery('');
      clearSearch();
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      setQuery(value);
      executeSearch(value);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (leftPanelWidth < 1) {
        setLeftPanelWidth(20);
      }
      setSidebarTab('search');

      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      if (localQuery.trim()) {
        if (localQuery === query) {
          nextHit();
        } else {
          setQuery(localQuery);
          executeSearch(localQuery);
        }
      }
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    setQuery('');
    clearSearch();
  };

  return (
    <div className="flex items-center justify-between h-12 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded-sm"></div>
          <span className="font-bold text-lg hidden sm:inline-block">
            {fileName ? (isDirty ? `• ${fileName}` : fileName) : 'DocCraft'}
          </span>
          <Badge data-testid="mode-badge" variant="success" className="ml-2">
            STATIC
          </Badge>
        </div>

        {fileName && (
          <div className="hidden lg:flex items-center ml-4 px-3 py-1 bg-slate-100 dark:bg-slate-800/50 rounded text-sm text-slate-700 dark:text-slate-300 font-medium">
            <span className="truncate max-w-[300px]">
              {isDirty && <span className="text-blue-500 mr-1 font-bold">•</span>}
              {fileName}
            </span>
          </div>
        )}

        <div className="hidden md:flex space-x-1 pl-4 ml-4 border-l border-slate-200 dark:border-slate-800">
          <NavLink
            to="/workspace"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50'
              }`
            }
          >
            Workspace
          </NavLink>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative hidden lg:block">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={localQuery}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search document..."
            className="h-9 w-48 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {localQuery && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button data-testid="theme-toggle" variant="ghost" size="icon" onClick={toggleDarkMode}>
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Settings (coming soon)"
          onClick={() =>
            addToast({ type: 'info', title: 'Settings', message: 'Settings panel coming in the next phase.' })
          }
        >
          <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </Button>
      </div>
    </div>
  );
};
