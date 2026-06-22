type QueryResult = { error: { message: string } | null }
type AwaitableQueryResult = PromiseLike<QueryResult>

type DashboardSettingsClient = {
  from(table: 'dashboard_settings'): {
    upsert(
      values: {
        id: string
        product_price_cents: number
        currency: string
        updated_at: string
      },
      options: { onConflict: string },
    ): AwaitableQueryResult
  }
  from(table: 'ad_spend_entries'): {
    delete(): {
      neq(column: string, value: string): AwaitableQueryResult
    }
    insert(
      values: Array<{
        id: string
        source: string
        medium: string | null
        campaign: string | null
        content: string | null
        spend_cents: number
        currency: string
        updated_at: string
      }>,
    ): AwaitableQueryResult
  }
}

export type DashboardSpendInput = {
  id?: string
  source?: string
  medium?: string | null
  campaign?: string | null
  content?: string | null
  spend_cents?: number
  currency?: string
}

export async function saveDashboardBusinessInputs({
  client,
  productPriceCents,
  entries,
  now = new Date().toISOString(),
  createId = () => crypto.randomUUID(),
}: {
  client: DashboardSettingsClient
  productPriceCents: number
  entries: DashboardSpendInput[]
  now?: string
  createId?: () => string
}) {
  const { error: settingsError } = await client.from('dashboard_settings').upsert(
    {
      id: 'default',
      product_price_cents: productPriceCents,
      currency: 'USD',
      updated_at: now,
    },
    { onConflict: 'id' },
  )

  if (settingsError) {
    return { error: settingsError.message, status: 500 }
  }

  const normalizedEntries = []
  for (const entry of entries) {
    const source = entry.source?.trim()
    const spendCents = Math.round(Number(entry.spend_cents ?? 0))

    if (!source || !Number.isFinite(spendCents) || spendCents < 0) {
      return { error: 'Each spend entry requires source and non-negative spend_cents', status: 400 }
    }

    normalizedEntries.push({
      id: entry.id && !entry.id.startsWith('new-') ? entry.id : createId(),
      source,
      medium: entry.medium || null,
      campaign: entry.campaign || null,
      content: entry.content || null,
      spend_cents: spendCents,
      currency: entry.currency || 'USD',
      updated_at: now,
    })
  }

  const { error: deleteError } = await client.from('ad_spend_entries').delete().neq('source', '__deleted_by_replace__')

  if (deleteError) {
    return { error: deleteError.message, status: 500 }
  }

  if (normalizedEntries.length === 0) {
    return { error: null, status: 200 }
  }

  const { error: insertError } = await client.from('ad_spend_entries').insert(normalizedEntries)

  if (insertError) {
    return { error: insertError.message, status: 500 }
  }

  return { error: null, status: 200 }
}
