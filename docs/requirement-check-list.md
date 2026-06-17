# Requirement Checklist

This checklist maps the assignment requirements to a simple "done / not done" review format.

Legend:

- `[ ]` Not done yet
- `[x]` Done
- `How`: short note on how the requirement is covered

## Part 1: Funnel MVP

| Requirement | Status | How |
| --- | --- | --- |
| Quiz start page exists | [ ] | Page with title and start CTA. |
| Start page has a title | [ ] | Visible headline on the first screen. |
| Start page has CTA/start button | [ ] | Button starts the funnel. |
| Email capture page exists | [ ] | User reaches email page after starting funnel. |
| Email field exists | [ ] | Email input is shown. |
| Email validation exists | [ ] | Invalid email cannot be submitted. |
| Email submit exists | [ ] | Submit starts user identification/auth flow. |
| New email creates a new user | [ ] | Supabase Auth creates user for a new email. |
| Existing email authorizes existing user | [ ] | Supabase Auth sends magic link for existing user; user is authorized after verification. |
| Repeat visits work for the same user | [ ] | Same email maps to same Supabase user after magic link verification. |
| Mock paywall page exists | [ ] | User reaches mock paywall after identification/auth. |
| Mock paywall has "Buy" button | [ ] | Button is visible and tracked as intent. |
| Real payment is not implemented | [ ] | Buy button does not charge or integrate payment provider. |

## Part 2: Analytics Dashboard

| Requirement | Status | How |
| --- | --- | --- |
| Separate analytics dashboard exists | [ ] | Dashboard is available separately from funnel flow. |
| Dashboard shows total funnel entries | [ ] | Shows how many users/visits entered the funnel. |
| Dashboard shows step progression | [ ] | Shows how many users reached each funnel step. |
| Dashboard shows final-step completions | [ ] | Shows how many users reached/clicked final paywall action. |
| Dashboard shows conversion between steps | [ ] | Conversion table between funnel stages. |
| Dashboard shows traffic source analysis | [ ] | Metrics grouped by source/UTM such as google, facebook, direct. |
| Dashboard supports first-touch attribution | [ ] | Shows source from user's first authenticated visit or first user creation. |
| Dashboard supports last-touch attribution | [ ] | Shows source from user's latest authenticated visit. |
| Attribution works for returning users | [ ] | First touch stays stable; last touch updates on repeat visit. |
| Dashboard is private | [ ] | Dashboard is not publicly accessible without authentication. |
| Dashboard is admin-only | [ ] | Only admin users can access dashboard data. |

## Technical Requirements

| Requirement | Status | How |
| --- | --- | --- |
| Stack decision is documented | [ ] | Planned stack: Supabase Auth + Supabase Postgres + hosted app. |
| Solution works end-to-end | [ ] | User can complete funnel and see data in dashboard. |
| Architecture decisions are documented | [ ] | README explains key decisions and trade-offs. |

## Deployment Requirements

| Requirement | Status | How |
| --- | --- | --- |
| Funnel application is deployed | [ ] | Provide public funnel URL. |
| Analytics dashboard is deployed | [ ] | Provide deployed dashboard URL; access must require admin authentication. |
| Links to both services are provided | [ ] | Include links in README / submission. |

## Testing Requirements

| Requirement | Status | How |
| --- | --- | --- |
| Can test funnel as a new user | [ ] | Use a new email and complete the flow. |
| Can test funnel as an existing user | [ ] | Reuse the same email and complete the flow again. |
| New funnel runs appear in dashboard | [ ] | After a test user completes the funnel, dashboard metrics and source attribution reflect that run. |
| First-touch attribution can be verified | [ ] | First source remains from first authenticated visit or user creation. |
| Last-touch attribution can be verified | [ ] | Last source updates after repeat visit with different UTM. |

## Access Requirements

| Requirement | Status | How |
| --- | --- | --- |
| Dashboard credentials are provided | [ ] | Provide admin credentials or access instructions. |
| Admin-only dashboard access is documented | [ ] | Explain who can access the dashboard and how. |
| Test user or test instructions are provided | [ ] | Include test email/user instructions in README. |

## Deliverables

| Requirement | Status | How |
| --- | --- | --- |
| GitHub repository is provided | [ ] | Include repository URL. |
| Deployed funnel link is provided | [ ] | Include funnel URL. |
| Deployed dashboard link is provided | [ ] | Include dashboard URL; access requires admin authentication. |
| Dashboard access instructions are provided | [ ] | Include credentials or admin access instructions. |
| README includes local setup | [ ] | README has install/run steps. |
| README includes verification steps | [ ] | README explains new user, returning user, dashboard checks. |
| README explains key decisions/trade-offs | [ ] | Short explanation of stack and product choices. |

## Final Acceptance

| Requirement | Status | How |
| --- | --- | --- |
| MVP demonstrates marketing funnel flow | [ ] | Start -> email -> paywall works. |
| MVP demonstrates user identity handling | [ ] | New and existing emails map to correct users. |
| MVP demonstrates analytics collection | [ ] | Funnel events are stored and shown. |
| MVP demonstrates practical interpretation | [ ] | Dashboard makes funnel/source/attribution performance clear. |
