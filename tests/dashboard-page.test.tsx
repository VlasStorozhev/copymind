import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
      emailLeads: fixture.emailLeads,
      authAttempts: fixture.authAttempts,
      dashboardSettings: fixture.dashboardSettings,
      adSpendEntries: fixture.adSpendEntries,
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
      emailLeads: fixture.emailLeads,
      authAttempts: fixture.authAttempts,
      dashboardSettings: fixture.dashboardSettings,
      adSpendEntries: fixture.adSpendEntries,
    })

    render(<DashboardPage summary={summary} userEmail="admin@example.com" />)

    expect(screen.getByText('Ad Spend')).toBeInTheDocument()
    expect(screen.getByText('Intent Revenue')).toBeInTheDocument()
    expect(screen.getByText('Intent Profit')).toBeInTheDocument()
    expect(screen.getByText('Intent CPA')).toBeInTheDocument()
    expect(screen.getAllByText('Email Submitted')).toHaveLength(3)
    expect(screen.getAllByText('Email Verified')).toHaveLength(2)
    expect(screen.getByText('Verification Rate')).toBeInTheDocument()
    expect(screen.getByText('Business inputs')).toBeInTheDocument()
    expect(screen.getByText('Conversion funnel')).toBeInTheDocument()
    expect(screen.getByText('Traffic breakdown')).toBeInTheDocument()
    expect(screen.getAllByText('Visitors')).toHaveLength(2)
    expect(screen.getAllByText('Quiz Started')).toHaveLength(2)
    expect(screen.getAllByText('Purchase Intent')).toHaveLength(3)
    expect(screen.getByText('Cost per Intent')).toBeInTheDocument()
    expect(screen.getByText('Registered-user attribution')).toBeInTheDocument()
    expect(screen.getByText('First-touch creative')).toBeInTheDocument()
    expect(screen.getByText('Product interest')).toBeInTheDocument()
    expect(screen.getByText('Interested at')).toBeInTheDocument()
    expect(screen.getByText('Interested')).toBeInTheDocument()
    expect(screen.queryByText('Anonymous acquisition conversion')).not.toBeInTheDocument()
    expect(screen.queryByText('Authenticated product conversion')).not.toBeInTheDocument()
    expect(screen.queryByText('Decision pattern breakdown')).not.toBeInTheDocument()
    expect(screen.queryByText('Source-by-pattern intelligence')).not.toBeInTheDocument()
    expect(screen.queryByText('Authenticated repeat-quiz conversion')).not.toBeInTheDocument()
    expect(screen.queryByText('Magic links sent')).not.toBeInTheDocument()
    expect(screen.queryByText('Magic links verified')).not.toBeInTheDocument()
    expect(screen.queryByText('Paywall views')).not.toBeInTheDocument()
    expect(screen.queryByText('Magic-link verification rate')).not.toBeInTheDocument()
  })

  it('renders traffic breakdown as an expandable source campaign creative tree', async () => {
    const user = userEvent.setup()
    const fixture = buildDashboardFixture()
    const summary = buildDashboardSummary({
      visits: fixture.visits,
      funnelEvents: fixture.funnelEvents,
      quizResponses: fixture.quizResponses,
      userProfiles: fixture.userProfiles,
      emailLeads: fixture.emailLeads,
      authAttempts: fixture.authAttempts,
      dashboardSettings: fixture.dashboardSettings,
      adSpendEntries: fixture.adSpendEntries,
    })

    render(<DashboardPage summary={summary} userEmail="admin@example.com" />)

    expect(screen.getByRole('button', { name: 'Collapse source facebook' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand campaign retargeting' })).toBeInTheDocument()
    expect(screen.queryByTestId('traffic-row-source:facebook/campaign:retargeting/creative:video-1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Expand campaign retargeting' }))

    expect(screen.getByTestId('traffic-row-source:facebook/campaign:retargeting/creative:video-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse campaign retargeting' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Collapse source facebook' }))

    expect(screen.queryByTestId('traffic-row-source:facebook/campaign:retargeting')).not.toBeInTheDocument()
    expect(screen.queryByTestId('traffic-row-source:facebook/campaign:retargeting/creative:video-1')).not.toBeInTheDocument()
  })

  it('removes a spend row from the saved business inputs payload', async () => {
    const user = userEvent.setup()
    const fixture = buildDashboardFixture()
    const summary = buildDashboardSummary({
      visits: fixture.visits,
      funnelEvents: fixture.funnelEvents,
      quizResponses: fixture.quizResponses,
      userProfiles: fixture.userProfiles,
      emailLeads: fixture.emailLeads,
      authAttempts: fixture.authAttempts,
      dashboardSettings: fixture.dashboardSettings,
      adSpendEntries: fixture.adSpendEntries,
    })
    const fetchCalls: unknown[] = []
    const originalFetch = global.fetch
    global.fetch = (async (...args: Parameters<typeof fetch>) => {
      fetchCalls.push(args)
      return new Response(JSON.stringify({ summary }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch

    try {
      render(<DashboardPage summary={summary} userEmail="admin@example.com" />)

      await user.click(screen.getByRole('button', { name: 'Remove spend row 1' }))
      await user.click(screen.getByRole('button', { name: 'Save business inputs' }))

      const [, request] = fetchCalls[0] as Parameters<typeof fetch>
      const payload = JSON.parse(String(request?.body))

      expect(payload.adSpendEntries).toHaveLength(1)
      expect(payload.adSpendEntries[0]).toMatchObject({
        id: 'spend_facebook_retargeting_video_1',
        source: 'facebook',
      })
    } finally {
      global.fetch = originalFetch
    }
  })
})
