export function getRootMagicLinkRedirectPath(params: Record<string, string | string[] | undefined>) {
  const code = params.code

  if (typeof code !== 'string' || !code) {
    return null
  }

  const redirectParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        redirectParams.append(key, item)
      }
      continue
    }

    if (typeof value === 'string') {
      redirectParams.set(key, value)
    }
  }

  return `/auth/callback?${redirectParams.toString()}`
}
