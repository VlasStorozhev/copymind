export function getPublicSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL) {
  if (!value) return 'http://localhost:3000';
  return value.replace(/\/$/, '');
}
