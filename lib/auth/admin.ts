import 'server-only'

import { normalizeEmail } from '@/lib/auth/profiles'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

type AdminUserRow = {
  id: string
  user_id: string | null
  email: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AdminAccessResult =
  | {
      status: 'unauthenticated'
      user: null
      adminUser: null
      isAdmin: false
    }
  | {
      status: 'forbidden'
      user: { id: string; email: string | null }
      adminUser: null
      isAdmin: false
    }
  | {
      status: 'authorized'
      user: { id: string; email: string | null }
      adminUser: AdminUserRow
      isAdmin: true
    }

export async function resolveAdminAccess(): Promise<AdminAccessResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      status: 'unauthenticated',
      user: null,
      adminUser: null,
      isAdmin: false,
    }
  }

  const adminClient = createAdminClient()

  const { data: adminByUserId } = await adminClient
    .from('admin_users')
    .select('id, user_id, email, role, is_active, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle<AdminUserRow>()

  if (adminByUserId) {
    return {
      status: 'authorized',
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      adminUser: adminByUserId,
      isAdmin: true,
    }
  }

  if (user.email) {
    const normalized = normalizeEmail(user.email)
    const { data: adminByEmail } = await adminClient
      .from('admin_users')
      .select('id, user_id, email, role, is_active, created_at, updated_at')
      .eq('email', normalized)
      .eq('is_active', true)
      .maybeSingle<AdminUserRow>()

    if (adminByEmail) {
      return {
        status: 'authorized',
        user: {
          id: user.id,
          email: user.email ?? null,
        },
        adminUser: adminByEmail,
        isAdmin: true,
      }
    }
  }

  return {
    status: 'forbidden',
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    adminUser: null,
    isAdmin: false,
  }
}

export async function isAdminUser(input: { userId: string; email?: string | null }) {
  const access = await resolveAdminAccess()

  if (access.status === 'unauthenticated') {
    return false
  }

  if (access.user.id === input.userId) {
    return access.isAdmin
  }

  if (input.email && access.user.email && normalizeEmail(input.email) === normalizeEmail(access.user.email)) {
    return access.isAdmin
  }

  return false
}
