"use client"

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'

import { DashboardSummaryGrid } from '@/components/dashboard/dashboard-summary-grid'
import { DashboardTableSection } from '@/components/dashboard/dashboard-table-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { DashboardSummary } from '@/lib/analytics/dashboardTransform'

function formatPercent(value: number | null) {
  if (value === null) {
    return '—'
  }

  return `${Math.round(value * 100)}%`
}

function formatCurrencyFromCents(value: number | null, currency = 'USD') {
  if (value === null) {
    return '—'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export function DashboardPage({
  summary,
  onDashboardUpdated,
}: {
  summary: DashboardSummary
  userEmail: string | null
  onDashboardUpdated?: () => Promise<void>
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">Admin dashboard</h1>
            </div>
          </div>
        </section>

        <DashboardSummaryGrid metrics={summary.businessMetrics} />

        <DashboardSettingsCard summary={summary} onDashboardUpdated={onDashboardUpdated} />

        <DashboardTableSection
          title="Conversion funnel"
          description="One end-to-end all-time funnel. Paywall CTA click is the MVP purchase-intent signal."
          columns={['Step', 'Users', 'Conv. from prev', 'Conv. from landing', 'Cost per user']}
          rows={summary.funnelConversion.map((row) => [
            row.step,
            row.users,
            formatPercent(row.conversionFromPrevious),
            formatPercent(row.conversionFromLanding),
            formatCurrencyFromCents(row.costPerUserCents, summary.currency),
          ])}
        />

        <DashboardTableSection
          title="Traffic breakdown"
          description="Spend and purchase-intent efficiency by source, campaign, and creative."
          columns={[
            'Dimension',
            'Value',
            'Spend',
            'Landing users',
            'Paywall CTA clicks',
            'CTA rate',
            'Cost per CTA',
          ]}
          rows={summary.trafficBreakdown.map((row) => [
            row.dimension,
            row.label,
            formatCurrencyFromCents(row.spendCents, summary.currency),
            row.landingUsers,
            row.paywallClicks,
            formatPercent(row.ctaRate),
            formatCurrencyFromCents(row.costPerPaywallClickCents, summary.currency),
          ])}
        />

        <DashboardTableSection
          title="Registered-user attribution"
          description="First-touch and last-touch attribution for saved user profiles."
          columns={[
            'Email',
            'First-touch source',
            'First-touch medium',
            'First-touch campaign',
            'First-touch creative',
            'Last-touch source',
            'Last-touch medium',
            'Last-touch campaign',
            'Last-touch creative',
            'Decision pattern',
            'Product interest',
            'Interested at',
            'First authenticated at',
            'Last seen at',
          ]}
          rows={summary.registeredUsers.map((row) => [
            row.email,
            row.firstTouchSource,
            row.firstTouchMedium,
            row.firstTouchCampaign,
            row.firstTouchContent,
            row.lastTouchSource,
            row.lastTouchMedium,
            row.lastTouchCampaign,
            row.lastTouchContent,
            row.decisionPattern,
            row.productInterest,
            row.productInterestedAt,
            row.firstAuthenticatedAt,
            row.lastSeenAt,
          ])}
        />

      </div>
    </main>
  )
}

type SpendDraft = DashboardSummary['adSpendEntries'][number]

function DashboardSettingsCard({
  summary,
  onDashboardUpdated,
}: {
  summary: DashboardSummary
  onDashboardUpdated?: () => Promise<void>
}) {
  const [price, setPrice] = useState((summary.productPriceCents / 100).toFixed(2))
  const [spendEntries, setSpendEntries] = useState<SpendDraft[]>(summary.adSpendEntries)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    setPrice((summary.productPriceCents / 100).toFixed(2))
    setSpendEntries(summary.adSpendEntries)
  }, [summary])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business inputs</CardTitle>
        <CardDescription>Edit all-time product price and ad spend. Available to admin users.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            setStatus('saving')

            void fetch('/api/dashboard/summary', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
              },
              credentials: 'same-origin',
              body: JSON.stringify({
                productPriceCents: Math.round(Number(price) * 100),
                adSpendEntries: spendEntries.map((entry) => ({
                  ...entry,
                  spend_cents: Number(entry.spend_cents),
                  currency: summary.currency,
                })),
              }),
            })
              .then(async (response) => {
                if (!response.ok) {
                  throw new Error('Could not save dashboard settings')
                }

                await onDashboardUpdated?.()
                setStatus('saved')
              })
              .catch(() => {
                setStatus('error')
              })
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <label className="space-y-1 text-sm font-medium">
              Product price
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-3">
            {spendEntries.map((entry, index) => (
              <div key={entry.id} className="grid gap-2 sm:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
                <Input
                  aria-label={`Source ${index + 1}`}
                  value={entry.source}
                  onChange={(event) => {
                    const next = [...spendEntries]
                    next[index] = { ...entry, source: event.target.value }
                    setSpendEntries(next)
                  }}
                />
                <Input
                  aria-label={`Medium ${index + 1}`}
                  value={entry.medium ?? ''}
                  placeholder="medium"
                  onChange={(event) => {
                    const next = [...spendEntries]
                    next[index] = { ...entry, medium: event.target.value || null }
                    setSpendEntries(next)
                  }}
                />
                <Input
                  aria-label={`Campaign ${index + 1}`}
                  value={entry.campaign ?? ''}
                  placeholder="campaign"
                  onChange={(event) => {
                    const next = [...spendEntries]
                    next[index] = { ...entry, campaign: event.target.value || null }
                    setSpendEntries(next)
                  }}
                />
                <Input
                  aria-label={`Creative ${index + 1}`}
                  value={entry.content ?? ''}
                  placeholder="utm_content"
                  onChange={(event) => {
                    const next = [...spendEntries]
                    next[index] = { ...entry, content: event.target.value || null }
                    setSpendEntries(next)
                  }}
                />
                <Input
                  aria-label={`Spend ${index + 1}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={(entry.spend_cents / 100).toFixed(2)}
                  onChange={(event) => {
                    const next = [...spendEntries]
                    next[index] = { ...entry, spend_cents: Math.round(Number(event.target.value) * 100) }
                    setSpendEntries(next)
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Remove spend row ${index + 1}`}
                  onClick={() => {
                    setSpendEntries((current) => current.filter((item) => item.id !== entry.id))
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={status === 'saving'}>
              {status === 'saving' ? 'Saving' : 'Save business inputs'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSpendEntries((current) => [
                  ...current,
                  {
                    id: `new-${Date.now()}`,
                    source: 'facebook',
                    medium: 'paid_social',
                    campaign: null,
                    content: null,
                    spend_cents: 0,
                    currency: summary.currency,
                  },
                ])
              }}
            >
              Add spend row
            </Button>
            {status === 'saved' ? <span className="text-sm text-muted-foreground">Saved</span> : null}
            {status === 'error' ? <span className="text-sm text-destructive">Could not save</span> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
