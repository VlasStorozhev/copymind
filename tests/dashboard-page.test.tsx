import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { buildDashboardSummary } from '@/lib/analytics/dashboardTransform'
import { buildDashboardFixture } from '@/tests/fixtures/dashboardData'

describe('DashboardPage', () => {
  it('omits the dashboard scope note from the admin dashboard', () => {
    const fixture = buildDashboardFixture()
    const summary = buildDashboardSummary({
      visits: fixture.visits,
      funnelEvents: fixture.funnelEvents,
      quizResponses: fixture.quizResponses,
      userProfiles: fixture.userProfiles,
    })

    render(<DashboardPage summary={summary} userEmail="admin@example.com" />)

    expect(screen.getByRole('heading', { name: 'Admin dashboard' })).toBeInTheDocument()
    expect(screen.queryByText(/Server-rendered funnel/)).not.toBeInTheDocument()
    expect(screen.queryByText(/admin@example\.com/)).not.toBeInTheDocument()
    expect(screen.queryByText('Private analytics')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard scope')).not.toBeInTheDocument()
    expect(screen.queryByText(/Gender is intentionally excluded/)).not.toBeInTheDocument()
  })

  it('only renders the selected dashboard analytics sections', () => {
    const fixture = buildDashboardFixture()
    const summary = buildDashboardSummary({
      visits: fixture.visits,
      funnelEvents: fixture.funnelEvents,
      quizResponses: fixture.quizResponses,
      userProfiles: fixture.userProfiles,
    })

    render(<DashboardPage summary={summary} userEmail="admin@example.com" />)

    expect(screen.getByText('Total visits')).toBeInTheDocument()
    expect(screen.getByText('Anonymous acquisition conversion')).toBeInTheDocument()
    expect(screen.getByText('Authenticated repeat-quiz conversion')).toBeInTheDocument()
    expect(screen.getByText('Source breakdown')).toBeInTheDocument()
    expect(screen.getByText('Registered-user attribution')).toBeInTheDocument()
    expect(screen.getByText('Product interest')).toBeInTheDocument()
    expect(screen.getByText('Interested at')).toBeInTheDocument()
    expect(screen.getByText('Interested')).toBeInTheDocument()
    expect(screen.queryByText('Decision pattern breakdown')).not.toBeInTheDocument()
    expect(screen.queryByText('Source-by-pattern intelligence')).not.toBeInTheDocument()
  })
})
