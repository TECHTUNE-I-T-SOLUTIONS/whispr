'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

export default function NewChainPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticityCheck, setAuthenticityCheck] = useState<any>(null);
  const [checkingAuthenticity, setCheckingAuthenticity] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/session');
        const data = await res.json();
        
        if (!data.authenticated) {
          setNotLoggedIn(true);
        }
      } catch (err) {
        console.error('Failed to check authentication:', err);
        setNotLoggedIn(true);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const checkContentAuthenticity = async () => {
    setCheckingAuthenticity(true);
    try {
      const plainText = description || title;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Chain title is required');
      return;
    }

    // Check authenticity before creating chain
    const checkResult = await checkContentAuthenticity();
    if (checkResult && !checkResult.canProceed) {
      setError(checkResult.recommendation || 'Content authenticity check failed. Please ensure your content is at least 80% original.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // Get auth token from browser client
      const supabase = createSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('You must be logged in to create a chain');
        return;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/chronicles/chains', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });
      
      const json = await res.json();
      if (json.success && json.data?.id) {
        // Redirect to the new chain page
        router.push(`/chronicles/chains/${json.data.id}`);
      } else {
        setError(json.error || 'Failed to create chain');
      }
    } catch (e) {
      console.error('Error creating chain:', e);
      setError('Error creating chain. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="whispr-gradient min-h-screen py-10">
      <div className="container max-w-2xl">
        {/* Back Button */}
        <Link
          href="/chronicles/chains"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <span>←</span>
          <span>Back to Chains</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Start a Writing Chain</h1>
          <p className="text-muted-foreground text-lg">
            Create a writing prompt or theme that others can contribute to
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-lg p-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : notLoggedIn ? (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-3">Authentication Required</h3>
              <p className="text-muted-foreground mb-6">
                You must be logged in to create a writing chain.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/auth/login">
                  <Button>Log In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="outline">Sign Up</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="text-sm font-semibold mb-2 block">
                  Chain Title *
                </label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Love in Three Words, Midnight Thoughts, etc."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                  maxLength={200}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {title.length}/200
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is the main title and theme of your writing chain
                </p>
              </div>

              <div>
                <label htmlFor="description" className="text-sm font-semibold mb-2 block">
                  Description (Optional)
                </label>
                <Textarea
                  id="description"
                  placeholder="Describe the theme, rules, or inspiration for this writing challenge..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  rows={5}
                  maxLength={1000}
                  className="resize-none text-base"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {description.length}/1000
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Help writers understand what you're looking for
                </p>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Authenticity Check Results */}
              {authenticityCheck && (
                <div className={`p-4 rounded-lg border ${
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

              {/* Authenticity Check Button */}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={checkContentAuthenticity}
                  disabled={checkingAuthenticity || !(title.trim() || description.trim())}
                >
                  {checkingAuthenticity ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Check Authenticity
                    </>
                  )}
                </Button>
                <Link href="/chronicles/chains">
                  <Button variant="outline" disabled={submitting}>
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="min-w-32"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Chain'
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold mb-3">How Writing Chains Work</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">1.</span>
                <span>Create a chain with a theme or prompt</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">2.</span>
                <span>Other writers contribute entries to your chain</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">3.</span>
                <span>Each entry can be liked, commented on, and shared</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">4.</span>
                <span>Build a collection of responses around your theme</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
