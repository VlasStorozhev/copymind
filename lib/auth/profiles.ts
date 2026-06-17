export type UserProfileRecord = {
  id: string;
  user_id: string;
  email: string;
  email_verified_at: string | null;
  first_authenticated_at: string;
  first_touch_source: string | null;
  first_touch_medium: string | null;
  first_touch_campaign: string | null;
  last_seen_at: string;
  last_touch_source: string | null;
  last_touch_medium: string | null;
  last_touch_campaign: string | null;
  created_at: string;
  updated_at: string;
};

export type UserProfileRepository = {
  getProfileByUserId(userId: string): Promise<UserProfileRecord | null>;
  insertProfile(input: {
    userId: string;
    email: string;
    emailVerifiedAt?: string | null;
    firstAuthenticatedAt: string;
    firstTouchSource: string | null;
    firstTouchMedium: string | null;
    firstTouchCampaign: string | null;
    lastSeenAt: string;
    lastTouchSource: string | null;
    lastTouchMedium: string | null;
    lastTouchCampaign: string | null;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<UserProfileRecord>;
  updateProfile(
    userId: string,
    input: Partial<{
      email: string;
      emailVerifiedAt: string | null;
      firstAuthenticatedAt: string;
      firstTouchSource: string | null;
      firstTouchMedium: string | null;
      firstTouchCampaign: string | null;
      lastSeenAt: string;
      lastTouchSource: string | null;
      lastTouchMedium: string | null;
      lastTouchCampaign: string | null;
      updatedAt: string;
    }>,
  ): Promise<UserProfileRecord>;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function upsertUserProfileAfterAuth(input: {
  repo: UserProfileRepository;
  userId: string;
  email: string;
  authenticatedAt: string;
  source: {
    source: string;
    medium: string | null;
    campaign: string | null;
  };
}): Promise<UserProfileRecord> {
  const normalizedEmail = normalizeEmail(input.email);

  return input.repo.getProfileByUserId(input.userId).then((existingProfile) => {
    if (!existingProfile) {
      return input.repo.insertProfile({
        userId: input.userId,
        email: normalizedEmail,
        emailVerifiedAt: input.authenticatedAt,
        firstAuthenticatedAt: input.authenticatedAt,
        firstTouchSource: input.source.source,
        firstTouchMedium: input.source.medium,
        firstTouchCampaign: input.source.campaign,
        lastSeenAt: input.authenticatedAt,
        lastTouchSource: input.source.source,
        lastTouchMedium: input.source.medium,
        lastTouchCampaign: input.source.campaign,
      });
    }

    return input.repo.updateProfile(input.userId, {
      email: normalizedEmail,
      emailVerifiedAt: input.authenticatedAt,
      lastSeenAt: input.authenticatedAt,
      lastTouchSource: input.source.source,
      lastTouchMedium: input.source.medium,
      lastTouchCampaign: input.source.campaign,
      updatedAt: input.authenticatedAt,
    });
  });
}
