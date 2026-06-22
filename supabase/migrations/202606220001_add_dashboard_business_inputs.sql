alter table public.visits
  add column if not exists content text;

alter table public.user_profiles
  add column if not exists first_touch_content text,
  add column if not exists last_touch_content text;

create table if not exists public.dashboard_settings (
  id text primary key default 'default',
  product_price_cents integer not null default 900 check (product_price_cents >= 0),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.dashboard_settings (id, product_price_cents, currency)
values ('default', 900, 'USD')
on conflict (id) do nothing;

create table if not exists public.ad_spend_entries (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  medium text,
  campaign text,
  content text,
  spend_cents integer not null default 0 check (spend_cents >= 0),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visits_content_idx on public.visits(content);
create index if not exists user_profiles_first_touch_content_idx on public.user_profiles(first_touch_content);
create index if not exists user_profiles_last_touch_content_idx on public.user_profiles(last_touch_content);
create index if not exists ad_spend_entries_source_idx on public.ad_spend_entries(source);
create index if not exists ad_spend_entries_campaign_idx on public.ad_spend_entries(campaign);
create index if not exists ad_spend_entries_content_idx on public.ad_spend_entries(content);

alter table public.dashboard_settings enable row level security;
alter table public.ad_spend_entries enable row level security;
