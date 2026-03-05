'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Eye, BookOpen } from 'lucide-react';

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
  entry_count?: number;
}

export default function ChainsPage() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChains();
  }, []);

  const fetchChains = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/chronicles/chains');
      
      if (!response.ok) {
        throw new Error('Failed to fetch chains');
      }
      
      const data = await response.json();
      setChains(data.chains || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching chains:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chainId: string) => {
    if (!confirm('Are you sure you want to delete this chain?')) return;
    
    try {
      const response = await fetch(`/api/admin/chronicles/chains/${chainId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setChains(chains.filter(c => c.id !== chainId));
      } else {
        setError('Failed to delete chain');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error deleting chain:', err);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            Writing Chains
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage all writing chains in your platform
          </p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/admin/chronicles/chains/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Chain
          </Link>
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 mb-6">
          <CardContent className="p-4 text-red-700 dark:text-red-300">
            {error}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading chains...</p>
          </CardContent>
        </Card>
      ) : chains.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No writing chains found. Create your first one!
            </p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link href="/admin/chronicles/chains/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Chain
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {chains.map((chain) => (
            <Card key={chain.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-grow">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {chain.title}
                    </h2>
                    {chain.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {chain.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Created: {new Date(chain.created_at).toLocaleDateString()}</span>
                      {chain.creator && (
                        <span>By: @{chain.creator.pen_name}</span>
                      )}
                      {chain.entry_count !== undefined && (
                        <span>{chain.entry_count} entries</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      <Link href={`/admin/chronicles/chains/${chain.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Link href={`/admin/chronicles/chains/${chain.id}/edit`}>
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(chain.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
