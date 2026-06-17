import 'server-only'

import { createClient as createAdminClient } from '@/lib/supabase/admin'

import { buildDashboardSummary, type DashboardSummary } from '@/lib/analytics/dashboardTransform'

type VisitRow = {
  id: string
  visitor_id: string
  user_id: string | null
  source: string
  medium: string | null
  campaign: string | null
  landing_url: string | null
  referrer: string | null
  created_at: string
  updated_at: string
}

type FunnelEventRow = {
  id: string
  visit_id: string
  event_type: string
  user_id: string | null
  step: string | null
  metadata: Record<string, unknown>
  created_at: string
}

type QuizResponseRow = {
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
}

type UserProfileRow = {
  id: string
  user_id: string
  email: string
  email_verified_at: string | null
  first_authenticated_at: string
  first_touch_source: string | null
  first_touch_medium: string | null
  first_touch_campaign: string | null
  last_seen_at: string
  last_touch_source: string | null
  last_touch_medium: string | null
  last_touch_campaign: string | null
  created_at: string
  updated_at: string
}

export type DashboardRows = {
  visits: VisitRow[]
  funnelEvents: FunnelEventRow[]
  quizResponses: QuizResponseRow[]
  userProfiles: UserProfileRow[]
}

export async function loadDashboardRows(): Promise<DashboardRows> {
  const client = createAdminClient()

  const [visitsResult, funnelEventsResult, quizResponsesResult, userProfilesResult] = await Promise.all([
    client
      .from('visits')
      .select('id, visitor_id, user_id, source, medium, campaign, landing_url, referrer, created_at, updated_at'),
    client
      .from('funnel_events')
      .select('id, visit_id, event_type, user_id, step, metadata, created_at'),
    client
      .from('quiz_responses')
      .select(
        'id, visitor_id, user_id, visit_id, answers, gender, current_decision, decision_context, decision_pattern, primary_blocker, emotional_driver, support_preference, recommended_starting_point, confidence, created_at, updated_at, completed_at',
      ),
    client
      .from('user_profiles')
      .select(
        'id, user_id, email, email_verified_at, first_authenticated_at, first_touch_source, first_touch_medium, first_touch_campaign, last_seen_at, last_touch_source, last_touch_medium, last_touch_campaign, created_at, updated_at',
      ),
  ])

  return {
    visits: (visitsResult.data ?? []) as VisitRow[],
    funnelEvents: (funnelEventsResult.data ?? []) as FunnelEventRow[],
    quizResponses: (quizResponsesResult.data ?? []) as QuizResponseRow[],
    userProfiles: (userProfilesResult.data ?? []) as UserProfileRow[],
  }
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const rows = await loadDashboardRows()
  return buildDashboardSummary(rows)
}
