/**
 * Email Sync Service for Zoho Mail
 * Syncs emails to Supabase for management
 * This uses a database-backed approach for serverless compatibility
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  synced_at: Date;
}

/**
 * Create emails table if it doesn't exist
 */
async function ensureEmailsTable() {
  // This would be done via SQL migration
  // For now, we'll assume the table exists or handle errors gracefully
}

/**
 * Sync emails from Zoho to Supabase
 * This would be called by a cron job
 */
export async function syncEmailsToDatabase(folder: string = 'INBOX', limit: number = 50): Promise<EmailMessage[]> {
  try {
    // For now, return empty array until we implement the IMAP sync
    // This is a placeholder - we'll need to implement actual IMAP sync
    // in a server environment (not serverless)
    
    console.log('Email sync placeholder - IMAP sync requires server environment');
    
    return [];
  } catch (error) {
    console.error('Error syncing emails:', error);
    throw new Error('Failed to sync emails');
  }
}

/**
 * Fetch emails from database
 */
export async function fetchEmailsFromDatabase(folder: string = 'INBOX', limit: number = 20): Promise<EmailMessage[]> {
  try {
    const { data, error } = await supabase
      .from('admin_emails')
      .select('*')
      .eq('folder', folder)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching emails from database:', error);
    // Return empty array if table doesn't exist yet
    return [];
  }
}

/**
 * Fetch folder counts from database
 */
export async function fetchFolderCounts(): Promise<{ name: string; count: number }[]> {
  try {
    const { data, error } = await supabase
      .from('admin_emails')
      .select('folder')
      .order('folder');

    if (error) throw error;

    const counts: Record<string, number> = {};
    (data || []).forEach((email: any) => {
      counts[email.folder] = (counts[email.folder] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  } catch (error) {
    console.error('Error fetching folder counts:', error);
    return [
      { name: 'INBOX', count: 0 },
      { name: 'SENT', count: 0 },
      { name: 'DRAFTS', count: 0 },
      { name: 'TRASH', count: 0 },
    ];
  }
}

/**
 * Get email by ID from database
 */
export async function getEmailById(id: string): Promise<EmailMessage | null> {
  try {
    const { data, error } = await supabase
      .from('admin_emails')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching email by ID:', error);
    return null;
  }
}

/**
 * Mark email as read
 */
export async function markEmailAsRead(id: string): Promise<void> {
  try {
    await supabase
      .from('admin_emails')
      .update({ flags: ['\\Seen'] })
      .eq('id', id);
  } catch (error) {
    console.error('Error marking email as read:', error);
  }
}

/**
 * Delete email
 */
export async function deleteEmail(id: string): Promise<void> {
  try {
    await supabase
      .from('admin_emails')
      .delete()
      .eq('id', id);
  } catch (error) {
    console.error('Error deleting email:', error);
  }
}
