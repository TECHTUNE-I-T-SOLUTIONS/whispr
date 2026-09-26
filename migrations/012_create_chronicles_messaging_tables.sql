-- Chronicles Messaging System with Moderation
-- This migration creates tables for secure messaging, attachments, and admin moderation

-- =====================================================
-- CORE MESSAGING TABLES
-- =====================================================

-- Conversations Table (manages conversation threads)
CREATE TABLE IF NOT EXISTS chronicles_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  participant_1_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  -- Conversation metadata
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  message_count INT DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_archived_by_1 BOOLEAN DEFAULT FALSE,
  is_archived_by_2 BOOLEAN DEFAULT FALSE,
  
  -- Encryption metadata
  encryption_key_id TEXT, -- Reference to encryption key management
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CHECK (participant_1_id != participant_2_id) -- Prevent self-conversations
);

-- Create index for faster conversation lookup
CREATE INDEX idx_conversations_participants ON chronicles_conversations(participant_1_id, participant_2_id);
CREATE INDEX idx_conversations_participants_reverse ON chronicles_conversations(participant_2_id, participant_1_id);

-- Trigger to prevent duplicate conversations
CREATE OR REPLACE FUNCTION prevent_duplicate_conversations()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if conversation already exists (in either direction)
  IF EXISTS (
    SELECT 1 FROM chronicles_conversations
    WHERE (
      (participant_1_id = NEW.participant_1_id AND participant_2_id = NEW.participant_2_id) OR
      (participant_1_id = NEW.participant_2_id AND participant_2_id = NEW.participant_1_id)
    )
    AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Conversation already exists between these participants';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_prevent_duplicate_conversations
BEFORE INSERT ON chronicles_conversations
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_conversations();

-- Messages Table (stores encrypted messages)
CREATE TABLE IF NOT EXISTS chronicles_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  conversation_id UUID NOT NULL REFERENCES chronicles_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  -- Encrypted content
  encrypted_content TEXT NOT NULL, -- AES-256 encrypted message content
  content_iv TEXT NOT NULL, -- Initialization vector for decryption
  encryption_version TEXT DEFAULT 'v1', -- For future encryption upgrades
  
  -- Message metadata
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio', 'video', 'system')),
  reply_to_id UUID REFERENCES chronicles_messages(id) ON DELETE SET NULL, -- For threaded replies
  
  -- Status
  is_deleted BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Read receipts
  read_by_1 BOOLEAN DEFAULT FALSE,
  read_by_1_at TIMESTAMP WITH TIME ZONE,
  read_by_2 BOOLEAN DEFAULT FALSE,
  read_by_2_at TIMESTAMP WITH TIME ZONE,
  
  -- Moderation
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderation_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message Attachments Table
CREATE TABLE IF NOT EXISTS chronicles_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key
  message_id UUID NOT NULL REFERENCES chronicles_messages(id) ON DELETE CASCADE,
  
  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  file_size INT NOT NULL, -- Size in bytes
  storage_path TEXT NOT NULL, -- Supabase storage path
  
  -- Encryption metadata
  encrypted BOOLEAN DEFAULT FALSE,
  encryption_key_id TEXT,
  
  -- Processing status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  
  -- Thumbnails/previews
  thumbnail_path TEXT,
  preview_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MODERATION AND CONTROL TABLES
-- =====================================================

-- Messaging Restrictions Table (admin control over user messaging)
CREATE TABLE IF NOT EXISTS chronicles_messaging_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User being restricted
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  -- Restriction type
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('temporary', 'permanent', 'warning')),
  
  -- Restriction details
  reason TEXT NOT NULL,
  restricted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Duration (for temporary restrictions)
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent restrictions
  
  -- Restriction scope
  can_send_messages BOOLEAN DEFAULT FALSE,
  can_receive_messages BOOLEAN DEFAULT FALSE,
  can_send_attachments BOOLEAN DEFAULT FALSE,
  can_create_conversations BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  lifted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lifted_at TIMESTAMP WITH TIME ZONE,
  lift_reason TEXT,
  
  -- Notification to user
  user_notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message Moderation Queue (for admin review)
CREATE TABLE IF NOT EXISTS chronicles_message_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Message being moderated
  message_id UUID NOT NULL REFERENCES chronicles_messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES chronicles_conversations(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES chronicles_creators(id) ON DELETE SET NULL,
  
  -- Moderation details
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  flag_reason TEXT NOT NULL CHECK (flag_reason IN ('spam', 'harassment', 'inappropriate_content', 'scam', 'other')),
  additional_notes TEXT,
  
  -- Auto moderation results
  ai_flagged BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
  ai_reason TEXT,
  
  -- Admin review
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_action TEXT CHECK (review_action IN ('approve', 'reject', 'delete', 'warn_user', 'restrict_user')),
  review_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message Reports Table (user-generated reports)
CREATE TABLE IF NOT EXISTS chronicles_message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Report details
  reporter_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chronicles_messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES chronicles_conversations(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  -- Report categorization
  report_type TEXT NOT NULL CHECK (report_type IN ('harassment', 'spam', 'inappropriate', 'scam', 'threat', 'other')),
  description TEXT NOT NULL,
  
  -- Evidence
  attachment_urls TEXT[], -- Array of screenshot URLs or other evidence
  
  -- Admin handling
  admin_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_action TEXT CHECK (admin_action IN ('no_action', 'warning', 'temporary_restriction', 'permanent_restriction', 'ban_user')),
  admin_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent duplicate reports
  CONSTRAINT unique_report UNIQUE (reporter_id, message_id)
);

-- User Messaging Notices (notifications to users about moderation actions)
CREATE TABLE IF NOT EXISTS chronicles_messaging_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  -- Notice details
  notice_type TEXT NOT NULL CHECK (notice_type IN ('restriction_applied', 'restriction_lifted', 'warning_issued', 'content_removed', 'account_suspended')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related data
  related_message_id UUID REFERENCES chronicles_messages(id) ON DELETE SET NULL,
  related_conversation_id UUID REFERENCES chronicles_conversations(id) ON DELETE SET NULL,
  restriction_id UUID REFERENCES chronicles_messaging_restrictions(id) ON DELETE SET NULL,
  
  -- Display settings
  is_dismissible BOOLEAN DEFAULT TRUE,
  requires_acknowledgment BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE -- NULL for permanent notices
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON chronicles_conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON chronicles_conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON chronicles_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_active ON chronicles_conversations(is_active, is_archived_by_1, is_archived_by_2);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON chronicles_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON chronicles_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON chronicles_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_moderation ON chronicles_messages(moderation_status);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON chronicles_messages(is_deleted);

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_attachments_message ON chronicles_message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_processing ON chronicles_message_attachments(processing_status);

-- Moderation indexes
CREATE INDEX IF NOT EXISTS idx_restrictions_creator ON chronicles_messaging_restrictions(creator_id);
CREATE INDEX IF NOT EXISTS idx_restrictions_active ON chronicles_messaging_restrictions(is_active, ends_at);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON chronicles_message_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON chronicles_message_moderation_queue(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON chronicles_message_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON chronicles_message_reports(status);
CREATE INDEX IF NOT EXISTS idx_notices_creator ON chronicles_messaging_notices(creator_id);
CREATE INDEX IF NOT EXISTS idx_notices_read ON chronicles_messaging_notices(is_read, created_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE chronicles_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_messaging_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_message_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_messaging_notices ENABLE ROW LEVEL SECURITY;

-- Conversations RLS
CREATE POLICY "Creators can view their conversations"
  ON chronicles_conversations FOR SELECT
  USING (
    participant_1_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
    OR participant_2_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can create conversations"
  ON chronicles_conversations FOR INSERT
  WITH CHECK (
    participant_1_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
    OR participant_2_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update their conversations"
  ON chronicles_conversations FOR UPDATE
  USING (
    participant_1_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
    OR participant_2_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
  );

-- Messages RLS
CREATE POLICY "Creators can view messages in their conversations"
  ON chronicles_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM chronicles_conversations
      WHERE participant_1_id IN (SELECT id FROM chronicles_creators WHERE user_id = auth.uid())
      OR participant_2_id IN (SELECT id FROM chronicles_creators WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Creators can send messages"
  ON chronicles_messages FOR INSERT
  WITH CHECK (
    sender_id IN (SELECT id FROM chronicles_creators WHERE user_id = auth.uid())
    AND id NOT IN (
      SELECT creator_id FROM chronicles_messaging_restrictions
      WHERE is_active = TRUE
      AND can_send_messages = FALSE
      AND (ends_at IS NULL OR ends_at > CURRENT_TIMESTAMP)
    )
  );

-- Attachments RLS
CREATE POLICY "Creators can view attachments in their messages"
  ON chronicles_message_attachments FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM chronicles_messages
      WHERE conversation_id IN (
        SELECT id FROM chronicles_conversations
        WHERE participant_1_id IN (SELECT id FROM chronicles_creators WHERE user_id = auth.uid())
        OR participant_2_id IN (SELECT id FROM chronicles_creators WHERE user_id = auth.uid())
      )
    )
  );

-- Messaging Notices RLS
CREATE POLICY "Creators can view their notices"
  ON chronicles_messaging_notices FOR SELECT
  USING (
    creator_id IN (SELECT id FROM chronicles_creators WHERE user_id = auth.uid())
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  );

CREATE POLICY "Creators can update their notices"
  ON chronicles_messaging_notices FOR UPDATE
  USING (
    creator_id IN (SELECT id FROM chronicles_creators WHERE user_id = auth.uid())
  );

-- Admin policies for moderation tables (simplified - handled via API)
-- These tables are managed through API endpoints that handle admin auth
-- So we use permissive policies that will be enforced at the API level
CREATE POLICY "Admins can view all restrictions"
  ON chronicles_messaging_restrictions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage restrictions"
  ON chronicles_messaging_restrictions FOR ALL
  USING (true);

CREATE POLICY "Admins can view moderation queue"
  ON chronicles_message_moderation_queue FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage moderation queue"
  ON chronicles_message_moderation_queue FOR ALL
  USING (true);

CREATE POLICY "Admins can view reports"
  ON chronicles_message_reports FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage reports"
  ON chronicles_message_reports FOR ALL
  USING (true);

CREATE POLICY "Admins can manage notices"
  ON chronicles_messaging_notices FOR ALL
  USING (true);

-- =====================================================
-- TRIGGERS FOR AUTOMATED ACTIONS
-- =====================================================

-- Trigger: Update conversation last_message_at when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chronicles_conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.encrypted_content, 50), -- Preview of encrypted content
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON chronicles_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Trigger: Auto-expire temporary restrictions
CREATE OR REPLACE FUNCTION expire_temporary_restrictions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chronicles_messaging_restrictions
  SET 
    is_active = FALSE,
    lifted_at = NOW(),
    lift_reason = 'Temporary restriction expired automatically'
  WHERE is_active = TRUE
  AND ends_at IS NOT NULL
  AND ends_at < NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check restrictions (can be called from API)
CREATE OR REPLACE FUNCTION check_messaging_restrictions(creator_id UUID)
RETURNS TABLE (
  can_send BOOLEAN,
  can_receive BOOLEAN,
  can_send_attachments BOOLEAN,
  can_create_conversations BOOLEAN,
  restriction_reason TEXT,
  restriction_ends_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(cr.can_send_messages, TRUE) as can_send,
    COALESCE(cr.can_receive_messages, TRUE) as can_receive,
    COALESCE(cr.can_send_attachments, TRUE) as can_send_attachments,
    COALESCE(cr.can_create_conversations, TRUE) as can_create_conversations,
    cr.reason as restriction_reason,
    cr.ends_at as restriction_ends_at
  FROM chronicles_messaging_restrictions cr
  WHERE cr.creator_id = creator_id
  AND cr.is_active = TRUE
  AND (cr.ends_at IS NULL OR cr.ends_at > NOW())
  LIMIT 1;
  
  -- If no restrictions found, return default TRUE values
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT TRUE, TRUE, TRUE, TRUE, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_messaging_restrictions(UUID) TO authenticated;

-- Trigger: Create notice when restriction is applied
CREATE OR REPLACE FUNCTION notify_restriction_applied()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_messaging_notices (
    creator_id,
    notice_type,
    title,
    message,
    restriction_id,
    requires_acknowledgment
  )
  VALUES (
    NEW.creator_id,
    'restriction_applied',
    CASE NEW.restriction_type
      WHEN 'temporary' THEN 'Temporary Messaging Restriction'
      WHEN 'permanent' THEN 'Messaging Restricted'
      WHEN 'warning' THEN 'Messaging Warning'
    END,
    CASE NEW.restriction_type
      WHEN 'temporary' THEN 
        'Your messaging has been temporarily restricted until ' || TO_CHAR(NEW.ends_at, 'YYYY-MM-DD HH24:MI') || '. Reason: ' || NEW.reason
      WHEN 'permanent' THEN 
        'Your messaging has been restricted. Reason: ' || NEW.reason
      WHEN 'warning' THEN 
        'You have received a warning regarding your messaging behavior. Reason: ' || NEW.reason
    END,
    NEW.id,
    NEW.restriction_type = 'permanent'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_restriction_applied
AFTER INSERT ON chronicles_messaging_restrictions
FOR EACH ROW
EXECUTE FUNCTION notify_restriction_applied();

-- Trigger: Create notice when restriction is lifted
CREATE OR REPLACE FUNCTION notify_restriction_lifted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
    INSERT INTO chronicles_messaging_notices (
      creator_id,
      notice_type,
      title,
      message,
      restriction_id,
      is_dismissible
    )
    VALUES (
      NEW.creator_id,
      'restriction_lifted',
      'Messaging Restriction Lifted',
      'Your messaging restriction has been lifted. You can now send messages again.',
      NEW.id,
      TRUE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_restriction_lifted
AFTER UPDATE ON chronicles_messaging_restrictions
FOR EACH ROW
EXECUTE FUNCTION notify_restriction_lifted();

-- =====================================================
-- STORAGE BUCKETS FOR ATTACHMENTS
-- =====================================================

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chronicles-attachments', 'chronicles-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
-- Note: These need to be set up in Supabase dashboard or via storage API
-- This is a placeholder for the storage bucket policies
