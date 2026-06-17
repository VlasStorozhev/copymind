import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AppPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/70 bg-card/95 p-6">
          <h1 className="text-2xl font-semibold">Your profile</h1>
          <p className="text-sm text-muted-foreground">Sign in to view your decision profile.</p>
          <Link href="/login" className={cn(buttonVariants({ className: 'w-full' }))}>
            Sign in
          </Link>
        </div>
      </main>
    )
  }

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('email, first_authenticated_at, last_seen_at, first_touch_source, last_touch_source')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6">
        <div className="flex items-center justify-between gap-4">
          <Badge variant="outline" className="w-fit border-border/70 bg-background/90 px-3 py-1">
            Your profile
          </Badge>
          <form action="/auth/logout" method="post">
            <button type="submit" className={buttonVariants({ variant: 'ghost' })}>
              Sign out
            </button>
          </form>
        </div>

        <section className="grid gap-6 rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm shadow-black/5 md:grid-cols-2">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold">Decision profile</h1>
            <p className="text-sm text-muted-foreground">
              This page is a lightweight handoff from the funnel into the working profile area.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Email:</span> {profile?.email ?? user.email ?? 'Unknown'}
            </p>
            <p>
              <span className="font-medium">First authenticated:</span>{' '}
              {profile?.first_authenticated_at ?? 'Unavailable'}
            </p>
            <p>
              <span className="font-medium">Last seen:</span> {profile?.last_seen_at ?? 'Unavailable'}
            </p>
            {adminUser ? <p className="font-medium text-foreground">Admin access enabled</p> : null}
          </div>
        </section>

        <section
          id="dashboard"
          className="rounded-2xl border border-dashed border-border/70 bg-card/70 p-6"
        >
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The funnel now routes here after quiz completion and magic-link verification.
          </p>
        </section>
      </div>
    </main>
  )
}
