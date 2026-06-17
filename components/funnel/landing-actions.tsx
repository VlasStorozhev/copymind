"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, LayoutDashboard, LogIn, LogOut, Play } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { sendFunnelVisitEvent } from '@/components/funnel/event-client'
import { cn } from '@/lib/utils'

export function LandingActions({
  authenticated,
  isAdmin,
}: {
  authenticated: boolean
  isAdmin: boolean
}) {
  const router = useRouter()

  if (!authenticated) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={async () => {
            await sendFunnelVisitEvent({
              eventName: 'start_clicked',
              metadata: { cta_label: 'Start assessment' },
            })
            router.push('/quiz')
          }}
          className={buttonVariants({ className: 'gap-2 px-4' })}
        >
          <Play className="size-4" />
          Start assessment
        </button>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: 'outline', className: 'gap-2 px-4' }))}
        >
          <LogIn className="size-4" />
          Already have a profile? Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Link
        href="/app"
        className={cn(buttonVariants({ className: 'gap-2 px-4' }))}
      >
        <ArrowRight className="size-4" />
        View my profile
      </Link>
      <Link
        href="/quiz"
        className={cn(buttonVariants({ variant: 'outline', className: 'gap-2 px-4' }))}
      >
        <Play className="size-4" />
        Start new assessment
      </Link>
      {isAdmin ? (
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: 'secondary', className: 'gap-2 px-4' }))}
        >
          <LayoutDashboard className="size-4" />
          Open dashboard
        </Link>
      ) : null}
      <form action="/auth/logout" method="post">
        <button
          type="submit"
          className={buttonVariants({ variant: 'ghost', className: 'gap-2 px-4' })}
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </form>
    </div>
  )
}
