"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { AuthStartForm } from '@/components/funnel/auth-start-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

function getRecoveryMessage(authError: string | null) {
  return authError === 'expired'
    ? 'This link expired. Enter your email to request a fresh one.'
    : authError === 'used'
      ? 'This link was already used. Enter your email to request another one.'
      : authError === 'missing_context'
        ? 'We could not verify that link. Enter your email again.'
        : authError === 'email_mismatch'
          ? 'The sign-in link does not match the current email.'
          : null
}

export function LoginPageShell({ authError }: { authError: string | null }) {
  const router = useRouter()
  const recoveryMessage = getRecoveryMessage(authError)

  useEffect(() => {
    let active = true

    async function redirectAuthenticatedUser() {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
      })

      if (!active || !response.ok) {
        return
      }

      const payload = (await response.json()) as { authenticated: boolean }
      if (payload.authenticated) {
        router.replace('/app')
      }
    }

    void redirectAuthenticatedUser().catch(() => undefined)

    return () => {
      active = false
    }
  }, [router])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center">
        {recoveryMessage ? (
          <Alert className="mb-4">
            <AlertTitle>Link recovery</AlertTitle>
            <AlertDescription>{recoveryMessage}</AlertDescription>
          </Alert>
        ) : null}
        <AuthStartForm
          mode="returning_login"
          title="Open your decision profile"
          subtitle="Enter your email and we will send a secure link to your saved decision profile."
          submitLabel="Send secure link"
          recoveryMessage={recoveryMessage}
        />
      </div>
    </main>
  )
}
