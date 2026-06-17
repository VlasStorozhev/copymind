## Data Model

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
- index on `visitor_id`
- index on `user_id`
- index on `source`
- index on `created_at`

### auth_attempts

`auth_attempts` preserves the relationship between the anonymous quiz completion and the later Supabase Auth callback. It stores application context only; Supabase owns the magic link token, token expiry, one-time use, and session creation.

- `id`
- `visitor_id`
- `visit_id`
- `quiz_response_id`
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

Constraints and indexes:

- `id` primary key
- index on `visitor_id`
- index on `visit_id`
- index on `quiz_response_id`
- index on `user_id`
- index on `normalized_email`
- index on `status`
- index on `expires_at`

Resend behavior:

- Multiple auth attempts can exist for the same `quiz_response_id`.
- Only the latest non-expired pending attempt should be used for callback resolution.
- When a later attempt is verified, older pending attempts for the same `quiz_response_id` should be marked `expired` or ignored for callback matching.

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

`current_decision` should be nullable and disabled in the default MVP. If enabled later, it must follow the privacy requirements in the assessment section before any user text is stored.

Constraints and indexes:

- `id` primary key
- index on `visitor_id`
- index on `user_id`
- index on `visit_id`
- index on `decision_pattern`
- index on `completed_at`

## Supabase Security Model

Row Level Security should be enabled on all application tables in Supabase Postgres.

Access rules:

- `user_profiles`: authenticated users can read their own profile where `user_id = auth.uid()`. Profile creation and attribution updates should happen through trusted server code after magic link verification.
- `quiz_responses`: authenticated users can read their own linked quiz responses. Anonymous quiz creation and updates before auth should go through server API routes using `visitor_id` and `visit_id`, not direct unrestricted client writes.
- `visits`: authenticated users can read visits linked to their own `user_id`. Anonymous visit creation should go through server API routes.
- `funnel_events`: regular users should not read raw event tables by default. Event writes should go through server API routes so event names and metadata stay canonical.
- `auth_attempts`: server-only table. Clients should not read or write auth attempts directly.
- Dashboard queries require an authenticated Supabase user with admin access.

Admin access:

- Admin access can be implemented through an `admin_users` table keyed by `user_id` or through an environment-configured allowlist.
- Dashboard routes must check both a valid Supabase Auth session and admin authorization.
- The Supabase service-role key must never be exposed to browser code.
