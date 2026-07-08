// RSS Source Configuration
// Central registry of all RSS feeds organized by category and country

export interface RSSSource {
  id: string;
  name: string;
  country: string;
  category: string;
  rssUrl: string;
  website: string;
  priority: number;
  credibilityScore: number;
  enabled: boolean;
}

export const RSS_SOURCES: RSSSource[] = [
  // 🇳🇬 Nigeria
  {
    id: 'channels-tv',
    name: 'Channels TV',
    country: 'NG',
    category: 'news',
    rssUrl: 'https://www.channelstv.com/feed/',
    website: 'https://www.channelstv.com',
    priority: 1,
    credibilityScore: 0.85,
    enabled: true,
  },
  {
    id: 'premium-times',
    name: 'Premium Times',
    country: 'NG',
    category: 'news',
    rssUrl: 'https://www.premiumtimesng.com/feed',
    website: 'https://www.premiumtimesng.com',
    priority: 1,
    credibilityScore: 0.9,
    enabled: true,
  },
  {
    id: 'punch',
    name: 'Punch',
    country: 'NG',
    category: 'news',
    rssUrl: 'https://punchng.com/feed/',
    website: 'https://punchng.com',
    priority: 1,
    credibilityScore: 0.85,
    enabled: true,
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    country: 'NG',
    category: 'news',
    rssUrl: 'https://www.vanguardngr.com/feed/',
    website: 'https://www.vanguardngr.com',
    priority: 1,
    credibilityScore: 0.8,
    enabled: true,
  },
  {
    id: 'guardian-nigeria',
    name: 'The Guardian Nigeria',
    country: 'NG',
    category: 'news',
    rssUrl: 'https://guardian.ng/feed/',
    website: 'https://guardian.ng',
    priority: 1,
    credibilityScore: 0.85,
    enabled: false, // Disabled due to 403 errors
  },
  {
    id: 'daily-post',
    name: 'Daily Post',
    country: 'NG',
    category: 'news',
    rssUrl: 'https://dailypost.ng/feed/',
    website: 'https://dailypost.ng',
    priority: 2,
    credibilityScore: 0.75,
    enabled: true,
  },
  {
    id: 'tribune',
    name: 'Tribune',
    country: 'NG',
    category: 'news',
    rssUrl: 'https://tribuneonlineng.com/feed/',
    website: 'https://tribuneonlineng.com',
    priority: 2,
    credibilityScore: 0.75,
    enabled: true,
  },
  {
    id: 'leadership',
    name: 'Leadership',
    country: 'NG',
    category: 'news',
    rssUrl: 'https://leadership.ng/feed/',
    website: 'https://leadership.ng',
    priority: 2,
    credibilityScore: 0.75,
    enabled: true,
  },
  {
    id: 'businessday',
    name: 'BusinessDay',
    country: 'NG',
    category: 'business',
    rssUrl: 'https://businessday.ng/feed/',
    website: 'https://businessday.ng',
    priority: 1,
    credibilityScore: 0.8,
    enabled: true,
  },
  {
    id: 'nairametrics',
    name: 'Nairametrics',
    country: 'NG',
    category: 'business',
    rssUrl: 'https://nairametrics.com/feed/',
    website: 'https://nairametrics.com',
    priority: 1,
    credibilityScore: 0.8,
    enabled: true,
  },
  {
    id: 'techcabal',
    name: 'TechCabal',
    country: 'NG',
    category: 'technology',
    rssUrl: 'https://techcabal.com/feed/',
    website: 'https://techcabal.com',
    priority: 1,
    credibilityScore: 0.85,
    enabled: true,
  },
  {
    id: 'techpoint-africa',
    name: 'Techpoint Africa',
    country: 'NG',
    category: 'technology',
    rssUrl: 'https://techpoint.africa/feed/',
    website: 'https://techpoint.africa',
    priority: 1,
    credibilityScore: 0.85,
    enabled: true,
  },

  // 🌍 International
  {
    id: 'reuters',
    name: 'Reuters',
    country: 'US',
    category: 'news',
    rssUrl: 'https://www.reutersagency.com/feed/',
    website: 'https://www.reuters.com',
    priority: 1,
    credibilityScore: 0.95,
    enabled: false, // Disabled due to 404 errors
  },
  {
    id: 'ap-news',
    name: 'AP News',
    country: 'US',
    category: 'news',
    rssUrl: 'https://apnews.com/hub/ap-top-news',
    website: 'https://apnews.com',
    priority: 1,
    credibilityScore: 0.95,
    enabled: false, // Disabled until RSS is confirmed
  },
  {
    id: 'bbc-news',
    name: 'BBC News',
    country: 'UK',
    category: 'news',
    rssUrl: 'http://feeds.bbci.co.uk/news/rss.xml',
    website: 'https://www.bbc.com/news',
    priority: 1,
    credibilityScore: 0.95,
    enabled: true,
  },
  {
    id: 'bbc-world',
    name: 'BBC World',
    country: 'UK',
    category: 'news',
    rssUrl: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    website: 'https://www.bbc.com/news/world',
    priority: 1,
    credibilityScore: 0.95,
    enabled: true,
  },
  {
    id: 'bbc-technology',
    name: 'BBC Technology',
    country: 'UK',
    category: 'technology',
    rssUrl: 'http://feeds.bbci.co.uk/news/technology/rss.xml',
    website: 'https://www.bbc.com/news/technology',
    priority: 1,
    credibilityScore: 0.95,
    enabled: true,
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    country: 'US',
    category: 'technology',
    rssUrl: 'https://www.theverge.com/rss/index.xml',
    website: 'https://www.theverge.com',
    priority: 1,
    credibilityScore: 0.85,
    enabled: true,
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    country: 'US',
    category: 'technology',
    rssUrl: 'https://techcrunch.com/feed/',
    website: 'https://techcrunch.com',
    priority: 1,
    credibilityScore: 0.85,
    enabled: true,
  },
  {
    id: 'ars-technica',
    name: 'Ars Technica',
    country: 'US',
    category: 'technology',
    rssUrl: 'http://feeds.arstechnica.com/arstechnica/index',
    website: 'https://arstechnica.com',
    priority: 1,
    credibilityScore: 0.9,
    enabled: true,
  },
  {
    id: 'wired',
    name: 'Wired',
    country: 'US',
    category: 'technology',
    rssUrl: 'https://www.wired.com/feed/rss',
    website: 'https://www.wired.com',
    priority: 1,
    credibilityScore: 0.85,
    enabled: true,
  },

  // AI
  {
    id: 'hugging-face',
    name: 'Hugging Face',
    country: 'US',
    category: 'ai',
    rssUrl: 'https://huggingface.co/blog/feed.xml',
    website: 'https://huggingface.co/blog',
    priority: 1,
    credibilityScore: 0.9,
    enabled: true,
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    country: 'US',
    category: 'ai',
    rssUrl: 'https://blog.google/technology/ai/rss/',
    website: 'https://blog.google/technology/ai/',
    priority: 1,
    credibilityScore: 0.95,
    enabled: true,
  },
  {
    id: 'openai',
    name: 'OpenAI News',
    country: 'US',
    category: 'ai',
    rssUrl: 'https://openai.com/news/rss.xml',
    website: 'https://openai.com/news',
    priority: 1,
    credibilityScore: 0.95,
    enabled: false, // Disabled until RSS is confirmed
  },

  // Programming
  {
    id: 'github-blog',
    name: 'GitHub Blog',
    country: 'US',
    category: 'programming',
    rssUrl: 'https://github.blog/feed/',
    website: 'https://github.blog',
    priority: 1,
    credibilityScore: 0.9,
    enabled: true,
  },
  {
    id: 'stack-overflow-blog',
    name: 'Stack Overflow Blog',
    country: 'US',
    category: 'programming',
    rssUrl: 'https://stackoverflow.blog/feed/',
    website: 'https://stackoverflow.blog',
    priority: 1,
    credibilityScore: 0.9,
    enabled: true,
  },
  {
    id: 'vercel-blog',
    name: 'Vercel',
    country: 'US',
    category: 'programming',
    rssUrl: 'https://vercel.com/blog/rss.xml',
    website: 'https://vercel.com/blog',
    priority: 1,
    credibilityScore: 0.85,
    enabled: true,
  },
  {
    id: 'nextjs-blog',
    name: 'Next.js',
    country: 'US',
    category: 'programming',
    rssUrl: 'https://nextjs.org/feed.xml',
    website: 'https://nextjs.org',
    priority: 1,
    credibilityScore: 0.9,
    enabled: true,
  },
  {
    id: 'supabase-blog',
    name: 'Supabase',
    country: 'US',
    category: 'programming',
    rssUrl: 'https://supabase.com/blog/rss.xml',
    website: 'https://supabase.com/blog',
    priority: 1,
    credibilityScore: 0.85,
    enabled: true,
  },
  {
    id: 'flutter-blog',
    name: 'Flutter',
    country: 'US',
    category: 'programming',
    rssUrl: 'https://medium.com/feed/flutter',
    website: 'https://flutter.dev',
    priority: 1,
    credibilityScore: 0.9,
    enabled: true,
  },

  // Science
  {
    id: 'nasa',
    name: 'NASA',
    country: 'US',
    category: 'science',
    rssUrl: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    website: 'https://www.nasa.gov',
    priority: 1,
    credibilityScore: 0.95,
    enabled: true,
  },
  {
    id: 'nature',
    name: 'Nature',
    country: 'UK',
    category: 'science',
    rssUrl: 'https://www.nature.com/nature.rss',
    website: 'https://www.nature.com',
    priority: 1,
    credibilityScore: 0.95,
    enabled: true,
  },

  // Business
  {
    id: 'forbes',
    name: 'Forbes',
    country: 'US',
    category: 'business',
    rssUrl: 'https://www.forbes.com/feed/',
    website: 'https://www.forbes.com',
    priority: 1,
    credibilityScore: 0.8,
    enabled: false, // Disabled due to 403 errors
  },
];

// Helper functions to get sources by category/country
export function getRSSSourcesByCategory(category: string): RSSSource[] {
  return RSS_SOURCES.filter(source => 
    source.category === category && source.enabled
  );
}

export function getRSSSourcesByCountry(country: string): RSSSource[] {
  return RSS_SOURCES.filter(source => 
    source.country === country && source.enabled
  );
}

export function getEnabledRSSSources(): RSSSource[] {
  return RSS_SOURCES.filter(source => source.enabled);
}

export function getRSSSourceById(id: string): RSSSource | undefined {
  return RSS_SOURCES.find(source => source.id === id);
}
