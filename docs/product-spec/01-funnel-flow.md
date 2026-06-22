## Funnel Flow

The product implements one canonical flow:

`Landing / Quiz Start -> Decision Assessment -> Email Capture/Auth -> /app with Decision Profile Result and Mock Paywall section`

This flow satisfies the assignment-required 3-step funnel while adding a short assessment and deterministic result page as product-specific value:

- `Landing / Quiz Start` covers the required quiz start page with title and CTA.
- `Email Capture/Auth` covers the required email capture page, email validation, submit action, and user identification logic.
- The `/app` mock paywall section covers the required final paywall with a "Buy" button and no real payment integration.

The decision assessment and result page are part of the product experience, not a separate alternative flow.

UI guardrail: implement funnel UI with Tailwind CSS and shadcn/ui components. Use `Button` for primary CTAs, `Input` for email capture, form primitives for validation, and `Alert` for magic-link and recovery states.

Emoji guardrail: use emoji as restrained visual accents across the funnel. Emoji should make the experience feel warmer and easier to scan, but must not replace labels, answer text, validation messages, or accessible names.

### Step 1: Landing Page

Purpose: create a focused, emotionally relevant entry point.

Anonymous content:

- Title: "Discover your decision pattern"
- Subtitle: "Understand what blocks your choices and create a starting point for your AI Decision Twin."
- CTA: "Start assessment"
- Secondary link: "Already have a profile? Sign in"

Authenticated user content:

- Title: "Welcome back"
- Subtitle: "Your decision profile is saved. You can review it or start a new assessment."
- Primary CTA: "View my profile"
- Secondary CTA: "Start new assessment"
- Utility action: "Sign out"

Authenticated admin content:

- Use the authenticated user content.
- Add secondary admin action: "Open dashboard"
- The admin action links to `/dashboard`.
- Place `Open dashboard` in the secondary action area near `Start new assessment`, not as the primary CTA.

Layout:

- Use a focused single-screen hero as the first viewport.
- Place the headline, subtitle, primary CTA, and secondary actions in a centered content column with a readable max width.
- Use a generated hero image that reflects the product idea: decision clarity, branching choices becoming clear, and a subtle AI Decision Twin presence.
- Save the final generated hero asset as `public/images/landing-hero.png` after the app is scaffolded.
- The hero image should be warm, polished, and product-specific, not generic stock imagery.
- The image should contain no text, logos, UI labels, or payment imagery.
- The image should support both desktop and mobile crops without hiding the primary subject.
- The primary CTA should be visually dominant and use shadcn/ui `Button`.
- Secondary links or actions should sit below or near the primary CTA and look secondary, not like competing primary actions.
- For anonymous users, show three short value bullets below the CTA area:
  - "🔍 Find the pattern behind your stuck decisions"
  - "🧭 Get a profile based on your answers"
  - "✨ Unlock a clearer next step"
- For authenticated users, do not show the anonymous value bullets unless needed for visual balance. Prioritize saved-profile actions.
- Avoid heavy decorative UI, nested cards, or a marketing-style split hero.
- Keep the page fast to scan on mobile: headline, primary CTA, and the most important secondary action must be visible without scrolling on common mobile viewports.
- On desktop, keep the hero visually calm and centered instead of spreading content across multiple panels.

Behavior:

- Anonymous primary CTA starts the canonical assessment flow by opening `/quiz`.
- Anonymous secondary sign-in link opens `/login` for returning users who want to access their saved decision profile without retaking the quiz.
- Authenticated user primary CTA opens `/app`.
- Authenticated user secondary CTA starts a new canonical assessment flow by opening `/quiz`.
- Authenticated user sign-out action clears the Supabase Auth session.
- Authenticated admin `Open dashboard` action is shown only after server-side `admin_users` authorization.
- Do not show `Open dashboard` based only on client-side email checks.
- Do not show `Open dashboard` to anonymous users or authenticated non-admin users.

Tracking:

- `landing_viewed`
- `start_clicked`

### Step 2: Decision Assessment

Route: `/quiz`

Purpose: collect structured decision-making data without pretending to run AI analysis.

The assessment should be short enough to complete quickly, but rich enough to produce meaningful segmentation.

Quiz UX:

- Use one question per screen.
- Show a progress indicator such as "Question 2 of 6".
- Use single-choice answer selection for each question.
- Render answer options as large selectable rows or cards using shadcn/ui `RadioGroup` or accessible button-style controls.
- Keep the selected answer visually clear.
- Use `Back` as the secondary navigation action after the first question.
- Use `Next` as the primary action after an answer is selected.
- Disable `Next` until the current question has a selected answer.
- On the final question, change the primary CTA to "See my result".
- After the final answer is submitted, create or update the `quiz_response`, track `quiz_completed`, and continue to the next auth-dependent step.
- Keep layout mobile-first with stable spacing and no layout shift between questions.
- Avoid nested cards. If a framed surface is needed, use one simple shadcn/ui `Card` around the question area.

Emoji usage:

- Add one leading emoji to each answer option where it improves scanning and emotional clarity.
- Keep the same answer text and canonical `answer_id` values; emoji are display-only.
- Do not store emoji inside canonical answer IDs or scoring logic.
- Decorative emoji should be hidden from screen readers.
- Avoid using more than one emoji in a single answer option.
- Keep emoji style consistent across the quiz: calm, clear, and not overly playful.

Example answer option display:

- "🧠 I overthink every option"
- "⏳ I avoid it until the last moment"
- "💬 I ask too many people for advice"

Gender question:

- Include one required, non-scoring gender question at the start of the quiz.
- Use question ID `profile_gender`.
- Suggested label: "Who are you creating this profile for?"
- Answer IDs:
  - `woman`: "Woman"
  - `man`: "Man"
  - `prefer_not_to_say`: "Prefer not to say"
- Store the answer on `quiz_response.gender` and in the structured `answers` JSON.
- Do not use this answer for decision pattern scoring.
- Use this answer only to choose the profile image shown in `/app`.

Desktop layout:

- Render the quiz as a compact centered wizard, not a wide dashboard-like page.
- Use a readable content width around `640px` to `720px`.
- Do not stretch answer options across the full desktop viewport.
- Place progress at the top of the wizard.
- Place the question directly below progress.
- Render answers as a vertical list.
- Place `Back` and `Next` in a bottom action row close to the answer list.
- Do not pin the action row to the bottom of the viewport on desktop.
- Avoid split-screen layouts for the quiz.
- Support keyboard-friendly interaction: Tab navigation, Enter/Space for answer selection, and Enter for the primary action when valid.

Route behavior:

- `/quiz` starts a new assessment attempt.
- Starting a new assessment should create a new `visit` if needed and a new anonymous `quiz_response`.
- Authenticated users can start a new assessment from the landing page; the new response should still be linked to their `user_id` after submission or immediately if the session is already valid.
- Authenticated users should skip email capture after completing `/quiz`; save the new result to their account, update last-touch attribution for the current visit, and redirect to `/app`.
- Anonymous users should continue to email capture after completing `/quiz`.
- Browser refresh should preserve the current quiz state where practical, but the source of truth should remain the server-created `quiz_response`.

Recommended questions:

1. Who are you creating this profile for?
   - Woman
   - Man
   - Prefer not to say

This answer should be treated as required profile display context. It does not affect scoring, attribution, or decision pattern analytics.

2. What kind of decisions do you get stuck on most often?
   - Big life decisions
   - Career decisions
   - Relationship decisions
   - Daily priorities
   - Financial decisions
   - Emotional decisions

This answer should be treated as secondary context. The main personalization segment is the user's decision pattern, not the life category where the pattern appears.

3. What usually happens when you need to make an important choice?
   - I overthink every option
   - I avoid it until the last moment
   - I ask too many people for advice
   - I avoid the option that might create conflict
   - I make a quick choice and regret it later
   - I know what I want but talk myself out of it
   - I choose what feels safest

4. What feels like the biggest blocker?
   - Fear of making the wrong choice
   - Too many options
   - Not trusting myself
   - Worrying what others will think
   - Not knowing what I really want
   - Feeling emotionally overwhelmed

5. After making a decision, what do you usually feel?
   - Relief
   - Doubt
   - Regret
   - Need for reassurance
   - Motivation to act
   - Emotional exhaustion

6. Which kind of decision tends to create the worst outcomes for you?
   - Decisions made under pressure
   - Decisions made to avoid conflict
   - Decisions made when tired
   - Decisions made from fear
   - Decisions delayed too long
   - Decisions made to please others

7. What kind of support would help you most?
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
| `profile_gender` | `woman`, `man`, `prefer_not_to_say` |
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
- If the user already has a valid Supabase Auth session, do not ask for email again after quiz completion.
- Use Supabase Auth passwordless email login with magic links as the canonical authentication mechanism.
- Call Supabase passwordless email login with user creation enabled.
- If email is new, Supabase Auth creates a new user record and sends a magic link.
- If email already exists, Supabase Auth sends a magic link for the existing user.
- Before sending the magic link, create an `auth_attempts` record with `attempt_type = quiz_email_capture` that stores the pending `visitor_id`, `visit_id`, `quiz_response_id`, normalized email, desired redirect path, and expiry.
- Call Supabase Auth with `emailRedirectTo` pointing to the application callback route and including the `auth_attempt_id` as non-secret application context.
- After email submission, show a "Check your email" state. Do not show the decision profile yet.
- The UI should use the same check-email message for new and existing emails so it does not reveal whether an account already exists.
- The check-email state should support resend after the Supabase rate-limit window and explain that the link can expire.
- After the user clicks the magic link and Supabase verifies the session, the callback route should resolve the pending `auth_attempts` record, associate the visit with `user_id`, and associate the quiz response with `user_id` when a quiz response is present.
- If the verified user is new to the application profile table, create the profile row and assign first-touch attribution.
- If the verified user already exists in the application profile table, update `last_seen_at` and last-touch attribution.
- After successful verification and profile update, redirect to `/app`.
- Access to result, paywall continuation, saved profile data, previous profiles, or future decision history requires a valid Supabase Auth session.
- If the magic link is expired, already used, invalid, or cannot be matched to a pending `auth_attempts` record, show a recovery state that lets the user resend a link from the email step.

Callback and redirect rules:

- Use `/auth/callback` as the application callback route.
- Use `NEXT_PUBLIC_SITE_URL` as the application base URL for magic link redirects.
- Local development Site URL should be `http://localhost:3000`.
- Local development Redirect URL should be `http://localhost:3000/auth/callback`.
- Production Site URL should be the deployed Vercel application URL.
- Production Redirect URL should be `${NEXT_PUBLIC_SITE_URL}/auth/callback`.
- Preview deployments can be tested with magic links only after the exact preview URL is added to Supabase allowed Redirect URLs.
- Configure Supabase Site URL and allowed Redirect URLs before testing magic links in each environment.
- The callback route should exchange or verify the Supabase magic link response, create the authenticated session, load the `auth_attempts` record by `auth_attempt_id`, verify that the attempt is pending and that `normalized_email` matches the authenticated Supabase user's email, then redirect to `/app`.
- If `attempt_type = quiz_email_capture`, the callback must link the stored `quiz_response` to the authenticated user before redirecting.
- If `attempt_type = returning_login`, the callback must not require a `quiz_response_id`; it should update profile last-touch context and redirect to `/app`.
- If the magic link is opened on a different device or browser than the original quiz session, the callback should still resolve the pending `auth_attempts` record, link the stored `quiz_response` when one exists, create the session on the new device, and redirect to `/app`.
- Authenticated routes must not rely on query-string user identifiers. The server should derive the user from the verified Supabase Auth session. `auth_attempt_id` can identify pending application context, but it must not authorize access by itself.
- Magic links are one-time use and time-limited. The product should treat expired and replayed links as expected recovery cases, not fatal errors.

Delivery and resend requirements:

- MVP can use Supabase's default email delivery for development and internal testing.
- Production should configure custom SMTP before paid or scaled acquisition traffic.
- The resend UI should respect Supabase Auth rate limits and avoid repeatedly calling magic link send while the provider is throttling requests.
- Product copy should not promise a fixed link lifetime unless the Supabase Auth expiry setting is explicitly configured.
- The "Check your email" state should include a resend action, a change-email action, and copy that tells users they can open the link on the same or another device.
- Expired, used, invalid, or unmatched links should redirect to a recovery state that can resend the link for the same pending quiz response when safe.

Tracking:

- `email_viewed`
- `email_submitted`
- `email_verified`
- `magic_link_sent`
- `magic_link_verified`
- `magic_link_failed`
- `user_created`
- `user_returned`

### Step 4: Decision Profile Result

Purpose: create a useful first product moment from structured quiz answers.

The result page should be transparent. It should say that the profile is based on the user's answers, not on hidden AI analysis.

Example profile:

#### Your Decision Pattern: 🧠 The Overthinking Delayer

- Primary blocker: ⚠️ fear of regret
- Decision loop: 🔁 research -> compare -> doubt -> delay
- Emotional driver: 🎯 wanting certainty before acting
- Hidden cost: ⏱️ more anxiety, slower momentum, missed opportunities
- Best support style: 🧘 calm narrowing and values-based prompts
- Recommended starting point: 🧭 a decision clarity check-in

Other possible patterns:

- The Approval Seeker
- The Conflict Avoider
- The Impulsive Reliever
- The Safety Chooser
- The Values-Disconnected Decider
- The Pressure Reactor

Tracking:

- `result_viewed`

Authenticated returning-user behavior:

- `/app` should show the latest completed decision profile for the authenticated user, ordered by `completed_at desc`.
- `/app` should show a profile image selected from the latest completed `quiz_response.gender`.
- Use `public/images/app-profile-woman.png` when `gender = woman`.
- Use `public/images/app-profile-man.png` when `gender = man`.
- For `gender = prefer_not_to_say` or missing gender, do not show a gendered portrait. Use a neutral, text-focused result layout until a dedicated neutral image asset exists.
- The gender-selected image is decorative product imagery. It must not change the user's result, scoring, dashboard segment, or paywall offer.
- `/app` should show the mock paywall offer below the saved decision profile.
- If the authenticated user has no saved `quiz_responses`, show an empty state with a CTA back to the quiz start page.
- If the authenticated user is an active admin in `admin_users`, show a secondary `Open dashboard` button that links to `/dashboard`.
- The dashboard button must be rendered only after server-side admin authorization, not from a client-only email check.
- Place the app-page `Open dashboard` button in the secondary action area, not as the primary app CTA.

### Step 5: Mock Paywall Section

Location: `/app`, below the saved decision profile.

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

- ⚠️ Your top decision trap and how to spot it
- 🧭 A step-by-step clarity framework for your pattern
- 💬 Prompts for the next decision you are stuck on
- 🔖 A saved decision profile you can revisit later

UI:

- Use shadcn/ui `Card` only where the paywall content needs a clear framed surface.
- Use shadcn/ui `Button` for the "Buy" CTA.
- The Buy button should look like a primary action but must not trigger a real payment.
- Do not create a separate `/paywall` route for the MVP.
- Do not integrate Stripe, checkout, payment links, or any real payment provider.

Tracking:

- `paywall_viewed`
- `paywall_cta_clicked`

The mock paywall section should track `paywall_viewed` when the offer is displayed on `/app`. The `Buy` CTA should track `paywall_cta_clicked` as a continuation intent event. A future billing flow can replace this intent action without changing the core funnel model.

## Returning User Login

Route: `/login`

Purpose: let existing users access their saved decision profile without retaking the quiz.

Content:

- Title: "Open your decision profile"
- Subtitle: "Enter your email and we will send a secure link to your saved decision profile."
- Field: email
- CTA: "Send secure link"

Behavior:

- Use the same Supabase Auth magic link mechanism as the email capture step.
- Do not require quiz answers before sending the magic link.
- Before sending the magic link, create an `auth_attempts` record with `attempt_type = returning_login`, no `quiz_response_id`, the current `visitor_id` and `visit_id` when available, normalized email, desired redirect path `/app`, and expiry.
- After successful magic link verification, redirect to `/app`.
- If no saved decision profile exists for the authenticated user, show an empty state and a CTA to start the canonical flow.
- Admin users can use `/login` as their authentication entry point before opening `/dashboard`.
