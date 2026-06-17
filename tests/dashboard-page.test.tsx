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
    expect(screen.queryByText('Dashboard scope')).not.toBeInTheDocument()
    expect(screen.queryByText(/Gender is intentionally excluded/)).not.toBeInTheDocument()
  })
})
