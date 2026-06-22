import { redirect } from 'next/navigation'

import { LandingShell } from '@/components/funnel/landing-shell'
import { getRootMagicLinkRedirectPath } from '@/lib/funnel/root-callback'

export default async function LandingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>
  const callbackRedirectPath = getRootMagicLinkRedirectPath(params)

  if (callbackRedirectPath) {
    redirect(callbackRedirectPath)
  }

  return <LandingShell />
}
