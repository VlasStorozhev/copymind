import { redirect } from 'next/navigation'

import { AuthStartForm } from '@/components/funnel/auth-start-form'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>
  const authError = typeof params.auth_error === 'string' ? params.auth_error : null

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/app')
  }

  const recoveryMessage =
    authError === 'expired'
      ? 'This link expired. Enter your email to request a fresh one.'
      : authError === 'used'
        ? 'This link was already used. Enter your email to request another one.'
        : authError === 'missing_context'
          ? 'We could not verify that link. Enter your email again.'
          : authError === 'email_mismatch'
            ? 'The sign-in link does not match the current email.'
            : null

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center">
        <Badge variant="outline" className="mb-6 w-fit border-border/70 bg-background/90 px-3 py-1">
          Sign in
        </Badge>
        {recoveryMessage ? (
          <Alert className="mb-4">
            <AlertTitle>Link recovery</AlertTitle>
            <AlertDescription>{recoveryMessage}</AlertDescription>
          </Alert>
        ) : null}
        <AuthStartForm
          mode="returning_login"
          title="Welcome back"
          subtitle="Enter the email tied to your decision profile and we will send a secure sign-in link."
          submitLabel="Send magic link"
          recoveryMessage={recoveryMessage}
        />
      </div>
    </main>
  )
}
