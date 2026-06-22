# Marketing Funnel MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the Decisionmind Marketing Funnel MVP end-to-end: landing, quiz, Supabase magic-link auth, authenticated `/app`, mock paywall, admin-only analytics dashboard, attribution, and verification docs.

**Architecture:** Use one Next.js App Router application for both public funnel routes and private dashboard routes. Supabase Auth owns passwordless sessions; Supabase Postgres stores visits, quiz responses, auth attempts, funnel events, profiles, attribution, and admin access. Server routes/actions perform all anonymous writes, auth-attempt writes, attribution updates, and dashboard reads.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth, Supabase Postgres, Vercel, Vitest, Playwright.

---

## Source Documents

Read these before implementation:

- `README.md`
- `docs/requirement-check-list.md`
- `docs/product-spec.md`
- `docs/product-spec/00-overview.md`
- `docs/product-spec/01-funnel-flow.md`
- `docs/product-spec/02-events-and-scoring.md`
- `docs/product-spec/03-auth-identity-and-attribution.md`
- `docs/product-spec/04-data-model-and-security.md`
- `docs/product-spec/05-analytics-dashboard.md`
- `docs/product-spec/06-scope-risks-success.md`
- `docs/product-spec/07-technical-stack-and-ui.md`

## Target File Structure

- `app/`: Next.js App Router pages and route handlers.
- `app/(funnel)/page.tsx`: public landing route `/`.
- `app/(funnel)/quiz/page.tsx`: quiz wizard route `/quiz`.
- `app/(funnel)/login/page.tsx`: returning-user login route `/login`.
- `app/(funnel)/auth/callback/route.ts`: Supabase magic-link callback.
- `app/(funnel)/email/page.tsx`: email capture/check-email route for anonymous quiz completion.
- `app/app/page.tsx`: authenticated product home with latest profile, gender image, mock paywall, admin CTA.
- `app/dashboard/page.tsx`: admin-only analytics dashboard.
- `app/api/*`: server route handlers for visit creation, quiz submission, email auth attempts, event tracking, and dashboard data.
- `components/`: reusable UI components.
- `components/funnel/`: landing, quiz, email, result, paywall components.
- `components/dashboard/`: dashboard metric cards and tables.
- `public/images/landing-hero.png`: generated landing hero image.
- `lib/supabase/`: browser/server/admin Supabase clients.
- `lib/analytics/`: visit, event, attribution, dashboard query helpers.
- `lib/quiz/`: question definitions, scoring, profile output mapping.
- `lib/auth/`: auth attempt helpers and admin authorization.
- `supabase/migrations/`: database schema, RLS policies, indexes.
- `tests/`: Vitest unit/integration tests.
- `e2e/`: Playwright end-to-end tests.

---

### Task 1: Scaffold Next.js Application

**Files:**
- Create: `package.json`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `components.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `playwright.config.ts`
- Modify: `README.md`

- [ ] **Step 1: Scaffold the app**

Run:

```bash
npx create-next-app@15 . \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*"
```

Expected: Next.js files are created at the repository root without removing `docs/`, `supabase/`, or `public/images/`.

- [ ] **Step 2: Install runtime and test dependencies**

Run:

```bash
npm install @supabase/ssr @supabase/supabase-js zod lucide-react
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright
npx playwright install
```

Expected: `package.json` contains the Supabase, zod, lucide, Vitest, Testing Library, and Playwright dependencies.

- [ ] **Step 3: Initialize shadcn/ui**

Run:

```bash
npx shadcn@latest init
npx shadcn@latest add button input form alert card table tabs badge separator skeleton radio-group progress
```

Expected: `components/ui/*` exists and matches shadcn/ui conventions.

- [ ] **Step 4: Add scripts**

Ensure `package.json` contains:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 5: Add Vitest config**

Create `vitest.config.ts`:

```ts
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Add Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 7: Verify scaffold**

Run:

```bash
npm run test
npm run lint
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json app components lib next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts components.json vitest.config.ts tests/setup.ts playwright.config.ts
git commit -m "chore: scaffold next app"
```

---

### Task 2: Add Supabase Schema, RLS, and Generated Types

**Files:**
- Create: `supabase/migrations/202606170001_initial_schema.sql`
- Create: `lib/database.types.ts`
- Modify: `supabase/seed.sql`

- [ ] **Step 1: Create migration**

Create `supabase/migrations/202606170001_initial_schema.sql` with tables from `docs/product-spec/04-data-model-and-security.md`.

Required table contracts:

```sql
create extension if not exists pgcrypto;

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
```

Do not add client policies for `auth_attempts`, `funnel_events`, or `admin_users`. Those tables are accessed through trusted server routes using the service-role key after application-level checks.

Do not add anonymous insert/update policies for any table. Anonymous visit, quiz, event, and auth-attempt writes must go through trusted Next.js server routes.

- [ ] **Step 2: Start Supabase and reset local database**

Run:

```bash
supabase start
supabase db reset
```

Expected: local Supabase API, DB, Studio, and Inbucket start successfully; migrations and `supabase/seed.sql` complete without SQL errors.

- [ ] **Step 3: Generate TypeScript types**

Run:

```bash
supabase gen types typescript --local > lib/database.types.ts
```

Expected: `lib/database.types.ts` contains `public.Tables` for all application tables.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations supabase/seed.sql lib/database.types.ts
git commit -m "feat: add supabase schema"
```

---

### Task 3: Add Supabase Clients, Env Validation, and Session Middleware

**Files:**
- Create: `lib/env.ts`
- Create: `lib/supabase/browser.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`
- Create: `middleware.ts`
- Test: `tests/env.test.ts`

- [ ] **Step 1: Add env validation test**

Create `tests/env.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getPublicSiteUrl } from '@/lib/env';

describe('env helpers', () => {
  it('normalizes NEXT_PUBLIC_SITE_URL without trailing slash', () => {
    expect(getPublicSiteUrl('http://localhost:3000/')).toBe('http://localhost:3000');
  });
});
```

- [ ] **Step 2: Implement env helper**

Create `lib/env.ts`:

```ts
export function getPublicSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL) {
  if (!value) return 'http://localhost:3000';
  return value.replace(/\/$/, '');
}
```

- [ ] **Step 3: Add Supabase clients**

Implement:

- `lib/supabase/browser.ts` with `createBrowserClient<Database>()`.
- `lib/supabase/server.ts` with `createServerClient<Database>()` using cookies.
- `lib/supabase/admin.ts` with `createClient<Database>()` and `SUPABASE_SERVICE_ROLE_KEY`; import only from server routes/actions.

- [ ] **Step 4: Add middleware**

Create `middleware.ts` using the official `@supabase/ssr` cookie-refresh pattern. It must skip static assets and preserve Supabase session cookies.

- [ ] **Step 5: Verify**

Run:

```bash
npm run test -- tests/env.test.ts
npm run lint
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase lib/env.ts middleware.ts tests/env.test.ts
git commit -m "feat: add supabase app clients"
```

---

### Task 4: Implement Quiz Questions and Deterministic Scoring

**Files:**
- Create: `lib/quiz/questions.ts`
- Create: `lib/quiz/scoring.ts`
- Test: `tests/quiz/scoring.test.ts`

- [ ] **Step 1: Write scoring tests**

Create tests for:

- `profile_gender` is required but contributes no points.
- `decision_context` is stored but contributes no points.
- clear winner produces `confidence = high`.
- tied or close winner produces `confidence = low` and uses the tie-break order.

- [ ] **Step 2: Add canonical quiz definitions**

Create `lib/quiz/questions.ts` with all seven questions from `docs/product-spec/01-funnel-flow.md`, using canonical IDs:

```ts
export type QuestionId =
  | 'profile_gender'
  | 'decision_context'
  | 'decision_behavior'
  | 'primary_blocker'
  | 'post_decision_feeling'
  | 'worst_outcome'
  | 'support_preference';
```

- [ ] **Step 3: Implement scoring**

Create `scoreQuiz(answers)` in `lib/quiz/scoring.ts`. Return:

- `gender`
- `decision_context`
- `decision_pattern`
- `primary_blocker`
- `emotional_driver`
- `support_preference`
- `recommended_starting_point`
- `confidence`

- [ ] **Step 4: Verify**

Run:

```bash
npm run test -- tests/quiz/scoring.test.ts
npm run lint
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/quiz tests/quiz
git commit -m "feat: add quiz scoring"
```

---

### Task 5: Implement Visit, Event, Attribution, and Auth Attempt Helpers

**Files:**
- Create: `lib/analytics/visitor.ts`
- Create: `lib/analytics/source.ts`
- Create: `lib/analytics/visits.ts`
- Create: `lib/analytics/events.ts`
- Create: `lib/auth/attempts.ts`
- Create: `lib/auth/profiles.ts`
- Test: `tests/analytics/source.test.ts`
- Test: `tests/analytics/events.test.ts`
- Test: `tests/auth/attempts.test.ts`
- Test: `tests/analytics/visitor.test.ts`

- [ ] **Step 1: Write visitor cookie tests**

Create `tests/analytics/visitor.test.ts` to cover:

- existing `visitor_id` cookie is reused
- missing `visitor_id` creates a new UUID-like value
- generated `visitor_id` is stable for subsequent requests when stored in a cookie

- [ ] **Step 2: Implement visitor cookie helper**

Create `lib/analytics/visitor.ts`.

Required API:

```ts
export function getOrCreateVisitorId(input: {
  existingVisitorId?: string | null;
  createId?: () => string;
}): { visitorId: string; shouldSetCookie: boolean } {
  if (input.existingVisitorId) {
    return { visitorId: input.existingVisitorId, shouldSetCookie: false };
  }

  const visitorId = input.createId ? input.createId() : crypto.randomUUID();
  return { visitorId, shouldSetCookie: true };
}
```

- [ ] **Step 3: Write source parsing tests**

Test priority:

1. `utm_source`
2. referrer domain
3. `direct`

- [ ] **Step 4: Implement source parsing**

Create `detectSource({ url, referrer })` returning `{ source, medium, campaign, landingUrl, referrer }`.

- [ ] **Step 5: Implement server helpers**

Implement helpers:

- `ensureVisit(input)`
- `trackEvent(input)`
- `createQuizEmailCaptureAttempt(input)`
- `createReturningLoginAttempt(input)`
- `verifyAuthAttempt(input)`
- `upsertUserProfileAfterAuth(input)`

Rules:

- Landing, quiz, email capture, and login routes must call `getOrCreateVisitorId` and persist `visitor_id` as an HTTP-only cookie when `shouldSetCookie = true`.
- `ensureVisit(input)` requires `visitorId` and source fields from `detectSource`.
- `createQuizEmailCaptureAttempt` requires `quizResponseId`.
- `createReturningLoginAttempt` rejects `quizResponseId`.
- All emails are normalized with `trim().toLowerCase()`.
- `first_touch_*` fields are written only when creating a profile.
- `last_touch_*` fields update on repeat verified visits.
- When creating a new `quiz_email_capture` attempt, expire older pending attempts for the same `quiz_response_id`.
- When creating a new `returning_login` attempt, expire older pending attempts for the same normalized email.
- `verifyAuthAttempt(input)` accepts only the latest non-expired pending attempt for the same context.
- Superseded, expired, failed, already verified, or email-mismatched attempts must not link visits, quiz responses, or profiles.
- `trackEvent(input)` accepts only canonical event names from `docs/product-spec/02-events-and-scoring.md`.
- Event-specific details are stored in `metadata`; do not create variant event names such as `quiz_completed_returning`.
- Conversion action events should be deduplicated once per `visit_id` and event name where practical.

Canonical events:

```ts
export const FUNNEL_EVENTS = [
  'landing_viewed',
  'start_clicked',
  'quiz_started',
  'quiz_question_answered',
  'quiz_completed',
  'email_viewed',
  'email_submitted',
  'magic_link_sent',
  'magic_link_verified',
  'magic_link_failed',
  'user_created',
  'user_returned',
  'result_viewed',
  'paywall_viewed',
  'paywall_cta_clicked',
] as const;
```

Create `tests/analytics/events.test.ts` to cover:

- known canonical event names are accepted
- unknown event names are rejected
- event metadata is stored without changing the event name

Create `tests/auth/attempts.test.ts` to cover:

- `createQuizEmailCaptureAttempt` requires `quizResponseId`
- `createReturningLoginAttempt` rejects `quizResponseId`
- a newer `quiz_email_capture` attempt supersedes older pending attempts for the same `quiz_response_id`
- a newer `returning_login` attempt supersedes older pending attempts for the same normalized email
- `verifyAuthAttempt` rejects superseded, expired, failed, verified, and email-mismatched attempts before linking application data

- [ ] **Step 6: Verify**

Run:

```bash
npm run test -- tests/analytics/visitor.test.ts tests/analytics/source.test.ts tests/analytics/events.test.ts tests/auth/attempts.test.ts
npm run lint
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add lib/analytics lib/auth tests/analytics tests/auth
git commit -m "feat: add attribution and auth attempt helpers"
```

---

### Task 6: Add Landing Hero Asset and Build Landing, Quiz, Email Capture, Login, and Callback

**Files:**
- Create: `app/(funnel)/page.tsx`
- Create: `app/(funnel)/quiz/page.tsx`
- Create: `app/(funnel)/email/page.tsx`
- Create: `app/(funnel)/login/page.tsx`
- Create: `app/(funnel)/auth/callback/route.ts`
- Create: `app/(funnel)/auth/logout/route.ts`
- Create: `app/api/visits/route.ts`
- Create: `app/api/quiz/route.ts`
- Create: `app/api/auth/start/route.ts`
- Create: `public/images/landing-hero.png`
- Create: `components/funnel/*`
- Test: `tests/auth/callback.test.ts`
- Test: `e2e/funnel.spec.ts`

- [ ] **Step 1: Add callback branch tests**

Create `tests/auth/callback.test.ts` to cover the callback decision logic with mocked Supabase clients:

- `quiz_email_capture` links both `visit.user_id` and `quiz_response.user_id`.
- `/email` rejects missing or invalid `quiz_response_id` before creating a `quiz_email_capture` attempt.
- `returning_login` updates profile last-touch and does not require `quiz_response_id`.
- expired, failed, or email-mismatch attempts return a recoverable failure result.

Expected test names:

```ts
it('links visit and quiz response for quiz email capture attempts', async () => {});
it('rejects quiz email capture attempts without quiz_response_id', async () => {});
it('does not require quiz response for returning login attempts', async () => {});
it('rejects expired attempts before linking application data', async () => {});
it('rejects attempts when authenticated email does not match normalized email', async () => {});
```

- [ ] **Step 2: Add landing hero asset**

Create `public/images/landing-hero.png`.

Asset requirements:

- bitmap PNG
- no text, logos, UI labels, or payment imagery
- visually expresses decision clarity, branching choices, and a subtle AI Decision Twin presence
- works with desktop and mobile crops

If using image generation, use this prompt:

```text
Warm polished product hero image for a decision clarity app. A calm person facing a subtle translucent AI twin silhouette, soft branching light paths becoming clear, sunrise atmosphere, modern minimal environment, no text, no logos, no UI, no payment imagery, cinematic but clean, suitable for web hero crop.
```

- [ ] **Step 3: Add Playwright smoke test**

Create `e2e/funnel.spec.ts` to assert:

- `/` shows `Discover your decision pattern`.
- landing page renders the hero image with accessible alt text or decorative empty alt.
- anonymous CTA navigates to `/quiz`.
- `/quiz` shows one question at a time.
- `Next` is disabled until an answer is selected.
- authenticated landing shows `Sign out`.
- `Sign out` clears the Supabase session and returns to the anonymous landing state while preserving the `visitor_id` cookie.

- [ ] **Step 4: Add route event tracking contract**

Implement the route/action tracking below. Use exactly these event names:

| Route/action | Event | Metadata |
| --- | --- | --- |
| `/` page view | `landing_viewed` | `{ source, medium, campaign }` |
| landing start CTA | `start_clicked` | `{ cta_label: "Start assessment" }` |
| `/quiz` first question shown | `quiz_started` | `{ authenticated: boolean }` |
| quiz answer selected | `quiz_question_answered` | `{ question_id, answer_id }` |
| quiz submitted | `quiz_completed` | `{ result_pattern, profile_gender }` |
| `/email` valid page view | `email_viewed` | `{ quiz_response_id }` |
| email form submitted | `email_submitted` | `{ auth_provider: "supabase", method: "magic_link", auth_attempt_id }` |
| magic link send succeeds | `magic_link_sent` | `{ auth_provider: "supabase", auth_attempt_id }` |
| callback verifies link | `magic_link_verified` | `{ auth_provider: "supabase", auth_attempt_id }` |
| callback or send fails | `magic_link_failed` | `{ auth_provider: "supabase", auth_attempt_id, reason }` |
| first app profile created | `user_created` | `{ source, medium, campaign }` |
| existing app profile verified again | `user_returned` | `{ source, medium, campaign }` |

Failure `reason` must be one of:

```ts
type MagicLinkFailureReason =
  | 'expired'
  | 'used'
  | 'invalid'
  | 'missing_context'
  | 'email_mismatch'
  | 'unknown';
```

- [ ] **Step 5: Build landing route**

Implement anonymous, authenticated, and admin landing states:

- anonymous: `Start assessment`, `Already have a profile? Sign in`
- authenticated: `View my profile`, `Start new assessment`, `Sign out`
- admin: secondary `Open dashboard`
- render `public/images/landing-hero.png`
- track `landing_viewed`
- track `start_clicked` when the anonymous start CTA is clicked
- `Sign out` submits to `/auth/logout`

- [ ] **Step 6: Build quiz route**

Implement:

- one question per screen
- progress
- Back/Next
- required `profile_gender`
- submit to server
- anonymous users continue to `/email?quiz_response_id=<created_response_id>`
- authenticated users skip email and redirect to `/app`
- track `quiz_started`, `quiz_question_answered`, and `quiz_completed`

- [ ] **Step 7: Build email capture route**

Implement:

- require `quiz_response_id` query param
- verify `quiz_response_id` belongs to the current `visitor_id` or current anonymous visit before sending the magic link
- if `quiz_response_id` is missing, invalid, expired, or not owned by the current visitor, show a recoverable state with copy "We could not find your quiz result" and CTA `Start assessment` linking to `/quiz`
- email validation
- create `auth_attempts.attempt_type = quiz_email_capture` before sending the magic link
- store the verified `quiz_response_id` on the auth attempt
- call Supabase magic link send with `emailRedirectTo = ${NEXT_PUBLIC_SITE_URL}/auth/callback?auth_attempt_id=<auth_attempt_id>`
- check-email, resend, change-email, expired-link recovery states
- track `email_viewed`, `email_submitted`, `magic_link_sent`, and `magic_link_failed`

- [ ] **Step 8: Build login route**

Implement:

- email validation
- create `auth_attempts.attempt_type = returning_login` before sending the magic link
- call Supabase magic link send with `emailRedirectTo = ${NEXT_PUBLIC_SITE_URL}/auth/callback?auth_attempt_id=<auth_attempt_id>`
- no quiz requirement
- redirect target `/app`
- track `email_submitted`, `magic_link_sent`, and `magic_link_failed`

- [ ] **Step 9: Build callback route**

Implement:

- exchange Supabase magic-link code for session
- load `auth_attempts` by `auth_attempt_id`
- fail recoverably with `magic_link_failed` reason `missing_context` when `auth_attempt_id` is absent
- reject attempts that are not the latest non-expired pending attempt for their context
- verify pending status and email match
- for `quiz_email_capture`, link visit and quiz response to user
- for `returning_login`, update profile last-touch without requiring quiz response
- track `magic_link_verified` after Supabase session and application context are verified
- track `user_created` when a new `user_profiles` row is created
- track `user_returned` when an existing `user_profiles` row is updated
- redirect `/app`

- [ ] **Step 10: Build logout route**

Implement `/auth/logout`:

- require `POST`
- call Supabase server client `auth.signOut()`
- clear only Supabase Auth session cookies
- keep the anonymous `visitor_id` cookie intact for future attribution
- redirect to `/`

- [ ] **Step 11: Verify**

Run:

```bash
npm run test
npm run lint
npm run build
npm run e2e
```

Expected: all commands exit `0`.

- [ ] **Step 12: Commit**

```bash
git add app components/funnel public/images/landing-hero.png tests/auth/callback.test.ts e2e/funnel.spec.ts
git commit -m "feat: build funnel auth flow"
```

---

### Task 7: Build Authenticated `/app` Profile and Mock Paywall

**Files:**
- Create: `app/app/page.tsx`
- Create: `components/funnel/DecisionProfile.tsx`
- Create: `components/funnel/MockPaywall.tsx`
- Create: `components/funnel/ProfileImage.tsx`
- Test: `e2e/app.spec.ts`

Preconditions:

- `public/images/app-profile-man.png` exists.
- `public/images/app-profile-woman.png` exists.

- [ ] **Step 1: Add app page tests**

Test:

- unauthenticated `/app` redirects to `/login`
- authenticated user sees latest completed decision profile
- `woman` uses `public/images/app-profile-woman.png`
- `man` uses `public/images/app-profile-man.png`
- `prefer_not_to_say` shows no gendered portrait
- mock paywall has `Buy`

- [ ] **Step 2: Implement `/app`**

Rules:

- derive user only from Supabase session
- query latest completed `quiz_responses` by `completed_at desc`
- show empty state when no completed profile exists
- show profile image based on `gender`
- track `result_viewed`
- render mock paywall below result
- track `paywall_viewed` and `paywall_cta_clicked`
- show `Open dashboard` only for active admin users

- [ ] **Step 3: Verify**

Run:

```bash
npm run test
npm run lint
npm run build
npm run e2e
```

Expected: all commands exit `0`.

- [ ] **Step 4: Commit**

```bash
git add app/app components/funnel e2e/app.spec.ts
git commit -m "feat: build authenticated app page"
```

---

### Task 8: Build Admin-Only Analytics Dashboard

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `app/api/dashboard/summary/route.ts`
- Create: `lib/auth/admin.ts`
- Create: `lib/analytics/dashboard.ts`
- Create: `lib/analytics/dashboardTransform.ts`
- Create: `tests/fixtures/dashboardData.ts`
- Create: `tests/e2e/dashboardAuth.ts`
- Create: `components/dashboard/*`
- Test: `tests/analytics/dashboard.test.ts`
- Test: `e2e/dashboard.spec.ts`

- [ ] **Step 1: Add deterministic dashboard fixtures**

Create `tests/fixtures/dashboardData.ts` with a fixture builder that returns plain objects for:

- one anonymous acquisition visit from `google` with `landing_viewed`, `start_clicked`, `quiz_completed`, `email_submitted`, `magic_link_sent`, `magic_link_verified`, `result_viewed`, `paywall_viewed`, `paywall_cta_clicked`
- one returning authenticated visit from `facebook` with `landing_viewed`, `start_clicked`, `quiz_started`, `quiz_completed`, `result_viewed`, `paywall_viewed`
- one direct visit that drops after `start_clicked`
- quiz responses with at least two `decision_pattern` values and at least two `primary_blocker` values so source-by-pattern and highest-converting-pattern logic is testable
- one user profile whose `first_touch_source = google`, `first_touch_medium = cpc`, `first_touch_campaign = launch`, `last_touch_source = facebook`, `last_touch_medium = paid_social`, and `last_touch_campaign = retargeting`
- one admin user row and one regular user row

The fixture builder should use stable IDs such as `user_google_repeat`, `visit_google_first`, `visit_facebook_return`, and fixed timestamps so conversion ordering is deterministic.

- [ ] **Step 2: Write dashboard transform tests**

Create tests for a pure `buildDashboardSummary(rows)` function in `tests/analytics/dashboard.test.ts`.

The pure function should accept plain arrays from `tests/fixtures/dashboardData.ts`:

```ts
buildDashboardSummary({
  visits,
  funnelEvents,
  quizResponses,
  userProfiles,
});
```

Expected return shape:

```ts
type DashboardSummary = {
  summaryMetrics: Array<{ label: string; value: number; description?: string }>;
  anonymousConversion: Array<{ step: string; visits: number; conversionRate: number | null }>;
  repeatQuizConversion: Array<{ step: string; visits: number; conversionRate: number | null }>;
  sourceBreakdown: Array<{
    source: string;
    visits: number;
    quizCompletions: number;
    emailSubmissions: number;
    magicLinksSent: number;
    magicLinksVerified: number;
    paywallViews: number;
    paywallClicks: number;
    quizCompletionRate: number | null;
    emailSubmissionRate: number | null;
    magicLinkVerificationRate: number | null;
    paywallClickRate: number | null;
  }>;
  registeredUsers: Array<{
    email: string;
    firstTouchSource: string | null;
    firstTouchMedium: string | null;
    firstTouchCampaign: string | null;
    lastTouchSource: string | null;
    lastTouchMedium: string | null;
    lastTouchCampaign: string | null;
    decisionPattern: string | null;
    firstAuthenticatedAt: string;
    lastSeenAt: string;
  }>;
  patternBreakdown: Array<{
    decisionPattern: string;
    usersOrVisits: number;
    emailSubmissionRate: number | null;
    magicLinkVerificationRate: number | null;
    paywallViewRate: number | null;
    paywallClickRate: number | null;
    topSource: string | null;
  }>;
  sourceByPattern: Array<{
    source: string;
    mostCommonDecisionPattern: string | null;
    mostCommonBlocker: string | null;
    highestConvertingPattern: string | null;
  }>;
};
```

Cover:

- anonymous acquisition conversion includes email and magic-link steps
- authenticated repeat quiz conversion uses `quiz_started -> quiz_completed`
- source breakdown includes email submissions, magic links sent, magic links verified, paywall views, paywall clicks, and conversion rates
- first touch stays stable
- last touch updates
- registered-user attribution includes source, medium, and campaign for first touch and last touch
- pattern breakdown includes magic-link verification rate, paywall view rate, paywall click rate, and top source
- source-by-pattern shows most common decision pattern, most common blocker, and highest-converting pattern
- gender is not included as an MVP dashboard breakdown

- [ ] **Step 3: Add local dashboard auth setup for e2e**

Create `tests/e2e/dashboardAuth.ts`.

Required behavior:

- Create or reuse one local Supabase Auth admin user.
- Create or reuse one local Supabase Auth regular user.
- Insert or upsert an active `admin_users` row for the admin user only.
- Never commit real production credentials.
- Use local/e2e env vars:

```env
E2E_ADMIN_EMAIL=admin-e2e@example.com
E2E_ADMIN_PASSWORD=admin-e2e-password
E2E_REGULAR_EMAIL=regular-e2e@example.com
E2E_REGULAR_PASSWORD=regular-e2e-password
```

Required helper API:

```ts
export async function ensureDashboardE2EUsers(): Promise<{
  admin: { email: string; password: string; userId: string };
  regular: { email: string; password: string; userId: string };
}> {
  // Use the Supabase service-role client against the local or configured test project.
  // Upsert auth users by email, then upsert admin_users for the admin user.
}
```

`e2e/dashboard.spec.ts` must call `ensureDashboardE2EUsers()` before dashboard access tests.

Dashboard e2e must cover:

- anonymous user is redirected away from `/dashboard`
- regular authenticated user cannot access dashboard data
- admin authenticated user can access `/dashboard`
- admin sees summary metrics, source breakdown, and first-touch/last-touch attribution

- [ ] **Step 4: Implement dashboard transform**

Create `lib/analytics/dashboardTransform.ts` with `buildDashboardSummary(rows)`.

Keep Supabase querying out of this file. It should only transform already-loaded rows into dashboard metrics so unit tests can run without a database.

- [ ] **Step 5: Implement admin authorization**

Rules:

- valid Supabase Auth session required
- active `admin_users` row required by `user_id` or normalized email
- no dashboard data returned to non-admins
- dashboard CTA shown only after server-side admin check

- [ ] **Step 6: Implement dashboard queries**

Return:

- `summaryMetrics`
- `anonymousConversion`
- `repeatQuizConversion`
- `sourceBreakdown`
- `registeredUsers`
- `patternBreakdown`
- `sourceByPattern`

`lib/analytics/dashboard.ts` should load rows from Supabase, call `buildDashboardSummary(rows)`, and return the summary to the API route.

- [ ] **Step 7: Build dashboard UI**

Use shadcn/ui:

- `Card` for summary metrics
- `Table` for conversions, source breakdown, attribution
- `Badge` for source/status/user state
- `Skeleton` for loading states

Dashboard UI must render:

- top-level summary metrics
- anonymous acquisition conversion table
- authenticated repeat-quiz conversion table
- source breakdown table
- registered-user attribution table with first-touch and last-touch source/medium/campaign
- decision pattern breakdown table
- source-by-pattern product intelligence table

- [ ] **Step 8: Verify**

Run:

```bash
npm run test
npm run lint
npm run build
npm run e2e
```

Expected: all commands exit `0`.

- [ ] **Step 9: Commit**

```bash
git add app/dashboard app/api/dashboard lib/auth/admin.ts lib/analytics/dashboard.ts lib/analytics/dashboardTransform.ts components/dashboard tests/fixtures/dashboardData.ts tests/e2e/dashboardAuth.ts tests/analytics e2e/dashboard.spec.ts
git commit -m "feat: build admin dashboard"
```

---

### Task 9: Deployment, README, and Final Acceptance

**Files:**
- Modify: `README.md`
- Modify: `docs/requirement-check-list.md`
- Modify: `.env.example`

- [ ] **Step 1: Update README local setup**

Replace `Current Local Setup` with exact commands:

```bash
npm install
cp .env.example .env.local
supabase start
supabase db reset
npm run dev
```

Include:

- required env vars
- local e2e-only env vars: `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_REGULAR_EMAIL`, `E2E_REGULAR_PASSWORD`
- Supabase Auth redirect URLs
- dashboard admin setup through `admin_users`
- local magic-link testing through Supabase Inbucket
- Vercel deployment commands
- deployed funnel URL
- deployed dashboard URL
- dashboard admin credentials or admin access instructions

- [ ] **Step 2: Update checklist status**

Set `[x]` only for requirements actually implemented and verified. Leave deployment items `[ ]` until production URLs and credentials exist.

- [ ] **Step 3: Configure Vercel env**

Set:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`

- [ ] **Step 4: Deploy to Vercel**

Run:

```bash
vercel pull --yes
vercel build
vercel deploy --prebuilt --prod
```

Expected: Vercel prints a production URL. Save it as the deployed funnel URL and dashboard base URL.

- [ ] **Step 5: Configure Supabase Auth production redirects**

Set:

- Site URL: deployed Vercel URL
- Redirect URL: `${NEXT_PUBLIC_SITE_URL}/auth/callback`

- [ ] **Step 6: Create or verify admin access**

In Supabase Table Editor, add or verify an active row in `admin_users` for the admin test email.

Required fields:

- `email`: normalized admin email
- `role`: `admin`
- `is_active`: `true`

- [ ] **Step 7: Run final local verification**

Run:

```bash
npm run test
npm run lint
npm run build
npm run e2e
```

- [ ] **Step 8: Run final production verification**

Using the deployed Vercel URL, verify:

- new user from `/?utm_source=google`
- same email returning from `/?utm_source=facebook`
- direct traffic new user
- `/login` returning user without quiz
- cross-device magic-link callback
- admin dashboard access
- non-admin dashboard denial
- authenticated repeat quiz skipping email capture

- Record the deployed funnel URL, deployed dashboard URL, and dashboard access instructions in `README.md`.

- [ ] **Step 9: Commit**

```bash
git add README.md docs/requirement-check-list.md .env.example
git commit -m "docs: add final setup and verification"
```

---

## Self-Review

- Spec coverage: tasks cover scaffold, schema/RLS, Supabase clients, quiz/scoring, attribution, auth attempts, landing, quiz, email capture, login, callback, `/app`, mock paywall, dashboard, deployment, README, and checklist.
- Red-flag scan: no task uses open-ended filler text; each task has concrete files, commands, and expected behavior.
- Type consistency: canonical names match the product spec: `profile_gender`, `quiz_email_capture`, `returning_login`, `quiz_started`, `quiz_completed`, `paywall_viewed`, `paywall_cta_clicked`, `admin_users`, `/app`, `/dashboard`, `/login`, `/auth/callback`.
- Known sequencing rule: do not start Task 6 until Task 2 and Task 3 are complete, because funnel routes depend on database tables and Supabase session helpers.
