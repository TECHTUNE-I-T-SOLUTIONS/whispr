'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Eye, BookOpen, Flag, X } from 'lucide-react';

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

// Flag Chain Modal Component
function FlagChainModal({
  isOpen,
  onClose,
  chain,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  chain: Chain | null;
  onSubmit: (reason: string, description: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen || !chain) return null;

  const flagReasons = [
    'Inappropriate Content',
    'Spam',
    'Plagiarism',
    'Copyright Violation',
    'Offensive Language',
    'Harassment',
    'Misinformation',
    'Other',
  ];

  const handleSubmit = async () => {
    if (!reason) {
      alert('Please select a reason');
      return;
    }
    await onSubmit(reason, description);
    setReason('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-600" />
            Flag Writing Chain
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Chain: {chain.title}
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">
              Reason for Flagging
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a reason...</option>
              {flagReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder="Provide more context for this flag..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={4}
            />
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Flagging this chain will change its status to
              draft immediately.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleSubmit}
              disabled={!reason || isLoading}
            >
              {isLoading ? 'Flagging...' : 'Flag Chain'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ChainsPage() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [isFlagging, setIsFlagging] = useState(false);

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

  const handleFlagChain = async (reason: string, description: string) => {
    if (!selectedChain) return;
    
    setIsFlagging(true);
    try {
      const response = await fetch('/api/admin/chronicles/flag-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain_id: selectedChain.id,
          reason,
          description,
          status: 'pending',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to flag chain');
      }

      alert('Chain flagged successfully for review');
      setFlagModalOpen(false);
      setSelectedChain(null);
      fetchChains(); // Refresh the list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to flag chain');
    } finally {
      setIsFlagging(false);
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
                      onClick={() => {
                        setSelectedChain(chain);
                        setFlagModalOpen(true);
                      }}
                    >
                      <Flag className="w-4 h-4 mr-1" />
                      Flag
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

      {/* Flag Chain Modal */}
      <FlagChainModal
        isOpen={flagModalOpen}
        onClose={() => {
          setFlagModalOpen(false);
          setSelectedChain(null);
        }}
        chain={selectedChain}
        onSubmit={handleFlagChain}
        isLoading={isFlagging}
      />
    </main>
  );
}
