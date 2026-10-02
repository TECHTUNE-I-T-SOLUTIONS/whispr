/**
 * Email IMAP Service for Zoho Mail
 * Fetches emails from hello@whisprwords.com using IMAP
 * 
 * NOTE: This is a placeholder for future IMAP implementation.
 * Currently using database-backed approach via email-sync-service.ts
 * for serverless compatibility.
 */

// Placeholder for future IMAP implementation
// This file is kept as reference for when IMAP sync is implemented
// in a server environment (not serverless)

interface EmailMessage {
  id: string;
  uid: number;
  subject: string;
  from: {
    name: string;
    address: string;
  };
  to: {
    name: string;
    address: string;
  }[];
  date: Date;
  body: string;
  html?: string;
  text?: string;
  flags: string[];
  folder: string;
}

interface EmailFolder {
  name: string;
  count: number;
}

/**
 * Placeholder function - use email-sync-service.ts instead
 */
export async function fetchEmails(folder: string = 'INBOX', limit: number = 20): Promise<EmailMessage[]> {
  console.warn('IMAP fetchEmails is not implemented. Use email-sync-service.ts for database-backed email management.');
  return [];
}

/**
 * Placeholder function - use email-sync-service.ts instead
 */
export async function fetchFolders(): Promise<EmailFolder[]> {
  console.warn('IMAP fetchFolders is not implemented. Use email-sync-service.ts for database-backed email management.');
  return [
    { name: 'INBOX', count: 0 },
    { name: 'SENT', count: 0 },
    { name: 'DRAFTS', count: 0 },
    { name: 'TRASH', count: 0 },
  ];
}

/**
 * Placeholder function - use email-sync-service.ts instead
 */
export async function getEmailBody(folder: string, uid: number): Promise<{ text?: string; html?: string }> {
  console.warn('IMAP getEmailBody is not implemented. Use email-sync-service.ts for database-backed email management.');
  return {};
}

/**
 * Send email reply (reuses existing SMTP service)
 */
export async function sendEmailReply(
  to: string,
  subject: string,
  body: string,
  inReplyTo?: string
): Promise<void> {
  const { sendEmailSync } = await import('@/lib/email-service');
  
  await sendEmailSync({
    type: 'notification' as any,
    to,
    data: {
      notificationTitle: subject,
      notificationMessage: body,
    },
  });
}
