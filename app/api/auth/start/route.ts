import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { createQuizEmailCaptureAttempt, createReturningLoginAttempt, type AuthAttemptRecord } from '@/lib/auth/attempts'
import { normalizeEmail } from '@/lib/auth/profiles'
import { resolveQuizEmailCaptureStart } from '@/lib/funnel/auth-start'
import { getOrCreateVisitorId } from '@/lib/analytics/visitor'
import { getOrCreateVisit, recordFunnelEvent } from '@/lib/funnel/db'
import { getPublicSiteUrl } from '@/lib/env'
import { getGeneratedMagicLink, isEmailRateLimitError } from '@/lib/auth/magic-link'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    attempt_type?: 'quiz_email_capture' | 'returning_login'
    email?: string
    quiz_response_id?: string | null
  }

  const attemptType = body.attempt_type
  const email = body.email?.trim() ?? ''

  if (!attemptType) {
    return NextResponse.json({ error: 'attempt_type is required' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
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
  const authClient = await createServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  const visit = await getOrCreateVisit({
    client: adminClient,
    visitorId,
    url: request.headers.get('referer') ?? request.url,
    referrer: request.headers.get('referer') ?? '',
    userId: user?.id ?? null,
  })

  if (!visit) {
    return NextResponse.json({ error: 'Could not load visit context' }, { status: 500 })
  }

  const existingQuizResponse =
    attemptType === 'quiz_email_capture'
      ? await resolveQuizEmailCaptureStart({
          quizResponseId: body.quiz_response_id,
          visitorId,
          findQuizResponseById: async (quizResponseId) => {
            const { data } = await adminClient
              .from('quiz_responses')
              .select('id, visit_id, visitor_id')
              .eq('id', quizResponseId)
              .maybeSingle()

            return data ?? null
          },
        })
      : { ok: true as const, quizResponse: null }

  if (!existingQuizResponse.ok) {
      await recordFunnelEvent({
        client: adminClient,
        visitId: visit.id,
      eventName: 'magic_link_failed',
      userId: user?.id ?? null,
      metadata: {
        auth_provider: 'supabase',
        auth_attempt_id: '',
        reason: existingQuizResponse.reason,
      },
    })

    return NextResponse.json(
      {
        error:
          existingQuizResponse.reason === 'missing_context' || existingQuizResponse.reason === 'invalid'
            ? 'We could not find your quiz result'
            : 'Could not continue this request',
        reason: existingQuizResponse.reason,
      },
      { status: 400 },
    )
  }

  const authAttemptId = randomUUID()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString()
  const redirectTo = `${getPublicSiteUrl()}/auth/callback?auth_attempt_id=${authAttemptId}`

  const authAttempt =
    attemptType === 'quiz_email_capture'
      ? await createQuizEmailCaptureAttempt({
          repo: {
            async createAttempt(input) {
              const { data } = await adminClient
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
                  visit_id: visit.id,
                  visitor_id: visitorId,
                  created_at: input.createdAt,
                  expires_at: input.expiresAt,
                })
                .select('id, attempt_type, normalized_email, quiz_response_id, redirect_path, status, user_id, verified_at, visit_id, visitor_id, created_at, expires_at')
                .single()

              return data as AuthAttemptRecord
            },
            async expirePendingAttemptsByQuizResponseId(quizResponseId) {
              await adminClient
                .from('auth_attempts')
                .update({ status: 'expired' })
                .eq('quiz_response_id', quizResponseId)
                .eq('status', 'pending')
            },
            async expirePendingAttemptsByNormalizedEmail() {
              // handled by the helper's attempt type branch
            },
            async listAttemptsByContext() {
              return []
            },
            async getAttemptById() {
              return null
            },
            async markAttemptVerified() {
              throw new Error('not implemented')
            },
            async markAttemptFailed() {
              throw new Error('not implemented')
            },
          },
          quizResponseId: existingQuizResponse.quizResponse!.id,
          normalizedEmail: normalizeEmail(email),
          visitorId,
          visitId: visit.id,
          expiresAt,
          createId: () => authAttemptId,
        })
      : await createReturningLoginAttempt({
          repo: {
            async createAttempt(input) {
              const { data } = await adminClient
                .from('auth_attempts')
                .insert({
                  id: input.id,
                  attempt_type: input.attemptType,
                  normalized_email: input.normalizedEmail,
                  quiz_response_id: null,
                  redirect_path: input.redirectPath ?? '/app',
                  status: input.status ?? 'pending',
                  user_id: input.userId ?? null,
                  verified_at: input.verifiedAt ?? null,
                  visit_id: visit.id,
                  visitor_id: visitorId,
                  created_at: input.createdAt,
                  expires_at: input.expiresAt,
                })
                .select('id, attempt_type, normalized_email, quiz_response_id, redirect_path, status, user_id, verified_at, visit_id, visitor_id, created_at, expires_at')
                .single()

              return data as AuthAttemptRecord
            },
            async expirePendingAttemptsByQuizResponseId() {
              // no-op
            },
            async expirePendingAttemptsByNormalizedEmail(normalizedEmail) {
              await adminClient
                .from('auth_attempts')
                .update({ status: 'expired' })
                .eq('normalized_email', normalizedEmail)
                .eq('status', 'pending')
            },
            async listAttemptsByContext() {
              return []
            },
            async getAttemptById() {
              return null
            },
            async markAttemptVerified() {
              throw new Error('not implemented')
            },
            async markAttemptFailed() {
              throw new Error('not implemented')
            },
          },
          normalizedEmail: normalizeEmail(email),
          visitorId,
          visitId: visit.id,
          expiresAt,
          createId: () => authAttemptId,
        })

  if (!authAttempt) {
    return NextResponse.json({ error: 'Could not create auth attempt' }, { status: 500 })
  }

  await recordFunnelEvent({
    client: adminClient,
    visitId: visit.id,
    eventName: 'email_submitted',
    userId: user?.id ?? null,
    metadata: {
      auth_provider: 'supabase',
      method: 'magic_link',
      auth_attempt_id: authAttempt.id,
    },
  })

  const { error } = await authClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    if (isEmailRateLimitError(error.message)) {
      const { data: generatedLink, error: generateLinkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo,
        },
      })
      const manualLink = generatedLink ? getGeneratedMagicLink(generatedLink) : null

      if (manualLink && !generateLinkError) {
        await recordFunnelEvent({
          client: adminClient,
          visitId: visit.id,
          eventName: 'magic_link_sent',
          userId: user?.id ?? null,
          metadata: {
            auth_provider: 'supabase',
            auth_attempt_id: authAttempt.id,
            delivery_method: 'manual_link_fallback',
            fallback_reason: 'email_rate_limited',
          },
        })

        return NextResponse.json({
          ok: true,
          auth_attempt_id: authAttempt.id,
          manual_link: manualLink,
          delivery: 'manual_link_fallback',
        })
      }
    }

    await adminClient
      .from('auth_attempts')
      .update({ status: 'failed' })
      .eq('id', authAttempt.id)

    await recordFunnelEvent({
      client: adminClient,
      visitId: visit.id,
      eventName: 'magic_link_failed',
      userId: user?.id ?? null,
      metadata: {
        auth_provider: 'supabase',
        auth_attempt_id: authAttempt.id,
        reason: 'unknown',
      },
    })

    return NextResponse.json({ error: error.message, auth_attempt_id: authAttempt.id }, { status: 500 })
  }

  await recordFunnelEvent({
    client: adminClient,
    visitId: visit.id,
    eventName: 'magic_link_sent',
    userId: user?.id ?? null,
    metadata: {
      auth_provider: 'supabase',
      auth_attempt_id: authAttempt.id,
    },
  })

  return NextResponse.json({
    ok: true,
    auth_attempt_id: authAttempt.id,
  })
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
