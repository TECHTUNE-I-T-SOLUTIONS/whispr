import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

// client component for adding entry
const ChainContributor = dynamic(
  () => import('@/components/chain-contributor')
);

interface Entry {
  id: string;
  sequence: number;
  post: { id: string; title: string; slug: string };
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
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-2">{chain.title}</h1>
      {/* contributor UI - shows a select of your published posts */}
      <div className="mb-6">
        <ChainContributor chainId={chain.id} onAdded={() => { /* reload page? via refresh */ }} />
      </div>
      {chain.description && <p className="mb-4 text-muted-foreground">{chain.description}</p>}
      <div className="space-y-4">
        {/* entries list */}
        {chain.entries.map((entry) => (
          <div key={entry.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg">
            <h2 className="text-xl">
              <a href={`/post/${entry.post.slug}`} className="text-blue-600 hover:underline">
                {entry.post.title}
              </a>
            </h2>
            <p className="text-xs text-muted-foreground">
              added {new Date(entry.added_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
