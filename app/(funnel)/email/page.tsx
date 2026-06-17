import { EmailPageShell } from '@/components/funnel/email-page-shell'

export default async function EmailPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>
  const quizResponseId = typeof params.quiz_response_id === 'string' ? params.quiz_response_id : null
  const authError = typeof params.auth_error === 'string' ? params.auth_error : null
  return <EmailPageShell quizResponseId={quizResponseId} authError={authError} />
}
