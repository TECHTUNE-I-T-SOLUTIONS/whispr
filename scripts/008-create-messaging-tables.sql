-- 008-create-messaging-tables.sql
-- Creates conversation and messaging tables, attachments, tags, and triggers to notify on new messages

-- Conversations (a room between admins)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NULL,
  is_direct boolean NOT NULL DEFAULT false,
  created_by uuid NULL REFERENCES admin(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Participants for conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
  role text NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, admin_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  admin_id uuid NULL REFERENCES admin(id) ON DELETE SET NULL,
  content text NULL,
  references_json jsonb NULL,
  tags text[] NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id DESC, created_at DESC);

-- Message attachments: link to media table if available
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  media_file_id uuid NULL REFERENCES media(id) ON DELETE SET NULL,
  file_url text NULL,
  file_type text NULL,
  file_size bigint NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: message references table (normalize references if needed)
CREATE TABLE IF NOT EXISTS message_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  ref_type text NOT NULL,
  ref_id text NOT NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger function to notify on new messages (useful for LISTEN/NOTIFY or hooking into realtime)
CREATE OR REPLACE FUNCTION notify_new_message() RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'conversation_id', NEW.conversation_id,
    'message_id', NEW.id,
    'admin_id', NEW.admin_id,
    'created_at', NEW.created_at
  );
  PERFORM pg_notify('new_message', payload::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_new_message ON messages;
CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- Trigger function to create rows in public.notifications for message recipients
CREATE OR REPLACE FUNCTION notify_new_message_create_notifications() RETURNS trigger AS $$
DECLARE
  recipient RECORD;
  notif_title varchar(255);
  notif_message text;
  conv record;
  sender_name text := 'Someone';
  is_direct boolean := false;
BEGIN
  -- Gather conversation and sender info
  SELECT * INTO conv FROM conversations WHERE id = NEW.conversation_id;
  IF conv IS NOT NULL THEN
    is_direct := conv.is_direct;
  END IF;

  IF NEW.admin_id IS NOT NULL THEN
    SELECT coalesce(display_name, email, 'Someone') INTO sender_name
    FROM admin
    WHERE id = NEW.admin_id
    LIMIT 1;
  END IF;

  -- Prepare title and message excerpt
  notif_title := coalesce(
    conv.title,
    CASE WHEN is_direct THEN ('Message from ' || sender_name) ELSE 'New message' END
  )::varchar(255);

  notif_message := left(coalesce(NEW.content, ''), 1024)::text;

  -- Insert a notification for recipients
  IF is_direct THEN
    -- For direct conversations, notify only the other participant
    FOR recipient IN
      SELECT admin_id FROM conversation_participants
      WHERE conversation_id = NEW.conversation_id
        AND admin_id IS NOT NULL
        AND admin_id <> NEW.admin_id
    LOOP
      INSERT INTO public.notifications (
        admin_id,
        type,
        title,
        message,
        read,
        created_at
      ) VALUES (
        recipient.admin_id,
        'message_direct'::varchar(50),
        notif_title,
        sender_name || ': ' || notif_message,
        false,
        NEW.created_at
      );
    END LOOP;
  ELSE
    -- For group conversations, notify all other participants and mark as group type
    FOR recipient IN
      SELECT admin_id FROM conversation_participants
      WHERE conversation_id = NEW.conversation_id
        AND admin_id IS NOT NULL
        AND admin_id <> NEW.admin_id
    LOOP
      INSERT INTO public.notifications (
        admin_id,
        type,
        title,
        message,
        read,
        created_at
      ) VALUES (
        recipient.admin_id,
        'message_group'::varchar(50),
        notif_title,
        sender_name || ': ' || notif_message,
        false,
        NEW.created_at
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_new_message_create_notifications ON messages;
CREATE TRIGGER trg_notify_new_message_create_notifications
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION notify_new_message_create_notifications();

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Allow admins who are participants to SELECT conversations
CREATE POLICY "conversations_select_participants" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id
        AND cp.admin_id::text = auth.jwt() ->> 'sub'
    )
  );

-- Allow participants to insert a conversation (server will also create participants rows)
CREATE POLICY "conversations_insert_admins" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Allow participants to SELECT messages if they are a conversation participant
CREATE POLICY "messages_select_participants" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
        AND cp.admin_id::text = auth.jwt() ->> 'sub'
    )
  );

-- Allow admins to INSERT messages when they are the authenticated admin (server can bypass via service role)
CREATE POLICY "messages_insert_participants" ON public.messages
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    AND auth.jwt() ->> 'sub' IS NOT NULL
    AND auth.jwt() ->> 'sub' = admin_id::text
  );

-- Grant basic permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;