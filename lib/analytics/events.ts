export const FUNNEL_EVENTS = [
  'landing_viewed',
  'start_clicked',
  'quiz_started',
  'quiz_question_answered',
  'quiz_completed',
  'email_viewed',
  'email_submitted',
  'email_verified',
  'magic_link_sent',
  'magic_link_verified',
  'magic_link_failed',
  'user_created',
  'user_returned',
  'result_viewed',
  'paywall_viewed',
  'paywall_cta_clicked',
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];

export type FunnelEventMetadata = Record<string, unknown>;

export type FunnelEventRecord = {
  id: string;
  visit_id: string;
  event_type: FunnelEventName;
  user_id: string | null;
  step: string | null;
  metadata: FunnelEventMetadata;
  created_at: string;
};

export type FunnelEventRepository = {
  findEventByVisitAndName(input: {
    visitId: string;
    eventName: FunnelEventName;
  }): Promise<FunnelEventRecord | null>;
  createEvent(input: {
    visitId: string;
    eventName: FunnelEventName;
    userId?: string | null;
    step?: string | null;
    metadata?: FunnelEventMetadata;
    createdAt?: string;
  }): Promise<FunnelEventRecord>;
};

export type TrackEventInput = {
  eventName: string;
  visitId: string;
  repo?: FunnelEventRepository;
  userId?: string | null;
  step?: string | null;
  metadata?: FunnelEventMetadata;
  createdAt?: string;
};

export type TrackEventResult = {
  event: FunnelEventRecord;
  created: boolean;
  deduped: boolean;
};

const DEDUPED_EVENT_NAMES = new Set<FunnelEventName>([
  'start_clicked',
  'quiz_started',
  'quiz_completed',
  'email_submitted',
  'email_verified',
  'magic_link_sent',
  'magic_link_verified',
  'user_created',
  'user_returned',
  'paywall_cta_clicked',
]);

function isCanonicalEventName(eventName: string): eventName is FunnelEventName {
  return (FUNNEL_EVENTS as readonly string[]).includes(eventName);
}

function shouldDeduplicateEvent(eventName: FunnelEventName) {
  return DEDUPED_EVENT_NAMES.has(eventName);
}

function buildEventRecord(input: {
  id: string;
  visitId: string;
  eventName: FunnelEventName;
  userId?: string | null;
  step?: string | null;
  metadata?: FunnelEventMetadata;
  createdAt: string;
}): FunnelEventRecord {
  return {
    id: input.id,
    visit_id: input.visitId,
    event_type: input.eventName,
    user_id: input.userId ?? null,
    step: input.step ?? null,
    metadata: input.metadata ?? {},
    created_at: input.createdAt,
  };
}

export async function trackEvent(input: TrackEventInput): Promise<TrackEventResult> {
  if (!isCanonicalEventName(input.eventName)) {
    throw new Error(`Event name must be canonical: ${input.eventName}`);
  }

  const eventName = input.eventName;
  const createdAt = input.createdAt ?? new Date().toISOString();

  if (input.repo && shouldDeduplicateEvent(eventName)) {
    const existingEvent = await input.repo.findEventByVisitAndName({
      visitId: input.visitId,
      eventName,
    });

    if (existingEvent) {
      return { event: existingEvent, created: false, deduped: true };
    }

    const createdEvent = await input.repo.createEvent({
      visitId: input.visitId,
      eventName,
      userId: input.userId,
      step: input.step,
      metadata: input.metadata,
      createdAt,
    });

    return { event: createdEvent, created: true, deduped: false };
  }

  if (input.repo) {
    const createdEvent = await input.repo.createEvent({
      visitId: input.visitId,
      eventName,
      userId: input.userId,
      step: input.step,
      metadata: input.metadata,
      createdAt,
    });

    return { event: createdEvent, created: true, deduped: false };
  }

  return {
    event: buildEventRecord({
      id: 'event_inline',
      visitId: input.visitId,
      eventName,
      userId: input.userId,
      step: input.step,
      metadata: input.metadata,
      createdAt,
    }),
    created: true,
    deduped: false,
  };
}
