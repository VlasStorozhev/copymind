import { Badge } from '@/components/ui/badge'
import { DashboardSummaryGrid } from '@/components/dashboard/dashboard-summary-grid'
import { DashboardTableSection } from '@/components/dashboard/dashboard-table-section'
import type { DashboardSummary } from '@/lib/analytics/dashboardTransform'

function formatPercent(value: number | null) {
  if (value === null) {
    return '—'
  }

  return `${Math.round(value * 100)}%`
}

export function DashboardPage({
  summary,
}: {
  summary: DashboardSummary
  userEmail: string | null
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

        <DashboardSummaryGrid metrics={summary.summaryMetrics} />

        <div className="grid gap-6 xl:grid-cols-2">
          <DashboardTableSection
            title="Anonymous acquisition conversion"
            description="Anonymous visitors from landing to magic-link request."
            columns={['Step', 'Visits', 'Conversion']}
            rows={summary.anonymousConversion.map((row) => [
              row.step,
              row.visits,
              formatPercent(row.conversionRate),
            ])}
          />

          <DashboardTableSection
            title="Authenticated product conversion"
            description="Signed-in users from result view to Buy intent."
            columns={['Step', 'Visits', 'Conversion']}
            rows={summary.authenticatedProductConversion.map((row) => [
              row.step,
              row.visits,
              formatPercent(row.conversionRate),
            ])}
          />
        </div>

        <DashboardTableSection
          title="Source breakdown"
          description="Key funnel outcomes by acquisition source."
          columns={[
            'Source',
            'Visits',
            'Quiz completions',
            'Email submissions',
            'Buy clicks',
            'Quiz completion rate',
            'Email submission rate',
            'Buy rate',
          ]}
          rows={summary.sourceBreakdown.map((row) => [
            <Badge key={row.source} variant="outline" className="border-border/70 bg-background/90">
              {row.source}
            </Badge>,
            row.visits,
            row.quizCompletions,
            row.emailSubmissions,
            row.paywallClicks,
            formatPercent(row.quizCompletionRate),
            formatPercent(row.emailSubmissionRate),
            formatPercent(row.paywallClickRate),
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
            'Last-touch source',
            'Last-touch medium',
            'Last-touch campaign',
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
            row.lastTouchSource,
            row.lastTouchMedium,
            row.lastTouchCampaign,
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
