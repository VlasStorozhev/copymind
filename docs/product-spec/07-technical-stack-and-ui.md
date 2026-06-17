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
- Use polished, accessible form states.
- Make primary actions visually clear.
- Do not use decorative complexity that slows down the MVP.
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
- Store server-only Supabase keys only in server-side environment variables.
- Do not commit `.env.local`, `.vercel`, or Supabase temporary metadata.
