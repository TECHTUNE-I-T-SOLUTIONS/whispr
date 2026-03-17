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
}
interface Chain {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  entries: Entry[];
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chronicles/chains/${params.id}`);
  const json = await res.json();
  if (!json.success || !json.data) {
    return { title: 'Chain not found' };
  }
  return { title: json.data.title + ' – Writing Chain' };
}

export default async function ChainDetailPage({ params }: { params: { id: string } }) {
  const res = await fetch(`/api/chronicles/chains/${params.id}`);
  const json = await res.json();
  if (!json.success || !json.data) {
    notFound();
  }
  const chain: Chain = json.data;

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
          <ChainContributor chainId={chain.id} onAdded={() => { /* reload page? via refresh */ }} />
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
                href={`/chronicles/post/${entry.post.slug}`}
                className="block p-6 bg-card border border-border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
                      {entry.post.title}
                    </h2>
                    {entry.post.excerpt && (
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                        {entry.post.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="badge bg-primary/10 text-primary text-base font-semibold px-3 py-1 rounded whitespace-nowrap ml-auto">
                    #{entry.sequence}
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
}
