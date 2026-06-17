import { createClient, type SupabaseClient as SupabaseJsClient } from '@supabase/supabase-js'

import { normalizeEmail } from '@/lib/auth/profiles'
import type { Database } from '@/lib/database.types'

type SupabaseClient = SupabaseJsClient<Database>

const E2E_STORAGE_KEY = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    return 'sb-e2e-auth-token'
  }

  return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
})()

let dashboardUsersPromise: Promise<{
  admin: { email: string; password: string; userId: string }
  regular: { email: string; password: string; userId: string }
}> | null = null

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function encodeSessionCookieValue(session: unknown) {
  return `base64-${Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')}`
}

async function ensureAuthUser(
  authClient: SupabaseClient,
  input: { email: string; password: string },
) {
  const normalized = normalizeEmail(input.email)
  const { data: users, error: listUsersError } = await authClient.auth.admin.listUsers({ page: 1, perPage: 1000 })

  if (listUsersError) {
    throw listUsersError
  }

  const existingUser = users.users.find((user) => normalizeEmail(user.email ?? '') === normalized)

  if (existingUser) {
    const { data, error } = await authClient.auth.admin.updateUserById(existingUser.id, {
      password: input.password,
      email_confirm: true,
    })

    if (error) {
      throw error
    }

    return data.user
  }

  const { data, error } = await authClient.auth.admin.createUser({
    email: normalized,
    password: input.password,
    email_confirm: true,
  })

  if (error) {
    throw error
  }

  return data.user
}

async function signInForCookie(
  authClient: SupabaseClient,
  input: { email: string; password: string },
) {
  const { data, error } = await authClient.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error || !data.session) {
    throw error ?? new Error(`Could not sign in ${input.email}`)
  }

  return data.session
}

export async function ensureDashboardE2EUsers(): Promise<{
  admin: { email: string; password: string; userId: string }
  regular: { email: string; password: string; userId: string }
}> {
  if (dashboardUsersPromise) {
    return dashboardUsersPromise
  }

  dashboardUsersPromise = (async () => {
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const adminEmail = normalizeEmail(process.env.E2E_ADMIN_EMAIL ?? 'admin-e2e@example.com')
    const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'admin-e2e-password'
    const regularEmail = normalizeEmail(process.env.E2E_REGULAR_EMAIL ?? 'regular-e2e@example.com')
    const regularPassword = process.env.E2E_REGULAR_PASSWORD ?? 'regular-e2e-password'

    const adminUser = await ensureAuthUser(adminClient, {
      email: adminEmail,
      password: adminPassword,
    })

    const regularUser = await ensureAuthUser(adminClient, {
      email: regularEmail,
      password: regularPassword,
    })

    const { error: adminRowError } = await adminClient.from('admin_users').upsert(
      {
        user_id: adminUser.id,
        email: adminEmail,
        role: 'admin',
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' },
    )

    if (adminRowError) {
      throw adminRowError
    }

    return {
      admin: {
        email: adminEmail,
        password: adminPassword,
        userId: adminUser.id,
      },
      regular: {
        email: regularEmail,
        password: regularPassword,
        userId: regularUser.id,
      },
    }
  })()

  return dashboardUsersPromise
}

export async function createDashboardSessionCookie(input: { email: string; password: string }) {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const authClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const session = await signInForCookie(authClient, input)

  return {
    name: E2E_STORAGE_KEY,
    value: encodeSessionCookieValue(session),
    url: new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000').toString(),
  }
}
