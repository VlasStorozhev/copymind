import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { recordFunnelEvent, getOrCreateVisit } from '@/lib/funnel/db'
import { getOrCreateVisitorId } from '@/lib/analytics/visitor'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    eventName?: 'landing_viewed' | 'start_clicked' | 'email_viewed'
    metadata?: Record<string, unknown>
    url?: string
    referrer?: string
  }

  if (!body.eventName) {
    return NextResponse.json({ error: 'eventName is required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const existingVisitorId = cookieStore.get('visitor_id')?.value ?? null
  const { visitorId, shouldSetCookie } = getOrCreateVisitorId({ existingVisitorId })

  if (shouldSetCookie) {
    cookieStore.set('visitor_id', visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
  }

  const adminClient = createAdminClient()
  const visit = await getOrCreateVisit({
    client: adminClient,
    visitorId,
    url: body.url ?? request.url,
    referrer: body.referrer ?? request.headers.get('referer') ?? '',
  })

  if (!visit) {
    return NextResponse.json({ error: 'Could not load visit context' }, { status: 500 })
  }

  await recordFunnelEvent({
    client: adminClient,
    visitId: visit.id,
    eventName: body.eventName,
    userId: visit.user_id,
    metadata:
      body.eventName === 'landing_viewed'
        ? { source: visit.source, medium: visit.medium, campaign: visit.campaign }
        : body.metadata ?? {},
  })

  return NextResponse.json({
    ok: true,
    visitor_id: visitorId,
    visit_id: visit.id,
  })
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
