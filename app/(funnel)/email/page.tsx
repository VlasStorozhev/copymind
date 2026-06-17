import Link from 'next/link'
import { cookies } from 'next/headers'

import { AuthStartForm } from '@/components/funnel/auth-start-form'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { resolveQuizEmailCaptureStart } from '@/lib/funnel/auth-start'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function EmailPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>
  const quizResponseId = typeof params.quiz_response_id === 'string' ? params.quiz_response_id : null
  const authError = typeof params.auth_error === 'string' ? params.auth_error : null
  const visitorId = (await cookies()).get('visitor_id')?.value ?? null
  const adminClient = createAdminClient()

  const startResult = await resolveQuizEmailCaptureStart({
    quizResponseId,
    visitorId,
    findQuizResponseById: async (id) => {
      const { data } = await adminClient
        .from('quiz_responses')
        .select('id, visit_id, visitor_id')
        .eq('id', id)
        .maybeSingle()

      return data ?? null
    },
  })

  const recoveryMessage =
    authError === 'expired'
      ? 'This link expired. Enter your email again to send a fresh one.'
      : authError === 'used'
        ? 'This link was already used. Enter your email to request a new one.'
        : authError === 'email_mismatch'
          ? 'The email on this device does not match the one that requested the link.'
          : null

  if (!startResult.ok) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center">
          <Badge variant="outline" className="mb-6 w-fit border-border/70 bg-background/90 px-3 py-1">
            Save your result
          </Badge>
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
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center">
        <Badge variant="outline" className="mb-6 w-fit border-border/70 bg-background/90 px-3 py-1">
          Save your result
        </Badge>
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
      </div>
    </main>
  )
}
