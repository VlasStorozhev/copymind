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

  it('builds anonymous acquisition and authenticated product conversion tables', () => {
    expect(summary.anonymousConversion).toEqual([
      { step: 'landing_viewed', visits: 2, conversionRate: 1 },
      { step: 'start_clicked', visits: 2, conversionRate: 1 },
      { step: 'quiz_completed', visits: 1, conversionRate: 0.5 },
      { step: 'email_submitted', visits: 1, conversionRate: 0.5 },
      { step: 'magic_link_sent', visits: 1, conversionRate: 0.5 },
    ])

    expect(summary.authenticatedProductConversion).toEqual([
      { step: 'result_viewed', visits: 1, conversionRate: 1 },
      { step: 'paywall_viewed', visits: 1, conversionRate: 1 },
      { step: 'paywall_cta_clicked', visits: 1, conversionRate: 1 },
    ])
  })

  it('aggregates source breakdown, registered-user attribution, and summary metrics', () => {
    expect(summary.summaryMetrics).toEqual([
      { label: 'Total visits', value: 3 },
      { label: 'Anonymous visitors', value: 2 },
      { label: 'Authenticated users', value: 1 },
      { label: 'Quiz completers', value: 2 },
      { label: 'Email submitters', value: 1 },
      { label: 'Verified magic-link users', value: 1 },
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
        paywallClicks: 1,
        quizCompletionRate: 1,
        emailSubmissionRate: 0,
        magicLinkVerificationRate: 0,
        paywallClickRate: 1,
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
        productInterest: 'Interested',
        productInterestedAt: '2026-06-02T09:01:15.000Z',
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
        paywallClickRate: 1,
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

  it('deduplicates summary action metrics by authenticated user', () => {
    const summaryWithRepeatUser = buildDashboardSummary({
      visits: [
        ...fixture.visits,
        {
          ...fixture.visits[1],
          id: 'visit_facebook_repeat_second',
          visitor_id: 'visitor_facebook_return_second',
        },
      ],
      funnelEvents: [
        ...fixture.funnelEvents,
        {
          id: 'event_facebook_second_quiz_completed',
          visit_id: 'visit_facebook_repeat_second',
          event_type: 'quiz_completed',
          user_id: 'user_google_repeat',
          step: 'quiz',
          metadata: {},
          created_at: '2026-06-02T10:01:00.000Z',
        },
        {
          id: 'event_facebook_second_paywall_clicked',
          visit_id: 'visit_facebook_repeat_second',
          event_type: 'paywall_cta_clicked',
          user_id: 'user_google_repeat',
          step: 'paywall',
          metadata: {},
          created_at: '2026-06-02T10:01:15.000Z',
        },
      ],
      quizResponses: fixture.quizResponses,
      userProfiles: fixture.userProfiles,
    })

    expect(summaryWithRepeatUser.summaryMetrics).toEqual(
      expect.arrayContaining([
        { label: 'Total visits', value: 4 },
        { label: 'Authenticated users', value: 1 },
        { label: 'Quiz completers', value: 2 },
      ]),
    )
  })
})
