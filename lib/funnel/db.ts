import { detectSource } from '@/lib/analytics/source'
import { trackEvent, type FunnelEventName, type FunnelEventRecord } from '@/lib/analytics/events'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/database.types'

type SupabaseClient = ReturnType<typeof createAdminClient>

type VisitRecord = {
  id: string
  visitor_id: string
  source: string
  medium: string | null
  campaign: string | null
  landing_url: string | null
  referrer: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export async function getOrCreateVisit(input: {
  client: SupabaseClient
  visitorId: string
  url: string
  referrer: string
  userId?: string | null
}) {
  const latestVisit = await input.client
    .from('visits')
    .select('id, visitor_id, source, medium, campaign, landing_url, referrer, user_id, created_at, updated_at')
    .eq('visitor_id', input.visitorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<VisitRecord>()

  if (latestVisit.data) {
    if (input.userId && latestVisit.data.user_id !== input.userId) {
      const updated = await input.client
        .from('visits')
        .update({ user_id: input.userId })
        .eq('id', latestVisit.data.id)
        .select('id, visitor_id, source, medium, campaign, landing_url, referrer, user_id, created_at, updated_at')
        .single<VisitRecord>()

      return updated.data
    }

    return latestVisit.data
  }

  const source = detectSource({
    url: input.url,
    referrer: input.referrer,
  })

  const created = await input.client
    .from('visits')
    .insert({
      visitor_id: input.visitorId,
      source: source.source,
      medium: source.medium,
      campaign: source.campaign,
      landing_url: source.landingUrl,
      referrer: source.referrer,
      user_id: input.userId ?? null,
    })
    .select('id, visitor_id, source, medium, campaign, landing_url, referrer, user_id, created_at, updated_at')
    .single<VisitRecord>()

  return created.data
}

export async function updateVisitUserId(input: {
  client: SupabaseClient
  visitId: string
  userId: string
}) {
  const updated = await input.client
    .from('visits')
    .update({ user_id: input.userId })
    .eq('id', input.visitId)
    .select('id, visitor_id, source, medium, campaign, landing_url, referrer, user_id, created_at, updated_at')
    .single<VisitRecord>()

  return updated.data
}

export async function recordFunnelEvent(input: {
  client: SupabaseClient
  visitId: string
  eventName: FunnelEventName
  userId?: string | null
  step?: string | null
  metadata?: Record<string, unknown>
}) {
  const eventRepo = {
    async findEventByVisitAndName(eventQuery: { visitId: string; eventName: FunnelEventName }) {
      const { data } = await input.client
        .from('funnel_events')
        .select('id, visit_id, event_type, user_id, step, metadata, created_at')
        .eq('visit_id', eventQuery.visitId)
        .eq('event_type', eventQuery.eventName)
        .maybeSingle()

      return (data ?? null) as FunnelEventRecord | null
    },
    async createEvent(eventInput: {
      visitId: string
      eventName: FunnelEventName
      userId?: string | null
      step?: string | null
      metadata?: Record<string, unknown>
      createdAt?: string
    }) {
      const created = await input.client
        .from('funnel_events')
        .insert({
          visit_id: eventInput.visitId,
          event_type: eventInput.eventName,
          user_id: eventInput.userId ?? null,
          step: eventInput.step ?? null,
          metadata: (eventInput.metadata ?? {}) as Json,
          created_at: eventInput.createdAt,
        })
        .select('id, visit_id, event_type, user_id, step, metadata, created_at')
        .single()

      return created.data as FunnelEventRecord
    },
  }

  return trackEvent({
    repo: eventRepo,
    eventName: input.eventName,
    visitId: input.visitId,
    userId: input.userId ?? null,
    step: input.step ?? null,
    metadata: input.metadata ?? {},
  })
}

export async function markUserProductInterest(input: {
  client: SupabaseClient
  userId: string
  interestedAt?: string
  source?: string
}) {
  const interestedAt = input.interestedAt ?? new Date().toISOString()
  const updated = await input.client
    .from('user_profiles')
    .update({
      product_interested_at: interestedAt,
      product_interest_source: input.source ?? 'mock_paywall_buy',
      updated_at: interestedAt,
    })
    .eq('user_id', input.userId)
    .is('product_interested_at', null)
    .select('user_id, product_interested_at, product_interest_source')
    .maybeSingle()

  return updated.data
}
