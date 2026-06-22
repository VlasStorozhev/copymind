## Analytics Dashboard

The dashboard should answer three questions:

1. How well does the funnel convert?
2. Does paid traffic create enough purchase intent to keep validating the product?
3. Which sources, campaigns, and creatives bring valuable users?

UI:

- Build the dashboard with Tailwind CSS and shadcn/ui.
- Use `Card` for top-level metric summaries.
- Use `Table` for funnel steps, hierarchical traffic drill-down, and attribution views.
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

Business metrics:

- ad spend
- intent revenue
- intent profit
- ROAS
- intent CPA
- purchase intent

For the MVP, `paywall_cta_clicked` is the primary North Star because checkout is not connected yet. Purchase intent should count unique users who clicked the paywall CTA. Intent revenue should use `purchase intent * editable product price`.

Core funnel metrics:

- visitors
- quiz starts
- quiz completions
- email submissions
- result views
- purchase intent
- new users
- returning users

`Visitors` means unique users who entered the acquisition funnel for the first time. Count a visitor once on the first acquisition page they land on, including the landing page, the quiz page, or a future acquisition entry point. Do not count utility pages such as Privacy Policy, Terms, Contact, About, or Blog.

Single end-to-end conversion table:

- visitors -> quiz started
- quiz started -> quiz completed
- quiz completed -> email submitted
- email submitted -> result viewed
- result viewed -> purchase intent

The main dashboard must not split the primary funnel into anonymous and authenticated tables. Authenticated repeat behavior can remain a secondary diagnostic if needed, but it should not compete with the end-to-end validation funnel.

### Business Inputs

Admin users should be able to edit:

- product price
- ad spend by `utm_source`
- ad spend by `utm_medium`
- ad spend by `utm_campaign`
- ad spend by `utm_content`

The MVP dashboard period is all-time.

### Source Attribution

Traffic breakdown tree:

- source, from `utm_source`
- campaign, from `utm_campaign`
- creative, from `utm_content`
- spend
- visitors
- quiz starts
- quiz completions
- email submissions
- purchase intent
- intent rate
- cost per intent

Traffic breakdown must be hierarchical and expandable:

- Source rows expand to Campaign rows.
- Campaign rows expand to Creative rows.
- Source rows are expanded by default.
- Campaign and Creative rows are collapsed by default.
- Metrics aggregate at every level so the dashboard can identify winning channels, campaigns, and creatives without duplicating rows.

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
- first touch creative
- last touch source
- last touch medium
- last touch campaign
- last touch creative
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
