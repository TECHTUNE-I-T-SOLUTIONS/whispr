/**
 * Whispr Email Service
 * Centralized email service using Nodemailer + Zoho Mail SMTP
 * All email sending must go through this service
 */

import nodemailer from 'nodemailer';
import {
  getWelcomeEmail,
  getVerificationEmail,
  getPasswordResetEmail,
  getNewFollowerEmail,
  getNewCommentEmail,
  getNewLikeEmail,
  getNotificationEmail,
  getSupportEmail,
  getDailyChallengeEmail,
  getChallengeWinnerEmail,
  type EmailTemplateData,
  type EmailTemplate
} from './email-templates';

/**
 * Email type enumeration
 */
export enum EmailType {
  WELCOME = 'welcome',
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password_reset',
  NEW_FOLLOWER = 'new_follower',
  NEW_COMMENT = 'new_comment',
  NEW_LIKE = 'new_like',
  NOTIFICATION = 'notification',
  SUPPORT = 'support',
  DAILY_CHALLENGE = 'daily_challenge',
  CHALLENGE_WINNER = 'challenge_winner',
}

/**
 * Email sender aliases
 */
enum EmailSender {
  HELLO = 'hello@whisprwords.com',
  NO_REPLY = 'no-reply@whisprwords.com',
  NOTIFICATIONS = 'notifications@whisprwords.com',
  SUPPORT = 'support@whisprwords.com',
}

/**
 * Map email types to sender aliases
 */
const EMAIL_TYPE_TO_SENDER: Record<EmailType, EmailSender> = {
  [EmailType.WELCOME]: EmailSender.HELLO,
  [EmailType.VERIFICATION]: EmailSender.NO_REPLY,
  [EmailType.PASSWORD_RESET]: EmailSender.NO_REPLY,
  [EmailType.NEW_FOLLOWER]: EmailSender.NOTIFICATIONS,
  [EmailType.NEW_COMMENT]: EmailSender.NOTIFICATIONS,
  [EmailType.NEW_LIKE]: EmailSender.NOTIFICATIONS,
  [EmailType.NOTIFICATION]: EmailSender.NOTIFICATIONS,
  [EmailType.SUPPORT]: EmailSender.SUPPORT,
  [EmailType.DAILY_CHALLENGE]: EmailSender.NOTIFICATIONS,
  [EmailType.CHALLENGE_WINNER]: EmailSender.NOTIFICATIONS,
};

/**
 * Map email types to template functions
 */
const EMAIL_TYPE_TO_TEMPLATE: Record<EmailType, (data: EmailTemplateData) => EmailTemplate> = {
  [EmailType.WELCOME]: getWelcomeEmail,
  [EmailType.VERIFICATION]: getVerificationEmail,
  [EmailType.PASSWORD_RESET]: getPasswordResetEmail,
  [EmailType.NEW_FOLLOWER]: getNewFollowerEmail,
  [EmailType.NEW_COMMENT]: getNewCommentEmail,
  [EmailType.NEW_LIKE]: getNewLikeEmail,
  [EmailType.NOTIFICATION]: getNotificationEmail,
  [EmailType.SUPPORT]: getSupportEmail,
  [EmailType.DAILY_CHALLENGE]: getDailyChallengeEmail,
  [EmailType.CHALLENGE_WINNER]: getChallengeWinnerEmail,
};

/**
 * Email service interface
 */
export interface SendEmailOptions {
  type: EmailType;
  to: string;
  data?: EmailTemplateData;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Email result interface
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Nodemailer transporter cache
 */
let transporter: nodemailer.Transporter | null = null;

/**
 * Get or create Nodemailer transporter
 * Uses Zoho Mail SMTP configuration
 */
function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    throw new Error('SMTP configuration is incomplete. Please check environment variables.');
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // STARTTLS
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    tls: {
      rejectUnauthorized: false, // For Zoho compatibility
    },
  });

  return transporter;
}

/**
 * Verify SMTP connection
 */
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection verification failed:', error);
    return false;
  }
}

/**
 * Get sender address and reply-to based on email type
 */
function getSenderDetails(emailType: EmailType): { from: string; replyTo?: string } {
  const sender = EMAIL_TYPE_TO_SENDER[emailType];
  const fromName = process.env.SMTP_FROM_NAME || 'Whispr';
  const replyTo = process.env.SMTP_REPLY_TO;

  const from = `${fromName} <${sender}>`;

  // For no-reply emails, set reply-to to support
  if (sender === EmailSender.NO_REPLY && replyTo) {
    return { from, replyTo };
  }

  return { from };
}

/**
 * Log email send attempt
 */
function logEmailSend(type: EmailType, to: string, success: boolean, error?: string): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    to: to.substring(0, 3) + '***' + to.substring(to.indexOf('@')), // Partial email for privacy
    success,
    error: success ? undefined : error,
  };

  if (success) {
    console.log(`[Email Service] ✅ Email sent: ${JSON.stringify(logEntry)}`);
  } else {
    console.error(`[Email Service] ❌ Email failed: ${JSON.stringify(logEntry)}`);
  }
}

/**
 * Send email synchronously (internal use)
 */
async function sendEmailInternal(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const { type, to, data = {} } = options;

    // Validate email address
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new Error('Invalid email address');
    }

    // Get template
    const templateFn = EMAIL_TYPE_TO_TEMPLATE[type];
    if (!templateFn) {
      throw new Error(`No template found for email type: ${type}`);
    }

    // Generate email content
    const template = templateFn(data);

    // Get sender details
    const { from, replyTo } = getSenderDetails(type);

    // Get transporter
    const transport = getTransporter();

    // Send email
    const info = await transport.sendMail({
      from,
      to,
      replyTo,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    logEmailSend(type, to, true);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logEmailSend(options.type, options.to, false, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send email asynchronously (non-blocking)
 * This is the main entry point for sending emails
 * Returns immediately without waiting for SMTP
 */
export function sendEmail(options: SendEmailOptions): void {
  // Fire and forget - don't await
  sendEmailInternal(options).catch((error) => {
    // Error already logged in sendEmailInternal
    console.error('[Email Service] Unhandled error in async email send:', error);
  });
}

/**
 * Send email and await result (for critical emails or testing)
 * Use sparingly - this blocks the operation
 */
export async function sendEmailSync(options: SendEmailOptions): Promise<EmailResult> {
  return sendEmailInternal(options);
}

/**
 * Send welcome email
 */
export function sendWelcomeEmail(to: string, data?: EmailTemplateData): void {
  sendEmail({ type: EmailType.WELCOME, to, data });
}

/**
 * Send verification email
 */
export function sendVerificationEmail(to: string, data?: EmailTemplateData): void {
  sendEmail({ type: EmailType.VERIFICATION, to, data });
}

/**
 * Send password reset email
 */
export function sendPasswordResetEmail(to: string, data?: EmailTemplateData): void {
  sendEmail({ type: EmailType.PASSWORD_RESET, to, data });
}

/**
 * Send new follower notification
 */
export function sendNewFollowerEmail(to: string, data?: EmailTemplateData): void {
  sendEmail({ type: EmailType.NEW_FOLLOWER, to, data });
}

/**
 * Send new comment notification
 */
export function sendNewCommentEmail(to: string, data?: EmailTemplateData): void {
  sendEmail({ type: EmailType.NEW_COMMENT, to, data });
}

/**
 * Send new like notification
 */
export function sendNewLikeEmail(to: string, data?: EmailTemplateData): void {
  sendEmail({ type: EmailType.NEW_LIKE, to, data });
}

/**
 * Send general notification
 */
export function sendNotificationEmail(to: string, data?: EmailTemplateData): void {
  sendEmail({ type: EmailType.NOTIFICATION, to, data });
}

/**
 * Send support email
 */
export function sendSupportEmail(to: string, data?: EmailTemplateData): void {
  sendEmail({ type: EmailType.SUPPORT, to, data });
}

/**
 * Send daily challenge notification
 */
export function sendDailyChallengeEmail(to: string, data?: EmailTemplateData): void {
  sendEmail({ type: EmailType.DAILY_CHALLENGE, to, data });
}

/**
 * Send challenge winner notification
 */
export function sendChallengeWinnerEmail(to: string, data?: EmailTemplateData): void {
  sendEmail({ type: EmailType.CHALLENGE_WINNER, to, data });
}

/**
 * Email service health check
 */
export async function healthCheck(): Promise<{ smtp: boolean; config: boolean }> {
  const smtpConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );

  const smtpWorking = smtpConfigured ? await verifySmtpConnection() : false;

  return {
    smtp: smtpWorking,
    config: smtpConfigured,
  };
}
