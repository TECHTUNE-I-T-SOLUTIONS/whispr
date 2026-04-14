"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface Chain {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  entries_count: number;
  hasFlaggedEntries?: boolean;
}

export default function ChainsListPage() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChains();
  }, []);

  const fetchChains = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chronicles/chains?limit=20');
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setChains(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white dark:bg-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Writing Chains</h1>
        <Link href="/chronicles/chains/new" className="btn btn-primary">
          Start a Chain
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {chains.map((chain) => (
            <Link
              key={chain.id}
              href={`/chronicles/chains/${chain.id}`}
              className="block p-4 bg-white dark:bg-black border border-border rounded-lg shadow hover:shadow-lg transition dark:hover:shadow-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{chain.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {chain.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {chain.entries_count} entries • created{' '}
                    {new Date(chain.created_at).toLocaleDateString()}
                  </p>
                </div>
                {chain.hasFlaggedEntries && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 whitespace-nowrap">
                    ⚠️ Flagged Entry
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
