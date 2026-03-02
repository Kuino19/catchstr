-- migration_ads_rpc.sql
-- RPC to increment ad impressions safely
create or replace function public.increment_ad_impressions(ad_id uuid)
returns void as $$
begin
  update public.ads
  set impressions_count = impressions_count + 1
  where id = ad_id;
end;
$$ language plpgsql security definer;

-- RPC to increment ad clicks safely
create or replace function public.increment_ad_clicks(ad_id uuid)
returns void as $$
begin
  update public.ads
  set clicks_count = clicks_count + 1
  where id = ad_id;
end;
$$ language plpgsql security definer;
