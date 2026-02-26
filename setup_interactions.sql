-- 1. Create Likes Table
create table public.likes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, post_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone." on public.likes
  for select using (true);

create policy "Users can toggle their own likes." on public.likes
  for all using (auth.uid() = user_id);

-- Define a database function for safely toggling a like count
create or replace function public.toggle_like(post_uuid uuid)
returns void as $$
declare
    has_liked boolean;
begin
    -- Check if the user already likes the post
    select exists (
        select 1 from public.likes
        where user_id = auth.uid() and post_id = post_uuid
    ) into has_liked;

    if has_liked then
        -- Unlike
        delete from public.likes where user_id = auth.uid() and post_id = post_uuid;
        update public.posts set likes_count = likes_count - 1 where id = post_uuid;
    else
        -- Like
        insert into public.likes (user_id, post_id) values (auth.uid(), post_uuid);
        update public.posts set likes_count = likes_count + 1 where id = post_uuid;
        
        -- Generate notification (Optional, check if not liking own post)
        -- Can expand later to insert into `notifications` explicitly if needed
    end if;
end;
$$ language plpgsql security definer;


-- 2. Create Saved Posts (Bookmarks)
create table public.saved_posts (
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, post_id)
);

alter table public.saved_posts enable row level security;

create policy "Users can only see their own saved posts." on public.saved_posts
  for select using (auth.uid() = user_id);

create policy "Users can save/unsave posts." on public.saved_posts
  for all using (auth.uid() = user_id);


-- 3. Create Comments Table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone." on public.comments
  for select using (true);

create policy "Users can insert own comments." on public.comments
  for insert with check (auth.uid() = author_id);

create policy "Users can delete own comments." on public.comments
  for delete using (auth.uid() = author_id);
