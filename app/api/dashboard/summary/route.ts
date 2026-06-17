import { NextResponse } from 'next/server'

import { getDashboardSummary } from '@/lib/analytics/dashboard'
import { resolveAdminAccess } from '@/lib/auth/admin'

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

  return NextResponse.json(summary)
}
