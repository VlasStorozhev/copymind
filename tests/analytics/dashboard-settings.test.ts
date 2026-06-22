import { describe, expect, it } from 'vitest'

import { saveDashboardBusinessInputs } from '@/lib/analytics/dashboardSettings'

describe('saveDashboardBusinessInputs', () => {
  it('replaces saved ad spend rows with the submitted rows', async () => {
    const calls: Array<[string, unknown]> = []
    const client = {
      from(table: string) {
        calls.push(['from', table])

        if (table === 'dashboard_settings') {
          return {
            upsert(values: unknown, options: unknown) {
              calls.push(['settings.upsert', { values, options }])
              return Promise.resolve({ error: null })
            },
          }
        }

        return {
          delete() {
            calls.push(['spend.delete', null])

            return {
              neq(column: string, value: string) {
                calls.push(['spend.neq', { column, value }])
                return Promise.resolve({ error: null })
              },
            }
          },
          insert(values: unknown) {
            calls.push(['spend.insert', values])
            return Promise.resolve({ error: null })
          },
        }
      },
    }

    const result = await saveDashboardBusinessInputs({
      client: client as never,
      productPriceCents: 900,
      entries: [
        {
          id: 'spend_facebook',
          source: ' facebook ',
          medium: 'paid_social',
          campaign: 'launch',
          content: 'video-1',
          spend_cents: 5000,
          currency: 'USD',
        },
      ],
      now: '2026-06-22T10:00:00.000Z',
    })

    expect(result).toEqual({ error: null, status: 200 })
    expect(calls).toEqual([
      ['from', 'dashboard_settings'],
      [
        'settings.upsert',
        {
          values: {
            id: 'default',
            product_price_cents: 900,
            currency: 'USD',
            updated_at: '2026-06-22T10:00:00.000Z',
          },
          options: { onConflict: 'id' },
        },
      ],
      ['from', 'ad_spend_entries'],
      ['spend.delete', null],
      ['spend.neq', { column: 'source', value: '__deleted_by_replace__' }],
      ['from', 'ad_spend_entries'],
      [
        'spend.insert',
        [
          {
            id: 'spend_facebook',
            source: 'facebook',
            medium: 'paid_social',
            campaign: 'launch',
            content: 'video-1',
            spend_cents: 5000,
            currency: 'USD',
            updated_at: '2026-06-22T10:00:00.000Z',
          },
        ],
      ],
    ])
  })
})
