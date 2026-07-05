'use client';

import React, { useState } from 'react';
import { Loader2, Sparkles, Check, X } from 'lucide-react';

interface EditorAIProps {
  content: string;
  userId?: string;
  onContentChange?: (content: string) => void;
  onSuggestionApply?: (suggestion: string) => void;
}

type SuggestionType = 'grammar' | 'seo' | 'outline' | 'headline' | 'tags' | 'category';

export default function EditorAI({ content, userId, onContentChange, onSuggestionApply }: EditorAIProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SuggestionType>('grammar');
  const [suggestions, setSuggestions] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const tabs: Array<{ key: SuggestionType; label: string }> = [
    { key: 'grammar', label: 'Grammar' },
    { key: 'seo', label: 'SEO' },
    { key: 'outline', label: 'Outline' },
    { key: 'headline', label: 'Headlines' },
    { key: 'tags', label: 'Tags' },
    { key: 'category', label: 'Category' },
  ];

  const fetchSuggestions = async (type: SuggestionType) => {
    if (!content.trim()) {
      setError('Please enter some content first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const response = await fetch('/api/ai/editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggestions',
          content,
          options: { type },
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }

      setSuggestions(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: SuggestionType) => {
    setActiveTab(tab);
    if (tab !== activeTab) {
      fetchSuggestions(tab);
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (onSuggestionApply) {
      onSuggestionApply(suggestion);
    } else if (onContentChange) {
      onContentChange(suggestion);
    }
  };

  const renderSuggestions = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Generating suggestions...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-8 text-red-500 dark:text-red-400">
          <X className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      );
    }

    if (!suggestions) {
      return (
        <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
          <Sparkles className="w-5 h-5 mr-2" />
          <span>Select a tab to get AI suggestions</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'grammar':
        return (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Improved Version</h4>
              <p className="text-green-700 dark:text-green-400">{suggestions}</p>
              <button
                onClick={() => applySuggestion(suggestions)}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        );

      case 'seo':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">SEO Title</h4>
              <p className="text-blue-700 dark:text-blue-400">{suggestions.title}</p>
              <button
                onClick={() => onSuggestionApply?.(suggestions.title)}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-800"
              >
                Use Title
              </button>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Meta Description</h4>
              <p className="text-purple-700 dark:text-purple-400">{suggestions.description}</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2">Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.keywords.map((keyword: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full text-sm cursor-pointer hover:bg-orange-300 dark:hover:bg-orange-700"
                    onClick={() => onSuggestionApply?.(keyword)}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'outline':
        return (
          <div className="space-y-2">
            {suggestions.map((item: string, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                onClick={() => onSuggestionApply?.(item)}
              >
                <p className="text-gray-700 dark:text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        );

      case 'headline':
        return (
          <div className="space-y-2">
            {suggestions.map((headline: string, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer"
                onClick={() => onSuggestionApply?.(headline)}
              >
                <p className="font-medium text-indigo-700 dark:text-indigo-300">{headline}</p>
              </div>
            ))}
          </div>
        );

      case 'tags':
        return (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((tag: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-full text-sm cursor-pointer hover:bg-teal-200 dark:hover:bg-teal-900/50"
                onClick={() => onSuggestionApply?.(tag)}
              >
                <Check className="w-3 h-3 inline mr-1" />
                {tag}
              </span>
            ))}
          </div>
        );

      case 'category':
        return (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="font-medium text-amber-800 dark:text-amber-300 text-lg">{suggestions}</p>
            <button
              onClick={() => onSuggestionApply?.(suggestions)}
              className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 dark:hover:bg-amber-800"
            >
              Apply Category
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
      <div className="flex items-center border-b border-gray-200 dark:border-slate-700">
        <Sparkles className="w-5 h-5 text-purple-500 ml-3 mr-2" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">AI Assistant</h3>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-b-2 border-purple-500'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 min-h-[200px] bg-white dark:bg-slate-900">
        {renderSuggestions()}
      </div>
    </div>
  );
}
