import { describe, expect, it } from 'vitest'

import { getRootMagicLinkRedirectPath } from '@/lib/funnel/root-callback'

describe('root magic link callback fallback', () => {
  it('redirects root Supabase code callbacks to the auth callback route', () => {
    expect(
      getRootMagicLinkRedirectPath({
        code: 'auth_code',
        auth_attempt_id: 'attempt_1',
      }),
    ).toBe('/auth/callback?code=auth_code&auth_attempt_id=attempt_1')
  })

  it('keeps rendering the landing page when no Supabase code is present', () => {
    expect(getRootMagicLinkRedirectPath({ utm_source: 'linkedin' })).toBe(null)
  })
})
