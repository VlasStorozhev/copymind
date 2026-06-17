# Requirement Checklist

This checklist maps the assignment requirements to a simple "done / not done" review format.

Legend:

- `[ ]` Not done yet
- `[x]` Done
- `How`: short note on how the requirement is covered

## Part 1: Funnel MVP

| Requirement | Status | How |
| --- | --- | --- |
| Quiz start page exists | [x] | Page with title and start CTA. |
| Start page has a title | [x] | Visible headline on the first screen. |
| Start page has CTA/start button | [x] | Button starts the funnel by opening `/quiz`. |
| Email capture page exists | [x] | Anonymous user reaches email page inside the canonical flow after the start/assessment steps; authenticated users skip it. |
| Email field exists | [x] | Email input is shown. |
| Email validation exists | [x] | Invalid email cannot be submitted. |
| Email submit exists | [x] | Submit starts user identification/auth flow. |
| New email creates a new user | [x] | Supabase Auth creates user for a new email. |
| Existing email authorizes existing user | [x] | Supabase Auth sends magic link for existing user; user is authorized after verification. |
| Repeat visits work for the same user | [x] | Same email maps to same Supabase user after magic link verification. |
| Existing user can sign in without retaking quiz | [x] | `/login` sends a magic link and redirects to `/app`. |
| Mock paywall exists | [x] | `/app` shows a mock paywall section below the saved decision profile. |
| Mock paywall has "Buy" button | [x] | Button is visible and tracked as intent. |
| Real payment is not implemented | [x] | Buy button does not charge or integrate any payment provider. |

## Part 2: Analytics Dashboard

| Requirement | Status | How |
| --- | --- | --- |
| Separate analytics dashboard exists | [x] | Dashboard is available separately from funnel flow. |
| Dashboard shows total funnel entries | [x] | Shows how many users/visits entered the funnel. |
| Dashboard shows step progression | [x] | Shows how many users reached each funnel step. |
| Dashboard shows final-step completions | [x] | Shows how many users viewed/clicked the mock paywall section. |
| Dashboard shows conversion between steps | [x] | Conversion table between funnel stages. |
| Dashboard separates anonymous and authenticated repeat conversion | [x] | Authenticated repeat quiz runs are not treated as drop-off at email or magic-link steps. |
| Dashboard shows traffic source analysis | [x] | Metrics grouped by source/UTM such as google, facebook, direct. |
| Dashboard supports first-touch attribution | [x] | Shows source from user's first authenticated visit or first user creation. |
| Dashboard supports last-touch attribution | [x] | Shows source from user's latest authenticated visit. |
| Attribution works for returning users | [x] | First touch stays stable; last touch updates on repeat visit. |
| Dashboard is private | [x] | Dashboard is not publicly accessible without authentication. |
| Dashboard is admin-only | [x] | Only active users listed in the Supabase `admin_users` table can access dashboard data. |
| Admin dashboard CTA is shown only to admins | [x] | Active admins see secondary `Open dashboard` on authenticated landing and app pages. |

## Technical Requirements

| Requirement | Status | How |
| --- | --- | --- |
| Stack decision is documented | [x] | Planned stack: Next.js + TypeScript + Tailwind + shadcn/ui + Supabase + Vercel. |
| Solution works end-to-end | [x] | User can complete the canonical flow and see data in dashboard. |
| Architecture decisions are documented | [x] | README explains key decisions and trade-offs. |

## Deployment Requirements

| Requirement | Status | How |
| --- | --- | --- |
| Funnel application is deployed | [x] | Public funnel URL is `https://project-jodbb.vercel.app`. |
| Analytics dashboard is deployed | [x] | Dashboard URL is `https://project-jodbb.vercel.app/dashboard`; unauthenticated access redirects to login. |
| Links to both services are provided | [x] | README includes public funnel and dashboard URLs. |

## Testing Requirements

| Requirement | Status | How |
| --- | --- | --- |
| Can test funnel as a new user | [x] | Use a new email and complete the canonical flow. |
| Can test funnel as an existing user | [x] | Reuse the same email and complete the canonical flow again. |
| Can test quiz route | [x] | `/quiz` shows one question per screen; anonymous users continue to email capture after completion. |
| Can test gender-based app image | [x] | Selecting Woman or Man in the quiz changes the profile image shown in `/app`; gender does not affect scoring. |
| Authenticated quiz skips email capture | [x] | Logged-in user completes `/quiz` and returns to `/app` without a new magic link. |
| Can test returning login without quiz | [x] | Use `/login` with an existing email and open `/app`. |
| Can test cross-device magic link | [x] | Open the magic link in another browser/device and confirm `/app` shows the saved quiz result. |
| New funnel runs appear in dashboard | [x] | After a test user completes the funnel, dashboard metrics and source attribution reflect that run. |
| Authenticated repeat quiz appears in dashboard | [x] | Logged-in repeat assessment appears in repeat-quiz metrics without email or magic-link drop-off. |
| First-touch attribution can be verified | [x] | First source remains from first authenticated visit or user creation. |
| Last-touch attribution can be verified | [x] | Last source updates after repeat visit with different UTM. |
| Demo scenarios cover multiple sources | [x] | Test at least google, facebook, and direct source scenarios. |

## Access Requirements

| Requirement | Status | How |
| --- | --- | --- |
| Dashboard credentials are provided | [ ] | Provide admin credentials or access instructions. |
| Admin-only dashboard access is documented | [x] | Explain that admin access is managed through the Supabase `admin_users` table. |
| Test user or test instructions are provided | [x] | Include test email/user instructions in README. |

## Deliverables

| Requirement | Status | How |
| --- | --- | --- |
| GitHub repository is provided | [ ] | Include repository URL. |
| Deployed funnel link is provided | [x] | README includes `https://project-jodbb.vercel.app`. |
| Deployed dashboard link is provided | [x] | README includes `https://project-jodbb.vercel.app/dashboard`; access requires admin authentication. |
| Dashboard access instructions are provided | [x] | Include `admin_users` access instructions in README. |
| README includes local setup | [x] | README has install/run steps after the app is scaffolded. |
| README includes verification steps | [x] | README explains new user, returning user, dashboard checks. |
| README explains key decisions/trade-offs | [x] | Short explanation of stack and product choices. |

## Final Acceptance

| Requirement | Status | How |
| --- | --- | --- |
| MVP demonstrates marketing funnel flow | [x] | Landing / quiz start -> assessment -> email/auth -> `/app` result and mock paywall section works. |
| MVP demonstrates user identity handling | [x] | New and existing emails map to correct users. |
| MVP demonstrates analytics collection | [x] | Funnel events are stored and shown. |
| MVP demonstrates practical interpretation | [x] | Dashboard makes funnel/source/attribution performance clear. |
