import { Metadata } from 'next';
import { Github, ExternalLink, Calendar, Tag, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Changelog - Whispr',
  description: 'View the latest updates, features, and improvements to Whispr',
};

async function getGitHubReleases() {
  try {
    const response = await fetch(
      'https://api.github.com/repos/TECHTUNE-I-T-SOLUTIONS/whispr/releases?per_page=20',
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch releases:', response.status);
      return [];
    }

    const releases = await response.json();
    return releases;
  } catch (error) {
    console.error('Error fetching GitHub releases:', error);
    return [];
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function parseReleaseBody(body: string) {
  const features: string[] = [];
  const enhancements: string[] = [];
  const fixes: string[] = [];

  const lines = body.split('\n');
  let currentSection: 'features' | 'enhancements' | 'fixes' | null = null;
  let skipNextLines = false;
  let hasMainSections = false;

  // First pass: check if there are proper main section headers
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## New Features') || trimmed.startsWith('### New Features') || 
        trimmed.startsWith('## Improvements') || trimmed.startsWith('### Improvements') ||
        trimmed.startsWith('## Bug Fixes') || trimmed.startsWith('### Bug Fixes')) {
      hasMainSections = true;
      break;
    }
  }

  // If no main sections, return empty to trigger fallback display
  if (!hasMainSections) {
    return { features: [], enhancements: [], fixes: [] };
  }

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip metadata lines
    if (trimmed.startsWith('Workflow Changes:') || 
        trimmed.startsWith('Engineer:') ||
        trimmed.startsWith('Generated with') ||
        trimmed.startsWith('Co-Authored-By') ||
        trimmed.startsWith('Complete Release Notes') ||
        trimmed.startsWith('Changes in this release:') ||
        trimmed.startsWith('**Full Changelog**')) {
      skipNextLines = true;
      continue;
    }
    
    // Stop skipping if we hit a header
    if ((trimmed.startsWith('##') || trimmed.startsWith('###')) && skipNextLines) {
      skipNextLines = false;
    }
    
    if (skipNextLines) continue;
    
    // Handle both ## and ### headers for main sections
    if (trimmed.startsWith('## New Features') || trimmed.startsWith('### New Features') || trimmed.startsWith('## Features')) {
      currentSection = 'features';
      continue;
    } else if (trimmed.startsWith('## Improvements') || trimmed.startsWith('### Improvements') || trimmed.startsWith('## Enhancements') || trimmed.startsWith('### Enhancements')) {
      currentSection = 'enhancements';
      continue;
    } else if (trimmed.startsWith('## Bug Fixes') || trimmed.startsWith('### Bug Fixes') || trimmed.startsWith('## Fixes') || trimmed.startsWith('### Fixes')) {
      currentSection = 'fixes';
      continue;
    } else if (trimmed.startsWith('## Database Changes') || trimmed.startsWith('### Database Changes')) {
      currentSection = null;
      continue;
    } else if (trimmed.startsWith('##') || trimmed.startsWith('###')) {
      // If we hit any other header, reset current section
      currentSection = null;
      continue;
    }

    if (currentSection && trimmed.startsWith('-')) {
      const item = trimmed.replace(/^-\s*/, '').trim();
      if (item) {
        if (currentSection === 'features') features.push(item);
        else if (currentSection === 'enhancements') enhancements.push(item);
        else if (currentSection === 'fixes') fixes.push(item);
      }
    }
  }

  return { features, enhancements, fixes };
}

export default async function ChangelogPage() {
  const releases = await getGitHubReleases();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-black">
        <div className="container max-w-3xl mx-auto py-12 px-4">
          <div className="flex items-center gap-3 mb-4">
            <Github className="w-8 h-8 text-red-600 dark:text-red-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Changelog</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Track all the latest updates, features, and improvements to Whispr
          </p>
        </div>
      </div>

      {/* Releases */}
      <div className="container max-w-3xl mx-auto py-12 px-4">
        {releases.length === 0 ? (
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800 p-8 text-center">
            <Github className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No releases found
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Visit our{' '}
              <a
                href="https://github.com/TECHTUNE-I-T-SOLUTIONS/whispr/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 dark:text-red-400 hover:underline"
              >
                GitHub releases page
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {releases.map((release: any) => {
              const { features, enhancements, fixes } = parseReleaseBody(release.body || '');
              
              return (
                <div
                  key={release.id}
                  className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Release Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                          {release.tag_name || release.name}
                        </span>
                        {release.prerelease && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                            Pre-release
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <time>{formatDate(release.published_at || release.created_at)}</time>
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {release.name && release.name !== release.tag_name ? release.name : `Release ${release.tag_name}`}
                      </h2>
                      {release.body && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {release.body.split('\n').find((line: string) => line.trim() && !line.startsWith('#') && !line.startsWith('-')) || ''}
                        </p>
                      )}
                    </div>
                    {release.html_url && (
                      <a
                        href={release.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on GitHub
                      </a>
                    )}
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <div className="mb-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        New Features
                      </h3>
                      <ul className="space-y-2">
                        {features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Enhancements */}
                  {enhancements.length > 0 && (
                    <div className="mb-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        <Tag className="w-4 h-4 text-blue-500" />
                        Improvements
                      </h3>
                      <ul className="space-y-2">
                        {enhancements.map((enhancement, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-blue-500 mt-1">↑</span>
                            <span>{enhancement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fixes */}
                  {fixes.length > 0 && (
                    <div className="mb-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        <Tag className="w-4 h-4 text-orange-500" />
                        Bug Fixes
                      </h3>
                      <ul className="space-y-2">
                        {fixes.map((fix, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>{fix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Full body as fallback if no parsed sections */}
                  {features.length === 0 && enhancements.length === 0 && fixes.length === 0 && release.body && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {release.body.split('\n').filter((line: string) => 
                          !line.trim().startsWith('Workflow Changes:') &&
                          !line.trim().startsWith('Engineer:') &&
                          !line.trim().startsWith('Generated with') &&
                          !line.trim().startsWith('Co-Authored-By') &&
                          !line.trim().startsWith('Complete Release Notes') &&
                          !line.trim().startsWith('Changes in this release:') &&
                          !line.trim().startsWith('**Full Changelog**')
                        ).map((line: string, idx: number) => {
                          const trimmed = line.trim();
                          if (!trimmed) return <br key={idx} />;
                          
                          // Handle headers
                          if (trimmed.startsWith('###')) {
                            return <h3 key={idx} className="text-lg font-bold mt-4 mb-2">{trimmed.replace(/^###\s*/, '')}</h3>;
                          }
                          if (trimmed.startsWith('##')) {
                            return <h2 key={idx} className="text-xl font-bold mt-6 mb-2">{trimmed.replace(/^##\s*/, '')}</h2>;
                          }
                          
                          // Handle bold text
                          if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                            return <p key={idx} className="font-semibold mb-2">{trimmed.replace(/\*\*/g, '')}</p>;
                          }
                          
                          // Handle bullet points
                          if (trimmed.startsWith('-')) {
                            return <li key={idx} className="ml-4 mb-1">{trimmed.replace(/^-\s*/, '')}</li>;
                          }
                          
                          // Handle regular paragraphs
                          return <p key={idx} className="mb-2">{trimmed}</p>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-black">
        <div className="container max-w-3xl mx-auto py-12 px-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Want to contribute?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Whispr is open source and we welcome contributions from the community
          </p>
          <Button
            asChild
            className="bg-red-600 hover:bg-red-700"
          >
            <a
              href="https://github.com/TECHTUNE-I-T-SOLUTIONS/whispr"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
