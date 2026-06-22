"use client"

import Link from 'next/link'

import { AuthStartForm } from '@/components/funnel/auth-start-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function getRecoveryMessage(authError: string | null) {
  return authError === 'expired'
    ? 'This link expired. Enter your email again to send a fresh one.'
    : authError === 'used'
      ? 'This link was already used. Enter your email to request a new one.'
      : authError === 'email_mismatch'
        ? 'The email on this device does not match the one that requested the link.'
        : null
}

export function EmailPageShell({
  quizResponseId,
  authError,
}: {
  quizResponseId: string | null
  authError: string | null
}) {
  const recoveryMessage = getRecoveryMessage(authError)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div
        data-testid="email-page-content"
        className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center"
      >
        {!quizResponseId ? (
          <div className="space-y-6 rounded-2xl border border-border/70 bg-card/95 p-5 shadow-sm shadow-black/5 sm:p-6">
            <Alert variant="destructive">
              <AlertTitle>We could not find your quiz result</AlertTitle>
              <AlertDescription>
                Please start a fresh assessment and we will create a new decision profile.
              </AlertDescription>
            </Alert>
            <Link href="/quiz" className={cn(buttonVariants({ className: 'w-full sm:w-auto' }))}>
              Start assessment
            </Link>
          </div>
        ) : (
          <>
            {recoveryMessage ? (
              <Alert className="mb-4">
                <AlertTitle>Link recovery</AlertTitle>
                <AlertDescription>{recoveryMessage}</AlertDescription>
              </Alert>
            ) : null}
            <AuthStartForm
              mode="quiz_email_capture"
              quizResponseId={quizResponseId}
              title="Save your decision profile"
              subtitle="Enter your email and we will send a secure link to open your personalized decision profile."
              submitLabel="Send secure link"
              pageViewEventName="email_viewed"
              pageViewMetadata={{ quiz_response_id: quizResponseId }}
              recoveryMessage={recoveryMessage}
            />
          </>
        )}
      </div>
    </main>
  )
}
