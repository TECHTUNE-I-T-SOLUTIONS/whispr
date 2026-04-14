'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image_url?: string;
  category?: string;
  tags?: string[];
  status: string;
}

interface EditPostModalProps {
  isOpen: boolean;
  post: Post;
  onClose: () => void;
  onSave: (updatedPost: Partial<Post>) => Promise<void>;
  isLoading?: boolean;
}

export default function EditPostModal({
  isOpen,
  post,
  onClose,
  onSave,
  isLoading = false,
}: EditPostModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
    excerpt: post.excerpt || '',
    cover_image_url: post.cover_image_url || '',
    category: post.category || '',
    tags: post.tags?.join(', ') || '',
    status: post.status || 'published',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      const errorMessage = 'Title and content are required';
      setError(errorMessage);
      toast({
        title: 'Validation Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    setError('');

    try {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await onSave({
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200),
        cover_image_url: formData.cover_image_url || undefined,
        category: formData.category || undefined,
        tags,
        status: formData.status,
      });

      toast({
        title: 'Success',
        description: 'Post updated successfully!',
      });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save changes';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-black rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-black border-b border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Post</h2>
          <button
            onClick={onClose}
            disabled={saving || isLoading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">
              Title *
            </label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Edit post title..."
              disabled={saving || isLoading}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.title.length}/200
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">
              Content *
            </label>
            <Textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Edit post content..."
              disabled={saving || isLoading}
              rows={8}
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">
              Excerpt
            </label>
            <Textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Auto-generated from content if blank..."
              disabled={saving || isLoading}
              rows={3}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">
              Category
            </label>
            <Input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., poetry, fiction, essay..."
              disabled={saving || isLoading}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">
              Tags
            </label>
            <Input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Separate with commas: tag1, tag2, tag3"
              disabled={saving || isLoading}
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">
              Cover Image URL
            </label>
            <Input
              type="url"
              name="cover_image_url"
              value={formData.cover_image_url}
              onChange={handleChange}
              placeholder="https://..."
              disabled={saving || isLoading}
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={saving || isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving || isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || isLoading}
              className="flex items-center gap-2"
            >
              {saving || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
