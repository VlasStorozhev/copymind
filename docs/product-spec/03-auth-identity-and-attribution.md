## Identity Model

The funnel should support anonymous visits, email-based user creation, magic link authentication, and repeat visits from the same user.

Authentication provider:

- Use Supabase Auth as the canonical authentication provider.
- Use Supabase Auth magic links for passwordless email login.
- Use Supabase Postgres for application data, funnel events, quiz responses, attribution, and dashboard queries.
- The application should not implement custom magic link tokens, token hashing, expiry, or session cookies.

Cookies:

- `visitor_id`: generated on first visit and used for anonymous tracking.
- Supabase Auth session cookies: set only after magic link verification and used for authenticated access.

Identity rules:

- A visitor can have many visits.
- A visit may start anonymous and later become associated with a verified Supabase Auth user after magic link callback.
- A quiz response can be created before email capture using `visitor_id` and `visit_id`, then linked to `user_id` after successful magic link verification.
- If a submitted email is new, Supabase Auth creates the user and sends a magic link.
- If a submitted email already exists, Supabase Auth sends a magic link for that existing user.
- The user is authorized only after the magic link is verified and a Supabase Auth session exists.
- Returning users can sign in from `/login` without retaking the quiz.
- Returning-user login redirects to `/app`, which shows the authenticated user's saved decision profile.
- If the authenticated user has no saved decision profile, `/app` should show an empty state with a CTA to start the canonical flow.
- `/quiz` starts a new assessment attempt for anonymous users and authenticated users.
- If the user is already authenticated when they complete `/quiz`, the app should save the new result and redirect to `/app` without asking for email again.
- If the user is anonymous when they complete `/quiz`, the app should continue to email capture and magic link verification before granting access to `/app`.
- A user can return from different sources over time.
- First-touch attribution is assigned only when the application profile is first created.
- Last-touch attribution is updated when an existing authenticated user returns through a new visit.
- Previous profiles, future decision history, and cross-device saved data can be shown only to the authenticated Supabase Auth user.
- Admin users are still regular funnel users. Admin status should only add dashboard access and dashboard entry points; it must not change profile ownership, quiz behavior, or attribution rules.
- Active admins should see an `Open dashboard` action on authenticated landing and `/app` pages after server-side `admin_users` authorization.
- The landing page should render different states for anonymous users, authenticated regular users, and authenticated admins.
- Authenticated regular users should be offered `View my profile`, `Start new assessment`, and `Sign out`.
- Authenticated admins should also be offered `Open dashboard` after server-side `admin_users` authorization.

### Supabase Session Handling

- Use `@supabase/ssr` and the official Supabase browser/server client pattern for session cookies.
- Authenticated routes should be rendered dynamically and should not be cached by the CDN or framework static rendering.
- Server-side protected routes must derive the user from the verified Supabase Auth session, not from query params, local storage, or client-submitted `user_id`.
- Server code should avoid trusting raw session cookies for authorization. It should use Supabase server-client verification methods such as `getUser()` or validated claims according to the framework setup.
- The magic link callback route should create or refresh the Supabase Auth session before accessing application tables.
- Magic links opened on a different device or browser should still resolve the pending `auth_attempts` record, link the stored quiz response when one exists, and redirect to `/app`.
- Returning-user login attempts from `/login` should use `attempt_type = returning_login` and must not require a quiz response.
- `/app` must derive the saved decision profile from the authenticated Supabase Auth user, not from an email or user id in the URL.
- `/dashboard` access and any landing or app-page dashboard CTA must require an active `admin_users` row checked in trusted server code.
- Logout should clear the Supabase Auth session and leave anonymous `visitor_id` tracking intact for future funnel attribution.

## Attribution Model

Source detection priority:

1. `utm_source`
2. Referrer domain
3. `direct`

Recommended fields:

- source
- medium
- campaign
- landing URL
- referrer
- created timestamp

Example:

Visit 1:

- URL: `/?utm_source=google`
- Email: `test@example.com`

Result:

- first touch: `google`
- last touch: `google`

Visit 2:

- URL: `/?utm_source=facebook`
- Email: `test@example.com`

Result:

- first touch: `google`
- last touch: `facebook`
