import { describe, expect, it, vi } from 'vitest';

import { FUNNEL_EVENTS, trackEvent } from '@/lib/analytics/events';
import type { FunnelEventRecord, FunnelEventRepository } from '@/lib/analytics/events';

function createRepositoryFixture() {
  const events: FunnelEventRecord[] = [];
  const repo: FunnelEventRepository = {
    async findEventByVisitAndName({ visitId, eventName }) {
      return (
        events.find((event) => event.visit_id === visitId && event.event_type === eventName) ?? null
      );
    },
    async createEvent(input) {
      const record: FunnelEventRecord = {
        id: `event_${events.length + 1}`,
        visit_id: input.visitId,
        event_type: input.eventName,
        user_id: input.userId ?? null,
        step: input.step ?? null,
        metadata: input.metadata ?? {},
        created_at: input.createdAt ?? '2026-01-01T00:00:00.000Z',
      };

      events.push(record);
      return record;
    },
  };

  return { events, repo };
}

describe('trackEvent', () => {
  it('accepts canonical event names', async () => {
    const result = await trackEvent({
      eventName: FUNNEL_EVENTS[0],
      visitId: 'visit_1',
    });

    expect(result.event.event_type).toBe('landing_viewed');
    expect(result.created).toBe(true);
  });

  it('rejects unknown event names', async () => {
    await expect(
      trackEvent({
        eventName: 'quiz_completed_returning',
        visitId: 'visit_1',
      } as never),
    ).rejects.toThrow(/canonical/i);
  });

  it('stores event metadata without changing the event name', async () => {
    const result = await trackEvent({
      eventName: 'quiz_question_answered',
      visitId: 'visit_1',
      metadata: {
        question_id: 'decision_behavior',
        answer_id: 'overthink_every_option',
      },
    });

    expect(result.event.event_type).toBe('quiz_question_answered');
    expect(result.event.metadata).toEqual({
      question_id: 'decision_behavior',
      answer_id: 'overthink_every_option',
    });
  });

  it('reuses an existing conversion event for the same visit and event name', async () => {
    const { events, repo } = createRepositoryFixture();
    const existingEvent: FunnelEventRecord = {
      id: 'event_1',
      visit_id: 'visit_1',
      event_type: 'start_clicked',
      user_id: null,
      step: null,
      metadata: { source: 'existing' },
      created_at: '2026-01-01T00:00:00.000Z',
    };
    events.push(existingEvent);
    const createEventSpy = vi.spyOn(repo, 'createEvent');

    const result = await trackEvent({
      repo,
      eventName: 'start_clicked',
      visitId: 'visit_1',
      metadata: { source: 'fresh' },
    });

    expect(result.created).toBe(false);
    expect(result.event).toBe(existingEvent);
    expect(createEventSpy).not.toHaveBeenCalled();
    expect(events).toHaveLength(1);
  });

  it('creates a new record for repeatable page-style events', async () => {
    const { events, repo } = createRepositoryFixture();
    events.push({
      id: 'event_1',
      visit_id: 'visit_1',
      event_type: 'landing_viewed',
      user_id: null,
      step: null,
      metadata: {},
      created_at: '2026-01-01T00:00:00.000Z',
    });

    const result = await trackEvent({
      repo,
      eventName: 'landing_viewed',
      visitId: 'visit_1',
      metadata: { reload: true },
    });

    expect(result.created).toBe(true);
    expect(events).toHaveLength(2);
    expect(events[1].metadata).toEqual({ reload: true });
  });
});
