## Analytics Dashboard

The dashboard should answer three questions:

1. How well does the funnel convert?
2. Which sources bring valuable users?
3. Which decision patterns are most common and most likely to convert?

UI:

- Build the dashboard with Tailwind CSS and shadcn/ui.
- Use `Card` for top-level metric summaries.
- Use `Table` for funnel steps, source breakdown, and attribution views.
- Use `Tabs` only if the dashboard needs clear separation between funnel, source, and product intelligence sections.
- Use `Badge` for source, status, and user state labels.
- Use `Skeleton` or loading states while dashboard data loads.
- Keep the dashboard private, admin-focused, dense, and easy to scan.

Access entry points:

- Admin users can open the dashboard directly at `/dashboard` after authentication.
- Active admins should also see an `Open dashboard` button on the authenticated landing page and `/app`.
- The dashboard button must be shown only after the server confirms active `admin_users` membership.
- The button should be a secondary action, not the primary CTA.
- Non-admin users must not see the dashboard button and must not be able to access `/dashboard`.

### Funnel Metrics

Core metrics:

- landing views
- assessment starts
- quiz completions
- email submissions
- magic links sent
- magic links verified
- authenticated repeat quiz completions
- result views
- mock paywall section views
- paywall CTA clicks
- new users
- returning users

Anonymous acquisition conversion table:

- landing view -> start clicked
- start clicked -> quiz completed
- quiz completed -> email submitted
- email submitted -> magic link sent
- magic link sent -> magic link verified
- magic link verified -> result viewed
- result viewed -> mock paywall section viewed
- paywall viewed -> paywall CTA clicked

Authenticated repeat-quiz conversion table:

- quiz started -> quiz completed
- quiz completed -> result viewed
- result viewed -> mock paywall section viewed
- paywall viewed -> paywall CTA clicked

For authenticated repeat quiz reporting, `quiz_started` is the denominator for the first conversion step. Authenticated repeat quiz runs intentionally skip email capture and magic-link verification. The dashboard must not report missing email or magic-link events as drop-off for those runs.

### Source Attribution

Source breakdown:

- source
- visits
- quiz completions
- email submissions
- magic links sent
- magic links verified
- mock paywall section views
- paywall CTA clicks
- conversion rates

For anonymous acquisition reporting, source conversion can include email submissions and magic-link verification. For authenticated repeat-quiz reporting, source conversion should use visit source plus quiz completion, result view, mock paywall view, and paywall CTA click metrics.

The dashboard should distinguish visit-source reporting from user-source reporting:

- Visit-source reporting uses `visits.source` and visit-level conversion counts.
- User-source reporting uses `user_profiles.first_touch_source` and `user_profiles.last_touch_source` for unique authenticated user counts.

### Registered User Attribution

The MVP dashboard must include a minimal registered-user attribution table so first-touch and last-touch behavior can be verified for repeat users.

Required columns:

- email
- first touch source
- first touch medium
- first touch campaign
- last touch source
- last touch medium
- last touch campaign
- decision pattern
- first authenticated
- last seen

Rules:

- The table should include only users with verified Supabase Auth sessions and application profile rows.
- First-touch fields must stay stable after the first authenticated profile creation.
- Last-touch fields must update when the same authenticated user returns through a new visit with a different source.
- The table is admin-only and must not be exposed on public funnel routes.

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

Do not add gender breakdowns to the MVP dashboard. The `profile_gender` answer is collected only to select the `/app` profile image, not to analyze users by gender.

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

### Launch-Followup: Expanded User Attribution Table

Additional columns can be added after the MVP:

- primary blocker
- support preference
- latest visit URL
- latest referrer
- total visits
- total completed quizzes
