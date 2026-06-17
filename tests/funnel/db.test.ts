import { describe, expect, it } from 'vitest'

import { markUserProductInterest } from '@/lib/funnel/db'

describe('markUserProductInterest', () => {
  it('stores the first product interest timestamp for a registered user', async () => {
    const calls: Array<[string, unknown]> = []
    const client = {
      from(table: string) {
        calls.push(['from', table])

        return {
          update(values: unknown) {
            calls.push(['update', values])

            return {
              eq(column: string, value: unknown) {
                calls.push(['eq', { column, value }])

                return {
                  is(column: string, value: unknown) {
                    calls.push(['is', { column, value }])

                    return {
                      select(columns: string) {
                        calls.push(['select', columns])

                        return {
                          maybeSingle() {
                            calls.push(['maybeSingle', null])

                            return Promise.resolve({
                              data: {
                                user_id: 'user_123',
                                product_interested_at: '2026-06-18T10:00:00.000Z',
                                product_interest_source: 'mock_paywall_buy',
                              },
                            })
                          },
                        }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
    }

    const result = await markUserProductInterest({
      client: client as never,
      userId: 'user_123',
      interestedAt: '2026-06-18T10:00:00.000Z',
      source: 'mock_paywall_buy',
    })

    expect(calls).toEqual([
      ['from', 'user_profiles'],
      [
        'update',
        {
          product_interested_at: '2026-06-18T10:00:00.000Z',
          product_interest_source: 'mock_paywall_buy',
          updated_at: '2026-06-18T10:00:00.000Z',
        },
      ],
      ['eq', { column: 'user_id', value: 'user_123' }],
      ['is', { column: 'product_interested_at', value: null }],
      ['select', 'user_id, product_interested_at, product_interest_source'],
      ['maybeSingle', null],
    ])
    expect(result).toEqual({
      user_id: 'user_123',
      product_interested_at: '2026-06-18T10:00:00.000Z',
      product_interest_source: 'mock_paywall_buy',
    })
  })
})
