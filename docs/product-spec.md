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

## Canonical Flow

The product implements one canonical flow:

`Landing / Quiz Start -> Decision Assessment -> Email Capture/Auth -> /app with Decision Profile Result and Mock Paywall section`

This flow satisfies the assignment-required funnel while adding product-specific value through a short assessment and deterministic result page.

Requirement coverage:

1. `Landing / Quiz Start` covers the required quiz start page with title and CTA.
2. `Email Capture/Auth` covers the required email capture page and user identification logic.
3. The `/app` mock paywall section covers the required final paywall with a "Buy" button and no real payment integration.
4. The private admin analytics dashboard covers the required analytics dashboard.

Implementation should follow this single flow. The assignment requirements are verified by checking that the required pages and behaviors are present inside this canonical product flow.
