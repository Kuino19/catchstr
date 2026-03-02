-- 1. Create Market Value History Table
create table public.market_value_history (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references public.profiles(id) on delete cascade not null,
  value integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.market_value_history enable row level security;

create policy "Market value history is viewable by everyone." on public.market_value_history
  for select using (true);

create policy "Only Agents can insert market value records." on public.market_value_history
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Agent'
    )
  );

-- 2. Create Endorsements Table
create table public.endorsements (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references public.profiles(id) on delete cascade not null,
  endorser_id uuid references public.profiles(id) on delete cascade not null,
  skill text not null, -- e.g. "Clinical Finishing", "Pace", "Leadership"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (player_id, endorser_id, skill)
);

alter table public.endorsements enable row level security;

create policy "Endorsements are viewable by everyone." on public.endorsements
  for select using (true);

create policy "Agents and Coaches can endorse players." on public.endorsements
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'Agent'
    )
  );

create policy "Users can remove their own endorsements." on public.endorsements
  for delete using (auth.uid() = endorser_id);

-- 3. Trigger to update current market_value in profiles when history is inserted
create or replace function public.update_profile_market_value()
returns trigger as $$
begin
  update public.profiles
  set market_value = new.value
  where id = new.player_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_market_value_inserted
  after insert on public.market_value_history
  for each row execute procedure public.update_profile_market_value();
