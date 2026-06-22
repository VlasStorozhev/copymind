import { NextResponse } from 'next/server'

import { getDashboardSummary } from '@/lib/analytics/dashboard'
import { saveDashboardBusinessInputs } from '@/lib/analytics/dashboardSettings'
import { resolveAdminAccess } from '@/lib/auth/admin'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const access = await resolveAdminAccess()

  if (access.status === 'unauthenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (access.status === 'forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const summary = await getDashboardSummary()

  return NextResponse.json({
    summary,
    user_email: access.user.email,
  })
}

export async function POST(request: Request) {
  const access = await resolveAdminAccess()

  if (access.status === 'unauthenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (access.status === 'forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as
    | {
        productPriceCents?: number
        adSpendEntries?: Array<{
          id?: string
          source?: string
          medium?: string | null
          campaign?: string | null
          content?: string | null
          spend_cents?: number
          currency?: string
        }>
      }
    | null

  const productPriceCents = Math.round(Number(body?.productPriceCents ?? 0))
  if (!Number.isFinite(productPriceCents) || productPriceCents < 0) {
    return NextResponse.json({ error: 'productPriceCents must be a non-negative number' }, { status: 400 })
  }

  const entries = body?.adSpendEntries ?? []
  const client = createAdminClient()

  const result = await saveDashboardBusinessInputs({
    client,
    productPriceCents,
    entries,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ ok: true })
}
