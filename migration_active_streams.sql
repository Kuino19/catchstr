-- Migration to add active_streams table to track who is currently live

CREATE TABLE IF NOT EXISTS public.active_streams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  stream_id text NOT NULL,
  playback_id text NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'live', 'ended'))
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.active_streams ENABLE ROW LEVEL SECURITY;

-- Allow anyone to see who is live
CREATE POLICY "Anyone can view active streams."
  ON public.active_streams FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own stream
CREATE POLICY "Users can create their own stream status."
  ON public.active_streams FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Allow authenticated users to update their own stream status
CREATE POLICY "Users can update their own stream status."
  ON public.active_streams FOR UPDATE
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Enable Realtime so the discover page can update instantly when someone goes live
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'active_streams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.active_streams;
  END IF;
END
$$;
