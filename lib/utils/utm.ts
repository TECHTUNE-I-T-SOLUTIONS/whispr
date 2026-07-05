// UTM Tracking Utility
// Adds Whispr referral tracking to external URLs

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://whisprwords.vercel.app';

export function addUtmTracking(url: string, source: string, medium: string = 'referral'): string {
  if (!url || url.startsWith('/') || url.startsWith(SITE_URL)) {
    return url; // Don't track internal links
  }

  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    // Only add UTM if not already present
    if (!params.has('utm_source')) {
      params.set('utm_source', 'whispr');
      params.set('utm_medium', medium);
      params.set('utm_campaign', source);
      urlObj.search = params.toString();
    }
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    google_search: 'Google',
    duckduckgo: 'DuckDuckGo',
    bing_search: 'Bing',
    wikipedia: 'Wikipedia',
    github: 'GitHub',
    youtube: 'YouTube',
    news: 'Google News',
    knowledge: 'Whispr Knowledge',
    database: 'Whispr',
    chronicles: 'Chronicles',
  };
  return labels[source] || source;
}

export function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    google_search: '🔍',
    duckduckgo: '🦆',
    bing_search: '🔵',
    wikipedia: '📚',
    github: '💻',
    youtube: '🎬',
    news: '📰',
    knowledge: '🧠',
    database: '📝',
    chronicles: '📖',
  };
  return icons[source] || '🔗';
}
