import { existsSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

describe('middleware edge bundle', () => {
  it('does not create an edge middleware bundle for auth checks', () => {
    expect(existsSync('middleware.ts')).toBe(false)
  })
})
