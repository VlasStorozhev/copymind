"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { buttonVariants } from '@/components/ui/button'
import type { DashboardSummary } from '@/lib/analytics/dashboardTransform'

type DashboardResponse = {
  summary: DashboardSummary
  user_email: string | null
}

export function DashboardShell() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthorized' | 'forbidden' | 'error'>('loading')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      const response = await fetch('/api/dashboard/summary', {
        credentials: 'same-origin',
      })

      if (!active) {
        return
      }

      if (response.status === 401) {
        setStatus('unauthorized')
        return
      }

      if (response.status === 403) {
        setStatus('forbidden')
        return
      }

      if (!response.ok) {
        setStatus('error')
        return
      }

      const payload = (await response.json()) as DashboardResponse
      setSummary(payload.summary)
      setUserEmail(payload.user_email)
      setStatus('ready')
    }

    void loadDashboard().catch(() => {
      if (active) {
        setStatus('error')
      }
    })

    return () => {
      active = false
    }
  }, [])

  if (status === 'ready' && summary) {
    return <DashboardPage summary={summary} userEmail={userEmail} />
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {status === 'loading' ? 'Loading dashboard metrics' : 'Dashboard metrics are unavailable.'}
          </p>
        </section>

        {status === 'loading' ? <DashboardLoadingCards /> : null}
        {status === 'unauthorized' ? <DashboardAccessCard title="Sign in required" href="/login" label="Sign in" /> : null}
        {status === 'forbidden' ? <DashboardAccessCard title="Admin access required" href="/" label="Back to home" /> : null}
        {status === 'error' ? (
          <Card>
            <CardHeader>
              <CardTitle>Could not load dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Refresh the page to try loading analytics again.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  )
}

function DashboardLoadingCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} size="sm">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DashboardAccessCard({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Link href={href} className={buttonVariants()}>
          {label}
        </Link>
      </CardContent>
    </Card>
  )
}
