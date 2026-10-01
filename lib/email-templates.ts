/**
 * Whispr Email Template Library
 * Centralized email templates with shared branding, header, and footer
 */

export interface EmailTemplateData {
  recipientName?: string;
  recipientEmail?: string;
  // Welcome email
  username?: string;
  // Verification email
  verificationUrl?: string;
  // Password reset
  resetUrl?: string;
  // New follower
  followerName?: string;
  followerProfileUrl?: string;
  // New comment
  commenterName?: string;
  commentContent?: string;
  postTitle?: string;
  postUrl?: string;
  // New like
  likerName?: string;
  likerProfileUrl?: string;
  // General notification
  notificationTitle?: string;
  notificationMessage?: string;
  actionUrl?: string;
  actionText?: string;
  // Support
  supportTicketId?: string;
  supportMessage?: string;
  // Daily challenge
  challengeTitle?: string;
  challengeDescription?: string;
  challengeType?: string;
  challengeUrl?: string;
  challengeDeadline?: string;
  // Challenge winner
  winnerRank?: string;
  winnerPrize?: string;
  winningPostTitle?: string;
  winningPostUrl?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com';
const PROD_URL = 'https://whisprwords.com';

/**
 * Shared email header with Whispr branding
 */
function getEmailHeader(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0; padding: 0;">
      <tr>
        <td style="background-color: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
          <a href="${PROD_URL}" style="text-decoration: none;">
            <img 
              src="${PROD_URL}/darklogo.png" 
              alt="Whispr Logo" 
              style="width: 180px; max-width: 180px; height: auto; display: block; margin: 0 auto;"
            />
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Shared email footer with links and legal info
 */
function getEmailFooter(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0; padding: 0;">
      <tr>
        <td style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; margin: 0 auto;">
            <tr>
              <td style="padding: 0 0 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                  <a href="${PROD_URL}" style="color: #2563eb; text-decoration: none;">Home</a>
                  <span style="color: #9ca3af; margin: 0 10px;">•</span>
                  <a href="${PROD_URL}/blog" style="color: #2563eb; text-decoration: none;">Blog</a>
                  <span style="color: #9ca3af; margin: 0 10px;">•</span>
                  <a href="${PROD_URL}/poems" style="color: #2563eb; text-decoration: none;">Poems</a>
                  <span style="color: #9ca3af; margin: 0 10px;">•</span>
                  <a href="${PROD_URL}/stories" style="color: #2563eb; text-decoration: none;">Stories</a>
                  <span style="color: #9ca3af; margin: 0 10px;">•</span>
                  <a href="${PROD_URL}/chronicles" style="color: #2563eb; text-decoration: none;">Chronicles</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 0 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                  <a href="${PROD_URL}/privacy" style="color: #6b7280; text-decoration: none;">Privacy Policy</a>
                  <span style="color: #9ca3af; margin: 0 10px;">•</span>
                  <a href="${PROD_URL}/terms" style="color: #6b7280; text-decoration: none;">Terms of Service</a>
                  <span style="color: #9ca3af; margin: 0 10px;">•</span>
                  <a href="mailto:support@whisprwords.com" style="color: #6b7280; text-decoration: none;">Support</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0 0 0;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                  © ${new Date().getFullYear()} Whispr. All rights reserved.
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                  This is an automated message from Whispr. Please do not reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Shared email wrapper
 */
function wrapEmail(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Whispr</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0; padding: 0;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              ${getEmailHeader()}
              <tr>
                <td style="padding: 40px 30px; background-color: #ffffff;">
                  ${content}
                </td>
              </tr>
              ${getEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Sanitize user-generated content to prevent XSS
 */
function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Create a styled button
 */
function createButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 25px 0;">
      <tr>
        <td style="text-align: center;">
          <a href="${url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; line-height: 1.5;">${text}</a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Welcome email template
 */
export function getWelcomeEmail(data: EmailTemplateData): EmailTemplate {
  const recipientName = data.recipientName || data.username || 'there';
  const safeRecipientName = sanitizeHtml(recipientName);

  const htmlContent = `
    <h1 style="margin: 0 0 20px 0; font-size: 28px; color: #111827; line-height: 1.3;">Welcome to Whispr, ${safeRecipientName}!</h1>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      You've joined the hush — gentle ripples of poems, posts, and spoken words will find you here.
    </p>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Whispr is your creative sanctuary — a space to share your voice, connect with fellow creators, and build your chronicles.
    </p>

    <h2 style="margin: 30px 0 15px 0; font-size: 20px; color: #111827; line-height: 1.3;">What You Can Do on Whispr</h2>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 25px 0;">
      <tr>
        <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">📝 Create & Share Content</h3>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">Publish poems, blog posts, stories, and spoken words. Express yourself through multiple creative formats.</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #7c3aed; margin-top: 10px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">📚 Build Your Chronicles</h3>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">As a Chronicles creator, you can create multi-chapter serialized stories, build your portfolio, and grow your audience.</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #059669; margin-top: 10px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">🛡️ Protect Your Work</h3>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">Every piece of content you publish is automatically fingerprinted with SHA-256 hashing for copyright protection and verification.</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #dc2626; margin-top: 10px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">🔍 Verify Authenticity</h3>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">Your content can be verified anytime using our copyright verification system, proving originality and publication history.</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #ea580c; margin-top: 10px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">🤝 Connect & Engage</h3>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">Follow creators, like and comment on posts, and become part of a vibrant creative community.</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #0891b2; margin-top: 10px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">🎨 AI-Powered Tools</h3>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">Access AI writing assistance, content suggestions, and powerful creative tools to enhance your work.</p>
        </td>
      </tr>
    </table>

    <h2 style="margin: 30px 0 15px 0; font-size: 20px; color: #111827; line-height: 1.3;">Content Types</h2>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 25px 0;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 500;">✨ <strong>Poems</strong> — Share your poetry with the world</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 500;">📖 <strong>Stories</strong> — Create serialized multi-chapter narratives</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 500;">📰 <strong>Blog Posts</strong> — Share your thoughts and insights</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 500;">🎙️ <strong>Spoken Words</strong> — Audio content and performances</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0;">
          <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 500;">📊 <strong>Chronicles</strong> — Your creator portfolio and analytics</p>
        </td>
      </tr>
    </table>

    <h2 style="margin: 30px 0 15px 0; font-size: 20px; color: #111827; line-height: 1.3;">Your Content is Protected</h2>

    <p style="margin: 0 0 15px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
      At Whispr, we take content protection seriously. Here's how we safeguard your creative work:
    </p>

    <ul style="margin: 0 0 25px 0; padding-left: 20px; font-size: 14px; color: #4b5563; line-height: 1.8;">
      <li style="margin-bottom: 8px;"><strong>Automatic Fingerprinting:</strong> Every piece of content is automatically hashed using SHA-256 upon publication</li>
      <li style="margin-bottom: 8px;"><strong>Version History:</strong> Track all changes to your content with complete version history</li>
      <li style="margin-bottom: 8px;"><strong>Verification System:</strong> Anyone can verify the authenticity and originality of your work</li>
      <li style="margin-bottom: 8px;"><strong>Certificates:</strong> Download copyright certificates for your published content</li>
      <li style="margin-bottom: 8px;"><strong>Timestamp Records:</strong> Immutable proof of when your content was first published</li>
    </ul>

    ${createButton('Start Creating', `${PROD_URL}/chronicles`)}
    ${createButton('Explore Content', `${PROD_URL}`)}

    <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      If you have any questions, feel free to reach out to our support team at support@whisprwords.com
    </p>
  `;

  return {
    subject: 'Welcome to Whispr! Start Creating Today',
    html: wrapEmail(htmlContent),
    text: `Welcome to Whispr, ${safeRecipientName}!\n\nYou've joined the hush — gentle ripples of poems, posts, and spoken words will find you here.\n\nWhispr is your creative sanctuary — a space to share your voice, connect with fellow creators, and build your chronicles.\n\nWhat You Can Do on Whispr:\n\n📝 Create & Share Content\nPublish poems, blog posts, stories, and spoken words. Express yourself through multiple creative formats.\n\n📚 Build Your Chronicles\nAs a Chronicles creator, you can create multi-chapter serialized stories, build your portfolio, and grow your audience.\n\n🛡️ Protect Your Work\nEvery piece of content you publish is automatically fingerprinted with SHA-256 hashing for copyright protection and verification.\n\n🔍 Verify Authenticity\nYour content can be verified anytime using our copyright verification system, proving originality and publication history.\n\n🤝 Connect & Engage\nFollow creators, like and comment on posts, and become part of a vibrant creative community.\n\n🎨 AI-Powered Tools\nAccess AI writing assistance, content suggestions, and powerful creative tools to enhance your work.\n\nContent Types:\n\n✨ Poems — Share your poetry with the world\n📖 Stories — Create serialized multi-chapter narratives\n📰 Blog Posts — Share your thoughts and insights\n🎙️ Spoken Words — Audio content and performances\n📊 Chronicles — Your creator portfolio and analytics\n\nYour Content is Protected:\n\nAt Whispr, we take content protection seriously. Here's how we safeguard your creative work:\n\n• Automatic Fingerprinting: Every piece of content is automatically hashed using SHA-256 upon publication\n• Version History: Track all changes to your content with complete version history\n• Verification System: Anyone can verify the authenticity and originality of your work\n• Certificates: Download copyright certificates for your published content\n• Timestamp Records: Immutable proof of when your content was first published\n\nStart creating: ${PROD_URL}/chronicles\nExplore content: ${PROD_URL}\n\nIf you have any questions, feel free to reach out to our support team at support@whisprwords.com\n\n© ${new Date().getFullYear()} Whispr. All rights reserved.\nThis is an automated message from Whispr. Please do not reply to this email.\n\nVisit us at: ${PROD_URL}`
  };
}

/**
 * Email verification template
 */
export function getVerificationEmail(data: EmailTemplateData): EmailTemplate {
  const recipientName = data.recipientName || 'there';
  const safeRecipientName = sanitizeHtml(recipientName);
  const verificationUrl = data.verificationUrl || `${PROD_URL}/verify`;

  const htmlContent = `
    <h1 style="margin: 0 0 20px 0; font-size: 28px; color: #111827; line-height: 1.3;">Verify Your Email Address</h1>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Hi ${safeRecipientName},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Please verify your email address to complete your Whispr account setup. This helps us keep your account secure.
    </p>
    ${createButton('Verify Email Address', verificationUrl)}
    <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      This link will expire in 24 hours. If you didn't create a Whispr account, you can safely ignore this email.
    </p>
  `;

  return {
    subject: 'Verify Your Email Address',
    html: wrapEmail(htmlContent),
    text: `Verify Your Email Address\n\nHi ${safeRecipientName},\n\nPlease verify your email address to complete your Whispr account setup. This helps us keep your account secure.\n\nVerify your email: ${verificationUrl}\n\nThis link will expire in 24 hours. If you didn't create a Whispr account, you can safely ignore this email.\n\n© ${new Date().getFullYear()} Whispr. All rights reserved.\nThis is an automated message from Whispr. Please do not reply to this email.\n\nVisit us at: ${PROD_URL}`
  };
}

/**
 * Password reset template
 */
export function getPasswordResetEmail(data: EmailTemplateData): EmailTemplate {
  const recipientName = data.recipientName || 'there';
  const safeRecipientName = sanitizeHtml(recipientName);
  const resetUrl = data.resetUrl || `${PROD_URL}/auth/forgot-password`;

  const htmlContent = `
    <h1 style="margin: 0 0 20px 0; font-size: 28px; color: #111827; line-height: 1.3;">Reset Your Password</h1>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Hi ${safeRecipientName},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      We received a request to reset your Whispr password. Click the button below to create a new password.
    </p>
    ${createButton('Reset Password', resetUrl)}
    <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
  `;

  return {
    subject: 'Reset Your Whispr Password',
    html: wrapEmail(htmlContent),
    text: `Reset Your Password\n\nHi ${safeRecipientName},\n\nWe received a request to reset your Whispr password. Click the link below to create a new password.\n\nReset password: ${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.\n\n© ${new Date().getFullYear()} Whispr. All rights reserved.\nThis is an automated message from Whispr. Please do not reply to this email.\n\nVisit us at: ${PROD_URL}`
  };
}

/**
 * New follower notification template
 */
export function getNewFollowerEmail(data: EmailTemplateData): EmailTemplate {
  const recipientName = data.recipientName || 'there';
  const safeRecipientName = sanitizeHtml(recipientName);
  const followerName = data.followerName || 'Someone';
  const safeFollowerName = sanitizeHtml(followerName);
  const followerProfileUrl = data.followerProfileUrl || `${PROD_URL}/chronicles/profile`;

  const htmlContent = `
    <h1 style="margin: 0 0 20px 0; font-size: 28px; color: #111827; line-height: 1.3;">You Have a New Follower!</h1>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Hi ${safeRecipientName},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      <strong>${safeFollowerName}</strong> has started following you on Whispr.
    </p>
    ${createButton('View Profile', followerProfileUrl)}
    <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      Keep creating amazing content!
    </p>
  `;

  return {
    subject: `${safeFollowerName} is now following you on Whispr`,
    html: wrapEmail(htmlContent),
    text: `You Have a New Follower!\n\nHi ${safeRecipientName},\n\n${safeFollowerName} has started following you on Whispr.\n\nView their profile: ${followerProfileUrl}\n\nKeep creating amazing content!\n\n© ${new Date().getFullYear()} Whispr. All rights reserved.\nThis is an automated message from Whispr. Please do not reply to this email.\n\nVisit us at: ${PROD_URL}`
  };
}

/**
 * New comment notification template
 */
export function getNewCommentEmail(data: EmailTemplateData): EmailTemplate {
  const recipientName = data.recipientName || 'there';
  const safeRecipientName = sanitizeHtml(recipientName);
  const commenterName = data.commenterName || 'Someone';
  const safeCommenterName = sanitizeHtml(commenterName);
  const commentContent = data.commentContent || '';
  const safeCommentContent = sanitizeHtml(commentContent);
  const postTitle = data.postTitle || 'your post';
  const safePostTitle = sanitizeHtml(postTitle);
  const postUrl = data.postUrl || `${PROD_URL}/chronicles/dashboard`;

  const htmlContent = `
    <h1 style="margin: 0 0 20px 0; font-size: 28px; color: #111827; line-height: 1.3;">New Comment on Your Post</h1>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Hi ${safeRecipientName},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      <strong>${safeCommenterName}</strong> commented on <strong>${safePostTitle}</strong>:
    </p>
    <div style="margin: 0 0 25px 0; padding: 15px; background-color: #f9fafb; border-left: 3px solid #2563eb; border-radius: 4px;">
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6; font-style: italic;">"${safeCommentContent}"</p>
    </div>
    ${createButton('View Comment', postUrl)}
    <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      Keep the conversation going!
    </p>
  `;

  return {
    subject: `New comment on ${safePostTitle}`,
    html: wrapEmail(htmlContent),
    text: `New Comment on Your Post\n\nHi ${safeRecipientName},\n\n${safeCommenterName} commented on ${safePostTitle}:\n\n"${safeCommentContent}"\n\nView the comment: ${postUrl}\n\nKeep the conversation going!\n\n© ${new Date().getFullYear()} Whispr. All rights reserved.\nThis is an automated message from Whispr. Please do not reply to this email.\n\nVisit us at: ${PROD_URL}`
  };
}

/**
 * New like notification template
 */
export function getNewLikeEmail(data: EmailTemplateData): EmailTemplate {
  const recipientName = data.recipientName || 'there';
  const safeRecipientName = sanitizeHtml(recipientName);
  const likerName = data.likerName || 'Someone';
  const safeLikerName = sanitizeHtml(likerName);
  const likerProfileUrl = data.likerProfileUrl || `${PROD_URL}/chronicles/profile`;

  const htmlContent = `
    <h1 style="margin: 0 0 20px 0; font-size: 28px; color: #111827; line-height: 1.3;">Your Content Was Liked!</h1>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Hi ${safeRecipientName},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      <strong>${safeLikerName}</strong> liked your content on Whispr.
    </p>
    ${createButton('View Your Content', likerProfileUrl)}
    <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      Keep creating amazing content!
    </p>
  `;

  return {
    subject: `${safeLikerName} liked your content on Whispr`,
    html: wrapEmail(htmlContent),
    text: `Your Content Was Liked!\n\nHi ${safeRecipientName},\n\n${safeLikerName} liked your content on Whispr.\n\nView your content: ${likerProfileUrl}\n\nKeep creating amazing content!\n\n© ${new Date().getFullYear()} Whispr. All rights reserved.\nThis is an automated message from Whispr. Please do not reply to this email.\n\nVisit us at: ${PROD_URL}`
  };
}

/**
 * General notification template
 */
export function getNotificationEmail(data: EmailTemplateData): EmailTemplate {
  const recipientName = data.recipientName || 'there';
  const safeRecipientName = sanitizeHtml(recipientName);
  const notificationTitle = data.notificationTitle || 'Notification';
  const safeNotificationTitle = sanitizeHtml(notificationTitle);
  const notificationMessage = data.notificationMessage || '';
  const safeNotificationMessage = sanitizeHtml(notificationMessage);
  const actionUrl = data.actionUrl || `${PROD_URL}`;
  const actionText = data.actionText || 'View Details';

  const htmlContent = `
    <h1 style="margin: 0 0 20px 0; font-size: 28px; color: #111827; line-height: 1.3;">${safeNotificationTitle}</h1>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Hi ${safeRecipientName},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      ${safeNotificationMessage}
    </p>
    ${createButton(actionText, actionUrl)}
    <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      Thank you for being part of Whispr!
    </p>
  `;

  return {
    subject: safeNotificationTitle,
    html: wrapEmail(htmlContent),
    text: `${safeNotificationTitle}\n\nHi ${safeRecipientName},\n\n${safeNotificationMessage}\n\n${actionText}: ${actionUrl}\n\nThank you for being part of Whispr!\n\n© ${new Date().getFullYear()} Whispr. All rights reserved.\nThis is an automated message from Whispr. Please do not reply to this email.\n\nVisit us at: ${PROD_URL}`
  };
}

/**
 * Support email template
 */
export function getSupportEmail(data: EmailTemplateData): EmailTemplate {
  const recipientName = data.recipientName || 'there';
  const safeRecipientName = sanitizeHtml(recipientName);
  const supportTicketId = data.supportTicketId || '';
  const safeSupportTicketId = sanitizeHtml(supportTicketId);
  const supportMessage = data.supportMessage || '';
  const safeSupportMessage = sanitizeHtml(supportMessage);

  const htmlContent = `
    <h1 style="margin: 0 0 0 0; font-size: 28px; color: #111827; line-height: 1.3;">Support Request Received</h1>
    ${safeSupportTicketId ? `<p style="margin: 20px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">Ticket ID: ${safeSupportTicketId}</p>` : ''}
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Hi ${safeRecipientName},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      We've received your support request and our team will get back to you as soon as possible.
    </p>
    ${safeSupportMessage ? `
    <div style="margin: 0 0 25px 0; padding: 15px; background-color: #f9fafb; border-left: 3px solid #2563eb; border-radius: 4px;">
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">Your message:</p>
      <p style="margin: 10px 0 0 0; font-size: 15px; color: #374151; line-height: 1.6; font-style: italic;">"${safeSupportMessage}"</p>
    </div>
    ` : ''}
    <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      For immediate assistance, you can also reach us at support@whisprwords.com
    </p>
  `;

  return {
    subject: safeSupportTicketId ? `Support Request #${safeSupportTicketId} Received` : 'Support Request Received',
    html: wrapEmail(htmlContent),
    text: `Support Request Received\n${safeSupportTicketId ? `\nTicket ID: ${safeSupportTicketId}` : ''}\n\nHi ${safeRecipientName},\n\nWe've received your support request and our team will get back to you as soon as possible.\n\n${safeSupportMessage ? `Your message:\n"${safeSupportMessage}"\n\n` : ''}For immediate assistance, you can also reach us at support@whisprwords.com\n\n© ${new Date().getFullYear()} Whispr. All rights reserved.\n\nVisit us at: ${PROD_URL}`
  };
}

/**
 * Daily challenge email template
 */
export function getDailyChallengeEmail(data: EmailTemplateData): EmailTemplate {
  const recipientName = data.recipientName || 'Writer';
  const safeRecipientName = sanitizeHtml(recipientName);
  const challengeTitle = data.challengeTitle || 'New Writing Challenge';
  const safeChallengeTitle = sanitizeHtml(challengeTitle);
  const challengeDescription = data.challengeDescription || '';
  const safeChallengeDescription = sanitizeHtml(challengeDescription);
  const challengeType = data.challengeType || 'Daily';
  const safeChallengeType = sanitizeHtml(challengeType);
  const challengeUrl = data.challengeUrl || `${PROD_URL}/chronicles/writing-challenges`;
  const safeChallengeUrl = sanitizeHtml(challengeUrl);
  const challengeDeadline = data.challengeDeadline || 'today';
  const safeChallengeDeadline = sanitizeHtml(challengeDeadline);

  const htmlContent = `
    <h1 style="margin: 0 0 0 0; font-size: 28px; color: #111827; line-height: 1.3;">${safeChallengeType} Writing Challenge Available! 🎯</h1>
    <p style="margin: 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Hi ${safeRecipientName},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      A new writing challenge is now live! This is your chance to showcase your creativity and compete with other writers.
    </p>
    <div style="margin: 0 0 25px 0; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #2563eb; border-radius: 4px;">
      <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1e40af;">${safeChallengeTitle}</h2>
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">${safeChallengeDescription}</p>
    </div>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      <strong>Deadline:</strong> ${safeChallengeDeadline}
    </p>
    ${createButton('Enter Challenge', safeChallengeUrl)}
    <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      Happy writing! 📝
    </p>
  `;

  return {
    subject: `${safeChallengeType} Writing Challenge: ${safeChallengeTitle}`,
    html: wrapEmail(htmlContent),
    text: `${safeChallengeType} Writing Challenge: ${safeChallengeTitle}\n\nHi ${recipientName},\n\nA new writing challenge is now live! This is your chance to showcase your creativity and compete with other writers.\n\n${safeChallengeTitle}\n${safeChallengeDescription}\n\nDeadline: ${challengeDeadline}\n\nEnter Challenge: ${challengeUrl}\n\nHappy writing! 📝\n\n© ${new Date().getFullYear()} Whispr. All rights reserved.\nThis is an automated message from Whispr. Please do not reply to this email.\n\nVisit us at: ${PROD_URL}`
  };
}

/**
 * Challenge winner email template
 */
export function getChallengeWinnerEmail(data: EmailTemplateData): EmailTemplate {
  const recipientName = data.recipientName || 'Winner';
  const safeRecipientName = sanitizeHtml(recipientName);
  const winnerRank = data.winnerRank || 'Top';
  const safeWinnerRank = sanitizeHtml(winnerRank);
  const winnerPrize = data.winnerPrize || 'Recognition';
  const safeWinnerPrize = sanitizeHtml(winnerPrize);
  const winningPostTitle = data.winningPostTitle || 'Your entry';
  const safeWinningPostTitle = sanitizeHtml(winningPostTitle);
  const winningPostUrl = data.winningPostUrl || `${PROD_URL}/chronicles/writing-challenges`;
  const safeWinningPostUrl = sanitizeHtml(winningPostUrl);

  const htmlContent = `
    <h1 style="margin: 0 0 0 0; font-size: 28px; color: #111827; line-height: 1.6;">🏆 Congratulations, ${safeRecipientName}!</h1>
    <p style="margin: 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      You've achieved ${safeWinnerRank} place in the writing challenge!
    </p>
    <div style="margin: 0 0 25px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
      <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #92400e;">🎉 Your Achievement</h2>
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
        <strong>Rank:</strong> ${safeWinnerRank}<br>
        <strong>Prize:</strong> ${safeWinnerPrize}<br>
        <strong>Winning Entry:</strong> ${safeWinningPostTitle}
      </p>
    </div>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
      Your creativity and writing skills have truly stood out. Thank you for participating and sharing your work with the community!
    </p>
    ${createButton('View Your Winning Entry', safeWinningPostUrl)}
    <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
      Keep writing and inspiring others! ✨
    </p>
  `;

  return {
    subject: `🏆 You Won ${safeWinnerRank} Place in the Writing Challenge!`,
    html: wrapEmail(htmlContent),
    text: `🏆 Congratulations, ${recipientName}!\n\nYou've achieved ${winnerRank} place in the writing challenge!\n\n🎉 Your Achievement\nRank: ${winnerRank}\nPrize: ${winnerPrize}\nWinning Entry: ${winningPostTitle}\n\nYour creativity and writing skills have truly stood out. Thank you for participating and sharing your work with the community!\n\nView Your Winning Entry: ${winningPostUrl}\n\nKeep writing and inspiring others! ✨\n\n© ${new Date().getFullYear()} Whispr. All rights reserved.\nThis is an automated message from Whispr. Please do not reply to this email.\n\nVisit us at: ${PROD_URL}`
  };
}
