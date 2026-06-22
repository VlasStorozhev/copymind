import {
  type AuthAttemptRecord,
  type AuthAttemptRepository,
  verifyAuthAttemptAndUpsertProfile,
} from '@/lib/auth/attempts'
import { normalizeEmail } from '@/lib/auth/profiles'
import type { UserProfileRecord, UserProfileRepository } from '@/lib/auth/profiles'

export type MagicLinkFailureReason =
  | 'expired'
  | 'used'
  | 'invalid'
  | 'missing_context'
  | 'email_mismatch'
  | 'unknown'

export type MagicLinkCallbackSource = {
  source: string
  medium: string | null
  campaign: string | null
  content?: string | null
}

export type MagicLinkCallbackResult =
  | {
      ok: true
      attempt: AuthAttemptRecord
      profileStatus: 'created' | 'returned'
    }
  | {
      ok: false
      reason: MagicLinkFailureReason
    }

export function resolveCallbackSource(input: {
  attemptVisitSource?: MagicLinkCallbackSource | null
  fallbackSource: MagicLinkCallbackSource
}): MagicLinkCallbackSource {
  return input.attemptVisitSource ?? input.fallbackSource
}

export function resolveAuthAttemptIdFromCallback(input: {
  queryAuthAttemptId?: string | null
  cookieAuthAttemptId?: string | null
}) {
  return input.queryAuthAttemptId || input.cookieAuthAttemptId || null
}

export function resolveFallbackAuthAttempt(input: {
  attempts: AuthAttemptRecord[]
  authenticatedEmail: string
  now?: string
}) {
  const normalizedEmail = normalizeEmail(input.authenticatedEmail)
  const now = input.now ?? new Date().toISOString()

  return input.attempts
    .filter((attempt) => attempt.normalized_email === normalizedEmail)
    .filter((attempt) => attempt.status === 'pending')
    .filter((attempt) => attempt.expires_at > now)
    .sort((left, right) => {
      const createdAtCompare = left.created_at.localeCompare(right.created_at)
      if (createdAtCompare !== 0) {
        return createdAtCompare
      }

      return left.id.localeCompare(right.id)
    })
    .at(-1) ?? null
}

function mapAttemptFailureReason(
  reason: 'missing' | 'expired' | 'failed' | 'verified' | 'email_mismatch' | 'superseded' | 'not_pending',
): MagicLinkFailureReason {
  switch (reason) {
    case 'expired':
      return 'expired'
    case 'email_mismatch':
      return 'email_mismatch'
    case 'missing':
      return 'invalid'
    case 'failed':
    case 'verified':
    case 'superseded':
    case 'not_pending':
      return 'used'
    default:
      return 'unknown'
  }
}

export async function resolveMagicLinkCallback(input: {
  authAttemptId?: string | null
  authenticatedUser: {
    id: string
    email: string | null
  }
  authenticatedAt: string
  source: MagicLinkCallbackSource
  authAttemptRepo: AuthAttemptRepository
  profileRepo: UserProfileRepository
  linkVisit?: (attempt: AuthAttemptRecord) => Promise<void> | void
  linkQuizResponse?: (attempt: AuthAttemptRecord) => Promise<void> | void
}): Promise<MagicLinkCallbackResult> {
  if (!input.authAttemptId) {
    return { ok: false, reason: 'missing_context' }
  }

  const authenticatedEmail = input.authenticatedUser.email?.trim()
  if (!authenticatedEmail) {
    return { ok: false, reason: 'invalid' }
  }

  const existingProfile = await input.profileRepo.getProfileByUserId(input.authenticatedUser.id)
  const result = await verifyAuthAttemptAndUpsertProfile({
    repo: input.authAttemptRepo,
    profileRepo: input.profileRepo,
    authAttemptId: input.authAttemptId,
    authenticatedEmail,
    userId: input.authenticatedUser.id,
    authenticatedAt: input.authenticatedAt,
    source: input.source,
    linkVisit: input.linkVisit,
    linkQuizResponse: input.linkQuizResponse,
  })

  if (!result.ok) {
    return { ok: false, reason: mapAttemptFailureReason(result.reason) }
  }

  return {
    ok: true,
    attempt: result.attempt,
    profileStatus: existingProfile ? 'returned' : 'created',
  }
}

export type UserProfileUpsertResult = {
  profile: UserProfileRecord
  profileStatus: 'created' | 'returned'
}
