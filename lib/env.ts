export function getPublicSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL) {
  if (!value) return 'http://localhost:3000';
  return value.replace(/\/$/, '');
}

export function getAuthRedirectBaseUrl({
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL,
  requestUrl,
}: {
  siteUrl?: string
  requestUrl: string
}) {
  try {
    return new URL(requestUrl).origin
  } catch {
    return getPublicSiteUrl(siteUrl)
  }
}
