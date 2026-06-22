import { normalizeEmail, type UserProfileRepository, upsertUserProfileAfterAuth } from '@/lib/auth/profiles';

export type AuthAttemptStatus = 'pending' | 'verified' | 'expired' | 'failed';
export type AuthAttemptType = 'quiz_email_capture' | 'returning_login';

export type AuthAttemptRecord = {
  id: string;
  attempt_type: AuthAttemptType;
  normalized_email: string;
  quiz_response_id: string | null;
  redirect_path: string;
  status: AuthAttemptStatus;
  user_id: string | null;
  verified_at: string | null;
  visit_id: string | null;
  visitor_id: string | null;
  created_at: string;
  expires_at: string;
};

export type AuthAttemptContext =
  | {
      attemptType: 'quiz_email_capture';
      quizResponseId: string;
    }
  | {
      attemptType: 'returning_login';
      normalizedEmail: string;
    };

export type AuthAttemptRepository = {
  createAttempt(input: {
    id?: string;
    attemptType: AuthAttemptType;
    normalizedEmail: string;
    quizResponseId?: string | null;
    redirectPath: string;
    status?: AuthAttemptStatus;
    userId?: string | null;
    verifiedAt?: string | null;
    visitId?: string | null;
    visitorId?: string | null;
    createdAt?: string;
    expiresAt: string;
  }): Promise<AuthAttemptRecord>;
  expirePendingAttemptsByQuizResponseId(quizResponseId: string): Promise<void>;
  expirePendingAttemptsByNormalizedEmail(normalizedEmail: string): Promise<void>;
  listAttemptsByContext(context: AuthAttemptContext): Promise<AuthAttemptRecord[]>;
  getAttemptById(id: string): Promise<AuthAttemptRecord | null>;
  markAttemptVerified(
    id: string,
    input: { userId: string | null; verifiedAt: string },
  ): Promise<AuthAttemptRecord>;
  markAttemptFailed(id: string): Promise<AuthAttemptRecord>;
};

export type AuthAttemptLinkingContext = {
  attempt: AuthAttemptRecord;
  authenticatedEmail: string;
  authenticatedAt?: string;
  linkVisit?: (attempt: AuthAttemptRecord) => Promise<void> | void;
  linkQuizResponse?: (attempt: AuthAttemptRecord) => Promise<void> | void;
  upsertUserProfile?: (attempt: AuthAttemptRecord) => Promise<void> | void;
};

function getAttemptContext(attempt: AuthAttemptRecord): AuthAttemptContext {
  if (attempt.attempt_type === 'quiz_email_capture') {
    return {
      attemptType: 'quiz_email_capture',
      quizResponseId: attempt.quiz_response_id ?? '',
    };
  }

  return {
    attemptType: 'returning_login',
    normalizedEmail: attempt.normalized_email,
  };
}

function isExpired(attempt: AuthAttemptRecord, nowIso: string) {
  return attempt.expires_at <= nowIso;
}

function compareAttempts(left: AuthAttemptRecord, right: AuthAttemptRecord) {
  const createdAtCompare = left.created_at.localeCompare(right.created_at);
  if (createdAtCompare !== 0) {
    return createdAtCompare;
  }

  return left.id.localeCompare(right.id);
}

async function createAuthAttempt(
  input: {
    repo: AuthAttemptRepository;
    attemptType: AuthAttemptType;
    normalizedEmail: string;
    quizResponseId?: string | null;
    visitorId?: string | null;
    visitId?: string | null;
    redirectPath?: string;
    expiresAt: string;
    createId?: () => string;
    createdAt?: string;
  },
  expireOlder: () => Promise<void>,
) {
  const normalizedEmail = normalizeEmail(input.normalizedEmail);
  await expireOlder();

  return input.repo.createAttempt({
    id: input.createId ? input.createId() : undefined,
    attemptType: input.attemptType,
    normalizedEmail,
    quizResponseId: input.quizResponseId ?? null,
    visitorId: input.visitorId ?? null,
    visitId: input.visitId ?? null,
    redirectPath: input.redirectPath ?? '/app',
    status: 'pending',
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
  });
}

export async function createQuizEmailCaptureAttempt(input: {
  repo: AuthAttemptRepository;
  quizResponseId: string;
  normalizedEmail: string;
  visitorId?: string | null;
  visitId?: string | null;
  redirectPath?: string;
  expiresAt: string;
  createId?: () => string;
  createdAt?: string;
}): Promise<AuthAttemptRecord> {
  if (!input.quizResponseId) {
    throw new Error('quizResponseId is required for quiz_email_capture attempts');
  }

  return createAuthAttempt(
    {
      repo: input.repo,
      attemptType: 'quiz_email_capture',
      normalizedEmail: input.normalizedEmail,
      quizResponseId: input.quizResponseId,
      visitorId: input.visitorId,
      visitId: input.visitId,
      redirectPath: input.redirectPath,
      expiresAt: input.expiresAt,
      createId: input.createId,
      createdAt: input.createdAt,
    },
    () => input.repo.expirePendingAttemptsByQuizResponseId(input.quizResponseId),
  );
}

export async function createReturningLoginAttempt(input: {
  repo: AuthAttemptRepository;
  normalizedEmail: string;
  quizResponseId?: string | null;
  visitorId?: string | null;
  visitId?: string | null;
  redirectPath?: string;
  expiresAt: string;
  createId?: () => string;
  createdAt?: string;
}): Promise<AuthAttemptRecord> {
  if (input.quizResponseId) {
    throw new Error('quizResponseId is not allowed for returning_login attempts');
  }

  return createAuthAttempt(
    {
      repo: input.repo,
      attemptType: 'returning_login',
      normalizedEmail: input.normalizedEmail,
      visitorId: input.visitorId,
      visitId: input.visitId,
      redirectPath: input.redirectPath,
      expiresAt: input.expiresAt,
      createId: input.createId,
      createdAt: input.createdAt,
    },
    () => input.repo.expirePendingAttemptsByNormalizedEmail(normalizeEmail(input.normalizedEmail)),
  );
}

export function verifyAuthAttempt(input: {
  repo: AuthAttemptRepository;
  authAttemptId: string;
  authenticatedEmail: string;
  userId?: string | null;
  authenticatedAt?: string;
  now?: string;
  linkVisit?: (attempt: AuthAttemptRecord) => Promise<void> | void;
  linkQuizResponse?: (attempt: AuthAttemptRecord) => Promise<void> | void;
  upsertUserProfile?: (attempt: AuthAttemptRecord) => Promise<void> | void;
}): Promise<
  | { ok: true; attempt: AuthAttemptRecord }
  | { ok: false; reason: 'missing' | 'expired' | 'failed' | 'verified' | 'email_mismatch' | 'superseded' | 'not_pending' }
> {
  return input.repo.getAttemptById(input.authAttemptId).then(async (attempt) => {
    if (!attempt) {
      return { ok: false as const, reason: 'missing' as const };
    }

    const normalizedAuthenticatedEmail = normalizeEmail(input.authenticatedEmail);
    const now = input.now ?? new Date().toISOString();

    if (attempt.normalized_email !== normalizedAuthenticatedEmail) {
      return { ok: false as const, reason: 'email_mismatch' as const };
    }

    if (attempt.status === 'expired') {
      return { ok: false as const, reason: 'expired' as const };
    }

    if (attempt.status === 'failed') {
      return { ok: false as const, reason: 'failed' as const };
    }

    if (attempt.status === 'verified') {
      return { ok: false as const, reason: 'verified' as const };
    }

    if (attempt.status !== 'pending') {
      return { ok: false as const, reason: 'not_pending' as const };
    }

    if (isExpired(attempt, now)) {
      return { ok: false as const, reason: 'expired' as const };
    }

    const latestAttempt = (await input.repo.listAttemptsByContext(getAttemptContext(attempt)))
      .filter((candidate) => candidate.status === 'pending')
      .filter((candidate) => !isExpired(candidate, now))
      .sort(compareAttempts)
      .at(-1);

    if (!latestAttempt || latestAttempt.id !== attempt.id) {
      return { ok: false as const, reason: 'superseded' as const };
    }

    await input.repo.markAttemptVerified(attempt.id, {
      userId: input.userId ?? attempt.user_id,
      verifiedAt: input.authenticatedAt ?? now,
    });

    if (input.linkVisit) {
      await input.linkVisit(attempt);
    }

    if (attempt.attempt_type === 'quiz_email_capture' && input.linkQuizResponse) {
      await input.linkQuizResponse(attempt);
    }

    if (input.upsertUserProfile) {
      await input.upsertUserProfile(attempt);
    }

    return { ok: true as const, attempt };
  });
}

export function verifyAuthAttemptAndUpsertProfile(input: {
  repo: AuthAttemptRepository;
  profileRepo: UserProfileRepository;
  authAttemptId: string;
  authenticatedEmail: string;
  userId: string;
  authenticatedAt: string;
  source: {
    source: string;
    medium: string | null;
    campaign: string | null;
    content?: string | null;
  };
  linkVisit?: (attempt: AuthAttemptRecord) => Promise<void> | void;
  linkQuizResponse?: (attempt: AuthAttemptRecord) => Promise<void> | void;
}): Promise<
  | { ok: true; attempt: AuthAttemptRecord }
  | { ok: false; reason: 'missing' | 'expired' | 'failed' | 'verified' | 'email_mismatch' | 'superseded' | 'not_pending' }
> {
  return verifyAuthAttempt({
    repo: input.repo,
    authAttemptId: input.authAttemptId,
    authenticatedEmail: input.authenticatedEmail,
    userId: input.userId,
    authenticatedAt: input.authenticatedAt,
    now: input.authenticatedAt,
    linkVisit: input.linkVisit,
    linkQuizResponse: input.linkQuizResponse,
    upsertUserProfile: async () => {
      if (!input.userId) {
        return;
      }

      await upsertUserProfileAfterAuth({
        repo: input.profileRepo,
        userId: input.userId,
        email: input.authenticatedEmail,
        authenticatedAt: input.authenticatedAt,
        source: input.source,
      });
    },
  });
}
