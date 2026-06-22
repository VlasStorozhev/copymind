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
    emailLeads: fixture.emailLeads,
    dashboardSettings: fixture.dashboardSettings,
    adSpendEntries: fixture.adSpendEntries,
  })

  it('builds business metrics and one end-to-end validation funnel', () => {
    expect(summary.businessMetrics).toEqual([
      { label: 'Ad Spend', value: '$150.00' },
      { label: 'Intent Revenue', value: '$9.00', description: 'Purchase intent × $9.00' },
      { label: 'Intent Profit', value: '-$141.00' },
      { label: 'ROAS', value: '0.06x' },
      { label: 'Intent CPA', value: '$150.00', description: 'Spend / purchase intent' },
      { label: 'Purchase Intent', value: '1', description: 'Unique users who clicked the paywall CTA' },
      { label: 'Email Submitted', value: '1' },
      { label: 'Email Verified', value: '1' },
      { label: 'Verification Rate', value: '100%', description: 'Email verified / email submitted' },
    ])

    expect(summary.funnelConversion).toEqual([
      {
        step: 'Visitors',
        users: 2,
        conversionFromPrevious: null,
        conversionFromVisitors: 1,
        costPerUserCents: 7500,
      },
      {
        step: 'Quiz Started',
        users: 1,
        conversionFromPrevious: 0.5,
        conversionFromVisitors: 0.5,
        costPerUserCents: 15000,
      },
      {
        step: 'Quiz Completed',
        users: 2,
        conversionFromPrevious: 2,
        conversionFromVisitors: 1,
        costPerUserCents: 7500,
      },
      {
        step: 'Email Submitted',
        users: 1,
        conversionFromPrevious: 0.5,
        conversionFromVisitors: 0.5,
        costPerUserCents: 15000,
      },
      {
        step: 'Email Verified',
        users: 1,
        conversionFromPrevious: 1,
        conversionFromVisitors: 0.5,
        costPerUserCents: 15000,
      },
      {
        step: 'Result Viewed',
        users: 1,
        conversionFromPrevious: 1,
        conversionFromVisitors: 0.5,
        costPerUserCents: 15000,
      },
      {
        step: 'Purchase Intent',
        users: 1,
        conversionFromPrevious: 1,
        conversionFromVisitors: 0.5,
        costPerUserCents: 15000,
      },
    ])
  })

  it('counts direct quiz traffic as visitors and excludes utility pages from the acquisition funnel', () => {
    const summaryWithDirectQuizAndUtilityPage = buildDashboardSummary({
      visits: [
        ...fixture.visits,
        {
          id: 'visit_tiktok_quiz_direct',
          visitor_id: 'visitor_tiktok_quiz_direct',
          user_id: null,
          source: 'tiktok',
          medium: 'paid_social',
          campaign: 'validation',
          content: 'ugc-1',
          landing_url:
            'https://decisionmind.example/quiz?utm_source=tiktok&utm_medium=paid_social&utm_campaign=validation&utm_content=ugc-1',
          referrer: 'https://www.tiktok.com/',
          created_at: '2026-06-04T09:00:00.000Z',
          updated_at: '2026-06-04T09:00:00.000Z',
        },
        {
          id: 'visit_blog_reader',
          visitor_id: 'visitor_blog_reader',
          user_id: null,
          source: 'linkedin',
          medium: 'organic_social',
          campaign: 'founder-post',
          content: 'blog-link',
          landing_url:
            'https://decisionmind.example/blog/decision-fatigue?utm_source=linkedin&utm_medium=organic_social&utm_campaign=founder-post&utm_content=blog-link',
          referrer: 'https://www.linkedin.com/',
          created_at: '2026-06-05T09:00:00.000Z',
          updated_at: '2026-06-05T09:00:00.000Z',
        },
      ],
      funnelEvents: [
        ...fixture.funnelEvents,
        {
          id: 'event_tiktok_quiz_started',
          visit_id: 'visit_tiktok_quiz_direct',
          event_type: 'quiz_started',
          user_id: null,
          step: 'quiz',
          metadata: {},
          created_at: '2026-06-04T09:00:05.000Z',
        },
        {
          id: 'event_tiktok_quiz_completed',
          visit_id: 'visit_tiktok_quiz_direct',
          event_type: 'quiz_completed',
          user_id: null,
          step: 'quiz',
          metadata: {},
          created_at: '2026-06-04T09:01:00.000Z',
        },
        {
          id: 'event_tiktok_email_submitted',
          visit_id: 'visit_tiktok_quiz_direct',
          event_type: 'email_submitted',
          user_id: null,
          step: 'email',
          metadata: {},
          created_at: '2026-06-04T09:01:10.000Z',
        },
        {
          id: 'event_tiktok_result_viewed',
          visit_id: 'visit_tiktok_quiz_direct',
          event_type: 'result_viewed',
          user_id: null,
          step: 'result',
          metadata: {},
          created_at: '2026-06-04T09:02:00.000Z',
        },
        {
          id: 'event_tiktok_paywall_clicked',
          visit_id: 'visit_tiktok_quiz_direct',
          event_type: 'paywall_cta_clicked',
          user_id: null,
          step: 'paywall',
          metadata: {},
          created_at: '2026-06-04T09:02:15.000Z',
        },
        {
          id: 'event_blog_landing',
          visit_id: 'visit_blog_reader',
          event_type: 'landing_viewed',
          user_id: null,
          step: 'landing',
          metadata: {},
          created_at: '2026-06-05T09:00:05.000Z',
        },
      ],
      quizResponses: [
        ...fixture.quizResponses,
        {
          ...fixture.quizResponses[0],
          id: 'quiz_tiktok_quiz_direct',
          visitor_id: 'visitor_tiktok_quiz_direct',
          user_id: null,
          visit_id: 'visit_tiktok_quiz_direct',
          created_at: '2026-06-04T09:00:40.000Z',
          updated_at: '2026-06-04T09:01:00.000Z',
          completed_at: '2026-06-04T09:01:00.000Z',
        },
      ],
      userProfiles: fixture.userProfiles,
      emailLeads: [
        ...fixture.emailLeads,
        {
          id: 'lead_tiktok_quiz_direct',
          email: 'tiktok.direct@example.com',
          status: 'pending_verification',
          visitor_id: 'visitor_tiktok_quiz_direct',
          visit_id: 'visit_tiktok_quiz_direct',
          first_submitted_at: '2026-06-04T09:01:10.000Z',
          last_submitted_at: '2026-06-04T09:01:10.000Z',
        },
      ],
      dashboardSettings: fixture.dashboardSettings,
      adSpendEntries: fixture.adSpendEntries,
    })

    expect(summaryWithDirectQuizAndUtilityPage.funnelConversion.map((row) => [row.step, row.users])).toEqual([
      ['Visitors', 3],
      ['Quiz Started', 2],
      ['Quiz Completed', 3],
      ['Email Submitted', 2],
      ['Email Verified', 1],
      ['Result Viewed', 2],
      ['Purchase Intent', 2],
    ])

    expect(summaryWithDirectQuizAndUtilityPage.trafficTree.find((node) => node.label === 'tiktok')).toMatchObject({
      visitors: 1,
      quizStarted: 1,
      quizCompleted: 1,
      emailSubmitted: 1,
      purchaseIntent: 1,
      intentRate: 1,
    })

    expect(summaryWithDirectQuizAndUtilityPage.trafficTree.find((node) => node.label === 'linkedin')).toMatchObject({
      visitors: 0,
      purchaseIntent: 0,
      intentRate: null,
    })
  })

  it('aggregates source breakdown, registered-user attribution, and summary metrics', () => {
    expect(summary.summaryMetrics).toEqual([
      { label: 'Total visits', value: 3 },
      { label: 'Anonymous visitors', value: 2 },
      { label: 'Quiz completed', value: 2 },
      { label: 'Emails submitted', value: 1 },
      { label: 'Registered users', value: 1 },
      { label: 'Repeat quiz users', value: 0 },
      { label: 'Buy intents', value: 1 },
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
      emailLeads: fixture.emailLeads,
      authAttempts: fixture.authAttempts,
      dashboardSettings: fixture.dashboardSettings,
      adSpendEntries: fixture.adSpendEntries,
    })

    expect(summaryWithRepeatUser.summaryMetrics).toEqual(
      expect.arrayContaining([
        { label: 'Total visits', value: 4 },
        { label: 'Quiz completed', value: 2 },
        { label: 'Repeat quiz users', value: 1 },
        { label: 'Buy intents', value: 1 },
      ]),
    )
    expect(summaryWithRepeatUser.businessMetrics).toEqual(
      expect.arrayContaining([
        { label: 'Intent Revenue', value: '$9.00', description: 'Purchase intent × $9.00' },
        { label: 'Intent CPA', value: '$150.00', description: 'Spend / purchase intent' },
        { label: 'Purchase Intent', value: '1', description: 'Unique users who clicked the paywall CTA' },
      ]),
    )
  })

  it('builds a hierarchical traffic tree by source, campaign, and creative', () => {
    expect(summary.trafficTree).toEqual([
      {
        id: 'source:facebook',
        level: 'source',
        label: 'facebook',
        spendCents: 5000,
        visitors: 1,
        quizStarted: 1,
        quizCompleted: 1,
        emailSubmitted: 0,
        purchaseIntent: 1,
        intentRate: 1,
        costPerIntentCents: 5000,
        children: [
          {
            id: 'source:facebook/campaign:retargeting',
            level: 'campaign',
            label: 'retargeting',
            spendCents: 5000,
            visitors: 1,
            quizStarted: 1,
            quizCompleted: 1,
            emailSubmitted: 0,
            purchaseIntent: 1,
            intentRate: 1,
            costPerIntentCents: 5000,
            children: [
              {
                id: 'source:facebook/campaign:retargeting/creative:video-1',
                level: 'creative',
                label: 'video-1',
                spendCents: 5000,
                visitors: 1,
                quizStarted: 1,
                quizCompleted: 1,
                emailSubmitted: 0,
                purchaseIntent: 1,
                intentRate: 1,
                costPerIntentCents: 5000,
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'source:google',
        level: 'source',
        label: 'google',
        spendCents: 10000,
        visitors: 1,
        quizStarted: 1,
        quizCompleted: 1,
        emailSubmitted: 1,
        purchaseIntent: 1,
        intentRate: 1,
        costPerIntentCents: 10000,
        children: [
          {
            id: 'source:google/campaign:launch',
            level: 'campaign',
            label: 'launch',
            spendCents: 10000,
            visitors: 1,
            quizStarted: 1,
            quizCompleted: 1,
            emailSubmitted: 1,
            purchaseIntent: 1,
            intentRate: 1,
            costPerIntentCents: 10000,
            children: [
              {
                id: 'source:google/campaign:launch/creative:hero-a',
                level: 'creative',
                label: 'hero-a',
                spendCents: 10000,
                visitors: 1,
                quizStarted: 1,
                quizCompleted: 1,
                emailSubmitted: 1,
                purchaseIntent: 1,
                intentRate: 1,
                costPerIntentCents: 10000,
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'source:direct',
        level: 'source',
        label: 'direct',
        spendCents: 0,
        visitors: 1,
        quizStarted: 0,
        quizCompleted: 1,
        emailSubmitted: 0,
        purchaseIntent: 0,
        intentRate: 0,
        costPerIntentCents: null,
        children: [
          {
            id: 'source:direct/campaign:direct',
            level: 'campaign',
            label: 'direct',
            spendCents: 0,
            visitors: 1,
            quizStarted: 0,
            quizCompleted: 1,
            emailSubmitted: 0,
            purchaseIntent: 0,
            intentRate: 0,
            costPerIntentCents: null,
            children: [
              {
                id: 'source:direct/campaign:direct/creative:direct',
                level: 'creative',
                label: 'direct',
                spendCents: 0,
                visitors: 1,
                quizStarted: 0,
                quizCompleted: 1,
                emailSubmitted: 0,
                purchaseIntent: 0,
                intentRate: 0,
                costPerIntentCents: null,
                children: [],
              },
            ],
          },
        ],
      },
    ])
  })
})
