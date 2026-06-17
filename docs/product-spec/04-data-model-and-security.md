## Data Model

Database migrations should implement the tables below in Supabase Postgres. Use `uuid` primary keys with `gen_random_uuid()`, `timestamptz` timestamps, and `jsonb` for structured metadata or answer payloads.

### user_profiles

Application profile rows are keyed by the Supabase Auth user id.

- `id`
- `user_id`
- `email`
- `email_verified_at`
- `first_touch_source`
- `first_touch_medium`
- `first_touch_campaign`
- `last_touch_source`
- `last_touch_medium`
- `last_touch_campaign`
- `first_authenticated_at`
- `last_seen_at`
- `created_at`
- `updated_at`

Constraints and indexes:

- `id` primary key
- `user_id` unique
- `email` unique
- `user_id` references `auth.users(id)` on delete cascade
- `email` should be stored normalized with `trim().toLowerCase()`
- index on `email_verified_at`
- index on `first_touch_source`
- index on `last_touch_source`

### visits

- `id`
- `visitor_id`
- `user_id`
- `source`
- `medium`
- `campaign`
- `landing_url`
- `referrer`
- `created_at`
- `updated_at`

Constraints and indexes:

- `id` primary key
- `user_id` references `auth.users(id)` on delete set null
- index on `visitor_id`
- index on `user_id`
- index on `source`
- index on `created_at`

### auth_attempts

`auth_attempts` preserves application context for Supabase Auth callbacks. It supports both anonymous quiz email capture and returning-user login without a new quiz. Supabase owns the magic link token, token expiry, one-time use, and session creation.

- `id`
- `visitor_id`
- `visit_id`
- `quiz_response_id`
- `attempt_type`
- `user_id`
- `normalized_email`
- `status`
- `redirect_path`
- `created_at`
- `expires_at`
- `verified_at`

Allowed `status` values:

- `pending`
- `verified`
- `expired`
- `failed`

Allowed `attempt_type` values:

- `quiz_email_capture`
- `returning_login`

Constraints and indexes:

- `id` primary key
- `visit_id` references `visits(id)` on delete cascade
- `quiz_response_id` nullable; references `quiz_responses(id)` on delete cascade
- `attempt_type` check: `quiz_email_capture` or `returning_login`
- `quiz_response_id` must be present when `attempt_type = quiz_email_capture`
- `quiz_response_id` must be null when `attempt_type = returning_login`
- `user_id` references `auth.users(id)` on delete set null
- `status` check: `pending`, `verified`, `expired`, or `failed`
- index on `visitor_id`
- index on `visit_id`
- index on `quiz_response_id`
- index on `user_id`
- index on `normalized_email`
- index on `status`
- index on `expires_at`

Resend behavior:

- Multiple quiz email-capture attempts can exist for the same `quiz_response_id`.
- Multiple returning-login attempts can exist for the same normalized email.
- Only the latest non-expired pending attempt for the same context should be used for callback resolution.
- When a later quiz email-capture attempt is verified, older pending attempts for the same `quiz_response_id` should be marked `expired` or ignored for callback matching.
- When a later returning-login attempt is verified, older pending returning-login attempts for the same normalized email should be marked `expired` or ignored for callback matching.

### funnel_events

- `id`
- `visit_id`
- `user_id`
- `event_type`
- `step`
- `metadata`
- `created_at`

Every funnel event must belong to a visit. Anonymous events should be linked through `visit_id`; `user_id` can be null until the user verifies a magic link.

Constraints and indexes:

- `id` primary key
- `visit_id` references `visits(id)` on delete cascade
- `user_id` references `auth.users(id)` on delete set null
- index on `visit_id`
- index on `user_id`
- index on `event_type`
- index on `created_at`

### quiz_responses

- `id`
- `visitor_id`
- `user_id`
- `visit_id`
- `answers`
- `gender`
- `current_decision`
- `decision_context`
- `decision_pattern`
- `primary_blocker`
- `emotional_driver`
- `support_preference`
- `recommended_starting_point`
- `confidence`
- `created_at`
- `updated_at`
- `completed_at`

`answers` should be stored as structured JSON. Recommended shape:

```json
[
  {
    "question_id": "decision_behavior",
    "question_label": "What usually happens when you need to make an important choice?",
    "answer_id": "overthink_every_option",
    "answer_label": "I overthink every option"
  }
]
```

Stable `question_id` and `answer_id` values are required for dashboard aggregation. Labels can change for copy improvements without breaking analytics.

`gender` should be copied from the required `profile_gender` answer. Allowed values are `woman`, `man`, and `prefer_not_to_say`. It is used only for selecting the profile image in `/app`; it must not affect scoring or access control.

When multiple completed `quiz_responses` exist for the same user, `/app` should display the latest completed row by `completed_at desc`.

`current_decision` should be nullable and disabled in the default MVP. If enabled later, it must follow the privacy requirements in the assessment section before any user text is stored.

Constraints and indexes:

- `id` primary key
- `user_id` references `auth.users(id)` on delete set null
- `visit_id` references `visits(id)` on delete cascade
- `answers` stored as `jsonb`
- `gender` check: `woman`, `man`, or `prefer_not_to_say`
- `confidence` check: `high` or `low`
- index on `visitor_id`
- index on `user_id`
- index on `visit_id`
- index on `decision_pattern`
- index on `completed_at`

### admin_users

`admin_users` is the canonical admin access control table for the private analytics dashboard. It should be editable through the Supabase Table Editor by project maintainers.

- `id`
- `user_id`
- `email`
- `role`
- `is_active`
- `created_at`
- `updated_at`

Constraints and indexes:

- `id` primary key
- `user_id` references `auth.users(id)` and is unique when present
- `email` unique
- `email` should be stored normalized with `trim().toLowerCase()`
- `role` defaults to `admin`
- `role` check: `admin`
- `is_active` defaults to `true`
- index on `email`
- index on `is_active`

Admin lookup rules:

- A dashboard user must have a valid Supabase Auth session.
- Dashboard access is allowed only when the authenticated user's `user_id` or normalized email matches an active `admin_users` row.
- Admin changes are made by adding, updating, or disabling rows in Supabase Table Editor.

## Supabase Security Model

Row Level Security should be enabled on all application tables in Supabase Postgres.

Access rules:

- `user_profiles`: authenticated users can read their own profile where `user_id = auth.uid()`. Profile creation and attribution updates should happen through trusted server code after magic link verification.
- `quiz_responses`: authenticated users can read their own linked quiz responses. Anonymous quiz creation and updates before auth should go through server API routes using `visitor_id` and `visit_id`, not direct unrestricted client writes.
- `visits`: authenticated users can read visits linked to their own `user_id`. Anonymous visit creation should go through server API routes.
- `funnel_events`: regular users should not read raw event tables by default. Event writes should go through server API routes so event names and metadata stay canonical.
- `auth_attempts`: server-only table. Clients should not read or write auth attempts directly.
- `admin_users`: regular users should not read or write admin access rows. Dashboard authorization checks should happen in trusted server code.
- Dashboard queries require an authenticated Supabase user with admin access.

Admin access:

- Admin access must be implemented through the `admin_users` table.
- Dashboard routes must check both a valid Supabase Auth session and admin authorization.
- Admin records should be manageable from Supabase UI through the Table Editor.
- The Supabase service-role key must never be exposed to browser code.

Migration and RLS contract:

- Enable RLS on `user_profiles`, `visits`, `quiz_responses`, `funnel_events`, `auth_attempts`, and `admin_users`.
- Browser clients should not write directly to analytics or auth-context tables. Anonymous visit, quiz, event, and auth-attempt writes should go through trusted Next.js server routes.
- Authenticated users can read only their own `user_profiles`, `visits`, and `quiz_responses` rows where `user_id = auth.uid()`.
- Regular authenticated users should not read `funnel_events`, `auth_attempts`, or `admin_users`.
- Dashboard reads should run through trusted server code after checking both Supabase Auth session validity and active `admin_users` membership.
- Server routes that need cross-user analytics or admin checks may use the Supabase service-role key only on the server.
- No service-role key, admin query, or raw dashboard dataset should be exposed to browser code without the server-side admin authorization check.
