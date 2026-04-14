import { Metadata } from 'next';
import { Github, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Changelog - Whispr',
  description: 'View the latest updates, features, and improvements to Whispr',
};

async function getGitHubCommits() {
  try {
    const response = await fetch(
      'https://api.github.com/repos/TECHTUNE-I-T-SOLUTIONS/whispr/commits?per_page=50',
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch commits:', response.status);
      return [];
    }

    const commits = await response.json();
    return commits;
  } catch (error) {
    console.error('Error fetching GitHub commits:', error);
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


export default async function ChangelogPage() {
  const commits = await getGitHubCommits();

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

      {/* Commits */}
      <div className="container max-w-3xl mx-auto py-12 px-4">
        {commits.length === 0 ? (
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800 p-8 text-center">
            <Github className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to load commits from GitHub
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Please try again later or visit our{' '}
              <a
                href="https://github.com/TECHTUNE-I-T-SOLUTIONS/whispr/commits"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 dark:text-red-400 hover:underline"
              >
                GitHub commits page
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {commits.map((commit: any, index: number) => {
              const commitMessage = commit.commit?.message || '';
              const firstLine = commitMessage.split('\n')[0];
              const author = commit.author?.login || commit.commit?.author?.name || 'Unknown';
              const authorUrl = commit.author?.html_url;
              const commitDate = commit.commit?.author?.date || commit.committed_date;
              
              return (
                <div
                  key={commit.sha}
                  className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white break-words hover:text-red-600 dark:hover:text-red-400 transition-colors">
                            <a
                              href={commit.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {firstLine}
                            </a>
                          </h3>
                          
                          {commitMessage.split('\n').length > 1 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                              {commitMessage.split('\n').slice(1).join('\n').trim()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 dark:text-gray-400 mt-3">
                        <div className="flex items-center gap-1">
                          <code className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">
                            {commit.sha.substring(0, 7)}
                          </code>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <time>{formatDate(commitDate)}</time>
                        </div>
                        
                        {authorUrl ? (
                          <a
                            href={authorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 dark:text-red-400 hover:underline"
                          >
                            by {author}
                          </a>
                        ) : (
                          <span>by {author}</span>
                        )}
                        
                        <a
                          href={commit.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      </div>
                    </div>
                  </div>
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
