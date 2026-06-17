import { describe, expect, it } from 'vitest';

import { detectSource } from '@/lib/analytics/source';

describe('detectSource', () => {
  it('prefers utm_source', () => {
    const result = detectSource({
      url: 'https://example.com/?utm_source=google&utm_medium=cpc&utm_campaign=launch',
      referrer: 'https://referrer.example.com/path',
    });

    expect(result).toEqual({
      source: 'google',
      medium: 'cpc',
      campaign: 'launch',
      landingUrl: 'https://example.com/?utm_source=google&utm_medium=cpc&utm_campaign=launch',
      referrer: 'https://referrer.example.com/path',
    });
  });

  it('falls back to the referrer hostname when utm_source is missing', () => {
    const result = detectSource({
      url: 'https://example.com/pricing',
      referrer: 'https://www.facebook.com/some/path',
    });

    expect(result).toEqual({
      source: 'facebook.com',
      medium: null,
      campaign: null,
      landingUrl: 'https://example.com/pricing',
      referrer: 'https://www.facebook.com/some/path',
    });
  });

  it('falls back to direct when there is no source or valid referrer', () => {
    const result = detectSource({
      url: 'https://example.com/',
      referrer: '',
    });

    expect(result).toEqual({
      source: 'direct',
      medium: null,
      campaign: null,
      landingUrl: 'https://example.com/',
      referrer: '',
    });
  });
});
