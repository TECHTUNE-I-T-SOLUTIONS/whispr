"use client";

import { useState, useEffect } from 'react';

interface CommentData {
  name: string;
  email: string;
}

interface UseCommentCache {
  cachedData: CommentData | null;
  saveCommentData: (data: CommentData) => void;
  clearCommentData: () => void;
}

const COMMENT_CACHE_KEY = 'whispr_comment_data';
const CACHE_EXPIRY_DAYS = 30; // Cache expires after 30 days

export function useCommentCache(): UseCommentCache {
  const [cachedData, setCachedData] = useState<CommentData | null>(null);

  useEffect(() => {
    // Load cached data on mount
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(COMMENT_CACHE_KEY);
        if (cached) {
          const parsedData = JSON.parse(cached);
          const now = new Date().getTime();

          // Check if cache is expired
          if (parsedData.timestamp && (now - parsedData.timestamp) > (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)) {
            // Cache expired, remove it
            localStorage.removeItem(COMMENT_CACHE_KEY);
            setCachedData(null);
          } else {
            // Cache is valid
            setCachedData({
              name: parsedData.name,
              email: parsedData.email
            });
          }
        }
      } catch (error) {
        console.error('Error loading comment cache:', error);
        // Clear corrupted cache
        localStorage.removeItem(COMMENT_CACHE_KEY);
      }
    };

    loadCachedData();
  }, []);

  const saveCommentData = (data: CommentData) => {
    try {
      const cacheData = {
        name: data.name.trim(),
        email: data.email.trim(),
        timestamp: new Date().getTime()
      };

      localStorage.setItem(COMMENT_CACHE_KEY, JSON.stringify(cacheData));
      setCachedData(data);
    } catch (error) {
      console.error('Error saving comment cache:', error);
    }
  };

  const clearCommentData = () => {
    try {
      localStorage.removeItem(COMMENT_CACHE_KEY);
      setCachedData(null);
    } catch (error) {
      console.error('Error clearing comment cache:', error);
    }
  };

  return {
    cachedData,
    saveCommentData,
    clearCommentData
  };
}
