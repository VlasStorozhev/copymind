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
  if (siteUrl) {
    return getPublicSiteUrl(siteUrl)
  }

  return new URL(requestUrl).origin
}
