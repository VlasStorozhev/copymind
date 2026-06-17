import Image from 'next/image'

import { FunnelEventBeacon } from '@/components/funnel/event-beacon'
import { LandingActions } from '@/components/funnel/landing-actions'
import { Badge } from '@/components/ui/badge'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminClient = createAdminClient()
  let isAdmin = false

  if (user) {
    const { data: adminUser } = await adminClient
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    isAdmin = !!adminUser
  }

  const authenticated = !!user

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)]">
      <FunnelEventBeacon eventName="landing_viewed" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="w-fit border-border/70 bg-background/90 px-3 py-1">
                Copymind Decision Twin
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl leading-none font-semibold tracking-tight text-balance sm:text-5xl">
                  {authenticated ? 'Welcome back' : 'Discover your decision pattern'}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {authenticated
                    ? 'Your decision profile is saved. You can review it or start a new assessment.'
                    : 'Understand what blocks your choices and create a starting point for your AI Decision Twin.'}
                </p>
              </div>
            </div>

            {!authenticated ? (
              <ul className="grid gap-3 text-sm text-foreground sm:grid-cols-3">
                <li className="rounded-lg border border-border/70 bg-card/80 px-4 py-3">
                  Find the pattern behind your stuck decisions
                </li>
                <li className="rounded-lg border border-border/70 bg-card/80 px-4 py-3">
                  Get a profile based on your answers
                </li>
                <li className="rounded-lg border border-border/70 bg-card/80 px-4 py-3">
                  Unlock a clearer next step
                </li>
              </ul>
            ) : null}

            <LandingActions authenticated={authenticated} isAdmin={isAdmin} />
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/images/landing-hero.png"
                  alt="Illustration of branching decision paths and a subtle AI twin presence"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
