"use client"

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, RefreshCw, Trash2 } from 'lucide-react'

import { DashboardSummaryGrid } from '@/components/dashboard/dashboard-summary-grid'
import { DashboardTableSection } from '@/components/dashboard/dashboard-table-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { DashboardSummary, TrafficTreeNode } from '@/lib/analytics/dashboardTransform'

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
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = onDashboardUpdated
    ? () => {
        setRefreshing(true)
        void onDashboardUpdated().finally(() => {
          setRefreshing(false)
        })
      }
    : undefined

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
          columns={['Step', 'Users', 'Conv. from prev', 'Conv. from visitors', 'Cost per user']}
          isRefreshing={refreshing}
          onRefresh={handleRefresh}
          rows={summary.funnelConversion.map((row) => [
            row.step,
            row.users,
            formatPercent(row.conversionFromPrevious),
            formatPercent(row.conversionFromVisitors),
            formatCurrencyFromCents(row.costPerUserCents, summary.currency),
          ])}
        />

        <TrafficTreeSection summary={summary} isRefreshing={refreshing} onRefresh={handleRefresh} />

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
          isRefreshing={refreshing}
          onRefresh={handleRefresh}
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

        <DashboardTableSection
          title="Unverified email leads"
          description="Submitted emails that have not completed magic-link verification yet."
          columns={['Email', 'Submitted at', 'Source', 'Medium', 'Campaign', 'Creative']}
          isRefreshing={refreshing}
          onRefresh={handleRefresh}
          rows={
            summary.pendingEmailLeads.length > 0
              ? summary.pendingEmailLeads.map((lead) => [
                  lead.email,
                  lead.submittedAt,
                  lead.source,
                  lead.medium,
                  lead.campaign,
                  lead.content,
                ])
              : [['No unverified email leads', '—', '—', '—', '—', '—']]
          }
        />
      </div>
    </main>
  )
}

type SpendDraft = DashboardSummary['adSpendEntries'][number]

function getDefaultExpandedTrafficNodes(nodes: TrafficTreeNode[]) {
  return new Set(nodes.map((node) => node.id))
}

function flattenTrafficNodes(nodes: TrafficTreeNode[], expandedNodes: Set<string>) {
  const rows: Array<{ node: TrafficTreeNode; depth: number }> = []

  function visit(node: TrafficTreeNode, depth: number) {
    rows.push({ node, depth })

    if (!expandedNodes.has(node.id)) {
      return
    }

    for (const child of node.children) {
      visit(child, depth + 1)
    }
  }

  for (const node of nodes) {
    visit(node, 0)
  }

  return rows
}

function TrafficTreeSection({
  summary,
  isRefreshing,
  onRefresh,
}: {
  summary: DashboardSummary
  isRefreshing: boolean
  onRefresh?: () => void
}) {
  const [expandedNodes, setExpandedNodes] = useState(() => getDefaultExpandedTrafficNodes(summary.trafficTree))

  useEffect(() => {
    setExpandedNodes(getDefaultExpandedTrafficNodes(summary.trafficTree))
  }, [summary.trafficTree])

  const rows = flattenTrafficNodes(summary.trafficTree, expandedNodes)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>Traffic breakdown</CardTitle>
          <CardDescription>Drill down from source to campaign to creative without duplicating rows.</CardDescription>
        </div>
        {onRefresh ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            onClick={onRefresh}
          >
            <RefreshCw className={isRefreshing ? 'animate-spin' : undefined} />
            Refresh
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source / Campaign / Creative</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Visitors</TableHead>
              <TableHead>Quiz Started</TableHead>
              <TableHead>Quiz Completed</TableHead>
              <TableHead>Email Submitted</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Purchase Intent</TableHead>
              <TableHead>Intent Rate</TableHead>
              <TableHead>Cost per Intent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ node, depth }) => {
              const isExpanded = expandedNodes.has(node.id)
              const hasChildren = node.children.length > 0

              return (
                <TableRow key={node.id} data-testid={`traffic-row-${node.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 1.25}rem` }}>
                      {hasChildren ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.level} ${node.label}`}
                          aria-expanded={isExpanded}
                          onClick={() => {
                            setExpandedNodes((current) => {
                              const next = new Set(current)
                              if (next.has(node.id)) {
                                next.delete(node.id)
                              } else {
                                next.add(node.id)
                              }
                              return next
                            })
                          }}
                        >
                          {isExpanded ? <ChevronDown /> : <ChevronRight />}
                        </Button>
                      ) : (
                        <span className="size-6" aria-hidden="true" />
                      )}
                      <span className="font-medium">{node.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrencyFromCents(node.spendCents, summary.currency)}</TableCell>
                  <TableCell>{node.visitors}</TableCell>
                  <TableCell>{node.quizStarted}</TableCell>
                  <TableCell>{node.quizCompleted}</TableCell>
                  <TableCell>{node.emailSubmitted}</TableCell>
                  <TableCell>{node.emailVerified}</TableCell>
                  <TableCell>{node.purchaseIntent}</TableCell>
                  <TableCell>{formatPercent(node.intentRate)}</TableCell>
                  <TableCell>{formatCurrencyFromCents(node.costPerIntentCents, summary.currency)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

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
