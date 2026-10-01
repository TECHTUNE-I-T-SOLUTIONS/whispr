'use client';

import { Suspense, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link as LinkIcon, Image, Target, Clock, Users } from 'lucide-react';
import { marked } from 'marked';
// Use marked.parse for synchronous parsing (ensure string output)
const parseMarkdown = (md: string) => typeof marked.parse === 'function' ? marked.parse(md) : '';
import DOMPurify from 'dompurify';
import dynamic from 'next/dynamic';
// Dynamically import React Quill for SSR compatibility
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
// import 'react-quill/dist/quill.snow.css';
// import { Modal } from '@/components/chronicles-feature-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Send, ArrowLeft, Loader2, AlertCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SEOAnalyzer } from '@/components/seo/seo-analyzer';
import { EditorSuggestions } from '@/components/editor/EditorSuggestions';

interface WritingPrompt {
  id: string;
  title: string;
  description: string;
  content: string;
  prompt_type: 'blog' | 'poem' | 'story';
  challenge_type: 'daily' | 'weekly' | 'monthly';
  status: 'draft' | 'active' | 'ended' | 'archived';
  starts_at: string;
  submission_deadline: string;
  entries_count: number;
  max_entries_per_user: number;
  featured_image_url?: string;
  tags: string[];
  prize_description?: string;
  user_entries_count?: number;
  has_user_entered?: boolean;
}

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
  flagged_for_review?: boolean;
}

function ChroniclesWriteContent() {
  // Get routing info first
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const urlPostId = searchParams?.get('id') as string | null;
  const postId = (params?.id as string | undefined) || urlPostId || undefined;

  // All useState calls in order
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
  const [imagePreview, setImagePreview] = useState<string>('');
  const [fetchedImage, setFetchedImage] = useState<string>('');
  const [fetchingImage, setFetchingImage] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagStatus, setFlagStatus] = useState<'pending' | 'under_review' | 'resolved' | 'dismissed' | null>(null);
  const [flaggedReason, setFlaggedReason] = useState<string>('');
  const [flagResolution, setFlagResolution] = useState<string | null>(null);
  const [appealing, setAppealing] = useState(false);

  // Authenticity check state
  const [authenticityCheck, setAuthenticityCheck] = useState<any>(null);
  const [checkingAuthenticity, setCheckingAuthenticity] = useState(false);

  // Editor suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });

  // Challenge selection state
  const [activeChallenges, setActiveChallenges] = useState<WritingPrompt[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<WritingPrompt | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const urlPromptId = searchParams?.get('prompt') as string | null;

  // All useRef calls
  const contentRef = useRef<HTMLDivElement>(null);
  const isUpdatingContent = useRef(false);
  const hasLoadedPost = useRef(false);

  // All useEffect calls
  useEffect(() => {
    // Get auth token on mount
    const getAuthToken = async () => {
      try {
        const supabase = createSupabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setAuthToken(session.access_token);
        }
      } catch (err) {
        console.error('Failed to get auth token:', err);
      }
    };
    getAuthToken();
  }, []);

  // Load active challenges
  useEffect(() => {
    const loadChallenges = async () => {
      setLoadingChallenges(true);
      try {
        const response = await fetch('/api/chronicles/writing-prompts');
        if (!response.ok) throw new Error('Failed to fetch challenges');
        const data = await response.json();
        const challenges = data.prompts || [];
        setActiveChallenges(challenges);
        
        // If prompt is in URL, select it
        if (urlPromptId) {
          const selected = challenges.find((c: WritingPrompt) => c.id === urlPromptId);
          if (selected) {
            setSelectedChallenge(selected);
            setSelectedPromptId(urlPromptId);
          }
        }
      } catch (error) {
        console.error('Error loading challenges:', error);
      } finally {
        setLoadingChallenges(false);
      }
    };
    loadChallenges();
  }, [urlPromptId]);

  useEffect(() => {
    if (postId && authToken && !hasLoadedPost.current) {
      fetchPost();
      hasLoadedPost.current = true;
    } else if (postId && !authToken) {
      // Wait for auth token
      const timer = setTimeout(() => {
        if (!authToken) {
          setError('Failed to authenticate');
          setLoading(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    } else if (!postId) {
      setLoading(false);
    }
  }, [postId, authToken]);

  useEffect(() => {
    if (postData.cover_image_url && postData.cover_image_url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
      setImagePreview(postData.cover_image_url);
    } else {
      setImagePreview('');
    }
  }, [postData.cover_image_url]);



  // All other functions
  const fetchPost = async () => {
    if (!authToken) return;
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      };
      
      const res = await fetch(`/api/chronicles/creator/posts/${postId}`, { headers });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load post');
      }
      const data = await res.json();
      
      console.log('=== FETCHED DATA ===');
      console.log('data.title:', data.title);
      console.log('data.content type:', typeof data.content);
      console.log('data.content length:', data.content?.length);
      console.log('data.content is null/undefined:', data.content == null);
      console.log('data.content === "" :', data.content === '');
      console.log('data.content first 200 chars:', data.content?.substring(0, 200));
      console.log('data.content last 50 chars:', data.content?.substring(Math.max(0, data.content.length - 50)));
      console.log('data.content charCodes (first 10):', data.content?.split('').slice(0, 10).map((c: string) => c.charCodeAt(0)));
      
      // Ensure content is a string and not empty
      const fetchedContent = data.content || '';
      
      console.log('fetchedContent after fallback:', {
        length: fetchedContent.length,
        type: typeof fetchedContent,
        first100: fetchedContent.substring(0, 100),
      });
      
      setPostData({
        id: data.id,
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        content: fetchedContent,
        category: data.category || '',
        tags: data.tags || [],
        cover_image_url: data.cover_image_url || '',
        post_type: data.post_type || 'blog',
        status: data.status || 'draft',
        flagged_for_review: data.flagged_for_review || false,
      });
      
      // Set editor content directly after state update - only once
      const editorElement = document.getElementById('chronicles-content-editor') as HTMLDivElement;
      if (editorElement && fetchedContent) {
        isUpdatingContent.current = true;
        editorElement.innerHTML = fetchedContent;
        setTimeout(() => {
          isUpdatingContent.current = false;
        }, 0);
      }
      
      console.log('State updated, waiting for effect to run...');

      // Fetch flagged status
      const flaggedRes = await fetch(`/api/chronicles/posts/${postId}/flagged`);
      const flaggedData = await flaggedRes.json();
      if (flaggedData.is_flagged && flaggedData.review) {
        setIsFlagged(true);
        setFlagStatus(flaggedData.review.status || 'pending');
        setFlaggedReason(flaggedData.review.reason || 'Content flagged for review');
        setFlagResolution(flaggedData.review.resolution || null);
      } else {
        setIsFlagged(false);
        setFlagStatus(null);
        setFlaggedReason('');
        setFlagResolution(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

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
          selectedPromptId: selectedPromptId, // Include selected challenge
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

  const checkContentAuthenticity = async () => {
    setCheckingAuthenticity(true);
    try {
      const plainText = contentRef.current?.innerText || postData.content.replace(/<[^>]+>/g, '');
      const response = await fetch('/api/content/authenticity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: plainText }),
      });
      const result = await response.json();
      setAuthenticityCheck(result);
      return result;
    } catch (error) {
      console.error('Authenticity check failed:', error);
      return null;
    } finally {
      setCheckingAuthenticity(false);
    }
  };

  // Handle editor input for suggestions
  const handleEditorInput = () => {
    if (!isUpdatingContent.current) {
      const editor = document.getElementById('chronicles-content-editor');
      if (editor) {
        const newContent = editor.innerHTML;
        // Only update state if content actually changed to prevent cursor jumping
        if (newContent !== postData.content) {
          setPostData((prev) => ({ ...prev, content: newContent }));
        }
        
        // Get cursor position for suggestions
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(editor);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          const cursorOffset = preCaretRange.toString().length;
          setCursorPosition(cursorOffset);

          // Calculate position for suggestions popup
          const rect = range.getBoundingClientRect();
          const editorRect = editor.getBoundingClientRect();
          if (editorRect) {
            setSuggestionPosition({
              top: rect.bottom - editorRect.top + 5,
              left: rect.left - editorRect.left
            });
          }

          // Show suggestions after typing 2+ characters
          const textBeforeCursor = editor.innerText?.substring(0, cursorOffset) || "";
          const lastWord = textBeforeCursor.split(/\s+/).pop() || "";
          if (lastWord.length >= 2) {
            setShowSuggestions(true);
          } else {
            setShowSuggestions(false);
          }
        }
      }
    }
  };

  // Apply suggestion to editor
  const applySuggestion = (suggestion: string) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      
      // Get the current word being typed
      const editor = document.getElementById('chronicles-content-editor');
      const textBeforeCursor = editor?.innerText?.substring(0, cursorPosition) || "";
      const words = textBeforeCursor.split(/\s+/);
      const lastWord = words.pop() || "";
      
      // Delete the current partial word
      if (lastWord.length > 0) {
        for (let i = 0; i < lastWord.length; i++) {
          document.execCommand('delete', false);
        }
      }
      
      // Insert the suggestion
      document.execCommand('insertText', false, suggestion + ' ');
      
      setShowSuggestions(false);
      const newContent = editor?.innerHTML || "";
      setPostData((prev) => ({ ...prev, content: newContent }));
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

    // Check authenticity before publishing
    const checkResult = await checkContentAuthenticity();
    if (checkResult && !checkResult.canProceed) {
      setError(checkResult.recommendation || 'Content authenticity check failed. Please ensure your content is at least 80% original.');
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
          selectedPromptId: selectedPromptId, // Include selected challenge
        }),
      });

      if (!res.ok) throw new Error('Failed to publish');
      
      const data = await res.json();

      router.push('/chronicles/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleAppeal = async () => {
    setAppealing(true);
    try {
      const res = await fetch(`/api/chronicles/posts/${postId}/appeal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to appeal');
      }

      const data = await res.json();
      const { toast: showToast } = await import('@/hooks/use-toast');
      showToast({
        title: 'Appeal Submitted',
        description: data.message || 'Your appeal has been submitted successfully.',
        duration: 5000,
      });
      
      // Refresh the flagged status
      const flaggedRes = await fetch(`/api/chronicles/posts/${postId}/flagged`);
      const flaggedData = await flaggedRes.json();
      if (!flaggedData.is_flagged) {
        setIsFlagged(false);
        setFlaggedReason('');
      }
    } catch (err) {
      const { toast: showToast } = await import('@/hooks/use-toast');
      showToast({
        title: 'Appeal Failed',
        description: err instanceof Error ? err.message : 'Failed to submit appeal',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setAppealing(false);
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

  // Rich text formatting functions
  const exec = (command: string, value?: string) => {
    contentRef.current?.focus();
    try {
      document.execCommand(command, false, value);
    } catch (e) {}
    setPostData((prev) => ({ ...prev, content: contentRef.current?.innerHTML || '' }));
  };

  return ( 
    <main className="min-h-screen bg-gray-50 dark:bg-black py-8 px-4">
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
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePublish}
              disabled={publishing || (isFlagged && (flagStatus === 'pending' || flagStatus === 'under_review'))}
              title={
                isFlagged && (flagStatus === 'pending' || flagStatus === 'under_review')
                  ? 'Cannot publish while under review'
                  : authenticityCheck && authenticityCheck.authenticityScore < 80
                  ? 'Cannot publish: authenticity score below 80%'
                  : undefined
              }
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

        {/* Authenticity Check Results */}
        {authenticityCheck && (
          <div className={`p-4 rounded-lg border mb-8 ${
            authenticityCheck.authenticityScore >= 80
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">
                Authenticity Score: {authenticityCheck.authenticityScore}%
              </span>
              {authenticityCheck.authenticityScore >= 80 ? (
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {authenticityCheck.recommendation}
            </p>
          </div>
        )}

        {/* Flagged Post Warning */}
        {postData.id && isFlagged && flagStatus && (
          <>
            {/* Pending - Waiting for approval */}
            {flagStatus === 'pending' && (
              <div className="flex gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg mb-8">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">⚠️ Post Flagged for Review</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Reason: <span className="capitalize">{flaggedReason.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    You can edit this post. Submit an appeal if you believe this is incorrect.
                  </p>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAppeal}
                      disabled={appealing}
                      className="text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                    >
                      {appealing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Appeal Review
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Under Review - Appeal Submitted */}
            {flagStatus === 'under_review' && (
              <div className="flex gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg mb-8">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">⏳ Review in Progress</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Reason: <span className="capitalize">{flaggedReason.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Your appeal is being reviewed by our team. You cannot publish until the review is complete.
                  </p>
                </div>
              </div>
            )}

            {/* Resolved - Review Complete */}
            {flagStatus === 'resolved' && (
              <div className="flex gap-2 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30 rounded-lg mb-8">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">⚠️ Review Completed</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Reason: <span className="capitalize">{flaggedReason.replace(/_/g, ' ')}</span>
                  </p>
                  {flagResolution && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Resolution: <span className="capitalize">{flagResolution.replace(/_/g, ' ')}</span>
                    </p>
                  )}
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                    The review has been completed. This post cannot be published.
                  </p>
                </div>
              </div>
            )}

            {/* Dismissed - Flag Removed */}
            {flagStatus === 'dismissed' && (
              <div className="flex gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg mb-8">
                <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">✓ Flag Dismissed</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    The flag has been dismissed. You can now publish this post.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Authenticity Check Button */}
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={checkContentAuthenticity}
            disabled={checkingAuthenticity || !postData.content}
            className="w-full"
          >
            {checkingAuthenticity ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Authenticity...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Check Content Authenticity
              </>
            )}
          </Button>
        </div>

        <div className="mb-2 align-middle flex justify-end gap-2">
          <select
            value={postData.post_type}
            onChange={e => setPostData(prev => ({ ...prev, post_type: e.target.value as 'blog' | 'poem' }))}
            className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-black text-base"
            aria-label="Post type"
          >
            <option value="blog">📝 Blog Post</option>
            <option value="poem">✨ Poem</option>
          </select>
          <select
            value={postData.category}
            onChange={e => setPostData(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-black text-base"
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

        {/* Challenge Selection */}
        {activeChallenges.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-red-900 dark:text-red-100">Enter a Writing Challenge</h3>
            </div>
            
            <div className="mb-3">
              <select
                value={selectedPromptId || ''}
                onChange={(e) => {
                  const promptId = e.target.value;
                  setSelectedPromptId(promptId || null);
                  const challenge = activeChallenges.find(c => c.id === promptId);
                  setSelectedChallenge(challenge || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-black text-base"
              >
                <option value="">Select a challenge (optional)</option>
                {activeChallenges
                  .filter(c => c.prompt_type === postData.post_type)
                  .map(challenge => (
                    <option key={challenge.id} value={challenge.id}>
                      {challenge.title} ({challenge.challenge_type}) - {challenge.has_user_entered ? '✓ Already entered' : `${challenge.user_entries_count || 0}/${challenge.max_entries_per_user} entries`}
                    </option>
                  ))}
              </select>
            </div>

            {selectedChallenge && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <Clock className="w-4 h-4" />
                  <span>Deadline: {new Date(selectedChallenge.submission_deadline).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <Users className="w-4 h-4" />
                  <span>{selectedChallenge.entries_count || 0} entries so far</span>
                </div>
                <p className="text-red-600 dark:text-red-400 mt-2 p-2 bg-white dark:bg-black rounded">
                  {selectedChallenge.description}
                </p>
                {selectedChallenge.prize_description && (
                  <p className="text-yellow-700 dark:text-yellow-300 mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    🏆 {selectedChallenge.prize_description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {/* Editor */}
        <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-slate-800 p-8">
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
                id="chronicles-content-editor"
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSuggestions(false)
                  }
                }}
                className={`min-h-[300px] p-4 border border-gray-300 dark:border-slate-700 rounded-md prose max-w-none bg-white dark:bg-black text-black dark:text-white ${postData.post_type === 'poem' ? 'font-serif text-center text-lg leading-relaxed bg-gradient-to-b from-red-50 to-white dark:from-slate-900 dark:to-slate-950' : ''}`}
                aria-label="Post content editor"
              />
              
              {/* Editor Suggestions Popup */}
              {showSuggestions && (
                <div className="absolute" style={{ top: suggestionPosition.top, left: suggestionPosition.left }}>
                  <EditorSuggestions
                    content={document.getElementById('chronicles-content-editor')?.innerText || ""}
                    cursorPosition={cursorPosition}
                    onApplySuggestion={applySuggestion}
                    onClose={() => setShowSuggestions(false)}
                  />
                </div>
              )}
              
              {(!postData.content || postData.content === '<p><br></p>') && (
                <span className={`absolute top-4 left-4 text-muted-foreground pointer-events-none select-none ${postData.post_type === 'poem' ? 'w-full text-center' : ''}`}>{postData.post_type === 'poem' ? 'Write your poem here...' : 'Write your story here...'}</span>
              )}
            </div>

            {/* Link dialog */}
            {showLinkDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white dark:bg-black rounded-lg shadow-lg max-w-sm w-full p-6 relative">
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
                <div className="prose prose-red dark:prose-invert max-w-none border rounded-md p-4 bg-muted/30" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(postData.content) }} />
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
                  className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:opacity-70">
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <SEOAnalyzer 
            title={postData.title}
            content={postData.content}
            excerpt={postData.excerpt}
            tags={postData.tags}
            type={postData.post_type}
            genre={postData.category}
            onApplyTitle={(newTitle) => setPostData(prev => ({ ...prev, title: newTitle, slug: generateSlug(newTitle) }))}
            onApplyTags={(newTags) => {
              setPostData(prev => ({
                ...prev,
                tags: Array.from(new Set([...prev.tags, ...newTags]))
              }))
            }}
          />

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
                className={`min-h-[300px] p-4 border border-gray-300 dark:border-slate-700 rounded-md prose max-w-none bg-white dark:bg-black text-black dark:text-white ${postData.post_type === 'poem' ? 'font-serif text-center text-lg leading-relaxed bg-gradient-to-b from-red-50 to-white dark:from-slate-900 dark:to-slate-950' : ''}`}
                aria-label="Post content editor"
              />
              {(!postData.content || postData.content === '<p><br></p>') && (
                <span className={`absolute top-4 left-4 text-muted-foreground pointer-events-none select-none ${postData.post_type === 'poem' ? 'w-full text-center' : ''}`}>{postData.post_type === 'poem' ? 'Write your poem here...' : 'Write your story here...'}</span>
              )}
            </div> */}
            {/* Link dialog */}
            {/* {showLinkDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white dark:bg-black rounded-lg shadow-lg max-w-sm w-full p-6 relative">
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
              <div className="bg-white dark:bg-black rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative border border-gray-200 dark:border-slate-800">
                <Button variant="ghost" className="absolute top-4 right-4 p-2" onClick={() => setShowPreviewModal(false)}>
                  <span className="sr-only">Close</span>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </Button>
                <div className="flex flex-col gap-4">
                  <h2 className="text-3xl font-extrabold mb-2 text-red-700 dark:text-red-300">{postData.title}</h2>
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
                    className="prose prose-red dark:prose-invert max-w-none text-lg"
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

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    </main>
  );
}

export default function ChroniclesWrite() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ChroniclesWriteContent />
    </Suspense>
  );
}
