import { describe, expect, it, vi } from 'vitest';

import {
  createQuizEmailCaptureAttempt,
  createReturningLoginAttempt,
  verifyAuthAttempt,
} from '@/lib/auth/attempts';
import type { AuthAttemptRepository, AuthAttemptRecord, AuthAttemptStatus } from '@/lib/auth/attempts';

function createRepositoryFixture() {
  const attempts: AuthAttemptRecord[] = [];
  const repo: AuthAttemptRepository = {
    async createAttempt(input) {
      const record: AuthAttemptRecord = {
        id: `attempt_${attempts.length + 1}`,
        attempt_type: input.attemptType,
        normalized_email: input.normalizedEmail,
        quiz_response_id: input.quizResponseId ?? null,
        redirect_path: input.redirectPath ?? '/app',
        status: 'pending',
        visitor_id: input.visitorId ?? null,
        visit_id: input.visitId ?? null,
        user_id: null,
        verified_at: null,
        created_at: input.createdAt ?? '2026-01-01T00:00:00.000Z',
        expires_at: input.expiresAt,
      };

      attempts.push(record);
      return record;
    },
    async expirePendingAttemptsByQuizResponseId(quizResponseId) {
      for (const attempt of attempts) {
        if (attempt.quiz_response_id === quizResponseId && attempt.status === 'pending') {
          attempt.status = 'expired';
        }
      }
    },
    async expirePendingAttemptsByNormalizedEmail(normalizedEmail) {
      for (const attempt of attempts) {
        if (attempt.normalized_email === normalizedEmail && attempt.status === 'pending') {
          attempt.status = 'expired';
        }
      }
    },
    async listAttemptsByContext(context) {
      return attempts
        .filter((attempt) => {
          if (context.attemptType !== attempt.attempt_type) {
            return false;
          }

          if (context.attemptType === 'quiz_email_capture') {
            return attempt.quiz_response_id === context.quizResponseId;
          }

          return attempt.normalized_email === context.normalizedEmail;
        })
        .sort((left, right) => left.created_at.localeCompare(right.created_at));
    },
    async getAttemptById(id) {
      return attempts.find((attempt) => attempt.id === id) ?? null;
    },
    async markAttemptVerified(id, input) {
      const attempt = attempts.find((item) => item.id === id);
      if (!attempt) {
        throw new Error('missing attempt');
      }

      attempt.status = 'verified';
      attempt.user_id = input.userId ?? null;
      attempt.verified_at = input.verifiedAt;
      return attempt;
    },
    async markAttemptFailed(id) {
      const attempt = attempts.find((item) => item.id === id);
      if (!attempt) {
        throw new Error('missing attempt');
      }

      attempt.status = 'failed';
      return attempt;
    },
    async linkAttemptToVisit() {},
    async linkAttemptToQuizResponse() {},
    async upsertUserProfile() {},
    async getProfileByUserId() {
      return null;
    },
  };

  return { attempts, repo };
}

describe('auth attempts', () => {
  it('requires quizResponseId for quiz email capture attempts', async () => {
    const { repo } = createRepositoryFixture();

    await expect(
      createQuizEmailCaptureAttempt({
        repo,
        normalizedEmail: 'test@example.com',
        visitorId: 'visitor_1',
        visitId: 'visit_1',
        redirectPath: '/app',
        expiresAt: '2026-01-02T00:00:00.000Z',
      } as never),
    ).rejects.toThrow(/quizResponseId/i);
  });

  it('rejects quizResponseId for returning login attempts', async () => {
    const { repo } = createRepositoryFixture();

    await expect(
      createReturningLoginAttempt({
        repo,
        normalizedEmail: 'test@example.com',
        quizResponseId: 'quiz_1',
        visitorId: 'visitor_1',
        visitId: 'visit_1',
        redirectPath: '/app',
        expiresAt: '2026-01-02T00:00:00.000Z',
      } as never),
    ).rejects.toThrow(/quizResponseId/i);
  });

  it('expires older pending quiz email capture attempts for the same quiz response', async () => {
    const { attempts, repo } = createRepositoryFixture();

    await createQuizEmailCaptureAttempt({
      repo,
      quizResponseId: 'quiz_1',
      normalizedEmail: 'test@example.com',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-02T00:00:00.000Z',
      createId: () => 'attempt_1',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    await createQuizEmailCaptureAttempt({
      repo,
      quizResponseId: 'quiz_1',
      normalizedEmail: 'test@example.com',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-03T00:00:00.000Z',
      createId: () => 'attempt_2',
      createdAt: '2026-01-02T00:00:00.000Z',
    });

    expect(attempts.map((attempt) => attempt.status)).toEqual(['expired', 'pending']);
  });

  it('expires older pending returning login attempts for the same normalized email', async () => {
    const { attempts, repo } = createRepositoryFixture();

    await createReturningLoginAttempt({
      repo,
      normalizedEmail: 'test@example.com',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-02T00:00:00.000Z',
      createId: () => 'attempt_1',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    await createReturningLoginAttempt({
      repo,
      normalizedEmail: ' TEST@example.com ',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-03T00:00:00.000Z',
      createId: () => 'attempt_2',
      createdAt: '2026-01-02T00:00:00.000Z',
    });

    expect(attempts.map((attempt) => attempt.status)).toEqual(['expired', 'pending']);
  });

  it('rejects superseded, expired, failed, verified, and email-mismatched attempts before linking data', async () => {
    const { attempts, repo } = createRepositoryFixture();

    await createReturningLoginAttempt({
      repo,
      normalizedEmail: 'test@example.com',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-02T00:00:00.000Z',
      createId: () => 'attempt_1',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const latest = await createReturningLoginAttempt({
      repo,
      normalizedEmail: 'test@example.com',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-03T00:00:00.000Z',
      createId: () => 'attempt_2',
      createdAt: '2026-01-02T00:00:00.000Z',
    });

    const expiredAttempt = attempts[0];
    const verifiedAttempt = attempts[1];
    verifiedAttempt.status = 'verified';
    verifiedAttempt.user_id = 'user_1';
    verifiedAttempt.verified_at = '2026-01-02T00:00:01.000Z';

    const failedAttempt: AuthAttemptRecord = {
      id: 'attempt_3',
      attempt_type: 'returning_login',
      normalized_email: 'test@example.com',
      quiz_response_id: null,
      redirect_path: '/app',
      status: 'failed',
      visitor_id: 'visitor_1',
      visit_id: 'visit_1',
      user_id: null,
      verified_at: null,
      created_at: '2026-01-03T00:00:00.000Z',
      expires_at: '2026-01-04T00:00:00.000Z',
    };
    attempts.push(failedAttempt);

    const linkingCalls: string[] = [];

    const expiredResult = await verifyAuthAttempt({
      repo,
      authAttemptId: expiredAttempt.id,
      authenticatedEmail: 'test@example.com',
      linkVisit: async () => {
        linkingCalls.push('visit');
      },
      linkQuizResponse: async () => {
        linkingCalls.push('quiz');
      },
      upsertUserProfile: async () => {
        linkingCalls.push('profile');
      },
    });
    expect(expiredResult.ok).toBe(false);

    const verifiedResult = await verifyAuthAttempt({
      repo,
      authAttemptId: verifiedAttempt.id,
      authenticatedEmail: 'test@example.com',
      linkVisit: async () => {
        linkingCalls.push('visit');
      },
      linkQuizResponse: async () => {
        linkingCalls.push('quiz');
      },
      upsertUserProfile: async () => {
        linkingCalls.push('profile');
      },
    });
    expect(verifiedResult.ok).toBe(false);

    const failedResult = await verifyAuthAttempt({
      repo,
      authAttemptId: failedAttempt.id,
      authenticatedEmail: 'test@example.com',
      linkVisit: async () => {
        linkingCalls.push('visit');
      },
      linkQuizResponse: async () => {
        linkingCalls.push('quiz');
      },
      upsertUserProfile: async () => {
        linkingCalls.push('profile');
      },
    });
    expect(failedResult.ok).toBe(false);

    const mismatchedResult = await verifyAuthAttempt({
      repo,
      authAttemptId: latest.id,
      authenticatedEmail: 'wrong@example.com',
      linkVisit: async () => {
        linkingCalls.push('visit');
      },
      linkQuizResponse: async () => {
        linkingCalls.push('quiz');
      },
      upsertUserProfile: async () => {
        linkingCalls.push('profile');
      },
    });
    expect(mismatchedResult.ok).toBe(false);
    expect(linkingCalls).toEqual([]);
  });

  it('accepts the latest pending attempt and links application data', async () => {
    const { repo } = createRepositoryFixture();

    await createQuizEmailCaptureAttempt({
      repo,
      quizResponseId: 'quiz_1',
      normalizedEmail: 'test@example.com',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-03T00:00:00.000Z',
      createId: () => 'attempt_1',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const latest = await createQuizEmailCaptureAttempt({
      repo,
      quizResponseId: 'quiz_1',
      normalizedEmail: 'test@example.com',
      visitorId: 'visitor_1',
      visitId: 'visit_1',
      redirectPath: '/app',
      expiresAt: '2026-01-04T00:00:00.000Z',
      createId: () => 'attempt_2',
      createdAt: '2026-01-02T00:00:00.000Z',
    });

    const linked: string[] = [];
    const result = await verifyAuthAttempt({
      repo,
      authAttemptId: latest.id,
      authenticatedEmail: 'test@example.com',
      now: '2026-01-02T12:00:00.000Z',
      linkVisit: async () => {
        linked.push('visit');
      },
      linkQuizResponse: async () => {
        linked.push('quiz');
      },
      upsertUserProfile: async () => {
        linked.push('profile');
      },
    });

    expect(result.ok).toBe(true);
    expect(linked).toEqual(['visit', 'quiz', 'profile']);
  });
});
