import { describe, expect, it } from 'vitest';
import { getAuthRedirectBaseUrl, getPublicSiteUrl } from '@/lib/env';

describe('env helpers', () => {
  it('normalizes NEXT_PUBLIC_SITE_URL without trailing slash', () => {
    expect(getPublicSiteUrl('http://localhost:3000/')).toBe('http://localhost:3000');
  });

  it('uses the request origin for auth redirects when NEXT_PUBLIC_SITE_URL is unset', () => {
    expect(getAuthRedirectBaseUrl({ siteUrl: undefined, requestUrl: 'http://localhost:3000/login' })).toBe(
      'http://localhost:3000',
    );
  });

  it('prefers NEXT_PUBLIC_SITE_URL for auth redirects when configured', () => {
    expect(
      getAuthRedirectBaseUrl({
        siteUrl: 'https://project-jodbb.vercel.app/',
        requestUrl: 'http://localhost:3000/login',
      }),
    ).toBe('https://project-jodbb.vercel.app');
  });
});
