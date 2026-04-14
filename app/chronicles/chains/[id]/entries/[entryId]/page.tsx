import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

const ChainEntryDetail = dynamic(
  () => import('@/components/chain-entry-detail')
);

interface Entry {
  id: string;
  chain_id: string;
  creator_id: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image_url?: string;
  category?: string;
  tags?: string[];
  status: string;
  sequence: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  added_by?: string;
}

interface Chain {
  id: string;
  title: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}): Promise<Metadata> {
  try {
    const { entryId } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.warn('NEXT_PUBLIC_BASE_URL not set for metadata generation');
      return { title: 'Writing Chain Entry' };
    }
    const res = await fetch(`${baseUrl}/api/chronicles/chains/entries/${entryId}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return { title: 'Entry not found' };
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      return { title: 'Entry not found' };
    }

    const entry: Entry = json.data;
    return {
      title: entry.title + ' – Writing Chain Entry',
      description: entry.excerpt || entry.content.substring(0, 150),
    };
  } catch (e) {
    console.error('Error generating metadata:', e);
    return { title: 'Writing Chain Entry' };
  }
}

export default async function ChainEntryPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}) {
  try {
    const { id, entryId } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error('Error loading entry: NEXT_PUBLIC_BASE_URL not configured');
      return notFound();
    }

    // Fetch entry
    const entryRes = await fetch(`${baseUrl}/api/chronicles/chains/entries/${entryId}`, {
      cache: 'no-store',
    });

    if (!entryRes.ok) {
      return notFound();
    }

    const entryJson = await entryRes.json();
    if (!entryJson.success || !entryJson.data) {
      return notFound();
    }

    const entry: Entry = entryJson.data;

    // Fetch chain for title
    let chainTitle = 'Writing Chain';
    try {
      const chainRes = await fetch(`${baseUrl}/api/chronicles/chains/${id}`, {
        cache: 'no-store',
      });
      if (chainRes.ok) {
        const chainJson = await chainRes.json();
        if (chainJson.success && chainJson.data) {
          chainTitle = chainJson.data.title;
        }
      }
    } catch (err) {
      console.error('Error fetching chain:', err);
    }

    return (
      <ChainEntryDetail
        chainId={id}
        entryId={entryId}
        initial_entry={entry}
        chain_title={chainTitle}
      />
    );
  } catch (err) {
    console.error('Error loading entry:', err);
    return notFound();
  }
}
