'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

interface Entry {
  id: string;
  chain: { id: string; title: string };
  post: { id: string; title: string; slug: string };
  added: { id: string; pen_name: string };
  added_at: string;
}

export default function ChainModerationPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chronicles/admin/chains/entries?limit=100');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setEntries(json.data || []);
    } catch (e) {
      setError('Unable to load entries');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (!confirm('Remove this chain entry?')) return;
    try {
      const res = await fetch(`/api/chronicles/admin/chains/entries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries(entries.filter((e) => e.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin" />;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Chain Contributions Moderation</h1>
      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow flex justify-between">
            <div>
              <p className="font-semibold">{e.chain.title}</p>
              <p className="text-sm text-muted-foreground">
                Post: {e.post.title} by {e.added.pen_name} on {new Date(e.added_at).toLocaleDateString()}
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => removeEntry(e.id)}>
              <Trash2 className="w-4 h-4" /> Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
