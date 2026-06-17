"use client"

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ExternalLink, LoaderCircle, Mail, RotateCcw, SquarePen } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sendAuthStartEvent, sendFunnelVisitEvent } from '@/components/funnel/event-client'

type StartFormMode = 'quiz_email_capture' | 'returning_login'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function AuthStartForm({
  mode,
  quizResponseId,
  title,
  subtitle,
  submitLabel,
  initialEmail = '',
  pageViewEventName,
  pageViewMetadata,
  recoveryMessage,
}: {
  mode: StartFormMode
  quizResponseId?: string | null
  title: string
  subtitle: string
  submitLabel: string
  initialEmail?: string
  pageViewEventName?: 'email_viewed'
  pageViewMetadata?: Record<string, unknown>
  recoveryMessage?: string | null
}) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(recoveryMessage ?? null)
  const [authAttemptId, setAuthAttemptId] = useState<string | null>(null)
  const [manualLink, setManualLink] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const pageViewMetadataKey = JSON.stringify(pageViewMetadata ?? {})
  const pageViewMetadataStable = useMemo(
    () => JSON.parse(pageViewMetadataKey) as Record<string, unknown>,
    [pageViewMetadataKey],
  )

  useEffect(() => {
    if (!pageViewEventName) {
      return
    }

    void sendFunnelVisitEvent({
      eventName: pageViewEventName,
      metadata: pageViewMetadataStable,
    })
  }, [pageViewEventName, pageViewMetadataStable])

  const canSubmit = useMemo(() => isValidEmail(email) && !isPending, [email, isPending])

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 rounded-2xl border border-border/70 bg-card/95 p-5 shadow-sm shadow-black/5 sm:p-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {mode === 'quiz_email_capture' ? 'Save your result' : 'Sign in'}
        </p>
        <h1 className="text-2xl font-semibold text-balance">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>We could not continue this link</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {status === 'sent' ? (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>{manualLink ? 'Secure link ready' : 'Check your email'}</AlertTitle>
          <AlertDescription>
            {manualLink ? (
              <>
                Email sending is temporarily rate-limited. Open this one-time secure link to continue with your
                decision profile.
              </>
            ) : (
              <>
                We sent a secure sign-in link to <span className="font-medium text-foreground">{email}</span>.
              </>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (!isValidEmail(email)) {
            setStatus('error')
            setErrorMessage('Enter a valid email address.')
            return
          }

          setStatus('sending')
          setErrorMessage(null)
          setManualLink(null)

          startTransition(async () => {
            const response = await sendAuthStartEvent({
              attemptType: mode,
              email,
              quizResponseId,
            })

            if (!response) {
              setStatus('error')
              setErrorMessage('We could not send the link right now.')
              return
            }

            const payload = (await response.json().catch(() => null)) as
              | { auth_attempt_id?: string; error?: string; reason?: string; manual_link?: string }
              | null

            if (!response.ok) {
              setStatus('error')
              setErrorMessage(
                payload?.reason === 'invalid' || payload?.reason === 'missing_context'
                  ? 'We could not find your quiz result'
                  : payload?.error ?? 'We could not send the link right now.',
              )
              return
            }

            setAuthAttemptId(payload?.auth_attempt_id ?? null)
            setManualLink(payload?.manual_link ?? null)
            setStatus('sent')
          })
        }}
      >
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (status === 'error') {
                setStatus('idle')
                setErrorMessage(recoveryMessage ?? null)
              }
              setManualLink(null)
            }}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={!canSubmit} className="gap-2">
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Mail className="size-4" />}
            {status === 'sent' ? 'Resend link' : submitLabel}
          </Button>

          {status === 'sent' ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => {
                setStatus('idle')
                setErrorMessage(null)
                setAuthAttemptId(null)
                setManualLink(null)
              }}
            >
              <SquarePen className="size-4" />
              Change email
            </Button>
          ) : null}

          {manualLink ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => {
                window.location.href = manualLink
              }}
            >
              <ExternalLink className="size-4" />
              Open secure link
            </Button>
          ) : null}

          {authAttemptId ? (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="gap-2"
              onClick={() => {
                setStatus('idle')
                void router.refresh()
              }}
            >
              <RotateCcw className="size-4" />
              Refresh
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
