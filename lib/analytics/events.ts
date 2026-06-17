export const FUNNEL_EVENTS = [
  'landing_viewed',
  'start_clicked',
  'quiz_started',
  'quiz_question_answered',
  'quiz_completed',
  'email_viewed',
  'email_submitted',
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

export type TrackEventInput = {
  eventName: string;
  visitId: string;
  userId?: string | null;
  step?: string | null;
  metadata?: FunnelEventMetadata;
};

export type TrackedEvent = {
  eventName: FunnelEventName;
  visitId: string;
  userId: string | null;
  step: string | null;
  metadata: FunnelEventMetadata;
};

function isCanonicalEventName(eventName: string): eventName is FunnelEventName {
  return (FUNNEL_EVENTS as readonly string[]).includes(eventName);
}

export function trackEvent(input: TrackEventInput): TrackedEvent {
  if (!isCanonicalEventName(input.eventName)) {
    throw new Error(`Event name must be canonical: ${input.eventName}`);
  }

  return {
    eventName: input.eventName,
    visitId: input.visitId,
    userId: input.userId ?? null,
    step: input.step ?? null,
    metadata: input.metadata ?? {},
  };
}
