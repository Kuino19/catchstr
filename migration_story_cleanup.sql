-- Story Cleanup: Delete stories older than 24 hours
-- Run this as a Supabase Edge Function cron job (once per day)
-- or set up via pg_cron in the Supabase SQL editor.

-- Option A: Run manually in SQL editor to clean up now
DELETE FROM stories
WHERE created_at < now() - interval '24 hours';

-- Option B: Set up with pg_cron (run once in SQL editor to create the job)
-- First enable pg_cron via Supabase Dashboard → Database → Extensions → pg_cron
--
-- SELECT cron.schedule(
--   'cleanup-expired-stories',
--   '0 3 * * *',  -- Runs every day at 3am UTC
--   $$
--     DELETE FROM stories WHERE created_at < now() - interval '24 hours';
--   $$
-- );
--
-- To view scheduled jobs: SELECT * FROM cron.job;
-- To remove the job: SELECT cron.unschedule('cleanup-expired-stories');
