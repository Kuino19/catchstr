-- Add audio_url to messages table
alter table public.messages add column if not exists audio_url text;

-- Make content nullable to allow for audio-only messages
alter table public.messages alter column content drop not null;
