## Funnel Flow

The product implements one canonical flow:

`Landing / Quiz Start -> Decision Assessment -> Email Capture/Auth -> Decision Profile Result -> Mock Paywall`

This flow satisfies the assignment-required 3-step funnel while adding a short assessment and deterministic result page as product-specific value:

- `Landing / Quiz Start` covers the required quiz start page with title and CTA.
- `Email Capture/Auth` covers the required email capture page, email validation, submit action, and user identification logic.
- `Mock Paywall` covers the required final paywall page with a "Buy" button and no real payment integration.

The decision assessment and result page are part of the product experience, not a separate alternative flow.

UI guardrail: implement funnel UI with Tailwind CSS and shadcn/ui components. Use `Button` for primary CTAs, `Input` for email capture, form primitives for validation, and `Alert` for magic-link and recovery states.

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

UI:

- Use shadcn/ui `Input` for email.
- Use shadcn/ui `Button` for submit and resend.
- Use form validation messaging for invalid email states.
- Use shadcn/ui `Alert` for "Check your email", expired link, invalid link, and resend states.

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

### Step 5: Mock Paywall

Purpose: convert the decision profile into a clear next-step offer without overstating current functionality.

Motivation:

- The user has just learned their decision pattern, blocker, and support style.
- The paywall should offer a concrete continuation of that result: a personalized decision clarity plan.
- The offer should feel like the next useful step after the result, not a generic upgrade or hidden AI promise.

Content:

- Title: "Unlock your decision clarity plan"
- Subtitle: "Get a structured plan based on your decision pattern, blocker, and support style."
- CTA: "Buy"
- Next step message: "Next: apply your profile to the next decision you are stuck on."

Value bullets:

- Your top decision trap and how to spot it
- A step-by-step clarity framework for your pattern
- Prompts for the next decision you are stuck on
- A saved profile you can revisit later

UI:

- Use shadcn/ui `Card` only where the paywall content needs a clear framed surface.
- Use shadcn/ui `Button` for the "Buy" CTA.
- The Buy button should look like a primary action but must not trigger a real payment.

Tracking:

- `paywall_viewed`
- `paywall_cta_clicked`

The paywall CTA should be tracked as a continuation intent event. A future billing flow can replace this intent action without changing the core funnel model.
