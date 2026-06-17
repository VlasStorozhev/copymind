import { describe, expect, it } from 'vitest';
import { getPublicSiteUrl } from '@/lib/env';

describe('env helpers', () => {
  it('normalizes NEXT_PUBLIC_SITE_URL without trailing slash', () => {
    expect(getPublicSiteUrl('http://localhost:3000/')).toBe('http://localhost:3000');
  });
});
