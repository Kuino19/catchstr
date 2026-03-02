-- migration_admin.sql
-- 1. Add admin and verification fields to profiles
alter table public.profiles 
add column if not exists is_admin boolean default false,
add column if not exists verification_status text check (verification_status in ('pending', 'approved', 'rejected')) default 'approved';

-- Note: We default to 'approved' for existing users to avoid breaking the current experience, 
-- but new Agents will need verification logic.

-- 2. Create Reports Table for Moderation
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade,
  reason text not null,
  status text check (status in ('pending', 'resolved', 'dismissed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reports enable row level security;

-- Admins can see all reports
create policy "Admins can view all reports." on public.reports
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Any user can create a report
create policy "Any user can report content." on public.reports
  for insert with check (auth.uid() = reporter_id);

-- Only admins can update reports
create policy "Admins can update reports." on public.reports
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
