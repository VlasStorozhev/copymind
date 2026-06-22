export type SourceDetectionResult = {
  source: string;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  landingUrl: string;
  referrer: string;
};

function normalizeReferrerHost(referrer: string) {
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();

    if (hostname.startsWith('www.')) {
      return hostname.slice(4);
    }

    return hostname;
  } catch {
    return null;
  }
}

function isInternalReferrerHost(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === 'decisionmind.space' ||
    hostname.endsWith('.vercel.app')
  );
}

export function detectSource(input: {
  url: string;
  referrer: string;
}): SourceDetectionResult {
  const landingUrl = input.url;
  const referrer = input.referrer;

  try {
    const parsedUrl = new URL(input.url);
    const utmSource = parsedUrl.searchParams.get('utm_source');
    const utmMedium = parsedUrl.searchParams.get('utm_medium');
    const utmCampaign = parsedUrl.searchParams.get('utm_campaign');
    const utmContent = parsedUrl.searchParams.get('utm_content');

    if (utmSource) {
      return {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        content: utmContent,
        landingUrl,
        referrer,
      };
    }
  } catch {
    // Fall through to direct when the landing URL cannot be parsed.
  }

  const referrerHost = normalizeReferrerHost(referrer);
  if (referrerHost && !isInternalReferrerHost(referrerHost)) {
    return {
      source: referrerHost,
      medium: null,
      campaign: null,
      content: null,
      landingUrl,
      referrer,
    };
  }

  return {
    source: 'direct',
    medium: null,
    campaign: null,
    content: null,
    landingUrl,
    referrer,
  };
}
