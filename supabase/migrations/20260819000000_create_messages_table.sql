-- SEEDHA PROPERTIES: Real-Time In-App Chat Messages Table
-- Migration: 20260819000000_create_messages_table.sql

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes for real-time conversation loading & unread count
CREATE INDEX IF NOT EXISTS idx_messages_inquiry_id ON public.messages(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id, is_read) WHERE is_read = FALSE;

-- Enable Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Participants can view messages where they are sender or receiver
DROP POLICY IF EXISTS "Participants can view their own messages" ON public.messages;
CREATE POLICY "Participants can view their own messages" ON public.messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- 2. Authenticated users can insert messages as sender
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );

-- 3. Receivers can mark messages as read
DROP POLICY IF EXISTS "Receivers can mark messages read" ON public.messages;
CREATE POLICY "Receivers can mark messages read" ON public.messages
  FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Enable Supabase Realtime for instant messaging
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
