'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

export default function NewChainPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chronicles/chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        router.push(`/chronicles/chains/${json.data.id}`);
      } else {
        alert(json.error || 'Failed to create chain');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to create chain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Start a New Writing Chain</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} disabled={loading || !title} className="w-full">
            {loading ? 'Creating…' : 'Create Chain'}
          </Button>
        </div>
      </div>
    </div>
  );
}
