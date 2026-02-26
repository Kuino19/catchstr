-- 1. ADD TAGS TO POSTS
alter table public.posts add column if not exists tags text[] default '{}';

-- 2. VERIFY SAVED POSTS EXISTS (just in case they were missing from the previous run)
create table if not exists public.saved_posts (
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, post_id)
);

alter table public.saved_posts enable row level security;
drop policy if exists "Users can only see their own saved posts." on public.saved_posts;
create policy "Users can only see their own saved posts." on public.saved_posts
  for select using (auth.uid() = user_id);

drop policy if exists "Users can save/unsave posts." on public.saved_posts;
create policy "Users can save/unsave posts." on public.saved_posts
  for all using (auth.uid() = user_id);

-- 3. CREATE STORIES TABLE
create table if not exists public.stories (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  media_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stories enable row level security;

drop policy if exists "Stories are viewable by everyone." on public.stories;
create policy "Stories are viewable by everyone." on public.stories
  for select using (true);

drop policy if exists "Users can insert own stories." on public.stories;
create policy "Users can insert own stories." on public.stories
  for insert with check (auth.uid() = author_id);

-- 4. FORCE POSTGREST TO RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
