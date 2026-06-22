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
- `paywall_cta_clicked`: `{ "cta_label": "Buy" }`
- `email_submitted`: `{ "auth_provider": "supabase", "method": "magic_link", "auth_attempt_id": "..." }`
- `magic_link_sent`: `{ "auth_provider": "supabase", "auth_attempt_id": "..." }`
- `magic_link_verified`: `{ "auth_provider": "supabase", "auth_attempt_id": "..." }`
- `magic_link_failed`: `{ "auth_provider": "supabase", "auth_attempt_id": "...", "reason": "expired" | "used" | "invalid" | "missing_context" | "email_mismatch" | "unknown" }`
- `user_created`: `{ "source": "...", "medium": "...", "campaign": "..." }`
- `user_returned`: `{ "source": "...", "medium": "...", "campaign": "..." }`

Page view events can repeat when a user reloads or revisits a page. Conversion action events, such as `start_clicked`, `email_submitted`, and `paywall_cta_clicked`, should be tracked once per visit where practical to keep conversion metrics interpretable.

### Metric Counting Rules

Primary funnel reporting should use unique acquisition visitors unless a metric explicitly says otherwise.

- `visitors`: unique users who entered the acquisition funnel for the first time. Count them once on the first acquisition page they land on, including `/`, `/quiz`, or a future acquisition entry point. Do not count utility pages such as Privacy Policy, Terms, Contact, About, or Blog.
- `quiz starts`: unique acquisition visitors with `quiz_started`.
- `quiz completions`: unique acquisition visitors with `quiz_completed`.
- `email submissions`: unique acquisition visitors with successful `email_submitted`.
- `result views`: unique acquisition visitors with `result_viewed`.
- `purchase intent`: unique acquisition visitors with `paywall_cta_clicked`. This is the MVP North Star and proxy purchase signal until checkout exists.
- `new users`: unique Supabase Auth users first verified in the selected period.
- `returning users`: unique Supabase Auth users that already existed before the selected visit.

Conversion rates should use the previous step in the single end-to-end validation funnel as the denominator. Conversion from acquisition should use `visitors` as the denominator.

The primary conversion dashboard should use this sequence:

- visitors -> quiz started
- quiz started -> quiz completed
- quiz completed -> email submitted
- email submitted -> result viewed
- result viewed -> paywall CTA clicked

Authenticated repeat-quiz conversion can be used as a secondary diagnostic, but it should not appear as a separate primary dashboard funnel.

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

- `gender`: the selected answer from `profile_gender`; used only for profile image selection.
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

The `profile_gender` answer is required for the quiz but must be excluded from scoring and decision pattern analytics. It can be counted as a normal `quiz_question_answered` event, but it should not contribute points to any segment.
