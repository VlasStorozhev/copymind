import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import {
  resolveCallbackSource,
  resolveMagicLinkCallback,
  type MagicLinkFailureReason,
} from '@/lib/funnel/callback'
import { recordFunnelEvent } from '@/lib/funnel/db'
import { type AuthAttemptRecord, type AuthAttemptRepository } from '@/lib/auth/attempts'
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
  return {
    async getProfileByUserId(userId) {
      const { data } = await client
        .from('user_profiles')
        .select('id, user_id, email, email_verified_at, first_authenticated_at, first_touch_source, first_touch_medium, first_touch_campaign, last_seen_at, last_touch_source, last_touch_medium, last_touch_campaign, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle()

      return data ?? null
    },
    async insertProfile(input) {
      const { data, error } = await client
        .from('user_profiles')
        .insert({
          user_id: input.userId,
          email: input.email,
          email_verified_at: input.emailVerifiedAt ?? null,
          first_authenticated_at: input.firstAuthenticatedAt,
          first_touch_source: input.firstTouchSource,
          first_touch_medium: input.firstTouchMedium,
          first_touch_campaign: input.firstTouchCampaign,
          last_seen_at: input.lastSeenAt,
          last_touch_source: input.lastTouchSource,
          last_touch_medium: input.lastTouchMedium,
          last_touch_campaign: input.lastTouchCampaign,
          created_at: input.createdAt,
          updated_at: input.updatedAt,
        })
        .select('id, user_id, email, email_verified_at, first_authenticated_at, first_touch_source, first_touch_medium, first_touch_campaign, last_seen_at, last_touch_source, last_touch_medium, last_touch_campaign, created_at, updated_at')
        .single()

      if (error || !data) {
        throw new Error(error?.message ?? 'Could not create user profile')
      }

      return data as UserProfileRecord
    },
    async updateProfile(userId, input) {
      const { data, error } = await client
        .from('user_profiles')
        .update({
          email: input.email,
          email_verified_at: input.emailVerifiedAt,
          first_authenticated_at: input.firstAuthenticatedAt,
          first_touch_source: input.firstTouchSource,
          first_touch_medium: input.firstTouchMedium,
          first_touch_campaign: input.firstTouchCampaign,
          last_seen_at: input.lastSeenAt,
          last_touch_source: input.lastTouchSource,
          last_touch_medium: input.lastTouchMedium,
          last_touch_campaign: input.lastTouchCampaign,
          updated_at: input.updatedAt,
        })
        .eq('user_id', userId)
        .select('id, user_id, email, email_verified_at, first_authenticated_at, first_touch_source, first_touch_medium, first_touch_campaign, last_seen_at, last_touch_source, last_touch_medium, last_touch_campaign, created_at, updated_at')
        .single()

      if (error || !data) {
        throw new Error(error?.message ?? 'Could not update user profile')
      }

      return data as UserProfileRecord
    },
  }
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const code = searchParams.get('code')
  const authAttemptId = searchParams.get('auth_attempt_id')

  if (!code) {
    return NextResponse.redirect(new URL('/login?auth_error=invalid', request.url))
  }

  const authClient = await createServerClient()
  const { data: sessionData, error: exchangeError } = await authClient.auth.exchangeCodeForSession(code)
  const session = sessionData.session
  const authenticatedUser = session?.user ?? null

  if (exchangeError || !session || !authenticatedUser) {
    return NextResponse.redirect(new URL('/login?auth_error=invalid', request.url))
  }

  const adminClient = createAdminClient()
  const authAttemptRepo = buildAuthAttemptRepo(adminClient)
  const profileRepo = buildProfileRepo(adminClient)

  const cookieStore = await cookies()
  const visitorId = cookieStore.get('visitor_id')?.value ?? null
  const latestVisit = visitorId
    ? await adminClient
        .from('visits')
        .select('id, visitor_id, source, medium, campaign, landing_url, referrer, user_id, created_at, updated_at')
        .eq('visitor_id', visitorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const fallbackSource = latestVisit.data
    ? {
        source: latestVisit.data.source,
        medium: latestVisit.data.medium,
        campaign: latestVisit.data.campaign,
      }
    : { source: 'direct', medium: null, campaign: null }

  if (!authAttemptId) {
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

    return NextResponse.redirect(new URL('/login?auth_error=missing_context', request.url))
  }

  const attempt = await authAttemptRepo.getAttemptById(authAttemptId)
  const attemptVisit = attempt?.visit_id
    ? await adminClient
        .from('visits')
        .select('source, medium, campaign')
        .eq('id', attempt.visit_id)
        .maybeSingle()
    : { data: null }
  const source = resolveCallbackSource({
    attemptVisitSource: attemptVisit.data
      ? {
          source: attemptVisit.data.source,
          medium: attemptVisit.data.medium,
          campaign: attemptVisit.data.campaign,
        }
      : null,
    fallbackSource,
  })
  const result = await resolveMagicLinkCallback({
    authAttemptId,
    authenticatedUser: {
      id: authenticatedUser.id,
      email: authenticatedUser.email ?? null,
    },
    authenticatedAt: new Date().toISOString(),
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
          auth_attempt_id: authAttemptId,
          reason: result.reason,
        },
      })
    }

    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  if (result.attempt.visit_id) {
    await recordFunnelEvent({
      client: adminClient,
      visitId: result.attempt.visit_id,
      eventName: 'magic_link_verified',
      userId: authenticatedUser.id,
      metadata: {
        auth_provider: 'supabase',
        auth_attempt_id: authAttemptId,
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

  return NextResponse.redirect(new URL('/app', request.url))
}
