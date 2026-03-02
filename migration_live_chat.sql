-- Migration to add live_chat table and real-time capabilities for Mux Live Streaming

-- 1. Create the live_chat table
CREATE TABLE IF NOT EXISTS public.live_chat (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  stream_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  user_name text NOT NULL,
  message text NOT NULL
);

-- 2. Add RLS (Row Level Security) policies
ALTER TABLE public.live_chat ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the live chat
CREATE POLICY "Anyone can view live chat."
  ON public.live_chat FOR SELECT
  USING (true);

-- Allow authenticated users to insert to live chat
CREATE POLICY "Authenticated users can add messages."
  ON public.live_chat FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 3. Enable Realtime for the live_chat table
-- This is crucial for the chat to update instantly without refreshing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'live_chat'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat;
  END IF;
END
$$;
