import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppShell } from '@/components/app/app-shell'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DecisionProfile } from '@/components/funnel/DecisionProfile'
import { EmailPageShell } from '@/components/funnel/email-page-shell'
import { LandingShell } from '@/components/funnel/landing-shell'
import { LoginPageShell } from '@/components/funnel/login-page-shell'
import { MockPaywall } from '@/components/funnel/MockPaywall'
import { QuizPageShell } from '@/components/funnel/quiz-page-shell'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

function deferFetch() {
  return vi.fn(() => new Promise<Response>(() => undefined))
}

describe('instant navigation shells', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the landing hero immediately before session state resolves', () => {
    vi.stubGlobal('fetch', deferFetch())

    render(<LandingShell />)

    expect(screen.getByRole('heading', { name: 'Discover your decision pattern' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /already have a profile/i })).toBeInTheDocument()
  })

  it('puts the landing image before the copy on mobile viewports', () => {
    vi.stubGlobal('fetch', deferFetch())

    render(<LandingShell />)

    expect(screen.getByTestId('landing-hero-visual')).toHaveClass('order-first')
    expect(screen.getByTestId('landing-hero-visual')).toHaveClass('lg:order-none')
  })

  it('renders the quiz immediately before session state resolves', () => {
    vi.stubGlobal('fetch', deferFetch())

    render(<QuizPageShell />)

    expect(screen.queryByText('Decision profile assessment')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'How do you identify?' })).toBeInTheDocument()
  })

  it('advances quiz questions immediately after selecting an answer', async () => {
    vi.stubGlobal('fetch', deferFetch())

    render(<QuizPageShell />)

    await userEvent.click(screen.getByRole('radio', { name: /Woman/ }))

    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'How do you identify?' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'What kind of decisions do you get stuck on most often?' }),
    ).toBeInTheDocument()
  })

  it('uses the quiz card vertical offset on the email capture form', () => {
    vi.stubGlobal('fetch', deferFetch())

    render(<EmailPageShell quizResponseId="quiz-response-1" authError={null} />)

    expect(screen.getByTestId('auth-start-form')).toHaveClass('mb-24')
    expect(screen.getByTestId('auth-start-form')).toHaveClass('sm:mb-[356px]')
  })

  it('renders the app shell immediately before profile data resolves', () => {
    vi.stubGlobal('fetch', deferFetch())

    render(<AppShell />)

    expect(screen.getByRole('link', { name: 'Decisionmind' })).toBeInTheDocument()
    expect(screen.getByText('Loading your decision profile')).toBeInTheDocument()
  })

  it('renders the dashboard navigation as a quiet text link in the app shell', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              profile: null,
              is_admin: true,
              user_email: 'admin@example.com',
            }),
          ),
        ),
      ),
    )

    render(<AppShell />)

    const dashboardLink = await screen.findByRole('link', { name: 'Dashboard' })
    expect(dashboardLink).toHaveClass('text-sm')
    expect(dashboardLink).not.toHaveClass('bg-background')
  })

  it('renders the dashboard shell immediately before analytics data resolves', () => {
    vi.stubGlobal('fetch', deferFetch())

    render(<DashboardShell />)

    expect(screen.getByRole('heading', { name: 'Admin dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Loading dashboard metrics')).toBeInTheDocument()
  })

  it('does not render an extra login page badge above the form card', () => {
    vi.stubGlobal('fetch', deferFetch())

    render(<LoginPageShell authError={null} />)

    expect(screen.getByRole('heading', { name: 'Open your decision profile' })).toBeInTheDocument()
    expect(screen.queryByText('Sign in', { selector: 'span[data-slot="badge"]' })).not.toBeInTheDocument()
  })

  it('does not duplicate the decision pattern as a profile badge', () => {
    render(
      <DecisionProfile
        profile={{
          gender: 'prefer_not_to_say',
          confidence: 'high',
          decision_pattern: 'overthinking_delayer',
          primary_blocker: 'fear_wrong_choice',
          emotional_driver: 'Wanting certainty before acting',
          support_preference: 'clear_framework',
          recommended_starting_point: 'Decision clarity check-in',
        }}
      />,
    )

    expect(screen.queryByText('Overthinking Delayer', { selector: 'span[data-slot="badge"]' })).not.toBeInTheDocument()
    expect(screen.getByText('Overthinking Delayer', { selector: 'dd' })).toBeInTheDocument()
  })

  it('does not duplicate confidence as a profile badge', () => {
    render(
      <DecisionProfile
        profile={{
          gender: 'prefer_not_to_say',
          confidence: 'high',
          decision_pattern: 'overthinking_delayer',
          primary_blocker: 'fear_wrong_choice',
          emotional_driver: 'Wanting certainty before acting',
          support_preference: 'clear_framework',
          recommended_starting_point: 'Decision clarity check-in',
        }}
      />,
    )

    expect(screen.queryByText('high confidence', { selector: 'span[data-slot="badge"]' })).not.toBeInTheDocument()
    expect(screen.getByText('High', { selector: 'dd' })).toBeInTheDocument()
  })

  it('capitalizes humanized profile field values', () => {
    render(
      <DecisionProfile
        profile={{
          gender: 'prefer_not_to_say',
          confidence: 'high',
          decision_pattern: 'overthinking_delayer',
          primary_blocker: 'fear_wrong_choice',
          emotional_driver: 'wanting_certainty_before_acting',
          support_preference: 'clear_framework',
          recommended_starting_point: 'decision_clarity_check_in',
        }}
      />,
    )

    expect(screen.getByText('Fear wrong choice', { selector: 'dd' })).toBeInTheDocument()
    expect(screen.getByText('Wanting certainty before acting', { selector: 'dd' })).toBeInTheDocument()
    expect(screen.getByText('High', { selector: 'dd' })).toBeInTheDocument()
  })

  it('shows checkout feedback when the paywall buy button is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ ok: true })))))

    render(<MockPaywall />)

    await userEvent.click(screen.getByRole('button', { name: 'Buy' }))

    expect(screen.queryByRole('button', { name: 'Buy' })).not.toBeInTheDocument()
    expect(screen.getByText('Checkout is not connected yet')).toBeInTheDocument()
    expect(screen.getByText('We recorded your interest and will connect you.')).toBeInTheDocument()
  })

  it('shows the paywall price once in a clean commerce column with a prominent right CTA', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ ok: true })))))

    render(<MockPaywall />)

    expect(screen.getAllByText('$9')).toHaveLength(1)
    expect(screen.getByText('/ month')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buy' })).toBeInTheDocument()
    expect(screen.getByTestId('paywall-card')).toHaveClass('lg:grid-cols-[minmax(0,0.58fr)_minmax(320px,0.42fr)]')
    expect(screen.getByTestId('paywall-copy-column')).not.toHaveClass('lg:max-w-[50%]')
    expect(screen.getByText(/structured prompts/i)).toBeInTheDocument()
    expect(screen.queryByText('Next-decision prompts')).not.toBeInTheDocument()
    expect(screen.getByTestId('paywall-price')).not.toHaveClass('border')
    expect(screen.getByTestId('paywall-price')).not.toHaveClass('bg-background/90')
    expect(screen.getByTestId('paywall-action-row')).toHaveClass('sm:justify-end')
  })
})
