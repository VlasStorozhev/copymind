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
  content: string | null
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
}

type DashboardSettingsRow = {
  id: string
  product_price_cents: number
  currency: string
  created_at: string
  updated_at: string
}

type AdSpendEntryRow = {
  id: string
  source: string
  medium: string | null
  campaign: string | null
  content: string | null
  spend_cents: number
  currency: string
  created_at: string
  updated_at: string
}

type EmailLeadRow = {
  id: string
  email: string
  status: string
  visitor_id: string | null
  visit_id: string | null
  first_submitted_at: string
  last_submitted_at: string
}

export type DashboardRows = {
  visits: VisitRow[]
  funnelEvents: FunnelEventRow[]
  quizResponses: QuizResponseRow[]
  userProfiles: UserProfileRow[]
  emailLeads: EmailLeadRow[]
  dashboardSettings: DashboardSettingsRow | null
  adSpendEntries: AdSpendEntryRow[]
}

export async function loadDashboardRows(): Promise<DashboardRows> {
  const client = createAdminClient()

  const [
    visitsResult,
    funnelEventsResult,
    quizResponsesResult,
    userProfilesResult,
    emailLeadsResult,
    dashboardSettingsResult,
    adSpendEntriesResult,
  ] = await Promise.all([
    loadVisits(client),
    client.from('funnel_events').select('id, visit_id, event_type, user_id, step, metadata, created_at'),
    client
      .from('quiz_responses')
      .select(
        'id, visitor_id, user_id, visit_id, answers, gender, current_decision, decision_context, decision_pattern, primary_blocker, emotional_driver, support_preference, recommended_starting_point, confidence, created_at, updated_at, completed_at',
      ),
    loadUserProfiles(client),
    client
      .from('email_leads')
      .select('id, email, status, visitor_id, visit_id, first_submitted_at, last_submitted_at')
      .eq('status', 'pending_verification')
      .order('last_submitted_at', { ascending: false }),
    client
      .from('dashboard_settings')
      .select('id, product_price_cents, currency, created_at, updated_at')
      .eq('id', 'default')
      .maybeSingle(),
    client
      .from('ad_spend_entries')
      .select('id, source, medium, campaign, content, spend_cents, currency, created_at, updated_at')
      .order('created_at', { ascending: true }),
  ])

  assertDashboardQuery(funnelEventsResult.error, 'funnel_events')
  assertDashboardQuery(quizResponsesResult.error, 'quiz_responses')
  assertDashboardQuery(emailLeadsResult.error, 'email_leads')

  return {
    visits: (visitsResult.data ?? []) as VisitRow[],
    funnelEvents: (funnelEventsResult.data ?? []) as FunnelEventRow[],
    quizResponses: (quizResponsesResult.data ?? []) as QuizResponseRow[],
    userProfiles: (userProfilesResult.data ?? []) as UserProfileRow[],
    emailLeads: (emailLeadsResult.data ?? []) as EmailLeadRow[],
    dashboardSettings: dashboardSettingsResult.error ? null : ((dashboardSettingsResult.data ?? null) as DashboardSettingsRow | null),
    adSpendEntries: adSpendEntriesResult.error ? [] : ((adSpendEntriesResult.data ?? []) as AdSpendEntryRow[]),
  }
}

function assertDashboardQuery(error: { message: string } | null, table: string) {
  if (error) {
    throw new Error(`Could not load dashboard ${table}: ${error.message}`)
  }
}

async function loadVisits(client: ReturnType<typeof createAdminClient>) {
  const withContent = await client
    .from('visits')
    .select('id, visitor_id, user_id, source, medium, campaign, content, landing_url, referrer, created_at, updated_at')

  if (!withContent.error) {
    return withContent
  }

  const withoutContent = await client
    .from('visits')
    .select('id, visitor_id, user_id, source, medium, campaign, landing_url, referrer, created_at, updated_at')

  assertDashboardQuery(withoutContent.error, 'visits')

  return {
    ...withoutContent,
    data: (withoutContent.data ?? []).map((visit) => ({ ...visit, content: null })),
  }
}

async function loadUserProfiles(client: ReturnType<typeof createAdminClient>) {
  const withContent = await client
    .from('user_profiles')
    .select(
      'id, user_id, email, email_verified_at, first_authenticated_at, first_touch_source, first_touch_medium, first_touch_campaign, first_touch_content, last_seen_at, last_touch_source, last_touch_medium, last_touch_campaign, last_touch_content, product_interested_at, product_interest_source, created_at, updated_at',
    )

  if (!withContent.error) {
    return withContent
  }

  const withoutContent = await client
    .from('user_profiles')
    .select(
      'id, user_id, email, email_verified_at, first_authenticated_at, first_touch_source, first_touch_medium, first_touch_campaign, last_seen_at, last_touch_source, last_touch_medium, last_touch_campaign, product_interested_at, product_interest_source, created_at, updated_at',
    )

  assertDashboardQuery(withoutContent.error, 'user_profiles')

  return {
    ...withoutContent,
    data: (withoutContent.data ?? []).map((profile) => ({
      ...profile,
      first_touch_content: null,
      last_touch_content: null,
    })),
  }
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const rows = await loadDashboardRows()
  return buildDashboardSummary(rows)
}
