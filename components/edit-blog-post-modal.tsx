'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  seo_description?: string;
  tags?: string[];
  status: string;
  reading_time?: number;
}

interface EditBlogPostModalProps {
  isOpen: boolean;
  post: BlogPost;
  onClose: () => void;
  onSave: (updatedPost: Partial<BlogPost>) => Promise<void>;
  isLoading?: boolean;
}

export default function EditBlogPostModal({
  isOpen,
  post,
  onClose,
  onSave,
  isLoading = false,
}: EditBlogPostModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
    excerpt: post.excerpt || '',
    seo_description: post.seo_description || '',
    tags: post.tags?.join(', ') || '',
    status: post.status || 'drafted',
    reading_time: post.reading_time?.toString() || '',
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

      const readingTime = formData.reading_time ? parseInt(formData.reading_time) : undefined;

      await onSave({
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200),
        seo_description: formData.seo_description,
        tags,
        status: formData.status,
        reading_time: readingTime,
      });

      toast({
        title: 'Success',
        description: 'Blog post updated successfully!',
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Blog Post</h2>
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
              placeholder="Edit blog post title..."
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
              placeholder="Edit blog post content..."
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

          {/* SEO Description */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">
              SEO Description
            </label>
            <Textarea
              name="seo_description"
              value={formData.seo_description}
              onChange={handleChange}
              placeholder="Used for search engine results..."
              disabled={saving || isLoading}
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.seo_description.length}/160
            </p>
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

          {/* Reading Time */}
          <div>
            <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-2">
              Reading Time (minutes)
            </label>
            <Input
              type="number"
              name="reading_time"
              value={formData.reading_time}
              onChange={handleChange}
              placeholder="e.g., 5"
              disabled={saving || isLoading}
              min="1"
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
              <option value="drafted">Drafted</option>
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
