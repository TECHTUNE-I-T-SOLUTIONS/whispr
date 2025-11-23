'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Save,
  Send,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Bold,
  Italic,
  Underline,
  List,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Maximize2,
  Eye,
  MoreVertical,
} from 'lucide-react';

interface PostData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  post_type: 'blog' | 'poem';
  category: string;
  tags: string[];
  coverImageUrl?: string;
}

export default function EnhancedChroniclesEditor() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string | undefined;
  const editorRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [postData, setPostData] = useState<PostData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    post_type: 'blog',
    category: '',
    tags: [],
    coverImageUrl: '',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (postId) {
      fetchPost();
    } else {
      setLoading(false);
    }

    // Auto-save every 30 seconds
    const timer = setInterval(() => {
      if (postData.title && postData.content && !postId) {
        autoSave();
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [postId, postData]);

  const autoSave = async () => {
    if (!postData.title.trim()) return;

    try {
      const res = await fetch('/api/chronicles/creator/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...postData, status: 'draft' }),
      });

      if (res.ok) {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/chronicles/creator/posts/${postId}`);
      if (!res.ok) throw new Error('Failed to load post');
      const data = await res.json();
      setPostData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setPostData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !postData.tags.includes(tagInput.trim())) {
      setPostData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setPostData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError('');
    try {
      const method = postId ? 'PUT' : 'POST';
      const endpoint = postId ? `/api/chronicles/creator/posts/${postId}` : '/api/chronicles/creator/posts';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...postData, status: 'draft' }),
      });

      if (!res.ok) throw new Error('Failed to save draft');
      const data = await res.json();
      setPostData(data);
      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError('');

    if (!postData.title || !postData.content || !postData.category || !postData.post_type) {
      setError('Please fill in all required fields');
      setPublishing(false);
      return;
    }

    try {
      const method = postId ? 'PUT' : 'POST';
      const endpoint = postId ? `/api/chronicles/creator/posts/${postId}` : '/api/chronicles/creator/posts';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...postData, status: 'published' }),
      });

      if (!res.ok) throw new Error('Failed to publish');
      router.push('/chronicles/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Publish
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Error Message */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg mb-8">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Main Editor */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
          {/* Title */}
          <div className="border-b border-gray-200 dark:border-slate-800 p-6">
            <Input
              type="text"
              placeholder="Enter your post title..."
              value={postData.title}
              onChange={handleTitleChange}
              className="text-4xl font-bold border-0 p-0 focus:ring-0 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-slate-600"
            />
            <p className="text-sm text-muted-foreground mt-2">Slug: {postData.slug}</p>
          </div>

          {/* Post Type & Category */}
          <div className="border-b border-gray-200 dark:border-slate-800 p-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Post Type *</label>
              <select
                value={postData.post_type}
                onChange={(e) => setPostData({ ...postData, post_type: e.target.value as 'blog' | 'poem' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
              >
                <option value="blog">Blog Post</option>
                <option value="poem">Poem</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                value={postData.category}
                onChange={(e) => setPostData({ ...postData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
              >
                <option value="">Select a category</option>
                <option value="fiction">Fiction</option>
                <option value="technology">Technology</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="education">Education</option>
              </select>
            </div>
          </div>

          {/* Cover Image & Excerpt */}
          <div className="border-b border-gray-200 dark:border-slate-800 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cover Image URL (Optional)</label>
              <Input
                type="text"
                placeholder="https://example.com/image.jpg or Google Drive share link"
                value={postData.coverImageUrl || ''}
                onChange={(e) => setPostData({ ...postData, coverImageUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Excerpt</label>
              <Textarea
                placeholder="Write a brief summary of your post..."
                value={postData.excerpt}
                onChange={(e) => setPostData({ ...postData, excerpt: e.target.value })}
                className="min-h-16 resize-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="border-b border-gray-200 dark:border-slate-800 p-6">
            <label className="block text-sm font-medium mb-3">Tags</label>
            <div className="flex gap-2 mb-3">
              <Input
                type="text"
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {postData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:opacity-70">
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="border-b border-gray-200 dark:border-slate-800 p-4 flex flex-wrap gap-2 bg-gray-50 dark:bg-slate-800/50">
            <Button size="sm" variant="outline" onClick={() => applyFormatting('bold')} title="Bold">
              <Bold className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyFormatting('italic')} title="Italic">
              <Italic className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyFormatting('underline')} title="Underline">
              <Underline className="w-4 h-4" />
            </Button>
            <div className="w-px bg-gray-300 dark:bg-slate-700"></div>
            <Button size="sm" variant="outline" onClick={() => applyFormatting('insertUnorderedList')} title="Bullet List">
              <List className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyFormatting('formatBlock', '<blockquote>')} title="Quote">
              <Quote className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyFormatting('formatBlock', '<pre>')} title="Code">
              <Code className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" title="Insert Link">
              <LinkIcon className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" title="Insert Image">
              <ImageIcon className="w-4 h-4" />
            </Button>
            <div className="flex-1"></div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreview(!preview)}
              title="Toggle Preview"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>

          {/* Content Editor */}
          <div className="p-6">
            {preview ? (
              <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: postData.content }} />
              </div>
            ) : (
              <div
                ref={editorRef}
                contentEditable
                onInput={(e) => setPostData({ ...postData, content: e.currentTarget.innerHTML })}
                className="min-h-96 p-4 border border-gray-300 dark:border-slate-700 rounded-md font-mono text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                suppressContentEditableWarning
              >
                {postData.content || 'Start writing...'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">{postData.content.length} characters</p>
          </div>
        </div>
      </div>
    </main>
  );
}
