import { notFound, redirect } from 'next/navigation'

import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { getDashboardSummary } from '@/lib/analytics/dashboard'
import { resolveAdminAccess } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

export default async function DashboardRoutePage() {
  const access = await resolveAdminAccess()

  if (access.status === 'unauthenticated') {
    redirect('/login')
  }

  if (access.status === 'forbidden') {
    notFound()
  }

  const summary = await getDashboardSummary()

  return <DashboardPage summary={summary} userEmail={access.user.email} />
}
