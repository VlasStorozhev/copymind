"use client"

import { useEffect, useState } from 'react'

import { QuizWizard } from '@/components/funnel/quiz-wizard'

type SessionSummary = {
  authenticated: boolean
}

export function QuizPageShell() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true

    async function loadSession() {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
      })

      if (!active || !response.ok) {
        setAuthenticated(false)
        return
      }

      const payload = (await response.json()) as SessionSummary
      setAuthenticated(payload.authenticated)
    }

    void loadSession().catch(() => {
      if (active) {
        setAuthenticated(false)
      }
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center">
        <QuizWizard authenticated={authenticated} />
      </div>
    </main>
  )
}
