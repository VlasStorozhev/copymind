# Copymind Marketing Funnel MVP

This repository contains the product specification and setup notes for the Copymind marketing funnel MVP and analytics dashboard.

Current status:

- Product specification is documented in `docs/product-spec/`.
- Assignment acceptance checklist is documented in `docs/requirement-check-list.md`.
- Supabase CLI project configuration exists in `supabase/config.toml`.
- Next.js App Router scaffold is now in place at the repository root.
- shadcn/ui has been initialized and the initial component set has been added.
- Runtime, testing, and browser automation dependencies are installed.

## Planned Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Vercel

## Canonical Product Flow

The product implements one canonical flow:

`Landing / Quiz Start -> Decision Assessment -> Email Capture/Auth -> /app with Decision Profile Result and Mock Paywall section`

This flow satisfies the assignment-required funnel while adding product-specific assessment and result value.

Returning users can use `/login` to receive a magic link and open `/app` without retaking the quiz. If the user has no saved decision profile, the app should route them back to the canonical flow.

The assessment route is `/quiz`. It shows one question per screen and tracks progress. Anonymous users continue to email capture after completion; authenticated users skip email capture and return to `/app`.

Landing page states:

- Anonymous users see `Start assessment` and `Already have a profile? Sign in`.
- Authenticated users see `View my profile`, `Start new assessment`, and `Sign out`.
- Authenticated admins also see secondary `Open dashboard` after server-side `admin_users` authorization.

## Key Decisions

- Supabase Auth magic links handle user creation, existing-user authentication, session creation, token expiry, and replay protection.
- Email submission creates or finds the Supabase Auth user, but access is granted only after magic link verification.
- Supabase Postgres stores visits, quiz responses, funnel events, user profiles, attribution fields, auth attempts, and dashboard admin access.
- The private analytics dashboard is available only to authenticated users listed in the `admin_users` table.
- Active admins should see a secondary `Open dashboard` button on authenticated landing and app pages.
- Analytics are implemented in Supabase Postgres instead of a third-party analytics service for the MVP.
- The mock paywall is a section on `/app` and does not integrate a real payment provider.
- The generated landing hero image should be saved as `public/images/landing-hero.png` after the app is scaffolded.
- The quiz includes a required non-scoring gender question. `/app` uses it to show `public/images/app-profile-man.png` or `public/images/app-profile-woman.png`.
- If the user selects `Prefer not to say`, `/app` should use a neutral text-focused result layout without a gendered portrait.

## Current Local Setup

There is no runnable application yet. The current repository contains documentation, environment variable definitions, and Supabase CLI configuration. After the Next.js app is scaffolded, this section should be replaced with exact install, development, migration, and run commands.

## Environment Variables

Use `.env.example` as the required variable list.

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`

Do not commit `.env.local`, `.vercel`, Supabase temporary metadata, or service-role secrets.

## Supabase Auth Redirects

Magic links require environment-specific Supabase Auth URL configuration.

Local development:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

Production:

- Site URL: deployed Vercel application URL
- Redirect URL: `${NEXT_PUBLIC_SITE_URL}/auth/callback`

Preview deployments can be tested with magic links only after the exact preview URL is added to Supabase allowed Redirect URLs.

## Verification Scenarios

Final implementation must support:

- Complete the canonical flow as a new user.
- Complete the canonical flow again with the same email as an existing user.
- Complete `/quiz` question by question, then continue to email capture as an anonymous user.
- Verify that gender selection changes the profile image in `/app` without changing scoring logic.
- Complete `/quiz` while already authenticated and confirm the app skips email capture and returns to `/app`.
- Sign in through `/login` as an existing user and open the saved decision profile without retaking the quiz.
- Open a magic link on a different device or browser and confirm it still restores the saved quiz result on `/app`.
- Verify that the dashboard updates after anonymous acquisition runs and authenticated repeat quiz runs.
- Verify that first-touch attribution remains stable.
- Verify that last-touch attribution updates for returning users with a new source.
- Verify that only active `admin_users` can access the dashboard.
- Verify that active admins see a secondary `Open dashboard` button on authenticated landing and app pages.
- Verify that the landing page shows the correct state for anonymous users, authenticated users, and authenticated admins.

Suggested demo data scenarios:

- New user from `/?utm_source=google`.
- Returning same email from `/?utm_source=facebook`.
- New user from direct traffic with no UTM.
- Admin user listed in `admin_users`.

## Deployment Deliverables

Final submission should include:

- GitHub repository URL
- Deployed funnel URL
- Deployed private dashboard URL
- Dashboard credentials or admin access instructions
- Local setup instructions after the application is scaffolded
- Short explanation of key decisions and trade-offs
