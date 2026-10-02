-- Create admin_emails table for email management
CREATE TABLE IF NOT EXISTS public.admin_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid INTEGER NOT NULL,
  subject TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_addresses TEXT[] NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  body_text TEXT,
  body_html TEXT,
  folder TEXT NOT NULL DEFAULT 'INBOX',
  flags TEXT[] DEFAULT '{}',
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_admin_emails_folder ON public.admin_emails(folder);
CREATE INDEX IF NOT EXISTS idx_admin_emails_date ON public.admin_emails(date DESC);
CREATE INDEX IF NOT EXISTS idx_admin_emails_uid ON public.admin_emails(uid);

-- Add RLS policies (only admin can access)
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all emails"
  ON public.admin_emails FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert emails"
  ON public.admin_emails FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update emails"
  ON public.admin_emails FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete emails"
  ON public.admin_emails FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin
      WHERE id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_emails_updated_at
  BEFORE UPDATE ON public.admin_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
