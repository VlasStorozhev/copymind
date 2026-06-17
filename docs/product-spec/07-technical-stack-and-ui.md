## Technical Stack and UI

The MVP should use this fixed stack:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Vercel

## Application Structure

- Use one Next.js application for both the funnel and the private analytics dashboard.
- Use public routes for the funnel.
- Use authenticated admin-only routes for the dashboard.
- Use Supabase Auth for sessions and magic link authentication.
- Use Supabase Postgres as the source of truth for funnel events, attribution, quiz responses, and dashboard data.
- Use the Supabase Postgres `admin_users` table as the source of truth for dashboard admin access.
- Deploy the application to Vercel.

## shadcn/ui Usage

Use shadcn/ui as the primary UI component system. Prefer shadcn/ui primitives over custom one-off controls when an equivalent component exists.

Recommended components:

- `Button` for CTA, submit, resend, and Buy actions.
- `Input` for email capture.
- `Form` or form field primitives for validation states.
- `Alert` for magic link sent, expired link, validation, and recovery states.
- `Card` for dashboard metric cards and paywall content blocks.
- `Table` for source breakdown, funnel step breakdown, and attribution views.
- `Tabs` for dashboard sections when useful.
- `Badge` for source, status, confidence, and user state labels.
- `Separator` for dense dashboard layout separation.
- `Skeleton` for loading dashboard data.

UI requirements:

- Keep the funnel simple and fast to complete.
- Use a generated bitmap hero image on the landing page instead of a purely decorative gradient or SVG abstraction.
- The landing hero image should visually express decision clarity, branching choices, and a subtle AI Decision Twin presence.
- Store the final landing hero asset at `public/images/landing-hero.png` after the app is scaffolded.
- Store app profile imagery at `public/images/app-profile-man.png` and `public/images/app-profile-woman.png`.
- In `/app`, select the displayed profile image from the latest completed `quiz_response.gender`.
- For `prefer_not_to_say` or missing gender, use a neutral, text-focused result layout without a gendered portrait until a dedicated neutral asset exists.
- Use polished, accessible form states.
- Make primary actions visually clear.
- Do not use decorative complexity that slows down the MVP.
- Use small emoji accents where they make the product feel warmer or easier to scan.
- Do not let emoji replace text labels, answer meaning, validation messages, or accessible names.
- Keep emoji usage restrained: one emoji per quiz answer option or value bullet is enough.
- Treat decorative emoji as `aria-hidden` in the implementation.
- Avoid emoji in analytics dashboard metric labels, table cells, and admin controls; the dashboard should stay dense and work-focused.
- Keep dashboard layout dense, readable, and admin-focused.
- Use responsive layouts for mobile and desktop.

## Styling Conventions

- Tailwind CSS should handle layout, spacing, and responsive behavior.
- shadcn/ui should provide base component styling and interaction states.
- Avoid creating a parallel custom component system.
- Keep copy concise and product-specific.
- Use clear empty, loading, error, and success states.

## Deployment Conventions

- Store public Supabase URL/key in Vercel environment variables with `NEXT_PUBLIC_` names.
- Store the public application base URL in `NEXT_PUBLIC_SITE_URL`.
- Store server-only Supabase keys only in server-side environment variables.
- Do not commit `.env.local`, `.vercel`, or Supabase temporary metadata.
- Manage dashboard admins in Supabase UI by editing the `admin_users` table.
- Supabase Auth Site URL and allowed Redirect URLs must include the environment-specific `${NEXT_PUBLIC_SITE_URL}/auth/callback` before magic links are tested.
