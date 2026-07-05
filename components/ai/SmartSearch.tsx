'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ExternalLink, BookOpen, Github, Youtube, Newspaper } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  sourceLabel?: string;
  sourceIcon?: string;
  type: string;
  credibility?: number;
  category?: string;
  displayLink?: string;
  channel?: string;
  stars?: number;
  publishedAt?: string;
}

interface SmartSearchProps {
  onResultClick?: (result: SearchResult) => void;
  userId?: string;
  placeholder?: string;
}

export default function SmartSearch({ onResultClick, userId, placeholder = 'Search anything...' }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    local: SearchResult[];
    external: SearchResult[];
    combined: SearchResult[];
  }>({ local: [], external: [], combined: [] });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce suggestions to avoid costly API calls on every keystroke
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    suggestionsTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/ai/search?q=${encodeURIComponent(q)}&limit=3`);
        const data = await response.json();
        if (data?.combined?.length > 0) {
          setSuggestions(data.combined.slice(0, 3).map((r: SearchResult) => r.title));
        } else if (data?.local?.length > 0) {
          setSuggestions(data.local.slice(0, 3).map((r: SearchResult) => r.title));
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      }
    }, 400); // 400ms debounce
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowResults(true);

    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          type: 'all',
          limit: 20,
          userId,
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getSourceMeta = (source: string) => {
    const meta: Record<string, { icon: React.ReactNode; color: string }> = {
      wikipedia: { icon: <BookOpen className="w-4 h-4" />, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
      github: { icon: <Github className="w-4 h-4" />, color: 'text-gray-800 bg-gray-200 dark:bg-gray-700' },
      youtube: { icon: <Youtube className="w-4 h-4" />, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
      news: { icon: <Newspaper className="w-4 h-4" />, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
      google_search: { icon: <Search className="w-4 h-4" />, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
      duckduckgo: { icon: <Search className="w-4 h-4" />, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    };
    return meta[source] || { icon: <Search className="w-4 h-4" />, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' };
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-auto mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full h-10 pl-12 pr-12 py-4 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg bg-transparent dark:bg-transparent text-gray-900 dark:text-white"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500 animate-spin" />
        )}
      </div>

      {showResults && (results.combined.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg max-h-[600px] overflow-y-auto z-50">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
            </div>
          ) : (
            <>
              {results.local.length > 0 && (
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">From Whispr</h4>
                  {results.local.map((result) => {
                    const meta = getSourceMeta(result.source);
                    return (
                      <a
                        key={result.id}
                        href={result.url}
                        target={result.url?.startsWith('http') ? '_blank' : '_self'}
                        rel={result.url?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        onClick={() => setShowResults(false)}
                        className="block p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors no-underline"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${meta.color}`}>
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 truncate">{result.title}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{result.summary}</p>
                            {result.url && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{result.url}</p>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {results.external.length > 0 && (
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">From the Web</h4>
                  {results.external.slice(0, 10).map((result) => {
                    const meta = getSourceMeta(result.source);
                    return (
                      <a
                        key={result.id}
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowResults(false)}
                        className="block p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors no-underline"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${meta.color}`}>
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 truncate">{result.title}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{result.summary}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {result.sourceLabel && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                  {result.sourceLabel}
                                </span>
                              )}
                              {result.displayLink && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{result.displayLink}</span>
                              )}
                              {result.channel && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{result.channel}</span>
                              )}
                              {result.stars && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">⭐ {result.stars}</span>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {results.combined.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No results found. Try a different search term.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {suggestions.length > 0 && !showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-50">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              onClick={() => {
                setQuery(suggestion);
                handleSearch(suggestion);
              }}
              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer text-gray-700 dark:text-gray-300"
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
