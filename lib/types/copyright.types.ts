// Copyright Protection System Types

export interface ContentFingerprint {
  id: string;
  article_id: string;
  article_type: 'post' | 'chronicles_post' | 'chronicles_chain_entry';
  article_version: number;
  sha256_hash: string;
  content_length: number;
  published_at: string;
  created_by: string;
  algorithm: string;
  metadata: {
    title?: string;
    excerpt?: string;
    article_id?: string;
    slug?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ArticleMetadata {
  author: string;
  copyrightHolder: string;
  copyrightYear: number;
  publisher: string;
  license: string;
  datePublished: string;
  dateModified?: string;
  headline: string;
  mainEntityOfPage: string;
  canonicalUrl: string;
}

export interface ArticleProof {
  article_id: string;
  sha256: string;
  version: number;
  timestamp: string;
  author: string;
  canonical_url: string;
  metadata: ArticleMetadata;
}

export interface VerificationResult {
  exists: boolean;
  title?: string;
  author?: string;
  published_date?: string;
  current_version?: number;
  original_url?: string;
  all_versions?: Array<{
    version: number;
    sha256_hash: string;
    published_at: string;
  }>;
  hash_history?: Array<{
    sha256_hash: string;
    version: number;
    published_at: string;
  }>;
}

export interface CertificateData {
  article_title: string;
  author: string;
  article_id: string;
  version: number;
  publication_date: string;
  sha256_fingerprint: string;
  canonical_url: string;
  generated_timestamp: string;
}

export interface CanonicalContent {
  title: string;
  subtitle?: string;
  body: string;
  author_id: string;
  creation_date: string;
}

export interface VersionHistory {
  version: number;
  sha256_hash: string;
  content_length: number;
  published_at: string;
  created_by: string;
  metadata: Record<string, any>;
}
