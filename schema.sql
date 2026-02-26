-- 1. Create Profiles Table (extended user data)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text check (role in ('Player', 'Agent')),
  position text,
  location text,
  avatar_url text,
  banner_url text,
  bio text,
  market_value integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);


-- 2. Create Posts Table (for the Feed)
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  media_url text, -- URL to a video or image in Supabase Storage
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone." on public.posts
  for select using (true);

create policy "Users can insert own posts." on public.posts
  for insert with check (auth.uid() = author_id);


-- 3. Create Messages Table (Networking / Chat)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

-- Users can only read messages where they are the sender or receiver
create policy "Users can view their own messages." on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages." on public.messages
  for insert with check (auth.uid() = sender_id);


-- 4. Set up auto-creation of profile via trigger when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 5. Create Follows Table
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone." on public.follows
  for select using (true);

create policy "Users can follow others." on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow others." on public.follows
  for delete using (auth.uid() = follower_id);


-- 6. Create Notifications Table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null, -- The user receiving the notification
  actor_id uuid references public.profiles(id) on delete cascade not null, -- The user who triggered it
  type text check (type in ('follow', 'like', 'message')),
  post_id uuid references public.posts(id) on delete cascade, -- Optional, if related to a post
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications." on public.notifications
  for select using (auth.uid() = user_id);

create policy "System can insert notifications." on public.notifications
  for insert with check (true);

create policy "Users can update their own notifications (e.g. mark read)." on public.notifications
  for update using (auth.uid() = user_id);
