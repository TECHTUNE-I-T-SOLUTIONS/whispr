// Search Categories Configuration
// Maps categories to their allowed domains for Programmable Search Engine

export interface SearchCategory {
  name: string;
  description: string;
  domains: string[];
  keywords: string[];
}

export const SEARCH_CATEGORIES: Record<string, SearchCategory> = {
  news: {
    name: 'News',
    description: 'Breaking news, world news, technology news, business news',
    domains: [
      'bbc.com',
      'cnn.com',
      'reuters.com',
      'apnews.com',
      'nytimes.com',
      'washingtonpost.com',
      'theguardian.com',
      'aljazeera.com',
      'bloomberg.com',
      'techcrunch.com',
      'theverge.com',
      'wired.com',
      'arstechnica.com',
      'engadget.com',
    ],
    keywords: ['news', 'breaking', 'world', 'politics', 'business', 'technology', 'update'],
  },

  programming: {
    name: 'Programming & Documentation',
    description: 'Official documentation, frameworks, programming languages, APIs, SDKs',
    domains: [
      'developer.mozilla.org',
      'docs.python.org',
      'docs.oracle.com',
      'nodejs.org',
      'reactjs.org',
      'vuejs.org',
      'angular.io',
      'nextjs.org',
      'tailwindcss.com',
      'typescriptlang.org',
      'go.dev',
      'rust-lang.org',
      'kotlinlang.org',
      'swift.org',
      'developer.apple.com',
      'docs.microsoft.com',
      'learn.microsoft.com',
      'developer.android.com',
      'spring.io',
      'laravel.com',
      'django-project.com',
      'rubyonrails.org',
      'expressjs.com',
      'nestjs.com',
      'graphql.org',
      'openapis.org',
      'swagger.io',
    ],
    keywords: [
      'documentation', 'docs', 'api', 'sdk', 'framework', 'library',
      'programming', 'code', 'tutorial', 'guide', 'reference'
    ],
  },

  developer_communities: {
    name: 'Developer Communities',
    description: 'Open source, GitHub, community discussions, technical blogs',
    domains: [
      'github.com',
      'stackoverflow.com',
      'dev.to',
      'medium.com',
      'hashnode.com',
      'freecodecamp.org',
      'codepen.io',
      'css-tricks.com',
      'smashingmagazine.com',
      'sitepoint.com',
      'alistapart.com',
      'csswizardry.com',
      'web.dev',
      'webplatform.news',
    ],
    keywords: [
      'github', 'open source', 'community', 'discussion', 'blog',
      'tutorial', 'code', 'development', 'programming'
    ],
  },

  artificial_intelligence: {
    name: 'Artificial Intelligence',
    description: 'AI documentation, machine learning, research papers, models, datasets',
    domains: [
      'openai.com',
      'anthropic.com',
      'deepmind.com',
      'tensorflow.org',
      'pytorch.org',
      'keras.io',
      'scikit-learn.org',
      'huggingface.co',
      'paperswithcode.com',
      'arxiv.org',
      'arxiv.org/list/cs.AI/recent',
      'ai.google',
      'developers.google.com/ai',
      'ml.google',
      'nvidia.com',
      'intel.com',
      'microsoft.com/ai',
      'research.google',
      'openai.com/research',
    ],
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
      'neural network', 'llm', 'gpt', 'model', 'research', 'paper'
    ],
  },

  writing: {
    name: 'Writing & Creativity',
    description: 'Creative writing, blogging, poetry, storytelling, publishing, writing tutorials',
    domains: [
      'medium.com',
      'substack.com',
      'ghost.org',
      'wordpress.org',
      'blogger.com',
      'writethedocs.org',
      'writersdigest.com',
      'poetryfoundation.org',
      'poets.org',
      'nanowrimo.org',
      'reedsy.com',
      'prowritingaid.com',
      'grammarly.com',
      'hemingwayapp.com',
      'scrivener.com',
      'notion.so',
      'evernote.com',
    ],
    keywords: [
      'writing', 'creative writing', 'blog', 'blogging', 'poetry', 'story',
      'storytelling', 'publish', 'author', 'writer', 'content'
    ],
  },

  business: {
    name: 'Business & Startups',
    description: 'Entrepreneurship, startups, product management, marketing, finance',
    domains: [
      'techcrunch.com',
      'venturebeat.com',
      'forbes.com',
      'entrepreneur.com',
      'inc.com',
      'fastcompany.com',
      'hbr.org',
      'mckinsey.com',
      'bcg.com',
      'bain.com',
      'producthunt.com',
      'indiehackers.com',
      'ycombinator.com',
      'startup.school',
      'firstround.com',
      'a16z.com',
      'sequoiacap.com',
      'greylock.com',
    ],
    keywords: [
      'startup', 'entrepreneur', 'business', 'marketing', 'finance',
      'product', 'management', 'growth', 'venture', 'capital'
    ],
  },

  education: {
    name: 'Education',
    description: 'Courses, tutorials, universities, learning resources',
    domains: [
      'coursera.org',
      'edx.org',
      'udemy.com',
      'khanacademy.org',
      'mit.edu',
      'stanford.edu',
      'harvard.edu',
      'berkeley.edu',
      'ocw.mit.edu',
      'youtube.com',
      'pluralsight.com',
      'linkedin.com/learning',
      'skillshare.com',
      'codecademy.com',
      'freecodecamp.org',
      'educative.io',
      'egghead.io',
      'frontendmasters.com',
    ],
    keywords: [
      'course', 'tutorial', 'learn', 'education', 'university', 'college',
      'training', 'certification', 'study', 'lesson'
    ],
  },

  science: {
    name: 'Science & Technology',
    description: 'Scientific research, space, engineering, technology',
    domains: [
      'nasa.gov',
      'esa.int',
      'nature.com',
      'science.org',
      'sciencemag.org',
      'scientificamerican.com',
      'popsci.com',
      'wired.com',
      'ieee.org',
      'acm.org',
      'springer.com',
      'elsevier.com',
      'arxiv.org',
      'researchgate.net',
      'pubmed.ncbi.nlm.nih.gov',
      'sciencedirect.com',
    ],
    keywords: [
      'science', 'research', 'space', 'engineering', 'technology',
      'physics', 'chemistry', 'biology', 'scientific', 'study'
    ],
  },

  design: {
    name: 'Design',
    description: 'UI/UX, graphic design, product design',
    domains: [
      'dribbble.com',
      'behance.net',
      'figma.com',
      'sketch.com',
      'adobe.com',
      'canva.com',
      'awwwards.com',
      'cssdesignawards.com',
      'smashingmagazine.com',
      'alistapart.com',
      'nngroup.com',
      'lawsofux.com',
      'refactoringui.com',
      'designsystems.com',
      'material.io',
      'developer.apple.com/design',
      'developer.microsoft.com/design',
    ],
    keywords: [
      'design', 'ui', 'ux', 'interface', 'user experience', 'graphic',
      'product design', 'visual', 'layout', 'typography'
    ],
  },

  cybersecurity: {
    name: 'Cybersecurity',
    description: 'Security, privacy, best practices',
    domains: [
      'cve.mitre.org',
      'nist.gov',
      'owasp.org',
      'sans.org',
      'krebsonsecurity.com',
      'thehackernews.com',
      'bleepingcomputer.com',
      'wired.com',
      'schneier.com',
      'securityweek.com',
      'threatpost.com',
      'darkreading.com',
      'portswigger.net',
      'burp.com',
    ],
    keywords: [
      'security', 'cybersecurity', 'privacy', 'vulnerability', 'exploit',
      'hack', 'breach', 'threat', 'protection', 'encryption'
    ],
  },

  knowledge: {
    name: 'Knowledge',
    description: 'Encyclopedias, reference materials, general knowledge',
    domains: [
      'wikipedia.org',
      'britannica.com',
      'encyclopedia.com',
      'reference.com',
      'dictionary.com',
      'thesaurus.com',
      'howstuffworks.com',
      'explainthatstuff.com',
      'quora.com',
      'reddit.com',
      'stackexchange.com',
    ],
    keywords: [
      'wiki', 'encyclopedia', 'reference', 'definition', 'explain',
      'what is', 'how does', 'learn about', 'understand'
    ],
  },
};

// Helper function to determine category from query
export function getCategoryFromQuery(query: string): string {
  const lowerQuery = query.toLowerCase();

  for (const [key, category] of Object.entries(SEARCH_CATEGORIES)) {
    for (const keyword of category.keywords) {
      if (lowerQuery.includes(keyword)) {
        return key;
      }
    }
  }

  // Default to knowledge for general queries
  return 'knowledge';
}

// Helper function to get domains for a category
export function getDomainsForCategory(category: string): string[] {
  return SEARCH_CATEGORIES[category]?.domains || [];
}

// Helper function to get all domains
export function getAllDomains(): string[] {
  const domains: string[] = [];
  for (const category of Object.values(SEARCH_CATEGORIES)) {
    domains.push(...category.domains);
  }
  return [...new Set(domains)];
}
