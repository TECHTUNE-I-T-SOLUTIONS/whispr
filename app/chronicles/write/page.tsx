'use client';

import { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link as LinkIcon, Image } from 'lucide-react';
import { marked } from 'marked';
// Use marked.parse for synchronous parsing (ensure string output)
const parseMarkdown = (md: string) => typeof marked.parse === 'function' ? marked.parse(md) : '';
import DOMPurify from 'dompurify';
import dynamic from 'next/dynamic';
// Dynamically import React Quill for SSR compatibility
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
// import 'react-quill/dist/quill.snow.css';
// import { Modal } from '@/components/chronicles-feature-modal';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Send, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface PostData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  cover_image_url?: string;
  post_type: 'blog' | 'poem';
  status?: 'draft' | 'published' | 'archived' | 'scheduled';
}

export default function ChroniclesWrite() {
    const [imagePreview, setImagePreview] = useState<string>('');
    const [fetchedImage, setFetchedImage] = useState<string>('');
    const [fetchingImage, setFetchingImage] = useState(false);
    // Fetch image from URL and show preview
    const handleFetchImage = async () => {
      if (!postData.cover_image_url) return;
      setFetchingImage(true);
      setFetchedImage('');
      try {
        // Simple check for image URL
        const res = await fetch(postData.cover_image_url);
        if (!res.ok) throw new Error('Image not found');
        setFetchedImage(postData.cover_image_url);
      } catch (err) {
        setFetchedImage('');
      } finally {
        setFetchingImage(false);
      }
    };
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    // Formatting toolbar state
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string | undefined;
  
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [postData, setPostData] = useState<PostData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    cover_image_url: '',
    post_type: 'blog',
    status: 'draft',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (postId) {
      fetchPost();
    } else {
      setLoading(false);
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/chronicles/creator/posts/${postId}`);
      if (!res.ok) throw new Error('Failed to load post');
      const data = await res.json();
      setPostData({
        ...data,
        cover_image_url: data.cover_image_url || '',
      });
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
        body: JSON.stringify({
          ...postData,
          status: 'draft',
          post_type: postData.post_type,
          category: postData.category,
          tags: postData.tags,
          excerpt: postData.excerpt,
          cover_image_url: postData.cover_image_url,
        }),
      });

      if (!res.ok) throw new Error('Failed to save draft');
      const data = await res.json();
      setPostData(data);
      // Toast notification would go here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError('');

    if (!postData.title || !postData.content || !postData.category) {
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
        body: JSON.stringify({
          ...postData,
          status: 'published',
          post_type: postData.post_type,
          category: postData.category,
          tags: postData.tags,
          excerpt: postData.excerpt,
          cover_image_url: postData.cover_image_url,
        }),
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

  // Image preview logic
  useEffect(() => {
    if (postData.cover_image_url && postData.cover_image_url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
      setImagePreview(postData.cover_image_url);
    } else {
      setImagePreview('');
    }
  }, [postData.cover_image_url]);

  // Rich text formatting functions
  const exec = (command: string, value?: string) => {
    contentRef.current?.focus();
    try {
      document.execCommand(command, false, value);
    } catch (e) {}
    setPostData((prev) => ({ ...prev, content: contentRef.current?.innerHTML || '' }));
  };

  return ( 
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Publish
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg mb-8">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="mb-2 align-middle flex justify-end gap-2">
          <select
            value={postData.post_type}
            onChange={e => setPostData(prev => ({ ...prev, post_type: e.target.value as 'blog' | 'poem' }))}
            className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-base"
            aria-label="Post type"
          >
            <option value="blog">📝 Blog Post</option>
            <option value="poem">✨ Poem</option>
          </select>
          <select
            value={postData.category}
            onChange={e => setPostData(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-base"
            aria-label="Category"
            required
          >
            <option value="">Select category</option>
            <option value="fiction">Fiction</option>
            <option value="technology">Technology</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>          
        </div>
        {/* Editor */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-8">
          {/* Title */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center mb-2">
              <Input
                type="text"
                placeholder={postData.post_type === 'poem' ? 'Enter poem title...' : 'Enter your post title...'}
                value={postData.title}
                onChange={handleTitleChange}
                className={`text-3xl font-bold border-2 p-2 focus:ring-0 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-slate-600 ${postData.post_type === 'poem' ? 'font-serif text-center' : ''}`}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">Slug: {postData.slug}</p>
          </div>

          <hr className="my-6 border-gray-200 dark:border-slate-800" />

          {/* Cover Image */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Cover Image URL (optional)</label>
            <Input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={postData.cover_image_url || ''}
              onChange={(e) => setPostData({ ...postData, cover_image_url: e.target.value })}
            />
            <Button type="button" variant="outline" className="mt-2" onClick={handleFetchImage} disabled={!postData.cover_image_url || fetchingImage}>
              {fetchingImage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Fetch Image
            </Button>
            {imagePreview && (
              <div className="mt-3">
                <img src={imagePreview} alt="Preview" className="h-24 rounded shadow border" />
              </div>
            )}
            {fetchedImage && (
              <div className="mt-3">
                <img src={fetchedImage} alt="Fetched Preview" className="h-24 rounded shadow border" />
                <p className="text-xs text-muted-foreground mt-1">Fetched image preview</p>
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <Textarea
              placeholder="Write a brief summary of your post..."
              value={postData.excerpt}
              onChange={(e) => setPostData({ ...postData, excerpt: e.target.value })}
              className="min-h-16 resize-none"
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Content *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('bold')}><Bold className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('italic')}><Italic className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('underline')}><Underline className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('justifyLeft')}><AlignLeft className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('justifyCenter')}><AlignCenter className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('justifyRight')}><AlignRight className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('justifyFull')}><AlignJustify className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowLinkDialog(true)}><LinkIcon className="h-4 w-4" /></Button>
              {/* Add image button logic if needed */}
            </div>
            <div className="relative">
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => setPostData((prev) => ({ ...prev, content: contentRef.current?.innerHTML || '' }))}
                className={`min-h-[300px] p-4 border border-gray-300 dark:border-slate-700 rounded-md prose max-w-none bg-white dark:bg-slate-900 text-black dark:text-white ${postData.post_type === 'poem' ? 'font-serif text-center text-lg leading-relaxed bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-950' : ''}`}
                aria-label="Post content editor"
              />
              {(!postData.content || postData.content === '<p><br></p>') && (
                <span className={`absolute top-4 left-4 text-muted-foreground pointer-events-none select-none ${postData.post_type === 'poem' ? 'w-full text-center' : ''}`}>{postData.post_type === 'poem' ? 'Write your poem here...' : 'Write your story here...'}</span>
              )}
            </div>

            {/* Link dialog */}
            {showLinkDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-sm w-full p-6 relative">
                  <Button variant="ghost" className="absolute top-2 right-2" onClick={() => setShowLinkDialog(false)}>Close</Button>
                  <h3 className="text-lg font-bold mb-2">Insert Link</h3>
                  <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="mb-2" />
                  <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Link text (optional)" className="mb-2" />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
                    <Button onClick={() => {
                      setShowLinkDialog(false);
                      setTimeout(() => {
                        contentRef.current?.focus();
                        if (linkText) {
                          exec('insertHTML', `<a href='${linkUrl}' target='_blank' rel='noopener noreferrer'>${linkText}</a>`);
                        } else {
                          exec('createLink', linkUrl);
                        }
                      }, 0);
                    }}>Insert</Button>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">Your content has {postData.content.replace(/<[^>]+>/g, '').length} characters</p>
            {/* Live Preview
            {postData.content && (
              <div>
                <label className="block mt-6 mb-2 font-medium">Live Preview</label>
                <div className="prose prose-purple dark:prose-invert max-w-none border rounded-md p-4 bg-muted/30" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(postData.content) }} />
              </div>
            )} */}
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex gap-2 mb-3">
              <Input
                type="text"
                placeholder="Add a tag and press Enter"
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

          <hr className="my-6 border-gray-200 dark:border-slate-800" />

          {/* Content Editor */}
          {/* <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Content *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('bold')}><Bold className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('italic')}><Italic className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('underline')}><Underline className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('justifyLeft')}><AlignLeft className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('justifyCenter')}><AlignCenter className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('justifyRight')}><AlignRight className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec('justifyFull')}><AlignJustify className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowLinkDialog(true)}><LinkIcon className="h-4 w-4" /></Button>
            </div> */}
            {/* <div className="relative">
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => setPostData((prev) => ({ ...prev, content: contentRef.current?.innerHTML || '' }))}
                className={`min-h-[300px] p-4 border border-gray-300 dark:border-slate-700 rounded-md prose max-w-none bg-white dark:bg-slate-900 text-black dark:text-white ${postData.post_type === 'poem' ? 'font-serif text-center text-lg leading-relaxed bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-950' : ''}`}
                aria-label="Post content editor"
              />
              {(!postData.content || postData.content === '<p><br></p>') && (
                <span className={`absolute top-4 left-4 text-muted-foreground pointer-events-none select-none ${postData.post_type === 'poem' ? 'w-full text-center' : ''}`}>{postData.post_type === 'poem' ? 'Write your poem here...' : 'Write your story here...'}</span>
              )}
            </div> */}
            {/* Link dialog */}
            {/* {showLinkDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-sm w-full p-6 relative">
                  <Button variant="ghost" className="absolute top-2 right-2" onClick={() => setShowLinkDialog(false)}>Close</Button>
                  <h3 className="text-lg font-bold mb-2">Insert Link</h3>
                  <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="mb-2" />
                  <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Link text (optional)" className="mb-2" />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
                    <Button onClick={() => {
                      setShowLinkDialog(false);
                      setTimeout(() => {
                        contentRef.current?.focus();
                        if (linkText) {
                          exec('insertHTML', `<a href='${linkUrl}' target='_blank' rel='noopener noreferrer'>${linkText}</a>`);
                        } else {
                          exec('createLink', linkUrl);
                        }
                      }, 0);
                    }}>Insert</Button>
                  </div>
                </div>
              </div>
            )} */}
            {/* <p className="text-xs text-muted-foreground mt-2">{postData.content.replace(/<[^>]+>/g, '').length} characters</p> */}
            {/* Live Preview */}
            {/*  */}

          {/* Preview Button (optional) */}
          <Button variant="outline" className="w-full" type="button" onClick={() => setShowPreviewModal(true)}>
            Preview Post
          </Button>
          {/* Modal for post preview */}
          {showPreviewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative border border-gray-200 dark:border-slate-800">
                <Button variant="ghost" className="absolute top-4 right-4 p-2" onClick={() => setShowPreviewModal(false)}>
                  <span className="sr-only">Close</span>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </Button>
                <div className="flex flex-col gap-4">
                  <h2 className="text-3xl font-extrabold mb-2 text-purple-700 dark:text-purple-300">{postData.title}</h2>
                  {(fetchedImage || imagePreview) && (
                    <img src={fetchedImage || imagePreview} alt="Preview" className="h-40 w-full object-cover rounded-lg shadow border mb-4" />
                  )}
                  <p className="text-base text-muted-foreground mb-2 italic">{postData.excerpt}</p>
                  <div className="flex gap-4 mb-2">
                    <span className="font-semibold">Category:</span> <span>{postData.category}</span>
                  </div>
                  <div className="flex gap-4 mb-2">
                    <span className="font-semibold">Tags:</span> <span>{postData.tags.join(', ')}</span>
                  </div>
                  <hr className="my-4" />
                  <div
                    className="prose prose-purple dark:prose-invert max-w-none text-lg"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(parseMarkdown(postData.content || ''))) }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
