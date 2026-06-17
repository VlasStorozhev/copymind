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
