"use client"

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { sendFunnelVisitEvent } from '@/components/funnel/event-client'

const VALUE_POINTS = [
  'Your top decision trap and how to spot it',
  'A step-by-step clarity framework for your pattern',
  'Prompts for the next decision you are stuck on',
  'A saved decision profile you can revisit later',
]

export function MockPaywall() {
  useEffect(() => {
    void sendFunnelVisitEvent({
      eventName: 'paywall_viewed',
      metadata: {
        placement: 'app_profile',
      },
    })
  }, [])

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm shadow-black/5">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Unlock your decision clarity plan</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Get a structured plan based on your decision pattern, blocker, and support style.
        </p>
      </div>

      <ul className="grid gap-2 text-sm text-foreground sm:grid-cols-2">
        {VALUE_POINTS.map((point) => (
          <li key={point} className="rounded-lg border border-border/70 bg-background/80 px-3 py-2 leading-5">
            {point}
          </li>
        ))}
      </ul>

      <p className="text-sm leading-6 text-muted-foreground">
        Next: apply your profile to the next decision you are stuck on.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => {
            void sendFunnelVisitEvent({
              eventName: 'paywall_cta_clicked',
              metadata: {
                placement: 'app_profile',
              },
            })
          }}
        >
          Buy
        </Button>
      </div>
    </section>
  )
}
