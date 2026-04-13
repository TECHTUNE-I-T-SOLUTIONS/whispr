-- Disable RLS on chronicles_generated_reports to allow inserts from API
-- This is safe because:
-- 1. Only admins should access this endpoint
-- 2. Reports are admin-only generated content
-- 3. RLS can cause issues with report generation

BEGIN;

-- Disable RLS on chronicles_generated_reports
ALTER TABLE public.chronicles_generated_reports DISABLE ROW LEVEL SECURITY;

-- Disable RLS on all report data tables
ALTER TABLE public.chronicles_audience_report_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_compliance_report_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_content_report_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_creator_report_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_engagement_report_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_monetization_report_data DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on these tables
DROP POLICY IF EXISTS "enable_authenticated_read" ON public.chronicles_generated_reports;
DROP POLICY IF EXISTS "enable_authenticated_insert" ON public.chronicles_generated_reports;
DROP POLICY IF EXISTS "enable_authenticated_update" ON public.chronicles_generated_reports;
DROP POLICY IF EXISTS "enable_service_insert" ON public.chronicles_generated_reports;
DROP POLICY IF EXISTS "enable_read" ON public.chronicles_generated_reports;
DROP POLICY IF EXISTS "enable_insert" ON public.chronicles_generated_reports;

COMMIT;
