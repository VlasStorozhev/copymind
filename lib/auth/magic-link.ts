export function isEmailRateLimitError(message: string | null | undefined) {
  return (message ?? '').toLowerCase().includes('email rate limit')
}

export function getGeneratedMagicLink(input: {
  properties?: {
    action_link?: string | null
  } | null
}) {
  const actionLink = input.properties?.action_link

  return typeof actionLink === 'string' && actionLink.startsWith('http') ? actionLink : null
}
