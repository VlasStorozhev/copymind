# AI Decision Twin Onboarding Product Specification

This is the index for the Copymind marketing funnel MVP product specification.

The full specification is split into focused files so implementation agents can read only the relevant product context for each task.

## Spec Files

| Area | File | Use When |
| --- | --- | --- |
| Product overview | [00-overview.md](product-spec/00-overview.md) | Understanding the product hypothesis, target user, user problem, and positioning. |
| Funnel flow | [01-funnel-flow.md](product-spec/01-funnel-flow.md) | Building or reviewing the user-facing funnel pages and copy. |
| Events and scoring | [02-events-and-scoring.md](product-spec/02-events-and-scoring.md) | Implementing canonical events, funnel metrics, quiz scoring, and profile fields. |
| Auth, identity, attribution | [03-auth-identity-and-attribution.md](product-spec/03-auth-identity-and-attribution.md) | Implementing Supabase Auth, magic link session handling, repeat users, and first/last touch attribution. |
| Data model and security | [04-data-model-and-security.md](product-spec/04-data-model-and-security.md) | Creating Supabase Postgres tables, indexes, and access rules. |
| Analytics dashboard | [05-analytics-dashboard.md](product-spec/05-analytics-dashboard.md) | Building the private admin dashboard and dashboard metrics. |
| Scope, risks, success | [06-scope-risks-success.md](product-spec/06-scope-risks-success.md) | Checking MVP scope, launch-followup scope, risks, and success criteria. |
| Technical stack and UI | [07-technical-stack-and-ui.md](product-spec/07-technical-stack-and-ui.md) | Applying the fixed stack and shadcn/ui component conventions. |

## Requirement Checklist

The assignment-facing acceptance checklist is kept separately:

- [requirement-check-list.md](requirement-check-list.md)

Use the checklist to verify that the implementation satisfies the original task requirements. Use the split product spec files for the detailed product and technical design.

## MVP Priority

The required assignment path remains:

1. Quiz start page.
2. Email capture and user identification/authentication.
3. Mock paywall with a "Buy" button.
4. Private admin analytics dashboard.

Product-specific additions, such as the decision assessment and deterministic profile result, should not prevent the required MVP path from being completed and tested.
