import { describe, expect, it } from 'vitest';

import { getOrCreateVisitorId } from '@/lib/analytics/visitor';

describe('getOrCreateVisitorId', () => {
  it('reuses an existing visitor_id cookie', () => {
    const result = getOrCreateVisitorId({
      existingVisitorId: 'visitor_existing',
      createId: () => 'visitor_created',
    });

    expect(result).toEqual({
      visitorId: 'visitor_existing',
      shouldSetCookie: false,
    });
  });

  it('creates a uuid-like visitor_id when missing', () => {
    const result = getOrCreateVisitorId({
      createId: () => '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.visitorId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.shouldSetCookie).toBe(true);
  });

  it('keeps a generated visitor_id stable when stored and reused', () => {
    const created = getOrCreateVisitorId({
      createId: () => '550e8400-e29b-41d4-a716-446655440000',
    });

    const reused = getOrCreateVisitorId({
      existingVisitorId: created.visitorId,
      createId: () => '11111111-1111-4111-8111-111111111111',
    });

    expect(created.shouldSetCookie).toBe(true);
    expect(reused).toEqual({
      visitorId: '550e8400-e29b-41d4-a716-446655440000',
      shouldSetCookie: false,
    });
  });
});
