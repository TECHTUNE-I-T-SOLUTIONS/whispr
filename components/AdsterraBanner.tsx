"use client";
import { useEffect, useRef, useState } from "react";

export function AdsterraBanner() {
  const adRef1 = useRef<HTMLDivElement>(null);
  const adRef2 = useRef<HTMLDivElement>(null);
  const [showAds, setShowAds] = useState<boolean | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetch("/api/ads-settings")
      .then((res) => res.json())
      .then((data) => setShowAds(data?.show_ads ?? false))
      .catch(() => setShowAds(false));
  }, []);

  useEffect(() => {
    if (!showAds || hasError) return;

    // Add global error handler for script errors
    const handleScriptError = (event: ErrorEvent) => {
      // Ignore errors from ad domains
      if (event.filename?.includes('highperformanceformat.com') || 
          event.filename?.includes('effectivegatecpm.com')) {
        event.preventDefault();
        setHasError(true);
      }
    };

    window.addEventListener('error', handleScriptError);

    const loadScript = (src: string, parent: HTMLElement): Promise<HTMLScriptElement> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        
        script.onload = () => resolve(script);
        script.onerror = () => {
          // Silently fail - ad scripts often fail due to ad blockers
          parent.innerHTML = '';
          reject(new Error('Ad script failed to load'));
        };
        
        script.src = src;
        parent.appendChild(script);
      });
    };

    // Adsterra iframe banner
    if (adRef1.current) {
      try {
        const script1 = document.createElement('script');
        script1.type = 'text/javascript';
        script1.textContent = `
          atOptions = {
            'key' : 'cf4f74123f08a93fa2b9c21405fb0da4',
            'format' : 'iframe',
            'height' : 60,
            'width' : 468,
            'params' : {}
          };
        `;
        adRef1.current.appendChild(script1);
        
        loadScript('https://www.highperformanceformat.com/cf4f74123f08a93fa2b9c21405fb0da4/invoke.js', adRef1.current).catch(() => {});
      } catch (e) {
        // Silently fail
        if (adRef1.current) adRef1.current.innerHTML = '';
      }
    }
    
    // Adsterra async banner
    if (adRef2.current) {
      try {
        const div = document.createElement('div');
        div.id = 'container-595afd21b56559223443ca3b653978bd';
        adRef2.current.appendChild(div);
        
        loadScript('https://pl27902130.effectivegatecpm.com/595afd21b56559223443ca3b653978bd/invoke.js', adRef2.current).catch(() => {});
      } catch (e) {
        // Silently fail
        if (adRef2.current) adRef2.current.innerHTML = '';
      }
    }

    return () => {
      window.removeEventListener('error', handleScriptError);
    };
  }, [showAds, hasError]);

  if (!showAds || hasError) return null;
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div ref={adRef1} />
      <div ref={adRef2} />
    </div>
  );
}
