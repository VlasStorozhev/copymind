import { describe, expect, it } from 'vitest';

import { FUNNEL_EVENTS, trackEvent } from '@/lib/analytics/events';

describe('trackEvent', () => {
  it('accepts canonical event names', () => {
    expect(() =>
      trackEvent({
        eventName: FUNNEL_EVENTS[0],
        visitId: 'visit_1',
      }),
    ).not.toThrow();
  });

  it('rejects unknown event names', () => {
    expect(() =>
      trackEvent({
        eventName: 'quiz_completed_returning',
        visitId: 'visit_1',
      } as never),
    ).toThrow(/canonical/i);
  });

  it('stores event metadata without changing the event name', () => {
    const result = trackEvent({
      eventName: 'quiz_question_answered',
      visitId: 'visit_1',
      metadata: {
        question_id: 'decision_behavior',
        answer_id: 'overthink_every_option',
      },
    });

    expect(result.eventName).toBe('quiz_question_answered');
    expect(result.metadata).toEqual({
      question_id: 'decision_behavior',
      answer_id: 'overthink_every_option',
    });
  });
});
