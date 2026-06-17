"use client"

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { sendFunnelVisitEvent } from '@/components/funnel/event-client'

const MONTHLY_PRICE = '$9'

export function MockPaywall() {
  const [checkoutRequested, setCheckoutRequested] = useState(false)

  useEffect(() => {
    void sendFunnelVisitEvent({
      eventName: 'paywall_viewed',
      metadata: {
        placement: 'app_profile',
      },
    })
  }, [])

  return (
    <section data-testid="paywall-card" className="grid gap-8 rounded-2xl border border-foreground/15 bg-[linear-gradient(135deg,rgba(17,17,17,0.04),rgba(255,255,255,0.96))] p-6 shadow-sm shadow-black/10 lg:grid-cols-[minmax(0,0.58fr)_minmax(320px,0.42fr)] lg:items-center lg:p-8">
      <div data-testid="paywall-copy-column" className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Decision clarity plan</p>
          <h2 className="text-2xl font-semibold tracking-tight">Turn your profile into a monthly action plan</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Get structured prompts, decision reviews, and a saved framework for the choices you keep postponing.
          </p>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          Next: apply your profile to the next decision you are stuck on.
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:items-end lg:text-right">
        <div data-testid="paywall-price" className="text-left lg:text-right">
          <div className="flex items-end gap-2 lg:justify-end">
            <span className="text-6xl font-semibold tracking-tight">{MONTHLY_PRICE}</span>
            <span className="pb-2 text-xl text-muted-foreground">/ month</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Cancel anytime</p>
        </div>

        {checkoutRequested ? (
          <div className="space-y-1 lg:max-w-xs">
            <p className="text-sm font-medium">Checkout is not connected yet</p>
            <p className="text-sm leading-6 text-muted-foreground">
              We recorded your interest and will connect you.
            </p>
          </div>
        ) : (
          <div data-testid="paywall-action-row" className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              size="lg"
              className="h-12 w-full px-10 text-base sm:w-auto"
              onClick={() => {
                setCheckoutRequested(true)
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
        )}
      </div>
    </section>
  )
}
