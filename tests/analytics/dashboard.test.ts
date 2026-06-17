import { describe, expect, it } from 'vitest'

import { buildDashboardSummary } from '@/lib/analytics/dashboardTransform'
import { buildDashboardFixture } from '@/tests/fixtures/dashboardData'

describe('buildDashboardSummary', () => {
  const fixture = buildDashboardFixture()
  const summary = buildDashboardSummary({
    visits: fixture.visits,
    funnelEvents: fixture.funnelEvents,
    quizResponses: fixture.quizResponses,
    userProfiles: fixture.userProfiles,
  })

  it('builds anonymous acquisition and repeat-quiz conversion tables', () => {
    expect(summary.anonymousConversion).toEqual([
      { step: 'landing_viewed', visits: 2, conversionRate: 1 },
      { step: 'start_clicked', visits: 2, conversionRate: 1 },
      { step: 'quiz_completed', visits: 1, conversionRate: 0.5 },
      { step: 'email_submitted', visits: 1, conversionRate: 0.5 },
      { step: 'magic_link_sent', visits: 1, conversionRate: 0.5 },
      { step: 'magic_link_verified', visits: 1, conversionRate: 0.5 },
      { step: 'result_viewed', visits: 1, conversionRate: 0.5 },
      { step: 'paywall_viewed', visits: 1, conversionRate: 0.5 },
      { step: 'paywall_cta_clicked', visits: 1, conversionRate: 0.5 },
    ])

    expect(summary.repeatQuizConversion).toEqual([
      { step: 'quiz_started', visits: 1, conversionRate: 1 },
      { step: 'quiz_completed', visits: 1, conversionRate: 1 },
      { step: 'result_viewed', visits: 1, conversionRate: 1 },
      { step: 'paywall_viewed', visits: 1, conversionRate: 1 },
    ])
  })

  it('aggregates source breakdown, registered-user attribution, and summary metrics', () => {
    expect(summary.summaryMetrics).toEqual([
      { label: 'Total visits', value: 3 },
      { label: 'Anonymous visits', value: 2 },
      { label: 'Authenticated visits', value: 1 },
      { label: 'Quiz completions', value: 2 },
      { label: 'Email submissions', value: 1 },
      { label: 'Magic links verified', value: 1 },
      { label: 'Registered users', value: 1 },
    ])

    expect(summary.sourceBreakdown).toEqual([
      {
        source: 'direct',
        visits: 1,
        quizCompletions: 0,
        emailSubmissions: 0,
        magicLinksSent: 0,
        magicLinksVerified: 0,
        paywallViews: 0,
        paywallClicks: 0,
        quizCompletionRate: 0,
        emailSubmissionRate: 0,
        magicLinkVerificationRate: 0,
        paywallClickRate: 0,
      },
      {
        source: 'facebook',
        visits: 1,
        quizCompletions: 1,
        emailSubmissions: 0,
        magicLinksSent: 0,
        magicLinksVerified: 0,
        paywallViews: 1,
        paywallClicks: 0,
        quizCompletionRate: 1,
        emailSubmissionRate: 0,
        magicLinkVerificationRate: 0,
        paywallClickRate: 0,
      },
      {
        source: 'google',
        visits: 1,
        quizCompletions: 1,
        emailSubmissions: 1,
        magicLinksSent: 1,
        magicLinksVerified: 1,
        paywallViews: 1,
        paywallClicks: 1,
        quizCompletionRate: 1,
        emailSubmissionRate: 1,
        magicLinkVerificationRate: 1,
        paywallClickRate: 1,
      },
    ])

    expect(summary.registeredUsers).toEqual([
      {
        email: 'user.google.repeat@example.com',
        firstTouchSource: 'google',
        firstTouchMedium: 'cpc',
        firstTouchCampaign: 'launch',
        lastTouchSource: 'facebook',
        lastTouchMedium: 'paid_social',
        lastTouchCampaign: 'retargeting',
        decisionPattern: 'explorer',
        firstAuthenticatedAt: '2026-06-02T09:01:00.000Z',
        lastSeenAt: '2026-06-02T09:01:00.000Z',
      },
    ])
  })

  it('builds decision-pattern and source-by-pattern intelligence without gender breakdowns', () => {
    expect(summary.patternBreakdown).toEqual([
      {
        decisionPattern: 'careful_planner',
        usersOrVisits: 2,
        emailSubmissionRate: 0.5,
        magicLinkVerificationRate: 0.5,
        paywallViewRate: 0.5,
        paywallClickRate: 0.5,
        topSource: 'direct',
      },
      {
        decisionPattern: 'explorer',
        usersOrVisits: 1,
        emailSubmissionRate: 0,
        magicLinkVerificationRate: 0,
        paywallViewRate: 1,
        paywallClickRate: 0,
        topSource: 'facebook',
      },
    ])

    expect(summary.sourceByPattern).toEqual([
      {
        source: 'direct',
        mostCommonDecisionPattern: 'careful_planner',
        mostCommonBlocker: 'fear_of_making_wrong_choice',
        highestConvertingPattern: 'careful_planner',
      },
      {
        source: 'facebook',
        mostCommonDecisionPattern: 'explorer',
        mostCommonBlocker: 'fear_of_making_wrong_choice',
        highestConvertingPattern: 'explorer',
      },
      {
        source: 'google',
        mostCommonDecisionPattern: 'careful_planner',
        mostCommonBlocker: 'too_many_options',
        highestConvertingPattern: 'careful_planner',
      },
    ])

    expect('gender' in summary.registeredUsers[0]).toBe(false)
  })
})
