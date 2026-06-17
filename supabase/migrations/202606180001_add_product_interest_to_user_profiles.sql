alter table public.user_profiles
  add column if not exists product_interested_at timestamptz,
  add column if not exists product_interest_source text;

create index if not exists user_profiles_product_interested_at_idx
  on public.user_profiles(product_interested_at);
