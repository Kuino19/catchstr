-- migration_ads.sql
-- 1. Create Ads Table
create table public.ads (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  image_url text not null,
  link_url text not null,
  is_active boolean default true,
  impressions_count integer default 0,
  clicks_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ads enable row level security;

-- Ads are viewable by everyone
create policy "Ads are viewable by everyone." on public.ads
  for select using (true);

-- Only admins can manage ads
create policy "Only admins can manage ads." on public.ads
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
