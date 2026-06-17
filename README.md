# Copymind Marketing Funnel MVP

This repository contains the Copymind marketing funnel MVP and the private analytics dashboard.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Vercel

## Product Flow

The canonical flow is:

`Landing -> Quiz -> Email capture or login -> /auth/callback -> /app -> Mock paywall -> /dashboard`

Returning users can use `/login` to receive a magic link and open `/app` without retaking the quiz.
Authenticated users who finish `/quiz` skip email capture and return to `/app`.

## Local Setup

Run these commands from the repository root:

```bash
npm install
cp .env.example .env.local
supabase start
supabase db reset
npm run dev
```

Supabase starts the local API, database, Studio, and Inbucket mail viewer.

Local URLs:

- App: `http://localhost:3000`
- Supabase Studio: `http://127.0.0.1:54323`
- Supabase Inbucket: `http://127.0.0.1:54324`

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`

E2E-only fixture variables:

- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `E2E_REGULAR_EMAIL`
- `E2E_REGULAR_PASSWORD`

Optional e2e override:

- `PLAYWRIGHT_BASE_URL`

## Supabase Auth Redirect URLs

Local development:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

Production:

- Site URL: your deployed Vercel URL
- Redirect URL: `${NEXT_PUBLIC_SITE_URL}/auth/callback`

Add the exact preview URL to Supabase allowed redirect URLs before testing magic links on a preview deployment.

## Dashboard Admin Setup

Dashboard access is controlled by the `admin_users` table in Supabase.

To grant admin access:

1. Open Supabase Studio.
2. Open Table Editor for `admin_users`.
3. Insert or update a row for the admin email.
4. Set `role` to `admin`.
5. Set `is_active` to `true`.
6. Set `user_id` when the Supabase Auth user already exists, or leave it null until the user signs in once.

The email should be stored in normalized form: trim whitespace and lowercase it.

## Local Magic-Link Testing

1. Start Supabase with `supabase start`.
2. Reset the local database with `supabase db reset`.
3. Start the app with `npm run dev`.
4. Open `http://localhost:3000/login` or submit the email capture form.
5. Open Supabase Inbucket at `http://127.0.0.1:54324`.
6. Open the message, click the magic link, and confirm it returns to `/auth/callback` and then `/app`.

If the email is for an admin account, make sure the matching row exists in `admin_users` before testing `/dashboard`.

## Vercel Deployment

Set the production environment variables in Vercel before deploying:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`

Then run:

```bash
vercel pull --yes
vercel build
vercel deploy --prebuilt --prod
```

## Deployed URLs

- Deployed funnel URL: https://copymind-3ohcekrm3-vlas1414s-projects.vercel.app
- Deployed dashboard URL: https://copymind-3ohcekrm3-vlas1414s-projects.vercel.app/dashboard
- Dashboard access instructions: sign in with an authenticated Supabase user whose email or `user_id` matches an active row in `admin_users`

## Verification

Run the local checks in this order:

```bash
npm run test
npm run lint
npm run build
npm run e2e
```

Suggested manual scenarios:

- New user from `/?utm_source=google`
- Returning user from `/?utm_source=facebook`
- New user from direct traffic
- Returning login through `/login`
- Admin dashboard access
- Non-admin dashboard denial
- Cross-device magic-link callback

## Key Decisions

- Supabase Auth handles passwordless login and session creation.
- `admin_users` is the source of truth for dashboard access.
- The dashboard and funnel share one Next.js app so the authenticated state stays consistent.
- Analytics live in Supabase Postgres instead of a third-party analytics product for the MVP.
- The mock paywall is intentionally non-billing and only captures intent.

## Deployment Notes

- Do not commit `.env.local`, `.vercel`, or Supabase temporary metadata.
- Use the service-role key only on the server.
- Record the final funnel and dashboard URLs here only after they are verified in production.
