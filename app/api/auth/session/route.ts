import { NextResponse } from 'next/server'

import { resolveAdminAccess } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const access = await resolveAdminAccess()

  if (access.status === 'unauthenticated') {
    return NextResponse.json({
      authenticated: false,
      is_admin: false,
      user_email: null,
    })
  }

  return NextResponse.json({
    authenticated: true,
    is_admin: access.status === 'authorized',
    user_email: access.user.email,
  })
}
