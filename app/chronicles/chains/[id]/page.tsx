import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// client component for adding entry
const ChainContributor = dynamic(
  () => import('@/components/chain-contributor')
);

interface Entry {
  id: string;
  sequence: number;
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    published_at?: string;
    likes_count?: number;
    comments_count?: number;
    shares_count?: number;
    views_count?: number;
  };
  added_at: string;
  isFlagged?: boolean;
  flagStatus?: 'pending' | 'under_review' | 'resolved' | 'dismissed' | null;
  flagReason?: string;
}
interface Chain {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  entries: Entry[];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.warn('NEXT_PUBLIC_BASE_URL not set');
      return { title: 'Writing Chain' };
    }
    const res = await fetch(`${baseUrl}/api/chronicles/chains/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return { title: 'Chain not found' };
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      return { title: 'Chain not found' };
    }
    return { title: json.data.title + ' – Writing Chain' };
  } catch (e) {
    console.error('Error generating metadata:', e);
    return { title: 'Writing Chain' };
  }
}

export default async function ChainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error('Error loading chain: NEXT_PUBLIC_BASE_URL not configured');
      return notFound();
    }
    const res = await fetch(`${baseUrl}/api/chronicles/chains/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return notFound();
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      return notFound();
    }
    const chain: Chain = json.data;
    
    // Filter out null entries
    const validEntries = (chain.entries || []).filter((entry) => entry.post !== null);
    chain.entries = validEntries;

  return (
    <div className="whispr-gradient min-h-screen py-10">
      <div className="container max-w-3xl">
        {/* Back Button */}
        <Link
          href="/chronicles/chains"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <span>←</span>
          <span>Back to Chains</span>
        </Link>

        {/* Chain Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">{chain.title}</h1>
          {chain.description && (
            <p className="text-muted-foreground text-lg mb-4">{chain.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{chain.entries.length} entries</span>
            <span>•</span>
            <span>Created {new Date(chain.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Add Entry */}
        <div className="mb-8">
          <ChainContributor chainId={chain.id} />
        </div>

        {/* Entries */}
        <div className="space-y-4">
          {chain.entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No entries yet. Be the first to contribute to this chain!</p>
            </div>
          ) : (
            chain.entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/chronicles/chains/${chain.id}/entries/${entry.post.id}`}
                className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
                      {entry.post.title}
                    </h2>
                    {entry.post.excerpt && (
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                        {entry.post.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {entry.isFlagged && entry.flagStatus && (
                      <span
                        className={`badge text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                          entry.flagStatus === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : entry.flagStatus === 'under_review'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : entry.flagStatus === 'resolved'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}
                      >
                        {entry.flagStatus === 'pending' && '⚠️ Flagged'}
                        {entry.flagStatus === 'under_review' && '⏳ Under Review'}
                        {entry.flagStatus === 'resolved' && '⚠️ Resolved'}
                        {entry.flagStatus === 'dismissed' && '✓ Dismissed'}
                      </span>
                    )}
                    <div className="badge bg-primary/10 text-primary text-base font-semibold px-3 py-1 rounded whitespace-nowrap">
                      #{entry.sequence}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
                  <span>Added {new Date(entry.added_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span>❤️</span>
                      {entry.post.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>💬</span>
                      {entry.post.comments_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>↗️</span>
                      {entry.post.shares_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>👁️</span>
                      {entry.post.views_count || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
  } catch (e) {
    console.error('Error loading chain:', e);
    return notFound();
  }
}
