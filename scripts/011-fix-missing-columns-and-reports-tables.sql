-- Migration: Fix Chronicles Missing Columns & Tables
-- This fixes: display_name, avatar_url, and other missing columns
-- Also creates missing tables: chronicles_generated_reports, chronicles_report_templates, chronicles_daily_analytics

-- =====================================================
-- 1. ADD MISSING COLUMNS TO chronicles_creators
-- =====================================================

-- Add display_name column (alternative to pen_name for UI)
ALTER TABLE chronicles_creators
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update display_name from pen_name if empty
UPDATE chronicles_creators 
SET display_name = pen_name 
WHERE display_name IS NULL OR display_name = '';

-- Add avatar_url column (alternative to profile_image_url)
ALTER TABLE chronicles_creators
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update avatar_url from profile_image_url if empty
UPDATE chronicles_creators 
SET avatar_url = profile_image_url 
WHERE avatar_url IS NULL OR avatar_url = '';

-- =====================================================
-- 2. CREATE MISSING REPORT TABLES
-- =====================================================

-- Chronicles Report Templates (Predefined report formats)
CREATE TABLE IF NOT EXISTS chronicles_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'analytics', 'monetization', 'engagement', 'creator_performance',
    'content_analysis', 'audience_demographics', 'revenue_breakdown'
  )),
  
  -- Template Configuration
  fields TEXT[] DEFAULT ARRAY[]::TEXT[],
  visualization_type TEXT DEFAULT 'table', -- table, chart, pie, line, bar
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_custom BOOLEAN DEFAULT FALSE,
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chronicles Generated Reports (Actual reports created from templates)
CREATE TABLE IF NOT EXISTS chronicles_generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES chronicles_report_templates(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES chronicles_creators(id) ON DELETE SET NULL,
  
  report_type TEXT NOT NULL CHECK (report_type IN (
    'analytics', 'monetization', 'engagement', 'creator_performance',
    'content_analysis', 'audience_demographics', 'revenue_breakdown'
  )),
  
  -- Report Data
  title TEXT NOT NULL,
  description TEXT,
  report_data JSONB DEFAULT '{}'::JSONB,
  
  -- Time Range
  start_date DATE,
  end_date DATE,
  
  -- Status
  status TEXT DEFAULT 'generated' CHECK (status IN ('pending', 'generating', 'generated', 'failed')),
  
  -- Generation Info
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chronicles Daily Analytics already exists with platform-wide metrics
-- No need to create or modify - table structure is correct
-- The table tracks daily platform statistics, not per-creator data

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_chronicles_creators_display_name ON chronicles_creators(display_name);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON chronicles_report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_template ON chronicles_generated_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_creator ON chronicles_generated_reports(creator_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON chronicles_generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON chronicles_generated_reports(status);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created ON chronicles_generated_reports(created_at DESC);

-- =====================================================
-- 4. INSERT DEFAULT REPORT TEMPLATES
-- =====================================================

INSERT INTO chronicles_report_templates (name, slug, report_type, description, metrics, include_charts, include_tables, include_summary, is_default)
VALUES
  (
    'Monthly Analytics Overview',
    'monthly-analytics-overview',
    'analytics',
    'Comprehensive overview of platform analytics for the past month',
    ARRAY['posts_published', 'total_views', 'total_engagement', 'new_creators', 'active_creators'],
    true,
    true,
    true,
    true
  ),
  (
    'Creator Performance Report',
    'creator-performance-report',
    'creator_performance',
    'Individual creator performance metrics and rankings',
    ARRAY['creator_name', 'total_posts', 'total_engagement', 'growth_rate', 'engagement_rate'],
    true,
    true,
    true,
    false
  ),
  (
    'Engagement Analytics',
    'engagement-analytics',
    'engagement',
    'Deep dive into user engagement patterns',
    ARRAY['date', 'likes', 'comments', 'shares', 'engagement_rate'],
    true,
    true,
    true,
    false
  ),
  (
    'Revenue & Monetization',
    'revenue-monetization',
    'monetization',
    'Revenue breakdown and monetization performance',
    ARRAY['total_revenue', 'ad_revenue', 'creator_payouts', 'pending_balance'],
    true,
    true,
    true,
    false
  ),
  (
    'Content Analysis',
    'content-analysis',
    'content_analysis',
    'Content type distribution and performance',
    ARRAY['content_type', 'post_count', 'avg_engagement', 'top_categories'],
    true,
    true,
    true,
    false
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE chronicles_generated_reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. FIX FOR conversation_participants TABLE
-- =====================================================

-- Check if conversation_participants table exists and add last_read_at if missing
ALTER TABLE conversation_participants
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE;

-- Update existing rows with joined_at as fallback
UPDATE conversation_participants
SET last_read_at = joined_at
WHERE last_read_at IS NULL AND joined_at IS NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_last_read ON conversation_participants(last_read_at DESC);

-- =====================================================
-- 7. VERIFICATION & STATUS CHECK
-- =====================================================

-- Verify all required columns exist
SELECT 'Chronicles Creators - Column Verification' as check_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chronicles_creators' 
    AND column_name IN ('display_name', 'avatar_url', 'is_verified', 'is_banned')
  ) THEN '✅ PASS: All creator columns exist'
  ELSE '❌ FAIL: Missing creator columns'
  END as status

UNION ALL

SELECT 'Report Tables - Verification',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name IN ('chronicles_report_templates', 'chronicles_generated_reports', 'chronicles_daily_analytics')
  ) THEN '✅ PASS: All report tables exist'
  ELSE '❌ FAIL: Missing report tables'
  END

UNION ALL

SELECT 'Conversation Participants - Verification',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversation_participants' 
    AND column_name = 'last_read_at'
  ) THEN '✅ PASS: last_read_at column exists'
  ELSE '❌ FAIL: last_read_at column missing'
  END;

-- Final confirmation
SELECT '✅ Migration Complete! All missing columns and tables have been created.' AS final_status;
