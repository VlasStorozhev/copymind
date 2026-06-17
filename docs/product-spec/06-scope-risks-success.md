## Initial Release Scope

The initial MVP should include:

- landing page;
- structured multi-step decision assessment;
- Next.js, TypeScript, Tailwind CSS, and shadcn/ui frontend implementation;
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

### Next.js + shadcn/ui vs. Custom UI

Next.js, TypeScript, Tailwind CSS, and shadcn/ui should be used for the MVP. This keeps implementation fast while providing polished, accessible UI primitives for forms, buttons, metric cards, tables, loading states, and admin dashboard controls.

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
