'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Chain {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    pen_name: string;
  };
}

interface ChainEntry {
  id: string;
  sequence: number;
  post?: {
    title: string;
    slug: string;
  };
  added_by?: {
    pen_name: string;
  };
  added_at: string;
}

export default function ChainDetailPage() {
  const router = useRouter();
  const params = useParams();
  const chainId = params?.id as string;

  const [chain, setChain] = useState<Chain | null>(null);
  const [entries, setEntries] = useState<ChainEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (chainId) {
      fetchChainDetails();
      fetchChainEntries();
    }
  }, [chainId]);

  const fetchChainDetails = async () => {
    try {
      const response = await fetch(`/api/admin/chronicles/chains/${chainId}`);
      if (!response.ok) throw new Error('Failed to fetch chain');
      const data = await response.json();
      setChain(data.chain);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchChainEntries = async () => {
    try {
      const response = await fetch(`/api/admin/chronicles/chains/${chainId}/entries`);
      if (!response.ok) throw new Error('Failed to fetch entries');
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to remove this entry?')) return;
    
    try {
      const response = await fetch(`/api/admin/chronicles/chains/${chainId}/entries/${entryId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setEntries(entries.filter(e => e.id !== entryId));
      } else {
        setError('Failed to delete entry');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading chain details...</p>
      </main>
    );
  }

  if (!chain) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/admin/chronicles/chains">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chains
          </Link>
        </Button>
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-6 text-red-700 dark:text-red-300">
            Chain not found or an error occurred.
            {error && <p className="mt-2">{error}</p>}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/admin/chronicles/chains">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chains
        </Link>
      </Button>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 mb-6">
          <CardContent className="p-4 text-red-700 dark:text-red-300">
            {error}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{chain.title}</CardTitle>
              {chain.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {chain.description}
                </p>
              )}
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href={`/admin/chronicles/chains/${chainId}/edit`}>
                Edit Chain
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Created By</p>
              <p className="font-semibold">@{chain.creator?.pen_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Created Date</p>
              <p className="font-semibold">
                {new Date(chain.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Chain Entries ({entries.length})
        </h2>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href={`/admin/chronicles/chains/${chainId}/add-entry`}>
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Link>
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No entries in this chain yet.
            </p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link href={`/admin/chronicles/chains/${chainId}/add-entry`}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Entry
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <Card key={entry.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-grow">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0">
                      <span className="font-semibold text-indigo-600">
                        {entry.sequence}
                      </span>
                    </div>
                    <div className="flex-grow">
                      {entry.post ? (
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {entry.post.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Added by @{entry.added_by?.pen_name || 'Unknown'} on{' '}
                            {new Date(entry.added_at).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400 italic">
                          Post not found
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
