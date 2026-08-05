// Copyright Protection Service
// Handles content hashing, article IDs, version history, and copyright management

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/lib/supabase-server';
import type {
  ContentFingerprint,
  ArticleMetadata,
  ArticleProof,
  VerificationResult,
  CertificateData,
  CanonicalContent,
  VersionHistory
} from '@/lib/types/copyright.types';

export class CopyrightService {
  private static readonly ARTICLE_ID_PREFIX = 'WHP-';
  private static readonly ARTICLE_ID_LENGTH = 8;
  private static readonly HASH_ALGORITHM = 'sha-256';

  /**
   * Generate a unique article ID in format WHP-XXXXXXXX
   */
  static generateArticleId(): string {
    const chars = '0123456789ABCDEF';
    let result = this.ARTICLE_ID_PREFIX;
    for (let i = 0; i < this.ARTICLE_ID_LENGTH; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  /**
   * Generate SHA-256 hash from canonical content
   * Canonical content includes: title, subtitle, body, author_id, creation_date
   */
  static generateContentHash(canonicalContent: CanonicalContent): string {
    const contentString = [
      canonicalContent.title,
      canonicalContent.subtitle || '',
      canonicalContent.body,
      canonicalContent.author_id,
      canonicalContent.creation_date
    ].join('|');

    return crypto
      .createHash(this.HASH_ALGORITHM)
      .update(contentString)
      .digest('hex');
  }

  /**
   * Create canonical content object from article data
   */
  static createCanonicalContent(article: any): CanonicalContent {
    return {
      title: article.title || '',
      subtitle: article.excerpt || '',
      body: article.content || '',
      author_id: article.admin_id || article.creator_id || '',
      creation_date: article.created_at || new Date().toISOString()
    };
  }

  /**
   * Create content fingerprint record
   */
  static async createFingerprint(
    articleId: string,
    articleType: 'post' | 'chronicles_post' | 'chronicles_chain_entry',
    canonicalContent: CanonicalContent,
    createdBy: string,
    metadata: Record<string, any> = {}
  ): Promise<ContentFingerprint> {
    const supabase = createSupabaseServer();

    // Generate hash
    const sha256Hash = this.generateContentHash(canonicalContent);
    const contentLength = JSON.stringify(canonicalContent).length;

    // Check for duplicate hash
    const { data: existing } = await supabase
      .from('content_fingerprints')
      .select('id, article_id')
      .eq('sha256_hash', sha256Hash)
      .single();

    if (existing) {
      // If the existing fingerprint is for the same article, return it
      if (existing.article_id === articleId) {
        const { data: fingerprint } = await supabase
          .from('content_fingerprints')
          .select('*')
          .eq('id', existing.id)
          .single();
        return fingerprint;
      }
      // Otherwise, it's a duplicate of different content
      throw new Error('Duplicate content detected. This content already exists.');
    }

    // Get next version number
    const { data: versionData } = await supabase
      .from('content_fingerprints')
      .select('article_version')
      .eq('article_id', articleId)
      .order('article_version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (versionData?.article_version || 0) + 1;

    // Insert fingerprint
    const { data, error } = await supabase
      .from('content_fingerprints')
      .insert({
        article_id: articleId,
        article_type: articleType,
        article_version: nextVersion,
        sha256_hash: sha256Hash,
        content_length: contentLength,
        published_at: new Date().toISOString(),
        created_by: createdBy,
        algorithm: this.HASH_ALGORITHM,
        metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get version history for an article
   */
  static async getVersionHistory(articleId: string): Promise<VersionHistory[]> {
    const supabase = createSupabaseServer();

    const { data, error } = await supabase
      .from('content_fingerprints')
      .select('*')
      .eq('article_id', articleId)
      .order('article_version', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get latest fingerprint for an article
   */
  static async getLatestFingerprint(articleId: string): Promise<ContentFingerprint | null> {
    const supabase = createSupabaseServer();

    const { data, error } = await supabase
      .from('content_fingerprints')
      .select('*')
      .eq('article_id', articleId)
      .order('article_version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  }

  /**
   * Verify content by article ID or SHA256 hash
   */
  static async verifyContent(identifier: string): Promise<VerificationResult> {
    const supabase = createSupabaseServer();

    let fingerprint = null;

    console.log('Verifying content with identifier:', identifier);

    // First, try to find fingerprint by SHA256 hash (simple query)
    if (!fingerprint) {
      const result = await supabase
        .from('content_fingerprints')
        .select('*')
        .eq('sha256_hash', identifier)
        .order('article_version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log('SHA256 search result:', result.error ? 'Error' : (result.data ? 'Found' : 'Not found'));
      if (!result.error && result.data) {
        fingerprint = result.data;
      }
    }

    // Try to find by metadata article_id (WHP-XXXXXXXX)
    if (!fingerprint) {
      const result = await supabase
        .from('content_fingerprints')
        .select('*')
        .eq('metadata->>article_id', identifier)
        .order('article_version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log('Metadata article_id search result:', result.error ? 'Error' : (result.data ? 'Found' : 'Not found'));
      if (!result.error && result.data) {
        fingerprint = result.data;
      }
    }

    // Try to find by internal article_id (UUID)
    if (!fingerprint) {
      const result = await supabase
        .from('content_fingerprints')
        .select('*')
        .eq('article_id', identifier)
        .order('article_version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log('Internal article_id search result:', result.error ? 'Error' : (result.data ? 'Found' : 'Not found'));
      if (!result.error && result.data) {
        fingerprint = result.data;
      }
    }

    if (!fingerprint) {
      console.log('No fingerprint found for identifier:', identifier);
      return { exists: false };
    }

    console.log('Found fingerprint:', fingerprint.id, 'for article:', fingerprint.article_id, 'type:', fingerprint.article_type);

    // Get article details based on type
    let author = 'Unknown';
    let slug = null;

    if (fingerprint.article_type === 'post') {
      const { data: post } = await supabase
        .from('posts')
        .select('title, slug, admin_id, admin:admin_id(username, full_name)')
        .eq('id', fingerprint.article_id)
        .maybeSingle();
      
      if (post) {
        author = post.admin?.full_name || post.admin?.username || 'Unknown';
        slug = post.slug;
      }
    } else if (fingerprint.article_type === 'chronicles_post') {
      const { data: post } = await supabase
        .from('chronicles_posts')
        .select('title, slug, creator_id, creator:creator_id(pen_name, username)')
        .eq('id', fingerprint.article_id)
        .maybeSingle();
      
      if (post) {
        author = post.creator?.pen_name || post.creator?.username || 'Unknown';
        slug = post.slug;
      }
    }

    // Get all versions
    const { data: allVersions } = await supabase
      .from('content_fingerprints')
      .select('article_version, sha256_hash, published_at')
      .eq('article_id', fingerprint.article_id)
      .order('article_version', { ascending: true });

    const articleType = fingerprint.article_type === 'post' ? 'blog' : 'chronicles';
    const originalUrl = slug ? `/${articleType}/${slug}` : null;

    return {
      exists: true,
      author,
      published_date: fingerprint.published_at,
      current_version: fingerprint.article_version,
      original_url: originalUrl || undefined,
      all_versions: allVersions || [],
      hash_history: allVersions || []
    };
  }

  /**
   * Generate article proof for API
   */
  static async generateArticleProof(articleId: string): Promise<ArticleProof | null> {
    const supabase = createSupabaseServer();

    let fingerprint = null;

    // Try to find by SHA256 hash first
    if (!fingerprint) {
      const result = await supabase
        .from('content_fingerprints')
        .select(`
          *,
          post:posts(id, title, slug, admin_id, admin:admin_id(username, full_name)),
          chronicles_post:chronicles_posts(id, title, slug, creator_id, creator:creator_id(username, pen_name))
        `)
        .eq('sha256_hash', articleId)
        .order('article_version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!result.error && result.data) {
        fingerprint = result.data;
      }
    }

    // Try to find by metadata article_id (WHP-XXXXXXXX)
    if (!fingerprint) {
      const result = await supabase
        .from('content_fingerprints')
        .select(`
          *,
          post:posts(id, title, slug, admin_id, admin:admin_id(username, full_name)),
          chronicles_post:chronicles_posts(id, title, slug, creator_id, creator:creator_id(username, pen_name))
        `)
        .eq('metadata->>article_id', articleId)
        .order('article_version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!result.error && result.data) {
        fingerprint = result.data;
      }
    }

    // Try to find by internal article_id (UUID)
    if (!fingerprint) {
      const result = await supabase
        .from('content_fingerprints')
        .select(`
          *,
          post:posts(id, title, slug, admin_id, admin:admin_id(username, full_name)),
          chronicles_post:chronicles_posts(id, title, slug, creator_id, creator:creator_id(username, pen_name))
        `)
        .eq('article_id', articleId)
        .order('article_version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!result.error && result.data) {
        fingerprint = result.data;
      }
    }

    if (!fingerprint) return null;

    const author = fingerprint.post?.admin?.full_name || 
                   fingerprint.post?.admin?.username ||
                   fingerprint.chronicles_post?.creator?.pen_name ||
                   fingerprint.chronicles_post?.creator?.username ||
                   'Unknown';

    const slug = fingerprint.post?.slug || fingerprint.chronicles_post?.slug;
    const articleType = fingerprint.article_type === 'post' ? 'blog' : 'chronicles';
    const canonicalUrl = slug ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/${articleType}/${slug}` : '';

    const currentYear = new Date().getFullYear();
    const metadata: ArticleMetadata = {
      author,
      copyrightHolder: author,
      copyrightYear: currentYear,
      publisher: 'Whispr',
      license: 'Perpetual, non-exclusive license to host and distribute',
      datePublished: fingerprint.published_at,
      dateModified: fingerprint.updated_at,
      headline: fingerprint.metadata?.title || '',
      mainEntityOfPage: canonicalUrl,
      canonicalUrl
    };

    return {
      article_id: fingerprint.metadata?.article_id || articleId,
      sha256: fingerprint.sha256_hash,
      version: fingerprint.article_version,
      timestamp: fingerprint.published_at,
      author,
      canonical_url: canonicalUrl,
      metadata
    };
  }

  /**
   * Generate certificate data for PDF generation
   */
  static async generateCertificateData(articleId: string): Promise<CertificateData | null> {
    const supabase = createSupabaseServer()

    let fingerprint
    let articleIdToUse = articleId

    // Check if the provided ID is an Article ID (WHP-XXXXXXXX)
    if (articleId.startsWith('WHP-')) {
      const { data } = await supabase
        .from('content_fingerprints')
        .select('*')
        .eq('metadata->>article_id', articleId)
        .order('article_version', { ascending: false })
        .limit(1)
        .single()

      fingerprint = data
    } else {
      // Try internal UUID
      const { data } = await supabase
        .from('content_fingerprints')
        .select('*')
        .eq('article_id', articleId)
        .order('article_version', { ascending: false })
        .limit(1)
        .single()

      fingerprint = data
    }

    if (!fingerprint) {
      return null
    }

    // Get article details
    let article
    if (fingerprint.article_type === 'post') {
      const { data } = await supabase
        .from('posts')
        .select('title, slug, admin_id, admin:admin_id(full_name, username)')
        .eq('id', fingerprint.article_id)
        .single()
      article = data
    } else if (fingerprint.article_type === 'chronicles_post') {
      const { data } = await supabase
        .from('chronicles_posts')
        .select('title, slug, creator_id, creator:creator_id(pen_name, username)')
        .eq('id', fingerprint.article_id)
        .single()
      article = data
    }

    const author = fingerprint.article_type === 'post' 
      ? article?.admin?.full_name || article?.admin?.username || 'Unknown'
      : article?.creator?.pen_name || article?.creator?.username || 'Unknown'

    const slug = article?.slug
    const articleType = fingerprint.article_type === 'post' ? 'blog' : 'chronicles'
    const canonicalUrl = slug 
      ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whispr.app'}/${articleType}/${slug}`
      : ''

    return {
      article_title: fingerprint.metadata?.title || article?.title || 'Unknown',
      author,
      article_id: fingerprint.metadata?.article_id || articleId,
      version: fingerprint.article_version,
      publication_date: fingerprint.published_at,
      sha256_fingerprint: fingerprint.sha256_hash,
      canonical_url: canonicalUrl,
      generated_timestamp: new Date().toISOString()
    };
  }

  /**
   * Assign article ID to an article if not already assigned
   */
  static async assignArticleId(
    articleId: string,
    articleType: 'post' | 'chronicles_post' | 'chronicles_chain_entry'
  ): Promise<string> {
    const supabase = createSupabaseServer();

    // Check if article already has an article_id
    const tableName = articleType === 'post' ? 'posts' : 
                     articleType === 'chronicles_post' ? 'chronicles_posts' : 'chronicles_chain_entry_posts';

    const { data: existing } = await supabase
      .from(tableName)
      .select('article_id')
      .eq('id', articleId)
      .single();

    if (existing?.article_id) {
      return existing.article_id;
    }

    // Generate new article ID
    const newArticleId = this.generateArticleId();

    // Update article with new ID
    const { error } = await supabase
      .from(tableName)
      .update({ article_id: newArticleId })
      .eq('id', articleId);

    if (error) throw error;

    return newArticleId;
  }

  /**
   * Check if content hash already exists
   */
  static async checkDuplicateHash(hash: string): Promise<boolean> {
    const supabase = createSupabaseServer();

    const { data, error } = await supabase
      .from('content_fingerprints')
      .select('id')
      .eq('sha256_hash', hash)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }
}
