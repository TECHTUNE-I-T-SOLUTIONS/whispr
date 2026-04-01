-- Migration: AI chat persistence tables
-- Create tables to store AI chat sessions and messages.

CREATE TABLE public.ai_chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid,
  chain_id uuid,
  mode text NOT NULL DEFAULT 'chronicles',
  output_type text NOT NULL DEFAULT 'draft',
  status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'archived'::text, 'closed'::text, 'pending'::text])),
  title text,
  label text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_sessions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT ai_chat_sessions_chain_id_fkey FOREIGN KEY (chain_id) REFERENCES public.chronicles_writing_chains(id),
  CONSTRAINT ai_chat_sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.chronicles_creators(id)
);

CREATE TABLE public.ai_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  sender text NOT NULL CHECK (sender = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX ai_chat_messages_session_id_idx ON public.ai_chat_messages(session_id);
CREATE INDEX ai_chat_sessions_creator_id_idx ON public.ai_chat_sessions(creator_id);
CREATE INDEX ai_chat_sessions_chain_id_idx ON public.ai_chat_sessions(chain_id);
