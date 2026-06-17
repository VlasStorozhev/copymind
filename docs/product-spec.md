# AI Decision Twin Onboarding Product Specification

## Overview

AI Decision Twin Onboarding is a focused acquisition and onboarding funnel for Copymind. It helps users identify their recurring decision-making pattern, captures high-signal personalization data, and creates a structured starting point for a future AI Twin experience.

The experience does not present AI chat or agent behavior in the initial flow. It uses explicit quiz answers and transparent deterministic logic to generate a decision profile. This keeps the first product moment honest, useful, and measurable while still aligning with Copymind's broader promise of a personalized AI twin that understands the user's inner patterns over time.

## Product Hypothesis

People often struggle with decisions not because they lack information, but because they repeat predictable behavioral loops:

- overthinking;
- avoiding decisions until pressure builds;
- seeking reassurance from others;
- choosing the safest option instead of the right one;
- making impulsive decisions to reduce discomfort;
- losing clarity when emotions are high;
- disconnecting from their own values.

A focused decision-making onboarding flow is expected to produce healthy email submission rate and paywall CTA intent because it addresses a concrete, frequent, emotionally meaningful problem:

> "I want to understand why I get stuck on decisions and how to make clearer choices before the same pattern repeats."

For Copymind, the quiz creates business value by collecting structured first-party data that can support personalization, lifecycle messaging, segmentation, and future product development.

The initial release should evaluate this assumption through absolute funnel health: email submission rate, quiz completion rate, paywall CTA intent, and the distribution of decision patterns. Any claim that this flow outperforms a broad self-insight quiz should be treated as a future experiment because the initial release does not include an A/B test or a live broad-quiz baseline.

## Target User

The initial target user is someone who is curious about self-understanding and personal growth, but enters through a concrete pain point: decision clarity.

They may be dealing with:

- career choices;
- relationship decisions;
- daily prioritization;
- personal boundaries;
- financial choices;
- emotional or high-pressure decisions;
- repeated regret after choosing too quickly or waiting too long.

The product should avoid presenting itself as therapy, diagnosis, or a replacement for professional support. The positioning should remain focused on reflection, clarity, decision patterns, and personal growth.

## Core User Problem

The user feels that decision-making is harder than it should be. They may delay, overthink, ask too many people, act impulsively, or choose against their own values.

The onboarding flow should help the user answer:

- What decision pattern do I repeat?
- What usually blocks me?
- What emotional driver is underneath the pattern?
- What kind of support would help me choose with more clarity?
- What should Copymind learn first to personalize my experience?

## Product Positioning

Primary positioning:

> Discover your decision pattern and create a personalized starting point for clearer choices.

Supporting message:

> Answer a few questions about how you make decisions. Copymind will identify your decision pattern and prepare a starting context for your AI Decision Twin.

Avoided positioning:

- Claims about hidden analysis that the product has not performed.
- Claims that the user's complete AI Twin has already been created.
- "A psychological diagnosis."
- "A complete decision coach experience from the first session."

Preferred language:

- "Based on your answers"
- "Your decision pattern"
- "Your likely blocker"
- "Recommended support style"
- "Starting context for your AI Twin"
- "What Copymind should learn first"

## Funnel Flow

### Step 1: Landing Page

Purpose: create a focused, emotionally relevant entry point.

Content:

- Title: "Discover your decision pattern"
- Subtitle: "Understand what blocks your choices and create a starting point for your AI Decision Twin."
- CTA: "Start assessment"

Tracking:

- `landing_viewed`
- `start_clicked`

### Step 2: Decision Assessment

Purpose: collect structured decision-making data without pretending to run AI analysis.

The assessment should be short enough to complete quickly, but rich enough to produce meaningful segmentation.

Recommended questions:

1. What kind of decisions do you get stuck on most often?
   - Big life decisions
   - Career decisions
   - Relationship decisions
   - Daily priorities
   - Financial decisions
   - Emotional decisions

This answer should be treated as secondary context. The main personalization segment is the user's decision pattern, not the life category where the pattern appears.

2. What usually happens when you need to make an important choice?
   - I overthink every option
   - I avoid it until the last moment
   - I ask too many people for advice
   - I avoid the option that might create conflict
   - I make a quick choice and regret it later
   - I know what I want but talk myself out of it
   - I choose what feels safest

3. What feels like the biggest blocker?
   - Fear of making the wrong choice
   - Too many options
   - Not trusting myself
   - Worrying what others will think
   - Not knowing what I really want
   - Feeling emotionally overwhelmed

4. After making a decision, what do you usually feel?
   - Relief
   - Doubt
   - Regret
   - Need for reassurance
   - Motivation to act
   - Emotional exhaustion

5. Which kind of decision tends to create the worst outcomes for you?
   - Decisions made under pressure
   - Decisions made to avoid conflict
   - Decisions made when tired
   - Decisions made from fear
   - Decisions delayed too long
   - Decisions made to please others

6. What kind of support would help you most?
   - A clear decision framework
   - A calm reflection partner
   - A challenge to my assumptions
   - A reminder of my values
   - A way to compare options
   - A push to take action

Post-MVP optional qualitative prompt:

> Is there a decision you are currently trying to make?

This field should not be enabled in the default MVP unless privacy controls are implemented first. It can appear after the structured assessment and before email capture when the product is ready to collect qualitative context.

The field should be optional and framed with privacy-conscious copy:

> Optional: share one decision you are currently trying to make. Do not include medical, legal, financial account, workplace-confidential, or other highly sensitive details. This will be saved as context for your profile, but it will not be analyzed in this version.

The prompt captures product insight and future personalization context without presenting hidden analysis.

`current_decision` should not affect scoring and should not be shown in the user attribution table by default. It should be treated as qualitative context for future product development.

Privacy requirements before enabling this field:

- Store it only when the user explicitly submits it.
- Keep it nullable and separate from scoring.
- Do not show it in aggregate dashboards or user attribution tables by default.
- Restrict access to internal admins who need qualitative research access.
- Define a retention period and deletion path before launch.
- Do not use it for AI generation, lifecycle messaging, or personalization without separate user-facing consent.

Tracking:

- `quiz_started`
- `quiz_question_answered`
- `quiz_completed`

Canonical assessment IDs:

| Question ID | Answer IDs |
| --- | --- |
| `decision_context` | `big_life_decisions`, `career_decisions`, `relationship_decisions`, `daily_priorities`, `financial_decisions`, `emotional_decisions` |
| `decision_behavior` | `overthink_every_option`, `avoid_until_last_moment`, `ask_too_many_people`, `avoid_conflict_option`, `quick_choice_regret_later`, `know_want_talk_out`, `choose_safest` |
| `primary_blocker` | `fear_wrong_choice`, `too_many_options`, `not_trusting_myself`, `worrying_others_think`, `not_knowing_want`, `emotionally_overwhelmed` |
| `post_decision_feeling` | `relief`, `doubt`, `regret`, `need_reassurance`, `motivation_to_act`, `emotional_exhaustion` |
| `worst_outcome` | `under_pressure`, `avoid_conflict`, `when_tired`, `from_fear`, `delayed_too_long`, `please_others` |
| `support_preference` | `clear_framework`, `calm_reflection_partner`, `challenge_assumptions`, `values_reminder`, `compare_options`, `push_to_act` |

These IDs are the source of truth for scoring, event metadata, dashboard aggregation, and seed data. Visible labels can change without changing IDs.

### Step 3: Email Capture and Magic Link

Purpose: identify the user by email and authorize access through Supabase Auth magic link verification.

Content:

- Title: "Save your decision profile"
- Subtitle: "Enter your email and we will send a secure link to open your personalized decision profile."
- Field: email
- CTA: "Send secure link"

Behavior:

- Normalize email with `trim().toLowerCase()`.
- Validate email format before creating or resolving identity.
- Use Supabase Auth passwordless email login with magic links as the canonical authentication mechanism.
- Call Supabase passwordless email login with user creation enabled.
- If email is new, Supabase Auth creates a new user record and sends a magic link.
- If email already exists, Supabase Auth sends a magic link for the existing user.
- Before sending the magic link, create an `auth_attempts` record that stores the pending `visitor_id`, `visit_id`, `quiz_response_id`, normalized email, desired redirect path, and expiry.
- Call Supabase Auth with `emailRedirectTo` pointing to the application callback route and including the `auth_attempt_id` as non-secret application context.
- After email submission, show a "Check your email" state. Do not show the decision profile yet.
- The UI should use the same check-email message for new and existing emails so it does not reveal whether an account already exists.
- The check-email state should support resend after the Supabase rate-limit window and explain that the link can expire.
- After the user clicks the magic link and Supabase verifies the session, the callback route should resolve the pending `auth_attempts` record and associate its visit and quiz response with `user_id`.
- If the verified user is new to the application profile table, create the profile row and assign first-touch attribution.
- If the verified user already exists in the application profile table, update `last_seen_at` and last-touch attribution.
- Access to result, paywall continuation, saved profile data, previous profiles, or future decision history requires a valid Supabase Auth session.
- If the magic link is expired, already used, invalid, or cannot be matched to a pending `auth_attempts` record, show a recovery state that lets the user resend a link from the email step.

Callback and redirect rules:

- Use `/auth/callback` as the application callback route.
- Configure Supabase Site URL and allowed Redirect URLs for local, preview, and production environments.
- The callback route should exchange or verify the Supabase magic link response, create the authenticated session, load the `auth_attempts` record by `auth_attempt_id`, verify that the attempt is pending and that `normalized_email` matches the authenticated Supabase user's email, then redirect to the result route for the linked `quiz_response_id`.
- Authenticated routes must not rely on query-string user identifiers. The server should derive the user from the verified Supabase Auth session. `auth_attempt_id` can identify pending application context, but it must not authorize access by itself.
- Magic links are one-time use and time-limited. The product should treat expired and replayed links as expected recovery cases, not fatal errors.

Delivery and resend requirements:

- MVP can use Supabase's default email delivery for development and internal testing.
- Production should configure custom SMTP before paid or scaled acquisition traffic.
- The resend UI should respect Supabase Auth rate limits and avoid repeatedly calling magic link send while the provider is throttling requests.
- Product copy should not promise a fixed link lifetime unless the Supabase Auth expiry setting is explicitly configured.

Tracking:

- `email_viewed`
- `email_submitted`
- `magic_link_sent`
- `magic_link_verified`
- `magic_link_failed`
- `user_created`
- `user_returned`

### Step 4: Decision Profile Result

Purpose: create a useful first product moment from structured quiz answers.

The result page should be transparent. It should say that the profile is based on the user's answers, not on hidden AI analysis.

Example profile:

#### Your Decision Pattern: The Overthinking Delayer

- Primary blocker: fear of regret
- Decision loop: research -> compare -> doubt -> delay
- Emotional driver: wanting certainty before acting
- Hidden cost: more anxiety, slower momentum, missed opportunities
- Best support style: calm narrowing and values-based prompts
- Recommended starting point: a decision clarity check-in

Other possible patterns:

- The Approval Seeker
- The Conflict Avoider
- The Impulsive Reliever
- The Safety Chooser
- The Values-Disconnected Decider
- The Pressure Reactor

Tracking:

- `result_viewed`

### Step 5: Paywall

Purpose: connect the decision profile to a deeper Copymind experience without overstating current functionality.

Content:

- Title: "Continue your decision clarity setup"
- Subtitle: "Use your decision profile as a starting point for deeper reflection, clearer choices, and pattern tracking over time."
- CTA: "Continue my setup"
- Next step message: "Next: choose your first decision clarity check-in."

Value bullets:

- Track recurring decision patterns
- Prepare to build a private decision history
- Get structured clarity prompts
- Compare choices against your values
- Turn repeated decision loops into personalized guidance

Tracking:

- `paywall_viewed`
- `paywall_cta_clicked`

The paywall CTA should be tracked as a continuation intent event. A future billing flow can replace this intent action without changing the core funnel model.

## Event Taxonomy

The implementation should use a single canonical list of funnel events:

- `landing_viewed`
- `start_clicked`
- `quiz_started`
- `quiz_question_answered`
- `quiz_completed`
- `email_viewed`
- `email_submitted`
- `magic_link_sent`
- `magic_link_verified`
- `magic_link_failed`
- `user_created`
- `user_returned`
- `result_viewed`
- `paywall_viewed`
- `paywall_cta_clicked`

Event names should not be varied in the implementation. Any additional event detail should be stored in `metadata`, not encoded into new event names.

Visits are source-attributed records, not funnel events. A new visit should be created when the user enters the funnel, while funnel events should describe actions or page views that happen within that visit.

Recommended event metadata:

- `quiz_question_answered`: `{ "question_id": "...", "answer_id": "..." }`
- `paywall_cta_clicked`: `{ "cta_label": "Continue my setup" }`
- `email_submitted`: `{ "auth_provider": "supabase", "method": "magic_link", "auth_attempt_id": "..." }`
- `magic_link_sent`: `{ "auth_provider": "supabase", "auth_attempt_id": "..." }`
- `magic_link_verified`: `{ "auth_provider": "supabase", "auth_attempt_id": "..." }`
- `magic_link_failed`: `{ "auth_provider": "supabase", "auth_attempt_id": "...", "reason": "expired" | "used" | "invalid" | "missing_context" | "email_mismatch" | "unknown" }`
- `user_created`: `{ "source": "...", "medium": "...", "campaign": "..." }`
- `user_returned`: `{ "source": "...", "medium": "...", "campaign": "..." }`

Page view events can repeat when a user reloads or revisits a page. Conversion action events, such as `start_clicked`, `email_submitted`, and `paywall_cta_clicked`, should be tracked once per visit where practical to keep conversion metrics interpretable.

### Metric Counting Rules

Primary funnel reporting should use visit-level deduplication unless a metric explicitly says otherwise.

- `landing views`: unique visits with `landing_viewed`.
- `assessment starts`: unique visits with `start_clicked`.
- `quiz completions`: unique visits with `quiz_completed`.
- `email submissions`: unique visits with successful `email_submitted`.
- `magic links sent`: unique visits with `magic_link_sent`.
- `magic links verified`: unique visits with `magic_link_verified`.
- `result views`: unique visits with `result_viewed`.
- `paywall views`: unique visits with `paywall_viewed`.
- `paywall CTA clicks`: unique visits with `paywall_cta_clicked`.
- `new users`: unique Supabase Auth users first verified in the selected period.
- `returning users`: unique Supabase Auth users that already existed before the selected visit.

Conversion rates should use the previous funnel step as the denominator. For example, `quiz completed -> email submitted` is unique visits with both `quiz_completed` and `email_submitted` divided by unique visits with `quiz_completed`.

Authenticated funnel conversion should use this sequence:

- landing view -> start clicked
- start clicked -> quiz completed
- quiz completed -> email submitted
- email submitted -> magic link sent
- magic link sent -> magic link verified
- magic link verified -> result viewed
- result viewed -> paywall viewed
- paywall viewed -> paywall CTA clicked

Raw event counts can be shown as a secondary diagnostic, but they should not be used as the primary conversion denominator because reloads and revisits can inflate page-view events.

## Decision Pattern Scoring

The initial release should use deterministic scoring, not AI generation.

Each quiz answer contributes points toward one or more derived segments:

- `overthinking_delayer`
- `approval_seeker`
- `conflict_avoider`
- `impulsive_reliever`
- `safety_chooser`
- `values_disconnected`
- `pressure_reactor`

The highest-scoring segment becomes the primary decision pattern. The scoring function must be deterministic and covered by tests.

`decision_context` should be stored separately from `decision_pattern`. Context answers explain where the user's decision difficulty appears; pattern answers explain how the user tends to get stuck.

Decision context answers should be stored but should not affect segment scoring. Some other answers can add zero segment points when they describe a neutral state rather than a recurring decision pattern. A profile has a clear winning pattern when the top segment is at least two points higher than the next highest segment. Otherwise, the profile should be marked as lower confidence and must use the tie-break rule.

`confidence` should be stored as `high` or `low`. Use `high` when the top segment is at least two points higher than the next highest segment. Use `low` for tied or close-scoring profiles.

Tie-break rule:

1. Prefer the segment from `decision_behavior` when that answer contributes 2 points to one of the tied or close-scoring segments.
2. If still unresolved, prefer the segment from `primary_blocker` when that answer contributes 2 points to one of the tied or close-scoring segments.
3. If still unresolved, prefer the segment from `worst_outcome` when that answer contributes 2 points to one of the tied or close-scoring segments.
4. If still unresolved, prefer the segment from `support_preference` when that answer contributes points to one of the tied or close-scoring segments.
5. If still unresolved, use this stable priority order: `overthinking_delayer`, `approval_seeker`, `conflict_avoider`, `impulsive_reliever`, `safety_chooser`, `values_disconnected`, `pressure_reactor`.

Example scoring matrix:

| Question | Answer | Segment | Points |
| --- | --- | --- | --- |
| What usually happens when you need to make an important choice? | I overthink every option | `overthinking_delayer` | 2 |
| What usually happens when you need to make an important choice? | I avoid it until the last moment | `pressure_reactor` | 2 |
| What usually happens when you need to make an important choice? | I ask too many people for advice | `approval_seeker` | 2 |
| What usually happens when you need to make an important choice? | I avoid the option that might create conflict | `conflict_avoider` | 2 |
| What usually happens when you need to make an important choice? | I make a quick choice and regret it later | `impulsive_reliever` | 2 |
| What usually happens when you need to make an important choice? | I know what I want but talk myself out of it | `values_disconnected` | 2 |
| What usually happens when you need to make an important choice? | I choose what feels safest | `safety_chooser` | 2 |
| What feels like the biggest blocker? | Fear of making the wrong choice | `overthinking_delayer` | 2 |
| What feels like the biggest blocker? | Fear of making the wrong choice | `safety_chooser` | 1 |
| What feels like the biggest blocker? | Too many options | `overthinking_delayer` | 1 |
| What feels like the biggest blocker? | Not trusting myself | `values_disconnected` | 2 |
| What feels like the biggest blocker? | Worrying what others will think | `approval_seeker` | 2 |
| What feels like the biggest blocker? | Worrying what others will think | `conflict_avoider` | 1 |
| What feels like the biggest blocker? | Not knowing what I really want | `values_disconnected` | 2 |
| What feels like the biggest blocker? | Feeling emotionally overwhelmed | `impulsive_reliever` | 1 |
| After making a decision, what do you usually feel? | Doubt | `overthinking_delayer` | 1 |
| After making a decision, what do you usually feel? | Regret | `impulsive_reliever` | 2 |
| After making a decision, what do you usually feel? | Need for reassurance | `approval_seeker` | 2 |
| After making a decision, what do you usually feel? | Emotional exhaustion | `pressure_reactor` | 1 |
| Which kind of decision tends to create the worst outcomes for you? | Decisions made under pressure | `pressure_reactor` | 2 |
| Which kind of decision tends to create the worst outcomes for you? | Decisions made to avoid conflict | `conflict_avoider` | 2 |
| Which kind of decision tends to create the worst outcomes for you? | Decisions made when tired | `pressure_reactor` | 1 |
| Which kind of decision tends to create the worst outcomes for you? | Decisions made from fear | `safety_chooser` | 2 |
| Which kind of decision tends to create the worst outcomes for you? | Decisions delayed too long | `overthinking_delayer` | 2 |
| Which kind of decision tends to create the worst outcomes for you? | Decisions made to please others | `approval_seeker` | 2 |
| What kind of support would help you most? | A clear decision framework | `overthinking_delayer` | 1 |
| What kind of support would help you most? | A calm reflection partner | `pressure_reactor` | 1 |
| What kind of support would help you most? | A challenge to my assumptions | `safety_chooser` | 1 |
| What kind of support would help you most? | A challenge to my assumptions | `conflict_avoider` | 1 |
| What kind of support would help you most? | A reminder of my values | `values_disconnected` | 2 |
| What kind of support would help you most? | A way to compare options | `overthinking_delayer` | 1 |
| What kind of support would help you most? | A push to take action | `pressure_reactor` | 1 |

The implementation should encode scoring against the canonical `question_id` and `answer_id` values, not against visible labels. Labels are for display and can change without changing scoring or analytics.

Derived profile fields:

- `decision_context`: the selected answer from the context question.
- `decision_pattern`: the scored segment after tie-break.
- `primary_blocker`: the selected answer from the blocker question.
- `emotional_driver`: derived from the pattern output mapping.
- `support_preference`: the selected answer from the support question.
- `recommended_starting_point`: derived from the pattern output mapping.
- `confidence`: `high` or `low` from the score gap rule.

Pattern output mapping:

| Segment | Result title | Emotional driver | Recommended starting point |
| --- | --- | --- | --- |
| `overthinking_delayer` | The Overthinking Delayer | Wanting certainty before acting | Decision clarity check-in |
| `approval_seeker` | The Approval Seeker | Wanting reassurance before trusting your own read | Self-trust and advice filter |
| `conflict_avoider` | The Conflict Avoider | Wanting to avoid disappointing or upsetting others | Boundary and trade-off check |
| `impulsive_reliever` | The Impulsive Reliever | Wanting discomfort to end quickly | Pause-before-choice reflection |
| `safety_chooser` | The Safety Chooser | Wanting protection from regret or risk | Risk and values comparison |
| `values_disconnected` | The Values-Disconnected Decider | Losing contact with what matters most under pressure | Values reconnection prompt |
| `pressure_reactor` | The Pressure Reactor | Waiting until urgency creates forced clarity | Early-warning decision plan |

The scoring rules should be simple and inspectable. This is important because the result should feel trustworthy and explainable.

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

## Analytics Dashboard

The dashboard should answer three questions:

1. How well does the funnel convert?
2. Which sources bring valuable users?
3. Which decision patterns are most common and most likely to convert?

### Funnel Metrics

Core metrics:

- landing views
- assessment starts
- quiz completions
- email submissions
- magic links sent
- magic links verified
- result views
- paywall views
- paywall CTA clicks
- new users
- returning users

Conversion table:

- landing view -> start clicked
- start clicked -> quiz completed
- quiz completed -> email submitted
- email submitted -> magic link sent
- magic link sent -> magic link verified
- magic link verified -> result viewed
- result viewed -> paywall viewed
- paywall viewed -> paywall CTA clicked

### Source Attribution

Source breakdown:

- source
- visits
- quiz completions
- email submissions
- magic links sent
- magic links verified
- paywall views
- paywall CTA clicks
- conversion rates

The dashboard should distinguish visit-source reporting from user-source reporting:

- Visit-source reporting uses `visits.source` and visit-level conversion counts.
- User-source reporting uses `user_profiles.first_touch_source` and `user_profiles.last_touch_source` for unique authenticated user counts.

### Product Intelligence

Decision pattern breakdown:

- decision pattern
- users or visits
- email submission rate
- magic link verification rate
- paywall view rate
- paywall CTA click rate
- top source

Source by pattern:

- source
- most common decision pattern
- most common blocker
- highest-converting pattern

This section turns the dashboard from basic analytics into product insight.

### Launch-Followup: Quiz Intelligence

This section should be added after the MVP dashboard because it shows whether the assessment is collecting useful product data, not only whether the funnel converts.

Required question-level insight:

- question
- answer option
- selections
- selection rate

Required profile quality metrics:

- quiz completion rate
- optional current-decision completion rate, only if the free-text field is enabled
- most common primary blockers
- most common support preferences
- share of profiles with a clear winning decision pattern
- share of profiles with tied or ambiguous scoring

Nice-to-have conversion insight:

- email submission rate after selecting each answer
- paywall CTA click rate after selecting each answer

This section helps evaluate whether the assessment is collecting useful product data, not only whether the funnel converts.

### Launch-Followup: User Attribution Table

Columns:

- email
- first touch source
- last touch source
- decision pattern
- primary blocker
- support preference
- first authenticated
- last seen

## Initial Release Scope

The initial MVP should include:

- landing page;
- structured multi-step decision assessment;
- Supabase Auth magic link login;
- Supabase magic link callback route;
- Supabase Postgres application data storage;
- email capture with validation and "check your email" state;
- pending auth context through `auth_attempts`;
- deterministic decision profile generation;
- authenticated result page after magic link verification;
- paywall page with tracked continuation intent;
- visitor tracking and Supabase Auth SSR/session handling;
- Row Level Security policies for application tables;
- first-touch and last-touch attribution for authenticated users;
- repeat visit handling through Supabase Auth sessions;
- canonical event tracking with visit-level metric counting;
- basic analytics dashboard covering funnel metrics, source attribution, and pattern breakdown;
- seed data or clear demo scenarios;
- README with architecture, trade-offs, and verification steps.

The initial MVP should not include:

- AI chat behavior;
- generated psychological analysis;
- real payment integration;
- custom authentication or custom magic link infrastructure;
- lifecycle email automation;
- a full decision journal;
- clinical or therapeutic claims;
- optional `current_decision` free-text collection unless the privacy requirements in this spec are implemented;
- previous-profile access or cross-device saved history outside Supabase Auth;
- AI analysis, lifecycle messaging, or personalization based on unreviewed free text.

Launch-followup scope can include:

- detailed quiz intelligence metrics;
- answer-level conversion reporting;
- protected user attribution table;
- first-touch vs. last-touch user attribution views;
- OAuth account access;
- custom SMTP configuration for production email delivery;
- optional current-decision collection after retention, access, and deletion rules are implemented.

## Future Product Extensions

Future versions could add:

- generated decision reflections based on a real current decision;
- decision history and pattern tracking;
- personalized daily clarity prompts;
- value-based decision frameworks;
- lifecycle email sequences by decision pattern;
- reminders for unresolved decisions;
- qualitative analysis of current-decision free text;
- deeper Copymind memory integration.

These extensions should be positioned as roadmap opportunities, not as part of the initial experience.

## Trade-Offs

### Deterministic Profile vs. Generated Result

The initial profile is deterministic and transparent. This avoids overstating product capabilities and makes the result easier to test, explain, and trust.

### Single App vs. Separate Services

A single application can handle the funnel, dashboard, event tracking, and attribution model. A separate backend or analytics pipeline would add complexity without improving the initial product experience.

### Basic Dashboard vs. BI Tooling

A custom dashboard is enough to demonstrate funnel performance, source attribution, Supabase session-based repeat visit handling, and product segmentation. A BI tool or warehouse would be unnecessary for the initial release.

The dashboard should prioritize clear metric cards and tables over complex charts. Charts can be added only where they make the funnel or pattern distribution easier to understand.

### Dashboard Protection

The dashboard should be protected with Supabase Auth. Only authenticated users whose email or `user_id` is present in an admin allowlist or admin role table should be able to access it. Admin access configuration should be stored in environment variables or Supabase Postgres and should not be hard-coded.

### Supabase Auth vs. Custom Auth

Supabase Auth should handle magic links, email verification, session creation, session refresh, and logout. The application should not build custom magic link infrastructure because token expiry, one-time use, replay protection, and session security are easy to implement incorrectly.

Supabase Postgres should store application-specific profile, quiz, visit, attribution, and dashboard data. Application tables should reference the verified Supabase Auth user id rather than using an unverified email-only identity.

## Key Risks

- The quiz may feel generic if the result copy is not specific enough.
- The product can lose trust if it overclaims AI capabilities.
- Dashboard metrics can become misleading if event definitions are unclear.
- Repeat visits can break attribution if visits are not linked correctly after magic link verification.
- Magic link delivery issues can block users from viewing their result after quiz completion.
- Missing or overly broad RLS policies can expose personal quiz data or dashboard data.
- Callback context can be lost if the pending `auth_attempts` record expires or cannot be matched after email redirect.
- The paywall can feel abrupt if the result page does not provide enough value first.
- Early source and decision-pattern conversion rates can be noisy when traffic volume is low.

## Success Criteria

The experience is successful if:

- users understand the decision-making problem within the first screen;
- the assessment feels focused and relevant;
- the result page feels useful without overstating how the profile was produced;
- Supabase Auth creates new users for new emails and authenticates existing users through magic links;
- magic link callback links the correct pending quiz response to the authenticated `user_id`;
- RLS policies prevent users from reading other users' profiles, quiz responses, visits, or raw events;
- first-touch attribution remains stable;
- last-touch attribution updates for authenticated repeat visits;
- the dashboard explains funnel conversion, source quality, and decision pattern distribution;
- README explains demo scenarios for a new user, an existing user, magic link verification, and source attribution changes;
- the product story clearly connects acquisition, personalization, analytics, and monetization.
