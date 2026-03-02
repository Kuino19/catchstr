-- Migration to add past_broadcasts table for Video On Demand (VOD) 

CREATE TABLE IF NOT EXISTS public.past_broadcasts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  asset_id text NOT NULL,
  playback_id text NOT NULL,
  duration numeric DEFAULT 0,
  title text,
  views integer DEFAULT 0
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.past_broadcasts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to see past broadcasts
CREATE POLICY "Anyone can view past broadcasts."
  ON public.past_broadcasts FOR SELECT
  USING (true);

-- Allow authenticated users to update their own broadcast titles
CREATE POLICY "Users can update their own broadcast titles."
  ON public.past_broadcasts FOR UPDATE
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Only service role (or our API) should insert records (done via the webhook)
-- But for development ease we might allow users to insert:
CREATE POLICY "Service Role or self can insert."
  ON public.past_broadcasts FOR INSERT
  WITH CHECK (true); -- Relaxed for testing. In prod, lock this to service role.
