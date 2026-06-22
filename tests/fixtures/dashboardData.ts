export type DashboardFixture = {
  visits: Array<{
    id: string
    visitor_id: string
    user_id: string | null
    source: string
    medium: string | null
    campaign: string | null
    content: string | null
    landing_url: string | null
    referrer: string | null
    created_at: string
    updated_at: string
  }>
  funnelEvents: Array<{
    id: string
    visit_id: string
    event_type: string
    user_id: string | null
    step: string | null
    metadata: Record<string, unknown>
    created_at: string
  }>
  quizResponses: Array<{
    id: string
    visitor_id: string
    user_id: string | null
    visit_id: string
    answers: unknown[]
    gender: string | null
    current_decision: string | null
    decision_context: string | null
    decision_pattern: string | null
    primary_blocker: string | null
    emotional_driver: string | null
    support_preference: string | null
    recommended_starting_point: string | null
    confidence: string | null
    created_at: string
    updated_at: string
    completed_at: string | null
  }>
  userProfiles: Array<{
    id: string
    user_id: string
    email: string
    email_verified_at: string | null
    first_authenticated_at: string
    first_touch_source: string | null
    first_touch_medium: string | null
    first_touch_campaign: string | null
    first_touch_content: string | null
    last_seen_at: string
    last_touch_source: string | null
    last_touch_medium: string | null
    last_touch_campaign: string | null
    last_touch_content: string | null
    product_interested_at: string | null
    product_interest_source: string | null
    created_at: string
    updated_at: string
  }>
  emailLeads: Array<{
    id: string
    email: string
    status: string
    visitor_id: string | null
    visit_id: string | null
    first_submitted_at: string
    last_submitted_at: string
  }>
  dashboardSettings: {
    product_price_cents: number
    currency: string
  } | null
  adSpendEntries: Array<{
    id: string
    source: string
    medium: string | null
    campaign: string | null
    content: string | null
    spend_cents: number
    currency: string
    created_at: string
    updated_at: string
  }>
  adminUsers: Array<{
    id: string
    user_id: string | null
    email: string
    role: string
    is_active: boolean
    created_at: string
    updated_at: string
  }>
  authUsers: Array<{
    id: string
    email: string
    password: string
  }>
}

export function buildDashboardFixture(): DashboardFixture {
  const now = '2026-06-01T09:00:00.000Z'

  return {
    visits: [
      {
        id: 'visit_google_first',
        visitor_id: 'visitor_google_first',
        user_id: null,
        source: 'google',
        medium: 'cpc',
        campaign: 'launch',
        content: 'hero-a',
        landing_url: 'https://decisionmind.example/?utm_source=google&utm_medium=cpc&utm_campaign=launch&utm_content=hero-a',
        referrer: 'https://www.google.com/',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'visit_facebook_return',
        visitor_id: 'visitor_facebook_return',
        user_id: 'user_google_repeat',
        source: 'facebook',
        medium: 'paid_social',
        campaign: 'retargeting',
        content: 'video-1',
        landing_url:
          'https://decisionmind.example/?utm_source=facebook&utm_medium=paid_social&utm_campaign=retargeting&utm_content=video-1',
        referrer: 'https://www.facebook.com/',
        created_at: '2026-06-02T09:00:00.000Z',
        updated_at: '2026-06-02T09:00:00.000Z',
      },
      {
        id: 'visit_direct_drop',
        visitor_id: 'visitor_direct_drop',
        user_id: null,
        source: 'direct',
        medium: null,
        campaign: null,
        content: null,
        landing_url: 'https://decisionmind.example/',
        referrer: '',
        created_at: '2026-06-03T09:00:00.000Z',
        updated_at: '2026-06-03T09:00:00.000Z',
      },
    ],
    funnelEvents: [
      {
        id: 'event_google_landing',
        visit_id: 'visit_google_first',
        event_type: 'landing_viewed',
        user_id: null,
        step: 'landing',
        metadata: {},
        created_at: '2026-06-01T09:00:05.000Z',
      },
      {
        id: 'event_google_start',
        visit_id: 'visit_google_first',
        event_type: 'start_clicked',
        user_id: null,
        step: 'start',
        metadata: {},
        created_at: '2026-06-01T09:00:10.000Z',
      },
      {
        id: 'event_google_quiz_started',
        visit_id: 'visit_google_first',
        event_type: 'quiz_started',
        user_id: null,
        step: 'quiz',
        metadata: {},
        created_at: '2026-06-01T09:00:20.000Z',
      },
      {
        id: 'event_google_quiz_completed',
        visit_id: 'visit_google_first',
        event_type: 'quiz_completed',
        user_id: null,
        step: 'quiz',
        metadata: {},
        created_at: '2026-06-01T09:01:00.000Z',
      },
      {
        id: 'event_google_email_submitted',
        visit_id: 'visit_google_first',
        event_type: 'email_submitted',
        user_id: null,
        step: 'email',
        metadata: {},
        created_at: '2026-06-01T09:01:10.000Z',
      },
      {
        id: 'event_google_magic_link_sent',
        visit_id: 'visit_google_first',
        event_type: 'magic_link_sent',
        user_id: null,
        step: 'auth',
        metadata: {},
        created_at: '2026-06-01T09:01:15.000Z',
      },
      {
        id: 'event_google_magic_link_verified',
        visit_id: 'visit_google_first',
        event_type: 'magic_link_verified',
        user_id: null,
        step: 'auth',
        metadata: {},
        created_at: '2026-06-01T09:03:00.000Z',
      },
      {
        id: 'event_google_result_viewed',
        visit_id: 'visit_google_first',
        event_type: 'result_viewed',
        user_id: null,
        step: 'result',
        metadata: {},
        created_at: '2026-06-01T09:03:05.000Z',
      },
      {
        id: 'event_google_paywall_viewed',
        visit_id: 'visit_google_first',
        event_type: 'paywall_viewed',
        user_id: null,
        step: 'paywall',
        metadata: {},
        created_at: '2026-06-01T09:03:10.000Z',
      },
      {
        id: 'event_google_paywall_clicked',
        visit_id: 'visit_google_first',
        event_type: 'paywall_cta_clicked',
        user_id: null,
        step: 'paywall',
        metadata: {},
        created_at: '2026-06-01T09:03:15.000Z',
      },
      {
        id: 'event_facebook_landing',
        visit_id: 'visit_facebook_return',
        event_type: 'landing_viewed',
        user_id: 'user_google_repeat',
        step: 'landing',
        metadata: {},
        created_at: '2026-06-02T09:00:05.000Z',
      },
      {
        id: 'event_facebook_start',
        visit_id: 'visit_facebook_return',
        event_type: 'start_clicked',
        user_id: 'user_google_repeat',
        step: 'start',
        metadata: {},
        created_at: '2026-06-02T09:00:10.000Z',
      },
      {
        id: 'event_facebook_quiz_started',
        visit_id: 'visit_facebook_return',
        event_type: 'quiz_started',
        user_id: 'user_google_repeat',
        step: 'quiz',
        metadata: {},
        created_at: '2026-06-02T09:00:20.000Z',
      },
      {
        id: 'event_facebook_quiz_completed',
        visit_id: 'visit_facebook_return',
        event_type: 'quiz_completed',
        user_id: 'user_google_repeat',
        step: 'quiz',
        metadata: {},
        created_at: '2026-06-02T09:01:00.000Z',
      },
      {
        id: 'event_facebook_result_viewed',
        visit_id: 'visit_facebook_return',
        event_type: 'result_viewed',
        user_id: 'user_google_repeat',
        step: 'result',
        metadata: {},
        created_at: '2026-06-02T09:01:05.000Z',
      },
      {
        id: 'event_facebook_paywall_viewed',
        visit_id: 'visit_facebook_return',
        event_type: 'paywall_viewed',
        user_id: 'user_google_repeat',
        step: 'paywall',
        metadata: {},
        created_at: '2026-06-02T09:01:10.000Z',
      },
      {
        id: 'event_facebook_paywall_clicked',
        visit_id: 'visit_facebook_return',
        event_type: 'paywall_cta_clicked',
        user_id: 'user_google_repeat',
        step: 'paywall',
        metadata: {},
        created_at: '2026-06-02T09:01:15.000Z',
      },
      {
        id: 'event_direct_landing',
        visit_id: 'visit_direct_drop',
        event_type: 'landing_viewed',
        user_id: null,
        step: 'landing',
        metadata: {},
        created_at: '2026-06-03T09:00:05.000Z',
      },
      {
        id: 'event_direct_start',
        visit_id: 'visit_direct_drop',
        event_type: 'start_clicked',
        user_id: null,
        step: 'start',
        metadata: {},
        created_at: '2026-06-03T09:00:10.000Z',
      },
    ],
    quizResponses: [
      {
        id: 'quiz_google_first',
        visitor_id: 'visitor_google_first',
        user_id: null,
        visit_id: 'visit_google_first',
        answers: [],
        gender: null,
        current_decision: 'launching the product',
        decision_context: 'marketing funnel',
        decision_pattern: 'careful_planner',
        primary_blocker: 'too_many_options',
        emotional_driver: 'clarity',
        support_preference: 'structured',
        recommended_starting_point: 'map priorities',
        confidence: 'high',
        created_at: '2026-06-01T09:00:45.000Z',
        updated_at: '2026-06-01T09:01:00.000Z',
        completed_at: '2026-06-01T09:01:00.000Z',
      },
      {
        id: 'quiz_facebook_return',
        visitor_id: 'visitor_facebook_return',
        user_id: 'user_google_repeat',
        visit_id: 'visit_facebook_return',
        answers: [],
        gender: null,
        current_decision: 'retargeting the audience',
        decision_context: 'returning user',
        decision_pattern: 'explorer',
        primary_blocker: 'fear_of_making_wrong_choice',
        emotional_driver: 'momentum',
        support_preference: 'lightweight',
        recommended_starting_point: 'pick a lane',
        confidence: 'low',
        created_at: '2026-06-02T09:00:40.000Z',
        updated_at: '2026-06-02T09:01:00.000Z',
        completed_at: '2026-06-02T09:01:00.000Z',
      },
      {
        id: 'quiz_direct_drop',
        visitor_id: 'visitor_direct_drop',
        user_id: null,
        visit_id: 'visit_direct_drop',
        answers: [],
        gender: null,
        current_decision: 'getting started',
        decision_context: 'direct traffic',
        decision_pattern: 'careful_planner',
        primary_blocker: 'fear_of_making_wrong_choice',
        emotional_driver: 'confidence',
        support_preference: 'structured',
        recommended_starting_point: 'reduce the options',
        confidence: 'low',
        created_at: '2026-06-03T09:00:25.000Z',
        updated_at: '2026-06-03T09:00:30.000Z',
        completed_at: '2026-06-03T09:00:30.000Z',
      },
    ],
    userProfiles: [
      {
        id: 'profile_google_repeat',
        user_id: 'user_google_repeat',
        email: 'user.google.repeat@example.com',
        email_verified_at: '2026-06-02T09:01:00.000Z',
        first_authenticated_at: '2026-06-02T09:01:00.000Z',
        first_touch_source: 'google',
        first_touch_medium: 'cpc',
        first_touch_campaign: 'launch',
        first_touch_content: 'hero-a',
        last_seen_at: '2026-06-02T09:01:00.000Z',
        last_touch_source: 'facebook',
        last_touch_medium: 'paid_social',
        last_touch_campaign: 'retargeting',
        last_touch_content: 'video-1',
        product_interested_at: '2026-06-02T09:01:15.000Z',
        product_interest_source: 'mock_paywall_buy',
        created_at: '2026-06-02T09:01:00.000Z',
        updated_at: '2026-06-02T09:01:00.000Z',
      },
    ],
    emailLeads: [
      {
        id: 'lead_google_first',
        email: 'user.google.repeat@example.com',
        status: 'verified',
        visitor_id: 'visitor_google_first',
        visit_id: 'visit_google_first',
        first_submitted_at: '2026-06-01T09:01:10.000Z',
        last_submitted_at: '2026-06-01T09:01:10.000Z',
      },
    ],
    dashboardSettings: {
      product_price_cents: 900,
      currency: 'USD',
    },
    adSpendEntries: [
      {
        id: 'spend_google_launch_hero_a',
        source: 'google',
        medium: 'cpc',
        campaign: 'launch',
        content: 'hero-a',
        spend_cents: 10000,
        currency: 'USD',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'spend_facebook_retargeting_video_1',
        source: 'facebook',
        medium: 'paid_social',
        campaign: 'retargeting',
        content: 'video-1',
        spend_cents: 5000,
        currency: 'USD',
        created_at: now,
        updated_at: now,
      },
    ],
    adminUsers: [
      {
        id: 'admin_user_row',
        user_id: 'user_admin_e2e',
        email: 'admin-e2e@example.com',
        role: 'admin',
        is_active: true,
        created_at: '2026-06-01T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
      },
      {
        id: 'regular_user_row',
        user_id: 'user_regular_e2e',
        email: 'regular-e2e@example.com',
        role: 'admin',
        is_active: false,
        created_at: '2026-06-01T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
      },
    ],
    authUsers: [
      {
        id: 'user_admin_e2e',
        email: 'admin-e2e@example.com',
        password: 'admin-e2e-password',
      },
      {
        id: 'user_regular_e2e',
        email: 'regular-e2e@example.com',
        password: 'regular-e2e-password',
      },
    ],
  }
}
