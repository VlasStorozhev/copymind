import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import {
  resolveAuthAttemptIdFromCallback,
  resolveCallbackSource,
  resolveFallbackAuthAttempt,
  resolveMagicLinkCallback,
  type MagicLinkFailureReason,
} from '@/lib/funnel/callback'
import { recordFunnelEvent } from '@/lib/funnel/db'
import { type AuthAttemptRecord, type AuthAttemptRepository } from '@/lib/auth/attempts'
import { markEmailLeadVerified } from '@/lib/auth/leads'
import { normalizeEmail, type UserProfileRecord, type UserProfileRepository } from '@/lib/auth/profiles'

function getFailureRedirect(
  attempt: AuthAttemptRecord | null,
  reason: MagicLinkFailureReason,
  quizResponseId?: string | null,
) {
  const params = new URLSearchParams({ auth_error: reason })

  if (attempt?.attempt_type === 'quiz_email_capture' && quizResponseId) {
    params.set('quiz_response_id', quizResponseId)
    return `/email?${params.toString()}`
  }

  return `/login?${params.toString()}`
}

function buildAuthAttemptRepo(client: ReturnType<typeof createAdminClient>): AuthAttemptRepository {
  return {
    async createAttempt(input) {
      const { data, error } = await client
        .from('auth_attempts')
        .insert({
          id: input.id,
          attempt_type: input.attemptType,
          normalized_email: input.normalizedEmail,
          quiz_response_id: input.quizResponseId ?? null,
          redirect_path: input.redirectPath ?? '/app',
          status: input.status ?? 'pending',
          user_id: input.userId ?? null,
          verified_at: input.verifiedAt ?? null,
          visit_id: input.visitId ?? null,
          visitor_id: input.visitorId ?? null,
          created_at: input.createdAt,
          expires_at: input.expiresAt,
        })
        .select('id, attempt_type, normalized_email, quiz_response_id, redirect_path, status, user_id, verified_at, visit_id, visitor_id, created_at, expires_at')
        .single()

      if (error || !data) {
        throw new Error(error?.message ?? 'Could not create auth attempt')
      }

      return data as AuthAttemptRecord
    },
    async expirePendingAttemptsByQuizResponseId(quizResponseId) {
      await client
        .from('auth_attempts')
        .update({ status: 'expired' })
        .eq('quiz_response_id', quizResponseId)
        .eq('status', 'pending')
    },
    async expirePendingAttemptsByNormalizedEmail(normalizedEmail) {
      await client
        .from('auth_attempts')
        .update({ status: 'expired' })
        .eq('normalized_email', normalizeEmail(normalizedEmail))
        .eq('status', 'pending')
    },
    async listAttemptsByContext(context) {
      const query = client
        .from('auth_attempts')
        .select('id, attempt_type, normalized_email, quiz_response_id, redirect_path, status, user_id, verified_at, visit_id, visitor_id, created_at, expires_at')

      if (context.attemptType === 'quiz_email_capture') {
        const { data } = await query
          .eq('attempt_type', context.attemptType)
          .eq('quiz_response_id', context.quizResponseId)
          .order('created_at', { ascending: true })

        return (data ?? []) as AuthAttemptRecord[]
      }

      const { data } = await query
        .eq('attempt_type', context.attemptType)
        .eq('normalized_email', normalizeEmail(context.normalizedEmail))
        .order('created_at', { ascending: true })

      return (data ?? []) as AuthAttemptRecord[]
    },
    async getAttemptById(id) {
      const { data } = await client
        .from('auth_attempts')
        .select('id, attempt_type, normalized_email, quiz_response_id, redirect_path, status, user_id, verified_at, visit_id, visitor_id, created_at, expires_at')
        .eq('id', id)
        .maybeSingle()

      return (data ?? null) as AuthAttemptRecord | null
    },
    async markAttemptVerified(id, input) {
      const { data, error } = await client
        .from('auth_attempts')
        .update({ status: 'verified', user_id: input.userId, verified_at: input.verifiedAt })
        .eq('id', id)
        .select('id, attempt_type, normalized_email, quiz_response_id, redirect_path, status, user_id, verified_at, visit_id, visitor_id, created_at, expires_at')
        .single()

      if (error || !data) {
        throw new Error(error?.message ?? 'Could not verify auth attempt')
      }

      return data as AuthAttemptRecord
    },
    async markAttemptFailed(id) {
      const { data, error } = await client
        .from('auth_attempts')
        .update({ status: 'failed' })
        .eq('id', id)
        .select('id, attempt_type, normalized_email, quiz_response_id, redirect_path, status, user_id, verified_at, visit_id, visitor_id, created_at, expires_at')
        .single()

      if (error || !data) {
        throw new Error(error?.message ?? 'Could not fail auth attempt')
      }

      return data as AuthAttemptRecord
    },
  }
}

function buildProfileRepo(client: ReturnType<typeof createAdminClient>): UserProfileRepository {
  const profileSelectWithContent =
    'id, user_id, email, email_verified_at, first_authenticated_at, first_touch_source, first_touch_medium, first_touch_campaign, first_touch_content, last_seen_at, last_touch_source, last_touch_medium, last_touch_campaign, last_touch_content, created_at, updated_at'
  const profileSelectLegacy =
    'id, user_id, email, email_verified_at, first_authenticated_at, first_touch_source, first_touch_medium, first_touch_campaign, last_seen_at, last_touch_source, last_touch_medium, last_touch_campaign, created_at, updated_at'
  const withContentDefaults = (profile: Record<string, unknown> | null) =>
    profile
      ? {
          ...profile,
          first_touch_content: profile.first_touch_content ?? null,
          last_touch_content: profile.last_touch_content ?? null,
        }
      : null

  return {
    async getProfileByUserId(userId) {
      const withContent = await client
        .from('user_profiles')
        .select(profileSelectWithContent)
        .eq('user_id', userId)
        .maybeSingle()

      if (!withContent.error) {
        return (withContent.data ?? null) as UserProfileRecord | null
      }

      const legacy = await client.from('user_profiles').select(profileSelectLegacy).eq('user_id', userId).maybeSingle()

      return withContentDefaults(legacy.data ?? null) as UserProfileRecord | null
    },
    async insertProfile(input) {
      const profileInsert = {
        user_id: input.userId,
        email: input.email,
        email_verified_at: input.emailVerifiedAt ?? null,
        first_authenticated_at: input.firstAuthenticatedAt,
        first_touch_source: input.firstTouchSource,
        first_touch_medium: input.firstTouchMedium,
        first_touch_campaign: input.firstTouchCampaign,
        first_touch_content: input.firstTouchContent,
        last_seen_at: input.lastSeenAt,
        last_touch_source: input.lastTouchSource,
        last_touch_medium: input.lastTouchMedium,
        last_touch_campaign: input.lastTouchCampaign,
        last_touch_content: input.lastTouchContent,
        created_at: input.createdAt,
        updated_at: input.updatedAt,
      }
      const withContent = await client
        .from('user_profiles')
        .insert(profileInsert)
        .select(profileSelectWithContent)
        .single()

      if (!withContent.error && withContent.data) {
        return withContent.data as UserProfileRecord
      }

      const legacyInsert = {
        user_id: profileInsert.user_id,
        email: profileInsert.email,
        email_verified_at: profileInsert.email_verified_at,
        first_authenticated_at: profileInsert.first_authenticated_at,
        first_touch_source: profileInsert.first_touch_source,
        first_touch_medium: profileInsert.first_touch_medium,
        first_touch_campaign: profileInsert.first_touch_campaign,
        last_seen_at: profileInsert.last_seen_at,
        last_touch_source: profileInsert.last_touch_source,
        last_touch_medium: profileInsert.last_touch_medium,
        last_touch_campaign: profileInsert.last_touch_campaign,
        created_at: profileInsert.created_at,
        updated_at: profileInsert.updated_at,
      }
      const legacy = await client.from('user_profiles').insert(legacyInsert).select(profileSelectLegacy).single()

      if (legacy.error || !legacy.data) {
        throw new Error(legacy.error?.message ?? 'Could not create user profile')
      }

      return withContentDefaults(legacy.data) as UserProfileRecord
    },
    async updateProfile(userId, input) {
      const profileUpdate = {
        email: input.email,
        email_verified_at: input.emailVerifiedAt,
        first_authenticated_at: input.firstAuthenticatedAt,
        first_touch_source: input.firstTouchSource,
        first_touch_medium: input.firstTouchMedium,
        first_touch_campaign: input.firstTouchCampaign,
        first_touch_content: input.firstTouchContent,
        last_seen_at: input.lastSeenAt,
        last_touch_source: input.lastTouchSource,
        last_touch_medium: input.lastTouchMedium,
        last_touch_campaign: input.lastTouchCampaign,
        last_touch_content: input.lastTouchContent,
        updated_at: input.updatedAt,
      }
      const withContent = await client
        .from('user_profiles')
        .update(profileUpdate)
        .eq('user_id', userId)
        .select(profileSelectWithContent)
        .single()

      if (!withContent.error && withContent.data) {
        return withContent.data as UserProfileRecord
      }

      const legacyUpdate = {
        email: profileUpdate.email,
        email_verified_at: profileUpdate.email_verified_at,
        first_authenticated_at: profileUpdate.first_authenticated_at,
        first_touch_source: profileUpdate.first_touch_source,
        first_touch_medium: profileUpdate.first_touch_medium,
        first_touch_campaign: profileUpdate.first_touch_campaign,
        last_seen_at: profileUpdate.last_seen_at,
        last_touch_source: profileUpdate.last_touch_source,
        last_touch_medium: profileUpdate.last_touch_medium,
        last_touch_campaign: profileUpdate.last_touch_campaign,
        updated_at: profileUpdate.updated_at,
      }
      const legacy = await client
        .from('user_profiles')
        .update(legacyUpdate)
        .eq('user_id', userId)
        .select(profileSelectLegacy)
        .single()

      if (legacy.error || !legacy.data) {
        throw new Error(legacy.error?.message ?? 'Could not update user profile')
      }

      return withContentDefaults(legacy.data) as UserProfileRecord
    },
  }
}

async function loadLatestVisitForCallback(client: ReturnType<typeof createAdminClient>, visitorId: string) {
  const withContent = await client
    .from('visits')
    .select('id, visitor_id, source, medium, campaign, content, landing_url, referrer, user_id, created_at, updated_at')
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!withContent.error) {
    return withContent
  }

  const legacy = await client
    .from('visits')
    .select('id, visitor_id, source, medium, campaign, landing_url, referrer, user_id, created_at, updated_at')
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    ...legacy,
    data: legacy.data ? { ...legacy.data, content: null } : null,
  }
}

async function loadAttemptVisitSource(client: ReturnType<typeof createAdminClient>, visitId: string) {
  const withContent = await client.from('visits').select('source, medium, campaign, content').eq('id', visitId).maybeSingle()

  if (!withContent.error) {
    return withContent
  }

  const legacy = await client.from('visits').select('source, medium, campaign').eq('id', visitId).maybeSingle()

  return {
    ...legacy,
    data: legacy.data ? { ...legacy.data, content: null } : null,
  }
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const code = searchParams.get('code')
  const cookieStore = await cookies()
  const authAttemptId = resolveAuthAttemptIdFromCallback({
    queryAuthAttemptId: searchParams.get('auth_attempt_id'),
    cookieAuthAttemptId: cookieStore.get('auth_attempt_id')?.value ?? null,
  })

  if (!code) {
    cookieStore.delete('auth_attempt_id')
    return NextResponse.redirect(new URL('/login?auth_error=invalid', request.url))
  }

  const authClient = await createServerClient()
  const { data: sessionData, error: exchangeError } = await authClient.auth.exchangeCodeForSession(code)
  const session = sessionData.session
  const authenticatedUser = session?.user ?? null

  if (exchangeError || !session || !authenticatedUser) {
    cookieStore.delete('auth_attempt_id')
    return NextResponse.redirect(new URL('/login?auth_error=invalid', request.url))
  }

  const adminClient = createAdminClient()
  const authAttemptRepo = buildAuthAttemptRepo(adminClient)
  const profileRepo = buildProfileRepo(adminClient)

  const visitorId = cookieStore.get('visitor_id')?.value ?? null
  const latestVisit = visitorId ? await loadLatestVisitForCallback(adminClient, visitorId) : { data: null }

  const fallbackSource = latestVisit.data
    ? {
        source: latestVisit.data.source,
        medium: latestVisit.data.medium,
        campaign: latestVisit.data.campaign,
        content: latestVisit.data.content,
      }
    : { source: 'direct', medium: null, campaign: null, content: null }

  let resolvedAuthAttemptId = authAttemptId
  let fallbackAttempt: AuthAttemptRecord | null = null

  if (!resolvedAuthAttemptId && authenticatedUser.email) {
    const { data } = await adminClient
      .from('auth_attempts')
      .select('id, attempt_type, normalized_email, quiz_response_id, redirect_path, status, user_id, verified_at, visit_id, visitor_id, created_at, expires_at')
      .eq('normalized_email', normalizeEmail(authenticatedUser.email))
      .order('created_at', { ascending: true })

    fallbackAttempt = resolveFallbackAuthAttempt({
      attempts: (data ?? []) as AuthAttemptRecord[],
      authenticatedEmail: authenticatedUser.email,
      now: new Date().toISOString(),
    })
    resolvedAuthAttemptId = fallbackAttempt?.id ?? null
  }

  if (!resolvedAuthAttemptId) {
    if (latestVisit.data) {
      await recordFunnelEvent({
        client: adminClient,
        visitId: latestVisit.data.id,
        eventName: 'magic_link_failed',
        userId: authenticatedUser.id,
        metadata: {
          auth_provider: 'supabase',
          auth_attempt_id: '',
          reason: 'missing_context',
        },
      })
    }

    cookieStore.delete('auth_attempt_id')
    return NextResponse.redirect(new URL('/login?auth_error=missing_context', request.url))
  }

  const attempt = fallbackAttempt ?? (await authAttemptRepo.getAttemptById(resolvedAuthAttemptId))
  const attemptVisit = attempt?.visit_id ? await loadAttemptVisitSource(adminClient, attempt.visit_id) : { data: null }
  const source = resolveCallbackSource({
    attemptVisitSource: attemptVisit.data
      ? {
          source: attemptVisit.data.source,
          medium: attemptVisit.data.medium,
          campaign: attemptVisit.data.campaign,
          content: attemptVisit.data.content,
        }
      : null,
    fallbackSource,
  })
  const authenticatedAt = new Date().toISOString()
  const result = await resolveMagicLinkCallback({
    authAttemptId: resolvedAuthAttemptId,
    authenticatedUser: {
      id: authenticatedUser.id,
      email: authenticatedUser.email ?? null,
    },
    authenticatedAt,
    source,
    authAttemptRepo,
    profileRepo,
    linkVisit: async (verifiedAttempt) => {
      if (verifiedAttempt.visit_id) {
        await adminClient.from('visits').update({ user_id: authenticatedUser.id }).eq('id', verifiedAttempt.visit_id)
      }
    },
    linkQuizResponse: async (verifiedAttempt) => {
      if (verifiedAttempt.quiz_response_id) {
        await adminClient
          .from('quiz_responses')
          .update({ user_id: authenticatedUser.id })
          .eq('id', verifiedAttempt.quiz_response_id)
      }
    },
  })

  if (!result.ok) {
    const redirectPath = getFailureRedirect(attempt, result.reason, attempt?.quiz_response_id ?? null)

    if (attempt?.visit_id) {
      await recordFunnelEvent({
        client: adminClient,
        visitId: attempt.visit_id,
        eventName: 'magic_link_failed',
        userId: authenticatedUser.id,
        metadata: {
          auth_provider: 'supabase',
          auth_attempt_id: resolvedAuthAttemptId,
          reason: result.reason,
        },
      })
    }

    cookieStore.delete('auth_attempt_id')
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  await markEmailLeadVerified({
    client: adminClient,
    normalizedEmail: result.attempt.normalized_email,
    userId: authenticatedUser.id,
    verifiedAt: authenticatedAt,
  })

  if (result.attempt.visit_id) {
    await recordFunnelEvent({
      client: adminClient,
      visitId: result.attempt.visit_id,
      eventName: 'email_verified',
      userId: authenticatedUser.id,
      metadata: {
        auth_provider: 'supabase',
        auth_attempt_id: resolvedAuthAttemptId,
      },
    })

    await recordFunnelEvent({
      client: adminClient,
      visitId: result.attempt.visit_id,
      eventName: 'magic_link_verified',
      userId: authenticatedUser.id,
      metadata: {
        auth_provider: 'supabase',
        auth_attempt_id: resolvedAuthAttemptId,
      },
    })

    await recordFunnelEvent({
      client: adminClient,
      visitId: result.attempt.visit_id,
      eventName: result.profileStatus === 'created' ? 'user_created' : 'user_returned',
      userId: authenticatedUser.id,
      metadata: source,
    })
  }

  cookieStore.delete('auth_attempt_id')
  return NextResponse.redirect(new URL('/app', request.url))
}
