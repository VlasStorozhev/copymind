"use client"

import { useEffect, useMemo, useRef } from 'react'

import { sendFunnelVisitEvent, type FunnelVisitEventName } from '@/components/funnel/event-client'

export function FunnelEventBeacon({
  eventName,
  metadata,
  enabled = true,
}: {
  eventName: FunnelVisitEventName
  metadata?: Record<string, unknown>
  enabled?: boolean
}) {
  const sent = useRef(false)
  const metadataKey = JSON.stringify(metadata ?? {})
  const metadataStable = useMemo(
    () => JSON.parse(metadataKey) as Record<string, unknown>,
    [metadataKey],
  )

  useEffect(() => {
    if (!enabled || sent.current) {
      return
    }

    sent.current = true
    void sendFunnelVisitEvent({
      eventName,
      metadata: metadataStable,
    })
  }, [enabled, eventName, metadataStable])

  return null
}
