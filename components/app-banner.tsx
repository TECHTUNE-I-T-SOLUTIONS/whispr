'use client';

import { useEffect, useState } from 'react';
import { X, Download, ArrowUpRight } from 'lucide-react';

interface AppBannerProps {
  postId?: string;
  postType?: 'chronicles' | 'post';
}

/**
 * Smart App Banner Component
 * 
 * Features:
 * - Detects if user is on mobile
 * - Shows banner suggesting to open in Whispr mobile app
 * - Attempts to open app via deeplink (whispr://app/{type}/{id})
 * - Shows app store download links if app not installed
 * - Respects user dismissal with localStorage
 */
export function AppBanner({ postId, postType = 'chronicles' }: AppBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [appInstalled, setAppInstalled] = useState<boolean | null>(null);
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(null);

  const BANNER_STORAGE_KEY = 'whispr_app_banner_dismissed';
  const DISMISS_DURATION_HOURS = 24;
  const DEEPLINK_CHECK_TIMEOUT = 1500; // milliseconds

  useEffect(() => {
    // Check if on mobile
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      );
    setIsMobile(isMobileDevice);

    // Check if user has dismissed banner recently
    const storedDismissal = localStorage.getItem(BANNER_STORAGE_KEY);
    if (storedDismissal) {
      try {
        const dismissedTimestamp = JSON.parse(storedDismissal);
        const now = Date.now();
        if (now < dismissedTimestamp) {
          setDismissedUntil(dismissedTimestamp);
          return; // Don't show banner if recently dismissed
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (isMobileDevice) {
      // Attempt to detect if app is installed
      checkIfAppInstalled();
      setIsVisible(true);
    }
  }, []);

  /**
   * Checks if the Whispr app is installed by attempting to open a deeplink
   * If app is not installed, the deeplink will fail and we'll show install prompts
   */
  const checkIfAppInstalled = async () => {
    // Try to open a dummy deeplink
    const testDeeplink = 'whispr://app/test';
    const timestamp = Date.now();

    try {
      // Attempt to open deeplink
      window.location.href = testDeeplink;

      // If we're still on the page after timeout, app likely isn't installed
      await new Promise((resolve) => {
        setTimeout(resolve, DEEPLINK_CHECK_TIMEOUT);
      });

      // Check if page visibility changed (indicating app opened)
      if (document.hidden) {
        setAppInstalled(true);
      } else {
        setAppInstalled(false);
      }
    } catch (e) {
      setAppInstalled(false);
    }
  };

  const handleOpenInApp = () => {
    if (!postId || !postType) return;

    // Try to open via deeplink
    const deeplink = `whispr://app/${postType}/${postId}`;
    window.location.href = deeplink;

    // Fallback to web version after timeout
    setTimeout(() => {
      if (!document.hidden) {
        // App didn't open, show install option
        setAppInstalled(false);
      }
    }, DEEPLINK_CHECK_TIMEOUT);
  };

  const handleDismiss = () => {
    const dismissUntil = Date.now() + DISMISS_DURATION_HOURS * 60 * 60 * 1000;
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(dismissUntil));
    setIsVisible(false);
  };

  const handleOpenPlayStore = () => {
    window.open(
      'https://play.google.com/store/apps/details?id=com.whispr.whisprmobile',
      '_blank'
    );
  };

  const handleOpenAppStore = () => {
    window.open(
      'https://apps.apple.com/app/whispr/id1234567890',
      '_blank'
    );
  };

  if (!isVisible || !isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <Sparkle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold truncate">
                Open in Whispr App
              </p>
              <p className="text-xs sm:text-sm opacity-90 hidden sm:block">
                Get a better reading experience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {postId && postType && (
              <button
                onClick={handleOpenInApp}
                className="bg-white text-purple-600 hover:bg-gray-100 px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-colors flex items-center gap-2"
                aria-label="Open in app"
              >
                <ArrowUpRight className="w-4 h-4 hidden sm:inline" />
                <span>Open</span>
              </button>
            )}

            {appInstalled === false && (
              <>
                {/android/i.test(navigator.userAgent) ? (
                  <button
                    onClick={handleOpenPlayStore}
                    className="bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-colors flex items-center gap-2"
                    aria-label="Get from Play Store"
                  >
                    <Download className="w-4 h-4 hidden sm:inline" />
                    <span className="hidden sm:inline">Get App</span>
                    <span className="sm:hidden">Get</span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenAppStore}
                    className="bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-colors flex items-center gap-2"
                    aria-label="Get from App Store"
                  >
                    <Download className="w-4 h-4 hidden sm:inline" />
                    <span className="hidden sm:inline">Get App</span>
                    <span className="sm:hidden">Get</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={handleDismiss}
              className="hover:bg-white/10 p-2 rounded-lg transition-colors flex-shrink-0"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sparkle icon component
 */
function Sparkle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
