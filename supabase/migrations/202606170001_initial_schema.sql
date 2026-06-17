create extension if not exists pgcrypto;

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  source text not null default 'direct',
  medium text,
  campaign text,
  landing_url text,
  referrer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  visit_id uuid not null references public.visits(id) on delete cascade,
  answers jsonb not null default '[]'::jsonb,
  gender text check (gender in ('woman', 'man', 'prefer_not_to_say')),
  current_decision text,
  decision_context text,
  decision_pattern text,
  primary_blocker text,
  emotional_driver text,
  support_preference text,
  recommended_starting_point text,
  confidence text check (confidence in ('high', 'low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.auth_attempts (
  id uuid primary key default gen_random_uuid(),
  visitor_id text,
  visit_id uuid references public.visits(id) on delete cascade,
  quiz_response_id uuid references public.quiz_responses(id) on delete cascade,
  attempt_type text not null check (attempt_type in ('quiz_email_capture', 'returning_login')),
  user_id uuid references auth.users(id) on delete set null,
  normalized_email text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'expired', 'failed')),
  redirect_path text not null default '/app',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  verified_at timestamptz,
  constraint auth_attempt_quiz_required check (
    (attempt_type = 'quiz_email_capture' and quiz_response_id is not null)
    or
    (attempt_type = 'returning_login' and quiz_response_id is null)
  )
);

create table public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  step text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  email_verified_at timestamptz,
  first_touch_source text,
  first_touch_medium text,
  first_touch_campaign text,
  last_touch_source text,
  last_touch_medium text,
  last_touch_campaign text,
  first_authenticated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role = 'admin'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_profiles_email_verified_at_idx on public.user_profiles(email_verified_at);
create index user_profiles_first_touch_source_idx on public.user_profiles(first_touch_source);
create index user_profiles_last_touch_source_idx on public.user_profiles(last_touch_source);

create index visits_visitor_id_idx on public.visits(visitor_id);
create index visits_user_id_idx on public.visits(user_id);
create index visits_source_idx on public.visits(source);
create index visits_created_at_idx on public.visits(created_at);

create index quiz_responses_visitor_id_idx on public.quiz_responses(visitor_id);
create index quiz_responses_user_id_idx on public.quiz_responses(user_id);
create index quiz_responses_visit_id_idx on public.quiz_responses(visit_id);
create index quiz_responses_decision_pattern_idx on public.quiz_responses(decision_pattern);
create index quiz_responses_completed_at_idx on public.quiz_responses(completed_at);

create index auth_attempts_visitor_id_idx on public.auth_attempts(visitor_id);
create index auth_attempts_visit_id_idx on public.auth_attempts(visit_id);
create index auth_attempts_quiz_response_id_idx on public.auth_attempts(quiz_response_id);
create index auth_attempts_user_id_idx on public.auth_attempts(user_id);
create index auth_attempts_normalized_email_idx on public.auth_attempts(normalized_email);
create index auth_attempts_status_idx on public.auth_attempts(status);
create index auth_attempts_expires_at_idx on public.auth_attempts(expires_at);

create index funnel_events_visit_id_idx on public.funnel_events(visit_id);
create index funnel_events_user_id_idx on public.funnel_events(user_id);
create index funnel_events_event_type_idx on public.funnel_events(event_type);
create index funnel_events_created_at_idx on public.funnel_events(created_at);

create index admin_users_email_idx on public.admin_users(email);
create index admin_users_is_active_idx on public.admin_users(is_active);

alter table public.user_profiles enable row level security;
alter table public.visits enable row level security;
alter table public.quiz_responses enable row level security;
alter table public.auth_attempts enable row level security;
alter table public.funnel_events enable row level security;
alter table public.admin_users enable row level security;

create policy "Users can read own profile"
  on public.user_profiles
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can read own visits"
  on public.visits
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can read own quiz responses"
  on public.quiz_responses
  for select
  to authenticated
  using (user_id = auth.uid());
