-- WHISPR CHRONICLES - REPORTS & GENERATION TABLES
-- Comprehensive reporting system with scheduled reports and export capabilities
-- Run this AFTER running 012-chronicles-settings-tables.sql

-- =====================================================
-- REPORTS & REPORTING INFRASTRUCTURE
-- =====================================================

-- Report Templates
CREATE TABLE IF NOT EXISTS chronicles_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Report Configuration
  report_type TEXT NOT NULL, -- 'analytics', 'monetization', 'engagement', 'content', 'creator_performance'
  metrics TEXT[] NOT NULL, -- Array of metric keys to include
  
  -- Visualization
  include_charts BOOLEAN DEFAULT TRUE,
  include_tables BOOLEAN DEFAULT TRUE,
  include_summary BOOLEAN DEFAULT TRUE,
  
  -- Distribution
  is_public BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Generated Reports
CREATE TABLE IF NOT EXISTS chronicles_generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_id UUID NOT NULL REFERENCES chronicles_report_templates(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES chronicles_creators(id) ON DELETE SET NULL,
  
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  
  -- Date Range
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Content
  report_data JSONB NOT NULL, -- Aggregated metrics and data
  summary TEXT, -- Executive summary
  
  -- File Information
  file_path TEXT,
  file_format TEXT DEFAULT 'json', -- json, pdf, csv, xlsx
  file_size_bytes INT,
  
  -- Generation Info
  generated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generation_time_ms INT,
  
  -- Status
  status TEXT DEFAULT 'generated', -- 'pending', 'generating', 'generated', 'failed'
  error_message TEXT,
  
  -- Download Tracking
  download_count INT DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled Reports
CREATE TABLE IF NOT EXISTS chronicles_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_id UUID NOT NULL REFERENCES chronicles_report_templates(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  report_name TEXT NOT NULL,
  
  -- Schedule
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  day_of_week INT, -- 0-6 for weekly (0 = Sunday)
  day_of_month INT, -- 1-31 for monthly
  time_of_day TIME DEFAULT '00:00:00',
  
  -- Recipients
  email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  send_to_creator BOOLEAN DEFAULT TRUE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  next_generation_at TIMESTAMP WITH TIME ZONE,
  
  failed_generations INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report Exports (Track user-initiated exports)
CREATE TABLE IF NOT EXISTS chronicles_report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  export_type TEXT NOT NULL, -- 'analytics', 'monetization', 'followers', 'engagement'
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  
  format TEXT NOT NULL, -- 'csv', 'json', 'xlsx', 'pdf'
  file_path TEXT NOT NULL,
  file_size_bytes INT,
  
  row_count INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Performance Report Data
CREATE TABLE IF NOT EXISTS chronicles_content_report_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  report_id UUID NOT NULL REFERENCES chronicles_generated_reports(id) ON DELETE CASCADE,
  
  -- Post Information
  post_id UUID REFERENCES chronicles_posts(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  -- Metrics
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  engagement_rate NUMERIC(5, 2) DEFAULT 0,
  
  -- Categorization
  category TEXT,
  post_type TEXT, -- 'text', 'audio', 'video', 'media'
  
  -- Performance
  publish_date DATE,
  peak_engagement_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creator Performance Report Data
CREATE TABLE IF NOT EXISTS chronicles_creator_report_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  report_id UUID NOT NULL REFERENCES chronicles_generated_reports(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  -- Growth Metrics
  follower_growth INT DEFAULT 0,
  engagement_growth NUMERIC(5, 2) DEFAULT 0,
  post_frequency INT DEFAULT 0, -- Posts per period
  
  -- Engagement Metrics
  avg_engagement_per_post NUMERIC(5, 2) DEFAULT 0,
  total_engagement INT DEFAULT 0,
  
  -- Monetization
  total_earnings NUMERIC(12, 2) DEFAULT 0,
  earnings_growth NUMERIC(5, 2) DEFAULT 0,
  
  -- Reach
  total_views INT DEFAULT 0,
  unique_viewers INT DEFAULT 0,
  
  -- Ranking
  leaderboard_rank INT,
  rank_change INT, -- +5 or -3
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Monetization Report Data
CREATE TABLE IF NOT EXISTS chronicles_monetization_report_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  report_id UUID NOT NULL REFERENCES chronicles_generated_reports(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES chronicles_creators(id) ON DELETE SET NULL,
  
  -- Revenue Breakdown
  ad_revenue NUMERIC(12, 2) DEFAULT 0,
  tip_revenue NUMERIC(12, 2) DEFAULT 0,
  subscription_revenue NUMERIC(12, 2) DEFAULT 0,
  total_revenue NUMERIC(12, 2) DEFAULT 0,
  
  -- Costs & Fees
  platform_fees NUMERIC(12, 2) DEFAULT 0,
  processing_fees NUMERIC(12, 2) DEFAULT 0,
  net_revenue NUMERIC(12, 2) DEFAULT 0,
  
  -- Ad Performance
  ad_impressions INT DEFAULT 0,
  ad_clicks INT DEFAULT 0,
  ctr NUMERIC(5, 2) DEFAULT 0,
  cpm NUMERIC(8, 2) DEFAULT 0,
  
  -- Subscriber Data
  subscriber_count INT DEFAULT 0,
  subscriber_growth INT DEFAULT 0,
  subscriber_retention_rate NUMERIC(5, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Engagement Report Data
CREATE TABLE IF NOT EXISTS chronicles_engagement_report_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  report_id UUID NOT NULL REFERENCES chronicles_generated_reports(id) ON DELETE CASCADE,
  
  -- Daily breakdowns
  report_date DATE NOT NULL,
  
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  reposts INT DEFAULT 0,
  follows INT DEFAULT 0,
  
  engagement_score NUMERIC(10, 2) DEFAULT 0,
  
  -- Peak metrics
  peak_engagement_time INT, -- Hour of day
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(report_id, report_date)
);

-- Audience Report Data
CREATE TABLE IF NOT EXISTS chronicles_audience_report_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  report_id UUID NOT NULL REFERENCES chronicles_generated_reports(id) ON DELETE CASCADE,
  
  -- Demographics
  total_followers INT DEFAULT 0,
  new_followers INT DEFAULT 0,
  lost_followers INT DEFAULT 0,
  
  avg_age INT,
  
  -- Geographic
  top_countries JSONB DEFAULT '[]'::JSONB, -- [{country, count, percentage}]
  top_regions JSONB DEFAULT '[]'::JSONB,
  
  -- Device
  device_breakdown JSONB DEFAULT '{}' -- {mobile, desktop, tablet}
);

-- Compliance & Moderation Reports
CREATE TABLE IF NOT EXISTS chronicles_compliance_report_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  report_id UUID NOT NULL REFERENCES chronicles_generated_reports(id) ON DELETE CASCADE,
  
  -- Flagged Content
  total_flagged_posts INT DEFAULT 0,
  total_flagged_comments INT DEFAULT 0,
  total_flagged_users INT DEFAULT 0,
  
  -- Actions Taken
  posts_removed INT DEFAULT 0,
  comments_removed INT DEFAULT 0,
  users_banned INT DEFAULT 0,
  
  -- Policy Violations
  violation_types JSONB DEFAULT '{}', -- {hate_speech: 5, spam: 12, etc}
  
  -- Appeals
  total_appeals INT DEFAULT 0,
  appeals_upheld INT DEFAULT 0,
  appeals_overturned INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report Audit Log (Track report access)
CREATE TABLE IF NOT EXISTS chronicles_report_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  report_id UUID NOT NULL REFERENCES chronicles_generated_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL, -- 'viewed', 'downloaded', 'shared', 'exported'
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR REPORTS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_generated_reports_template ON chronicles_generated_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_creator ON chronicles_generated_reports(creator_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_period ON chronicles_generated_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created ON chronicles_generated_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON chronicles_scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_creator ON chronicles_scheduled_reports(creator_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next ON chronicles_scheduled_reports(next_generation_at);
CREATE INDEX IF NOT EXISTS idx_report_exports_user ON chronicles_report_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_date ON chronicles_report_exports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_report_creator ON chronicles_content_report_data(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_report_creator ON chronicles_creator_report_data(creator_id);
CREATE INDEX IF NOT EXISTS idx_monetization_report_creator ON chronicles_monetization_report_data(creator_id);
CREATE INDEX IF NOT EXISTS idx_engagement_report_date ON chronicles_engagement_report_data(report_date);
CREATE INDEX IF NOT EXISTS idx_compliance_report_violations ON chronicles_compliance_report_data(id);
CREATE INDEX IF NOT EXISTS idx_report_audit_log_user ON chronicles_report_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_report_audit_log_report ON chronicles_report_audit_log(report_id);

-- =====================================================
-- TRIGGERS FOR REPORT MANAGEMENT
-- =====================================================

-- Update audit log when report is accessed
CREATE OR REPLACE FUNCTION log_report_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.download_count > OLD.download_count THEN
    INSERT INTO chronicles_report_audit_log (report_id, user_id, action)
    VALUES (NEW.id, COALESCE(NEW.generated_by_user_id, gen_random_uuid()), 'downloaded')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_report_access
AFTER UPDATE ON chronicles_generated_reports
FOR EACH ROW
EXECUTE FUNCTION log_report_access();

-- =====================================================
-- DEFAULT REPORT TEMPLATES
-- =====================================================

INSERT INTO chronicles_report_templates (name, slug, description, report_type, metrics, include_charts, is_default)
VALUES
  (
    'Executive Summary',
    'executive-summary',
    'High-level overview of platform performance',
    'analytics',
    ARRAY['total_creators', 'total_posts', 'total_engagement', 'active_users', 'revenue']::TEXT[],
    TRUE,
    TRUE
  ),
  (
    'Creator Performance',
    'creator-performance',
    'Detailed creator performance metrics and rankings',
    'creator_performance',
    ARRAY['follower_growth', 'engagement_rate', 'post_frequency', 'earnings', 'ranking']::TEXT[],
    TRUE,
    TRUE
  ),
  (
    'Monetization Report',
    'monetization-report',
    'Complete monetization and revenue analysis',
    'monetization',
    ARRAY['ad_revenue', 'tip_revenue', 'subscription_revenue', 'creator_earnings', 'cpm']::TEXT[],
    TRUE,
    TRUE
  ),
  (
    'Engagement Analytics',
    'engagement-analytics',
    'Detailed engagement metrics and trends',
    'engagement',
    ARRAY['daily_engagement', 'engagement_rate', 'interaction_types', 'peak_hours', 'engagement_score']::TEXT[],
    TRUE,
    TRUE
  ),
  (
    'Content Performance',
    'content-performance',
    'Top performing content and virality analysis',
    'content',
    ARRAY['top_posts', 'engagement_rate', 'virality_score', 'content_types', 'category_performance']::TEXT[],
    TRUE,
    FALSE
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SAMPLE REPORT DATA FOR TESTING
-- =====================================================

-- This will be populated when reports are generated through the API

COMMIT;
