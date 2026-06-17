import type { SourceDetectionResult } from '@/lib/analytics/source';

export type VisitRecord = {
  id: string;
  visitor_id: string;
  source: string;
  medium: string | null;
  campaign: string | null;
  landing_url: string | null;
  referrer: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type VisitRepository = {
  createVisit(input: {
    id?: string;
    visitorId: string;
    source: string;
    medium: string | null;
    campaign: string | null;
    landingUrl: string | null;
    referrer: string | null;
    userId?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<VisitRecord>;
  updateVisit?(id: string, input: Partial<Omit<VisitRecord, 'id' | 'created_at'>>): Promise<VisitRecord>;
  getVisitById?(id: string): Promise<VisitRecord | null>;
};

export function ensureVisit(input: {
  repo: VisitRepository;
  visitorId: string;
  source: SourceDetectionResult;
  userId?: string | null;
  visitId?: string;
  createdAt?: string;
  updatedAt?: string;
}): Promise<VisitRecord> {
  if (!input.visitorId) {
    throw new Error('visitorId is required');
  }

  return input.repo.createVisit({
    id: input.visitId,
    visitorId: input.visitorId,
    source: input.source.source,
    medium: input.source.medium,
    campaign: input.source.campaign,
    landingUrl: input.source.landingUrl,
    referrer: input.source.referrer,
    userId: input.userId ?? null,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}
