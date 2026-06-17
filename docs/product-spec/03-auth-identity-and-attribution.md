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
- A user can return from different sources over time.
- First-touch attribution is assigned only when the application profile is first created.
- Last-touch attribution is updated when an existing authenticated user returns through a new visit.
- Previous profiles, future decision history, and cross-device saved data can be shown only to the authenticated Supabase Auth user.

### Supabase Session Handling

- Use `@supabase/ssr` and the official Supabase browser/server client pattern for session cookies.
- Authenticated routes should be rendered dynamically and should not be cached by the CDN or framework static rendering.
- Server-side protected routes must derive the user from the verified Supabase Auth session, not from query params, local storage, or client-submitted `user_id`.
- Server code should avoid trusting raw session cookies for authorization. It should use Supabase server-client verification methods such as `getUser()` or validated claims according to the framework setup.
- The magic link callback route should create or refresh the Supabase Auth session before accessing application tables.
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
