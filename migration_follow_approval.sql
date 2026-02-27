-- Add status column to follows table
create type follow_status as enum ('pending', 'accepted');

alter table public.follows 
add column if not exists status follow_status default 'pending';

-- Update existing follows to accepted
update public.follows set status = 'accepted' where status is null or status = 'pending';

-- Re-verify RLS policies for follows
drop policy if exists "Follows are viewable by everyone." on public.follows;
drop policy if exists "Users can follow others." on public.follows;
drop policy if exists "Users can unfollow others." on public.follows;

-- Publicly viewable follows should only be accepted ones
create policy "Accepted follows are viewable by everyone." on public.follows
  for select using (status = 'accepted');

-- Users can see their own outgoing or incoming requests (including pending)
create policy "Users can view their own follow requests." on public.follows
  for select using (auth.uid() = follower_id or auth.uid() = following_id);

-- Users can insert follow requests
create policy "Users can follow others." on public.follows
  for insert with check (auth.uid() = follower_id);

-- Users can delete their own outgoing requests or recipients can delete incoming
create policy "Users can remove follow relationships." on public.follows
  for delete using (auth.uid() = follower_id or auth.uid() = following_id);

-- Add policy for updating status (only the recipient can accept)
create policy "Recipients can accept follow requests." on public.follows
  for update using (auth.uid() = following_id)
  with check (status = 'accepted');
