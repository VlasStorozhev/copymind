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
| Start page has CTA/start button | [ ] | Button starts the funnel by opening `/quiz`. |
| Email capture page exists | [ ] | Anonymous user reaches email page inside the canonical flow after the start/assessment steps; authenticated users skip it. |
| Email field exists | [ ] | Email input is shown. |
| Email validation exists | [ ] | Invalid email cannot be submitted. |
| Email submit exists | [ ] | Submit starts user identification/auth flow. |
| New email creates a new user | [ ] | Supabase Auth creates user for a new email. |
| Existing email authorizes existing user | [ ] | Supabase Auth sends magic link for existing user; user is authorized after verification. |
| Repeat visits work for the same user | [ ] | Same email maps to same Supabase user after magic link verification. |
| Existing user can sign in without retaking quiz | [ ] | `/login` sends a magic link and redirects to `/app`. |
| Mock paywall exists | [ ] | `/app` shows a mock paywall section below the saved decision profile. |
| Mock paywall has "Buy" button | [ ] | Button is visible and tracked as intent. |
| Real payment is not implemented | [ ] | Buy button does not charge or integrate any payment provider. |

## Part 2: Analytics Dashboard

| Requirement | Status | How |
| --- | --- | --- |
| Separate analytics dashboard exists | [ ] | Dashboard is available separately from funnel flow. |
| Dashboard shows total funnel entries | [ ] | Shows how many users/visits entered the funnel. |
| Dashboard shows step progression | [ ] | Shows how many users reached each funnel step. |
| Dashboard shows final-step completions | [ ] | Shows how many users viewed/clicked the mock paywall section. |
| Dashboard shows conversion between steps | [ ] | Conversion table between funnel stages. |
| Dashboard separates anonymous and authenticated repeat conversion | [ ] | Authenticated repeat quiz runs are not treated as drop-off at email or magic-link steps. |
| Dashboard shows traffic source analysis | [ ] | Metrics grouped by source/UTM such as google, facebook, direct. |
| Dashboard supports first-touch attribution | [ ] | Shows source from user's first authenticated visit or first user creation. |
| Dashboard supports last-touch attribution | [ ] | Shows source from user's latest authenticated visit. |
| Attribution works for returning users | [ ] | First touch stays stable; last touch updates on repeat visit. |
| Dashboard is private | [ ] | Dashboard is not publicly accessible without authentication. |
| Dashboard is admin-only | [ ] | Only active users listed in the Supabase `admin_users` table can access dashboard data. |
| Admin dashboard CTA is shown only to admins | [ ] | Active admins see secondary `Open dashboard` on authenticated landing and app pages. |

## Technical Requirements

| Requirement | Status | How |
| --- | --- | --- |
| Stack decision is documented | [ ] | Planned stack: Next.js + TypeScript + Tailwind + shadcn/ui + Supabase + Vercel. |
| Solution works end-to-end | [ ] | User can complete the canonical flow and see data in dashboard. |
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
| Can test funnel as a new user | [ ] | Use a new email and complete the canonical flow. |
| Can test funnel as an existing user | [ ] | Reuse the same email and complete the canonical flow again. |
| Can test quiz route | [ ] | `/quiz` shows one question per screen; anonymous users continue to email capture after completion. |
| Can test gender-based app image | [ ] | Selecting Woman or Man in the quiz changes the profile image shown in `/app`; gender does not affect scoring. |
| Authenticated quiz skips email capture | [ ] | Logged-in user completes `/quiz` and returns to `/app` without a new magic link. |
| Can test returning login without quiz | [ ] | Use `/login` with an existing email and open `/app`. |
| Can test cross-device magic link | [ ] | Open the magic link in another browser/device and confirm `/app` shows the saved quiz result. |
| New funnel runs appear in dashboard | [ ] | After a test user completes the funnel, dashboard metrics and source attribution reflect that run. |
| Authenticated repeat quiz appears in dashboard | [ ] | Logged-in repeat assessment appears in repeat-quiz metrics without email or magic-link drop-off. |
| First-touch attribution can be verified | [ ] | First source remains from first authenticated visit or user creation. |
| Last-touch attribution can be verified | [ ] | Last source updates after repeat visit with different UTM. |
| Demo scenarios cover multiple sources | [ ] | Test at least google, facebook, and direct source scenarios. |

## Access Requirements

| Requirement | Status | How |
| --- | --- | --- |
| Dashboard credentials are provided | [ ] | Provide admin credentials or access instructions. |
| Admin-only dashboard access is documented | [ ] | Explain that admin access is managed through the Supabase `admin_users` table. |
| Test user or test instructions are provided | [ ] | Include test email/user instructions in README. |

## Deliverables

| Requirement | Status | How |
| --- | --- | --- |
| GitHub repository is provided | [ ] | Include repository URL. |
| Deployed funnel link is provided | [ ] | Include funnel URL. |
| Deployed dashboard link is provided | [ ] | Include dashboard URL; access requires admin authentication. |
| Dashboard access instructions are provided | [ ] | Include credentials and `admin_users` access instructions. |
| README includes local setup | [ ] | README has install/run steps after the app is scaffolded; current README states that no runnable app exists yet. |
| README includes verification steps | [ ] | README explains new user, returning user, dashboard checks. |
| README explains key decisions/trade-offs | [ ] | Short explanation of stack and product choices. |

## Final Acceptance

| Requirement | Status | How |
| --- | --- | --- |
| MVP demonstrates marketing funnel flow | [ ] | Landing / quiz start -> assessment -> email/auth -> `/app` result and mock paywall section works. |
| MVP demonstrates user identity handling | [ ] | New and existing emails map to correct users. |
| MVP demonstrates analytics collection | [ ] | Funnel events are stored and shown. |
| MVP demonstrates practical interpretation | [ ] | Dashboard makes funnel/source/attribution performance clear. |
