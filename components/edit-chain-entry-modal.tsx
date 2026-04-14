'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface Entry {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image_url?: string;
  category?: string;
  tags?: string[];
  status: string;
}

interface EditChainEntryModalProps {
  isOpen: boolean;
  entry: Entry;
  onClose: () => void;
  onSave: (updatedEntry: Partial<Entry>) => Promise<void>;
  isLoading?: boolean;
}

export default function EditChainEntryModal({
  isOpen,
  entry,
  onClose,
  onSave,
  isLoading = false,
}: EditChainEntryModalProps) {
  const [formData, setFormData] = useState({
    title: entry.title,
    content: entry.content,
    excerpt: entry.excerpt || '',
    cover_image_url: entry.cover_image_url || '',
    category: entry.category || '',
    tags: entry.tags?.join(', ') || '',
    status: entry.status || 'published',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setToast(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      setToast({ type: 'error', message: 'Title and content are required' });
      return;
    }

    setSaving(true);
    setError('');
    setToast(null);

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

      setToast({ type: 'success', message: 'Entry updated successfully!' });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save changes';
      setError(errorMsg);
      setToast({ type: 'error', message: errorMsg });
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Entry</h2>
          <button
            title="Close"
            onClick={onClose}
            disabled={saving || isLoading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Toast Notification */}
          {toast && (
            <div
              className={`p-4 rounded-md flex items-center gap-3 ${
                toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              <p
                className={
                  toast.type === 'success'
                    ? 'text-green-700 dark:text-green-400 text-sm'
                    : 'text-red-700 dark:text-red-400 text-sm'
                }
              >
                {toast.message}
              </p>
            </div>
          )}

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
              placeholder="Edit entry title..."
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
              placeholder="Edit entry content..."
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
              title="Status"
              value={formData.status}
              onChange={handleChange}
              disabled={saving || isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-black text-gray-900 dark:text-white"
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
