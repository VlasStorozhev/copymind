import { LoginPageShell } from '@/components/funnel/login-page-shell'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>
  const authError = typeof params.auth_error === 'string' ? params.auth_error : null
  return <LoginPageShell authError={authError} />
}
