-- 1. Create Roster Table (Agent -> Player association)
create table public.roster (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.profiles(id) on delete cascade not null,
  player_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'active' check (status in ('active', 'former')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (agent_id, player_id)
);

alter table public.roster enable row level security;

create policy "Users can see their own roster." on public.roster
  for select using (auth.uid() = agent_id);

create policy "Agents can manage their roster." on public.roster
  for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'Agent'));

create policy "Agents can delete from roster." on public.roster
  for delete using (auth.uid() = agent_id);

-- 2. Create Interest Flags Table
create table public.interest_flags (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.profiles(id) on delete cascade not null,
  player_id uuid references public.profiles(id) on delete cascade not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (agent_id, player_id)
);

alter table public.interest_flags enable row level security;

create policy "Agents can see their own interest flags." on public.interest_flags
  for select using (auth.uid() = agent_id);

create policy "Players can see who flagged interest in them." on public.interest_flags
  for select using (auth.uid() = player_id);

create policy "Agents can flag interest." on public.interest_flags
  for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'Agent'));

create policy "Agents can unflag interest." on public.interest_flags
  for delete using (auth.uid() = agent_id);
