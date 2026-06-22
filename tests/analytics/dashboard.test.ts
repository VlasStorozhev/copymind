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
    dashboardSettings: fixture.dashboardSettings,
    adSpendEntries: fixture.adSpendEntries,
  })

  it('builds business metrics and one end-to-end validation funnel', () => {
    expect(summary.businessMetrics).toEqual([
      { label: 'Ad Spend', value: '$150.00' },
      { label: 'Estimated Revenue', value: '$18.00', description: 'Paywall CTA clicks × $9.00' },
      { label: 'Estimated Profit', value: '-$132.00' },
      { label: 'ROAS', value: '0.12x' },
      { label: 'Intent CPA', value: '$75.00', description: 'Spend / paywall CTA clicks' },
      { label: 'Paywall CTA Clicks', value: '2', description: 'North Star for MVP validation' },
    ])

    expect(summary.funnelConversion).toEqual([
      {
        step: 'landing_viewed',
        users: 3,
        conversionFromPrevious: null,
        conversionFromLanding: 1,
        costPerUserCents: 5000,
      },
      {
        step: 'start_clicked',
        users: 3,
        conversionFromPrevious: 1,
        conversionFromLanding: 1,
        costPerUserCents: 5000,
      },
      {
        step: 'quiz_completed',
        users: 2,
        conversionFromPrevious: 2 / 3,
        conversionFromLanding: 2 / 3,
        costPerUserCents: 7500,
      },
      {
        step: 'email_submitted',
        users: 1,
        conversionFromPrevious: 0.5,
        conversionFromLanding: 1 / 3,
        costPerUserCents: 15000,
      },
      {
        step: 'magic_link_verified',
        users: 1,
        conversionFromPrevious: 1,
        conversionFromLanding: 1 / 3,
        costPerUserCents: 15000,
      },
      {
        step: 'result_viewed',
        users: 2,
        conversionFromPrevious: 2,
        conversionFromLanding: 2 / 3,
        costPerUserCents: 7500,
      },
      {
        step: 'paywall_viewed',
        users: 2,
        conversionFromPrevious: 1,
        conversionFromLanding: 2 / 3,
        costPerUserCents: 7500,
      },
      {
        step: 'paywall_cta_clicked',
        users: 2,
        conversionFromPrevious: 1,
        conversionFromLanding: 2 / 3,
        costPerUserCents: 7500,
      },
    ])
  })

  it('aggregates source breakdown, registered-user attribution, and summary metrics', () => {
    expect(summary.summaryMetrics).toEqual([
      { label: 'Total visits', value: 3 },
      { label: 'Anonymous visitors', value: 2 },
      { label: 'Quiz completed', value: 2 },
      { label: 'Emails submitted', value: 1 },
      { label: 'Registered users', value: 1 },
      { label: 'Repeat quiz users', value: 0 },
      { label: 'Buy intents', value: 2 },
    ])

    expect(summary.sourceBreakdown).toEqual([
      {
        source: 'direct',
        medium: null,
        campaign: null,
        content: null,
        spendCents: 0,
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
        medium: 'paid_social',
        campaign: 'retargeting',
        content: 'video-1',
        spendCents: 5000,
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
        medium: 'cpc',
        campaign: 'launch',
        content: 'hero-a',
        spendCents: 10000,
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
        firstTouchContent: 'hero-a',
        lastTouchSource: 'facebook',
        lastTouchMedium: 'paid_social',
        lastTouchCampaign: 'retargeting',
        lastTouchContent: 'video-1',
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

  it('deduplicates summary action metrics by authenticated user and counts repeat quiz users', () => {
    const summaryWithRepeatUser = buildDashboardSummary({
      visits: [
        ...fixture.visits,
        {
          ...fixture.visits[1],
          id: 'visit_facebook_repeat_second',
          visitor_id: 'visitor_facebook_return_second',
          content: 'video-1',
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
      quizResponses: [
        ...fixture.quizResponses,
        {
          ...fixture.quizResponses[1],
          id: 'quiz_facebook_return_second',
          visit_id: 'visit_facebook_repeat_second',
          created_at: '2026-06-02T10:00:40.000Z',
          updated_at: '2026-06-02T10:01:00.000Z',
          completed_at: '2026-06-02T10:01:00.000Z',
        },
      ],
      userProfiles: fixture.userProfiles,
      dashboardSettings: fixture.dashboardSettings,
      adSpendEntries: fixture.adSpendEntries,
    })

    expect(summaryWithRepeatUser.summaryMetrics).toEqual(
      expect.arrayContaining([
        { label: 'Total visits', value: 4 },
        { label: 'Quiz completed', value: 2 },
        { label: 'Repeat quiz users', value: 1 },
        { label: 'Buy intents', value: 2 },
      ]),
    )
  })

  it('builds traffic breakdowns by source, campaign, and creative', () => {
    expect(summary.trafficBreakdown).toEqual([
      {
        dimension: 'source',
        label: 'facebook',
        spendCents: 5000,
        landingUsers: 1,
        paywallClicks: 1,
        ctaRate: 1,
        costPerPaywallClickCents: 5000,
      },
      {
        dimension: 'source',
        label: 'google',
        spendCents: 10000,
        landingUsers: 1,
        paywallClicks: 1,
        ctaRate: 1,
        costPerPaywallClickCents: 10000,
      },
      {
        dimension: 'source',
        label: 'direct',
        spendCents: 0,
        landingUsers: 1,
        paywallClicks: 0,
        ctaRate: 0,
        costPerPaywallClickCents: null,
      },
      {
        dimension: 'campaign',
        label: 'launch',
        spendCents: 10000,
        landingUsers: 1,
        paywallClicks: 1,
        ctaRate: 1,
        costPerPaywallClickCents: 10000,
      },
      {
        dimension: 'campaign',
        label: 'retargeting',
        spendCents: 5000,
        landingUsers: 1,
        paywallClicks: 1,
        ctaRate: 1,
        costPerPaywallClickCents: 5000,
      },
      {
        dimension: 'campaign',
        label: 'direct',
        spendCents: 0,
        landingUsers: 1,
        paywallClicks: 0,
        ctaRate: 0,
        costPerPaywallClickCents: null,
      },
      {
        dimension: 'creative',
        label: 'hero-a',
        spendCents: 10000,
        landingUsers: 1,
        paywallClicks: 1,
        ctaRate: 1,
        costPerPaywallClickCents: 10000,
      },
      {
        dimension: 'creative',
        label: 'video-1',
        spendCents: 5000,
        landingUsers: 1,
        paywallClicks: 1,
        ctaRate: 1,
        costPerPaywallClickCents: 5000,
      },
      {
        dimension: 'creative',
        label: 'direct',
        spendCents: 0,
        landingUsers: 1,
        paywallClicks: 0,
        ctaRate: 0,
        costPerPaywallClickCents: null,
      },
    ])
  })
})
