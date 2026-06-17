import {
  type AuthAttemptRecord,
  type AuthAttemptRepository,
  verifyAuthAttemptAndUpsertProfile,
} from '@/lib/auth/attempts'
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
