"use client"

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { FunnelEventBeacon } from '@/components/funnel/event-beacon'
import { LandingActions } from '@/components/funnel/landing-actions'

type SessionSummary = {
  authenticated: boolean
  is_admin: boolean
}

export function LandingShell() {
  const [session, setSession] = useState<SessionSummary>({ authenticated: false, is_admin: false })

  useEffect(() => {
    let active = true

    async function loadSession() {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
      })

      if (!active || !response.ok) {
        return
      }

      const payload = (await response.json()) as SessionSummary
      setSession(payload)
    }

    void loadSession().catch(() => undefined)

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)]">
      <FunnelEventBeacon eventName="landing_viewed" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl leading-none font-semibold tracking-tight text-balance sm:text-5xl">
                  {session.authenticated ? 'Welcome back' : 'Discover your decision pattern'}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {session.authenticated
                    ? 'Your decision profile is saved. You can review it or start a new assessment.'
                    : 'Understand what blocks your choices and create a starting point for your AI Decision Twin.'}
                </p>
              </div>
            </div>

            {!session.authenticated ? (
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

            <LandingActions authenticated={session.authenticated} isAdmin={session.is_admin} />
          </div>

          <div data-testid="landing-hero-visual" className="relative order-first lg:order-none">
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/images/landing-hero.jpg"
                  alt="A person facing a translucent AI decision twin with branching paths between them"
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
