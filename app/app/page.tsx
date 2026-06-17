import Link from 'next/link'
import { redirect } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'
import { normalizeEmail } from '@/lib/auth/profiles'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { DecisionProfile } from '@/components/funnel/DecisionProfile'

export const dynamic = 'force-dynamic'

export default async function AppPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminClient = createAdminClient()

  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  let isAdmin = !!adminUser

  if (!isAdmin && user.email) {
    const normalizedEmail = normalizeEmail(user.email)
    const { data: adminEmailUser } = await adminClient
      .from('admin_users')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .maybeSingle()

    isAdmin = !!adminEmailUser
  }

  const { data: latestResponse } = await adminClient
    .from('quiz_responses')
    .select(
      'id, answers, completed_at, confidence, decision_pattern, primary_blocker, emotional_driver, support_preference, recommended_starting_point, gender',
    )
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Copymind
          </Link>
          {isAdmin ? (
            <Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Open dashboard
            </Link>
          ) : null}
        </div>

        {latestResponse ? (
          <DecisionProfile profile={latestResponse} />
        ) : (
          <section className="rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm shadow-black/5">
            <h1 className="text-2xl font-semibold">Decision profile</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              We could not find a completed profile for this account yet. Finish the quiz to generate your saved
              decision pattern and next-step guidance.
            </p>
            <div className="mt-6">
              <Link href="/quiz" className={buttonVariants()}>
                Take the quiz
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
