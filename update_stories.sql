alter table public.stories add column if not exists content text;
alter table public.stories alter column media_url drop not null;
NOTIFY pgrst, 'reload schema';
