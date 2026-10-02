'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox, Send, Trash2, FileText, RefreshCw, ExternalLink, Database, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface EmailFolder {
  name: string;
  count: number;
}

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

export default function EmailManagementPage() {
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('INBOX');
  const [loading, setLoading] = useState(true);
  const [showSetupInfo, setShowSetupInfo] = useState(true);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/email-management');
      const data = await res.json();
      setFolders(data.folders || []);
      
      // Load emails for default folder
      if (data.folders && data.folders.length > 0) {
        loadEmails(selectedFolder);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmails = async (folder: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/email-management/inbox?folder=${folder}`);
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder: string) => {
    setSelectedFolder(folder);
    loadEmails(folder);
  };

  const handleRefresh = () => {
    loadFolders();
    loadEmails(selectedFolder);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFolderIcon = (folder: string) => {
    switch (folder.toUpperCase()) {
      case 'INBOX': return <Inbox className="w-4 h-4" />;
      case 'SENT': return <Send className="w-4 h-4" />;
      case 'DRAFTS': return <FileText className="w-4 h-4" />;
      case 'TRASH': return <Trash2 className="w-4 h-4" />;
      default: return <Inbox className="w-4 h-4" />;
    }
  };

  const getFolderBadgeColor = (folder: string) => {
    switch (folder.toUpperCase()) {
      case 'INBOX': return 'bg-blue-500';
      case 'SENT': return 'bg-green-500';
      case 'DRAFTS': return 'bg-yellow-500';
      case 'TRASH': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email Management</h1>
          <p className="text-muted-foreground">Manage your Zoho Mail inbox and communications</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSetupInfo(!showSetupInfo)} variant="outline" size="sm">
            <Database className="w-4 h-4 mr-2" />
            {showSetupInfo ? 'Hide' : 'Show'} Setup
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Setup Information Card */}
      {showSetupInfo && (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              This email management system uses a database-backed approach for serverless compatibility. 
              To sync emails from Zoho Mail, you need to:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Run the SQL migration: <code className="bg-muted px-2 py-1 rounded">scripts/create_admin_emails_table.sql</code></li>
              <li>Set up a cron job or server to periodically sync emails from Zoho IMAP to the database</li>
              <li>Configure IMAP credentials in your environment (already set in .env.local)</li>
            </ol>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href="https://mail.zoho.com/zm/mail#inbox" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Zoho Mail
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/email-testing">
                  <Mail className="w-4 h-4 mr-2" />
                  Test Email Sending
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Folders Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Folders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder.name}
                  onClick={() => handleFolderClick(folder.name)}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                    selectedFolder === folder.name
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getFolderIcon(folder.name)}
                    <span className="capitalize">{folder.name.replace('INBOX', 'Inbox')}</span>
                  </div>
                  {folder.count > 0 && (
                    <Badge className={getFolderBadgeColor(folder.name)}>
                      {folder.count}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Email List */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>
              {selectedFolder.replace('INBOX', 'Inbox').replace('SENT', 'Sent').replace('DRAFTS', 'Drafts').replace('TRASH', 'Trash')}
            </CardTitle>
            <CardDescription>
              {emails.length} emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading emails...</div>
            ) : emails.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No emails in this folder</p>
                <p className="text-sm">Sync emails from Zoho Mail to see them here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {emails.map((email) => (
                  <Link
                    key={email.id}
                    href={`/admin/email-management/${selectedFolder}/${email.id}`}
                    className="block p-4 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{email.subject}</span>
                          {email.flags.includes('\\Seen') && (
                            <Badge variant="outline" className="text-xs">
                              Read
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          From: {email.from_name} &lt;{email.from_address}&gt;
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(email.date)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
