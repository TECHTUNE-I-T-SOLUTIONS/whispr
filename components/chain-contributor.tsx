'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

interface Props {
  chainId: string;
}

export default function ChainContributor({ chainId }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [category, setCategory] = useState('poem');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState('published');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // Get auth token from Supabase using the proper browser client
      const supabase = createSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('You must be logged in to contribute');
        return;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      headers['Authorization'] = `Bearer ${token}`;

      // Parse tags from comma-separated input
      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Use provided excerpt or auto-generate from content
      const finalExcerpt = excerpt.trim() || content.substring(0, 200).trim();

      const res = await fetch(`/api/chronicles/chains/${chainId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          excerpt: finalExcerpt,
          cover_image_url: coverImageUrl.trim() || null,
          category: category || null,
          tags,
          status,
        }),
      });
      
      const json = await res.json();
      if (json.success) {
        setTitle('');
        setContent('');
        setExcerpt('');
        setCoverImageUrl('');
        setCategory('poem');
        setTagsInput('');
        setShowForm(false);
        // reload to show new entry
        window.location.reload();
      } else {
        setError(json.error || 'Failed to create entry');
      }
    } catch (e) {
      console.error('Error creating entry:', e);
      setError('Error creating entry');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setError('');
    setTitle('');
    setContent('');
    setExcerpt('');
    setCoverImageUrl('');
    setCategory('poem');
    setTagsInput('');
    setStatus('published');
  };

  if (!showForm) {
    return (
      <Button 
        onClick={() => setShowForm(true)}
        className="w-full md:w-auto"
      >
        + Add Entry to Chain
      </Button>
    );
  }

  return (
    <div className="w-full p-6 bg-card border border-border rounded-lg space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Create Chain Entry</h3>
        <button
          onClick={resetForm}
          className="text-muted-foreground hover:text-foreground text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-sm font-medium mb-2 block">Title *</label>
          <Input
            type="text"
            placeholder="Give your entry a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground mt-1">{title.length}/200</p>
        </div>

        {/* Content */}
        <div>
          <label className="text-sm font-medium mb-2 block">Content *</label>
          <Textarea
            placeholder="Write your entry content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
            rows={8}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">{content.length} characters</p>
        </div>

        {/* Excerpt */}
        <div>
          <label className="text-sm font-medium mb-2 block">Excerpt (Optional)</label>
          <Input
            type="text"
            placeholder="Leave empty to auto-generate from content..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            disabled={submitting}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {excerpt.length}/500 • Auto-generated if empty
          </p>
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="text-sm font-medium mb-2 block">Cover Image URL (Optional)</label>
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground mt-1">Full URL to cover image</p>
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium mb-2 block">Category (Optional)</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={submitting}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
          >
            <option value="">None</option>
            <option value="poem">Poem</option>
            <option value="prose">Prose</option>
            <option value="story">Story</option>
            <option value="essay">Essay</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium mb-2 block">Tags (Optional)</label>
          <Input
            type="text"
            placeholder="Enter tags separated by commas (e.g. love, nature, mystery)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {tagsInput.split(',').filter((t) => t.trim()).length} tags
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={submitting}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">Choose entry status</p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive dark:text-primary">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Entry'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
