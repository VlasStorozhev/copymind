"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { DecisionProfile } from '@/components/funnel/DecisionProfile'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Database } from '@/lib/database.types'

type Profile = Pick<
  Database['public']['Tables']['quiz_responses']['Row'],
  | 'gender'
  | 'confidence'
  | 'decision_pattern'
  | 'primary_blocker'
  | 'emotional_driver'
  | 'support_preference'
  | 'recommended_starting_point'
>

type ProfileResponse = {
  profile: Profile | null
  is_admin: boolean
  user_email: string | null
}

export function AppShell() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthorized' | 'error'>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      const response = await fetch('/api/profile/latest', {
        credentials: 'same-origin',
      })

      if (!active) {
        return
      }

      if (response.status === 401) {
        setStatus('unauthorized')
        return
      }

      if (!response.ok) {
        setStatus('error')
        return
      }

      const payload = (await response.json()) as ProfileResponse
      setProfile(payload.profile)
      setIsAdmin(payload.is_admin)
      setStatus('ready')
    }

    void loadProfile().catch(() => {
      if (active) {
        setStatus('error')
      }
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Decisionmind
          </Link>
          {isAdmin ? (
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
          ) : null}
        </div>

        {status === 'loading' ? <ProfileLoading /> : null}
        {status === 'unauthorized' ? <SignInPrompt /> : null}
        {status === 'error' ? <AppError /> : null}
        {status === 'ready' && profile ? <DecisionProfile profile={profile} /> : null}
        {status === 'ready' && !profile ? <EmptyProfile /> : null}
      </div>
    </main>
  )
}

function ProfileLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loading your decision profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  )
}

function SignInPrompt() {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm shadow-black/5">
      <h1 className="text-2xl font-semibold">Sign in required</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Open your saved decision profile with a secure email link.
      </p>
      <div className="mt-6">
        <Link href="/login" className={buttonVariants()}>
          Sign in
        </Link>
      </div>
    </section>
  )
}

function EmptyProfile() {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm shadow-black/5">
      <h1 className="text-2xl font-semibold">Decision profile</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        We could not find a completed profile for this account yet. Finish the quiz to generate your saved decision
        pattern and next-step guidance.
      </p>
      <div className="mt-6">
        <Link href="/quiz" className={buttonVariants()}>
          Take the quiz
        </Link>
      </div>
    </section>
  )
}

function AppError() {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm shadow-black/5">
      <h1 className="text-2xl font-semibold">Could not load profile</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Refresh the page to try loading your saved decision profile again.
      </p>
    </section>
  )
}
