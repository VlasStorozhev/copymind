import { describe, expect, it, vi } from 'vitest'

import {
  createQuizEmailCaptureAttempt,
  createReturningLoginAttempt,
  type AuthAttemptRecord,
  type AuthAttemptRepository,
} from '@/lib/auth/attempts'
import type { UserProfileRecord, UserProfileRepository } from '@/lib/auth/profiles'
import { resolveQuizEmailCaptureStart } from '@/lib/funnel/auth-start'
import { resolveMagicLinkCallback } from '@/lib/funnel/callback'

function createAttemptRepositoryFixture() {
  const attempts: AuthAttemptRecord[] = []
  const repo: AuthAttemptRepository = {
    async createAttempt(input) {
      const record: AuthAttemptRecord = {
        id: input.id ?? `attempt_${attempts.length + 1}`,
        attempt_type: input.attemptType,
        normalized_email: input.normalizedEmail,
        quiz_response_id: input.quizResponseId ?? null,
        redirect_path: input.redirectPath ?? '/app',
        status: input.status ?? 'pending',
        user_id: input.userId ?? null,
        verified_at: input.verifiedAt ?? null,
        visit_id: input.visitId ?? null,
        visitor_id: input.visitorId ?? null,
        created_at: input.createdAt ?? '2026-01-01T00:00:00.000Z',
        expires_at: input.expiresAt,
      }

      attempts.push(record)
      return record
    },
    async expirePendingAttemptsByQuizResponseId(quizResponseId) {
      for (const attempt of attempts) {
        if (attempt.quiz_response_id === quizResponseId && attempt.status === 'pending') {
          attempt.status = 'expired'
        }
      }
    },
    async expirePendingAttemptsByNormalizedEmail(normalizedEmail) {
      for (const attempt of attempts) {
        if (attempt.normalized_email === normalizedEmail && attempt.status === 'pending') {
          attempt.status = 'expired'
        }
      }
    },
    async listAttemptsByContext(context) {
      return attempts.filter((attempt) => {
        if (attempt.attempt_type !== context.attemptType) {
          return false
        }

        if (context.attemptType === 'quiz_email_capture') {
          return attempt.quiz_response_id === context.quizResponseId
        }

        return attempt.normalized_email === context.normalizedEmail
      })
    },
    async getAttemptById(id) {
      return attempts.find((attempt) => attempt.id === id) ?? null
    },
    async markAttemptVerified(id, input) {
      const attempt = attempts.find((item) => item.id === id)
      if (!attempt) throw new Error('missing attempt')

      attempt.status = 'verified'
      attempt.user_id = input.userId ?? null
      attempt.verified_at = input.verifiedAt
      return attempt
    },
    async markAttemptFailed(id) {
      const attempt = attempts.find((item) => item.id === id)
      if (!attempt) throw new Error('missing attempt')

      attempt.status = 'failed'
      return attempt
    },
  }

  return { attempts, repo }
}

function createProfileRepositoryFixture(initialProfiles: UserProfileRecord[] = []) {
  const profiles = [...initialProfiles]
  const repo: UserProfileRepository = {
    async getProfileByUserId(userId) {
      return profiles.find((profile) => profile.user_id === userId) ?? null
    },
    async insertProfile(input) {
      const profile: UserProfileRecord = {
        id: `profile_${profiles.length + 1}`,
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
        created_at: input.createdAt ?? '2026-01-01T00:00:00.000Z',
        updated_at: input.updatedAt ?? '2026-01-01T00:00:00.000Z',
      }

      profiles.push(profile)
      return profile
    },
    async updateProfile(userId, input) {
      const profile = profiles.find((item) => item.user_id === userId)
      if (!profile) throw new Error('missing profile')

      Object.assign(profile, input)
      return profile
    },
  }

  return { profiles, repo }
}

describe('resolveQuizEmailCaptureStart', () => {
  it('rejects quiz email capture attempts without quiz_response_id', async () => {
    const result = await resolveQuizEmailCaptureStart({
      quizResponseId: null,
      visitorId: 'visitor_1',
      findQuizResponseById: vi.fn(),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('missing_context')
    }
  })
})

describe('resolveMagicLinkCallback', () => {
  it('links visit and quiz response for quiz email capture attempts', async () => {
    const { repo } = createAttemptRepositoryFixture()
    const { repo: profileRepo } = createProfileRepositoryFixture()

    const attempt = await createQuizEmailCaptureAttempt({
      repo,
      quizResponseId: 'quiz_1',
      normalizedEmail: 'test@example.com',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-02T00:00:00.000Z',
      createId: () => 'attempt_1',
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    const linked: string[] = []
    const result = await resolveMagicLinkCallback({
      authAttemptId: attempt.id,
      authenticatedUser: {
        id: 'user_1',
        email: 'test@example.com',
      },
      authenticatedAt: '2026-01-01T12:00:00.000Z',
      source: {
        source: 'direct',
        medium: null,
        campaign: null,
      },
      authAttemptRepo: repo,
      profileRepo,
      linkVisit: async () => {
        linked.push('visit')
      },
      linkQuizResponse: async () => {
        linked.push('quiz')
      },
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.profileStatus).toBe('created')
    }
    expect(linked).toEqual(['visit', 'quiz'])
  })

  it('does not require quiz response for returning login attempts', async () => {
    const { repo } = createAttemptRepositoryFixture()
    const { repo: profileRepo } = createProfileRepositoryFixture()

    const attempt = await createReturningLoginAttempt({
      repo,
      normalizedEmail: 'test@example.com',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-02T00:00:00.000Z',
      createId: () => 'attempt_1',
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    const linked: string[] = []
    const result = await resolveMagicLinkCallback({
      authAttemptId: attempt.id,
      authenticatedUser: {
        id: 'user_1',
        email: 'test@example.com',
      },
      authenticatedAt: '2026-01-01T12:00:00.000Z',
      source: {
        source: 'direct',
        medium: null,
        campaign: null,
      },
      authAttemptRepo: repo,
      profileRepo,
      linkVisit: async () => {
        linked.push('visit')
      },
      linkQuizResponse: async () => {
        linked.push('quiz')
      },
    })

    expect(result.ok).toBe(true)
    expect(linked).toEqual(['visit'])
  })

  it('rejects expired attempts before linking application data', async () => {
    const { repo } = createAttemptRepositoryFixture()
    const { repo: profileRepo } = createProfileRepositoryFixture()

    const attempt = await createReturningLoginAttempt({
      repo,
      normalizedEmail: 'test@example.com',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-01T00:00:00.000Z',
      createId: () => 'attempt_1',
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    const linked: string[] = []
    const result = await resolveMagicLinkCallback({
      authAttemptId: attempt.id,
      authenticatedUser: {
        id: 'user_1',
        email: 'test@example.com',
      },
      authenticatedAt: '2026-01-02T12:00:00.000Z',
      source: {
        source: 'direct',
        medium: null,
        campaign: null,
      },
      authAttemptRepo: repo,
      profileRepo,
      linkVisit: async () => {
        linked.push('visit')
      },
      linkQuizResponse: async () => {
        linked.push('quiz')
      },
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('expired')
    }
    expect(linked).toEqual([])
  })

  it('rejects attempts when authenticated email does not match normalized email', async () => {
    const { repo } = createAttemptRepositoryFixture()
    const { repo: profileRepo } = createProfileRepositoryFixture()

    const attempt = await createReturningLoginAttempt({
      repo,
      normalizedEmail: 'test@example.com',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-02T00:00:00.000Z',
      createId: () => 'attempt_1',
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    const linked: string[] = []
    const result = await resolveMagicLinkCallback({
      authAttemptId: attempt.id,
      authenticatedUser: {
        id: 'user_1',
        email: 'wrong@example.com',
      },
      authenticatedAt: '2026-01-01T12:00:00.000Z',
      source: {
        source: 'direct',
        medium: null,
        campaign: null,
      },
      authAttemptRepo: repo,
      profileRepo,
      linkVisit: async () => {
        linked.push('visit')
      },
      linkQuizResponse: async () => {
        linked.push('quiz')
      },
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('email_mismatch')
    }
    expect(linked).toEqual([])
  })
})
