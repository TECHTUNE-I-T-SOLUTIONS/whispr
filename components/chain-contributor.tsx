'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2 } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
}

interface Props {
  chainId: string;
  onAdded?: () => void;
}

export default function ChainContributor({ chainId, onAdded }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chronicles/creator/posts?status=published');
      if (!res.ok) throw new Error('');
      const json = await res.json();
      setPosts(json.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/chronicles/chains/${chainId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: selected }),
      });
      const json = await res.json();
      if (json.success) {
        setSelected('');
        // reload to show new entry
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin" />;
  if (posts.length === 0) return <p>No published posts to add.</p>;

  return (
    <div className="flex gap-2 items-center">
      <Select onValueChange={(v) => setSelected(v)} value={selected}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select a post" />
        </SelectTrigger>
        <SelectContent>
          {posts.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button disabled={!selected || adding} onClick={handleAdd}>
        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
      </Button>
    </div>
  );
}
