import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
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
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm shadow-black/5">
          <h1 className="text-2xl font-semibold">Decision profile</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue to your decision profile.</p>
          <Link href="/login" className={cn(buttonVariants({ className: 'w-full' }))}>
            Sign in
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Copymind
          </Link>
          <form action="/auth/logout" method="post">
            <button type="submit" className={buttonVariants({ variant: 'ghost' })}>
              Sign out
            </button>
          </form>
        </div>

        <section className="space-y-4 rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm shadow-black/5">
          <h1 className="text-3xl font-semibold">Decision profile</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            This page is reserved as the funnel handoff target.
          </p>
        </section>
      </div>
    </main>
  )
}
