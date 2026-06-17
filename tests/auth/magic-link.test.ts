import { describe, expect, it } from 'vitest'

import { getGeneratedMagicLink, isEmailRateLimitError } from '@/lib/auth/magic-link'

describe('magic link helpers', () => {
  it('detects Supabase email rate-limit errors', () => {
    expect(isEmailRateLimitError('email rate limit exceeded')).toBe(true)
    expect(isEmailRateLimitError('Email Rate Limit Exceeded')).toBe(true)
    expect(isEmailRateLimitError('invalid email')).toBe(false)
  })

  it('returns only generated http action links', () => {
    expect(
      getGeneratedMagicLink({
        properties: {
          action_link: 'https://example.supabase.co/auth/v1/verify?token=abc',
        },
      }),
    ).toBe('https://example.supabase.co/auth/v1/verify?token=abc')

    expect(getGeneratedMagicLink({ properties: { action_link: '/relative' } })).toBeNull()
    expect(getGeneratedMagicLink({ properties: null })).toBeNull()
  })
})
