create table if not exists public.email_leads (
  id uuid primary key default gen_random_uuid(),
  normalized_email text not null unique,
  email text not null,
  status text not null default 'pending_verification' check (status in ('pending_verification', 'verified')),
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  visit_id uuid references public.visits(id) on delete set null,
  first_submitted_at timestamptz not null default now(),
  last_submitted_at timestamptz not null default now(),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_leads_status_idx on public.email_leads(status);
create index if not exists email_leads_user_id_idx on public.email_leads(user_id);
create index if not exists email_leads_visitor_id_idx on public.email_leads(visitor_id);
create index if not exists email_leads_visit_id_idx on public.email_leads(visit_id);
create index if not exists email_leads_last_submitted_at_idx on public.email_leads(last_submitted_at);
create index if not exists email_leads_verified_at_idx on public.email_leads(verified_at);

alter table public.email_leads enable row level security;
