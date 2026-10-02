'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Reply, ReplyAll, Forward, Trash2, Archive, ExternalLink, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getEmailById } from '@/lib/email-sync-service';

interface EmailMessage {
  id: string;
  uid: number;
  subject: string;
  from_name: string;
  from_address: string;
  to_addresses: string[];
  date: Date;
  body_text: string;
  body_html?: string;
  folder: string;
  flags: string[];
}

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [email, setEmail] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadEmail();
  }, [params.id]);

  const loadEmail = async () => {
    setLoading(true);
    try {
      const foundEmail = await getEmailById(params.id as string);
      setEmail(foundEmail);
    } catch (error) {
      console.error('Error loading email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!email || !replyText.trim()) return;
    
    setSending(true);
    try {
      const res = await fetch('/api/admin/email-management/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.from_address,
          subject: `Re: ${email.subject}`,
          body: replyText,
          inReplyTo: email.id,
        }),
      });

      if (res.ok) {
        setReplyDialogOpen(false);
        setReplyText('');
        alert('Reply sent successfully!');
      } else {
        alert('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">Loading email...</div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">Email not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {params.folder}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{email.subject}</CardTitle>
              <CardDescription className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">From:</span>
                  <span>{email.from_name} &lt;{email.from_address}&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">To:</span>
                  <span>{email.to_addresses.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(email.date)}</span>
                </div>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {email.flags.includes('\\Seen') && (
                <Badge variant="outline">Read</Badge>
              )}
              {email.flags.includes('\\Flagged') && (
                <Badge variant="outline">Flagged</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-2">
            <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reply to {email.from_name}</DialogTitle>
                  <DialogDescription>
                    Your reply will be sent to {email.from_address}
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={8}
                  className="mb-4"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setReplyDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                  >
                    {sending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button size="sm" variant="outline">
              <ReplyAll className="w-4 h-4 mr-2" />
              Reply All
            </Button>
            
            <Button size="sm" variant="outline">
              <Forward className="w-4 h-4 mr-2" />
              Forward
            </Button>
            
            <Button size="sm" variant="outline">
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
            
            <Button size="sm" variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>

          <div className="border rounded-lg p-6 bg-background">
            {email.body_html ? (
              <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
            ) : (
              <div className="whitespace-pre-wrap">{email.body_text}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
