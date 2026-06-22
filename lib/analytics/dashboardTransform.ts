export type DashboardSummary = {
  businessMetrics: Array<{ label: string; value: string; description?: string }>
  summaryMetrics: Array<{ label: string; value: number; description?: string }>
  funnelConversion: Array<{
    step: string
    users: number
    conversionFromPrevious: number | null
    conversionFromLanding: number | null
    costPerUserCents: number | null
  }>
  sourceBreakdown: Array<{
    source: string
    medium: string | null
    campaign: string | null
    content: string | null
    spendCents: number
    visits: number
    quizCompletions: number
    emailSubmissions: number
    magicLinksSent: number
    magicLinksVerified: number
    paywallViews: number
    paywallClicks: number
    quizCompletionRate: number | null
    emailSubmissionRate: number | null
    magicLinkVerificationRate: number | null
    paywallClickRate: number | null
  }>
  registeredUsers: Array<{
    email: string
    firstTouchSource: string | null
    firstTouchMedium: string | null
    firstTouchCampaign: string | null
    firstTouchContent: string | null
    lastTouchSource: string | null
    lastTouchMedium: string | null
    lastTouchCampaign: string | null
    lastTouchContent: string | null
    decisionPattern: string | null
    productInterest: string
    productInterestedAt: string | null
    firstAuthenticatedAt: string
    lastSeenAt: string
  }>
  patternBreakdown: Array<{
    decisionPattern: string
    usersOrVisits: number
    emailSubmissionRate: number | null
    magicLinkVerificationRate: number | null
    paywallViewRate: number | null
    paywallClickRate: number | null
    topSource: string | null
  }>
  sourceByPattern: Array<{
    source: string
    mostCommonDecisionPattern: string | null
    mostCommonBlocker: string | null
    highestConvertingPattern: string | null
  }>
  trafficBreakdown: Array<{
    dimension: 'source' | 'campaign' | 'creative'
    label: string
    spendCents: number
    landingUsers: number
    paywallClicks: number
    ctaRate: number | null
    costPerPaywallClickCents: number | null
  }>
  productPriceCents: number
  currency: string
  adSpendEntries: Array<{
    id: string
    source: string
    medium: string | null
    campaign: string | null
    content: string | null
    spend_cents: number
    currency: string
  }>
}

type VisitRow = {
  id: string
  visitor_id: string
  user_id: string | null
  source: string
  medium: string | null
  campaign: string | null
  content: string | null
  landing_url: string | null
  referrer: string | null
  created_at: string
  updated_at: string
}

type FunnelEventRow = {
  id: string
  visit_id: string
  event_type: string
  user_id: string | null
  step: string | null
  metadata: Record<string, unknown>
  created_at: string
}

type QuizResponseRow = {
  id: string
  visitor_id: string
  user_id: string | null
  visit_id: string
  answers: unknown[]
  gender: string | null
  current_decision: string | null
  decision_context: string | null
  decision_pattern: string | null
  primary_blocker: string | null
  emotional_driver: string | null
  support_preference: string | null
  recommended_starting_point: string | null
  confidence: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

type UserProfileRow = {
  id: string
  user_id: string
  email: string
  email_verified_at: string | null
  first_authenticated_at: string
  first_touch_source: string | null
  first_touch_medium: string | null
  first_touch_campaign: string | null
  first_touch_content: string | null
  last_seen_at: string
  last_touch_source: string | null
  last_touch_medium: string | null
  last_touch_campaign: string | null
  last_touch_content: string | null
  product_interested_at: string | null
  product_interest_source: string | null
  created_at: string
  updated_at: string
}

type DashboardRows = {
  visits: VisitRow[]
  funnelEvents: FunnelEventRow[]
  quizResponses: QuizResponseRow[]
  userProfiles: UserProfileRow[]
  dashboardSettings?: {
    product_price_cents: number
    currency: string
  } | null
  adSpendEntries?: Array<{
    id: string
    source: string
    medium: string | null
    campaign: string | null
    content: string | null
    spend_cents: number
    currency: string
  }>
}

const FUNNEL_STEPS = [
  'landing_viewed',
  'start_clicked',
  'quiz_completed',
  'email_submitted',
  'magic_link_verified',
  'result_viewed',
  'paywall_viewed',
  'paywall_cta_clicked',
]

function divide(numerator: number, denominator: number) {
  if (denominator === 0) {
    return null
  }

  return numerator / denominator
}

function sortByCountThenName(left: [string, number], right: [string, number]) {
  if (right[1] !== left[1]) {
    return right[1] - left[1]
  }

  return left[0].localeCompare(right[0])
}

function getVisitEventMap(funnelEvents: FunnelEventRow[]) {
  const map = new Map<string, Set<string>>()

  for (const event of funnelEvents) {
    const current = map.get(event.visit_id) ?? new Set<string>()
    current.add(event.event_type)
    map.set(event.visit_id, current)
  }

  return map
}

function hasEvent(eventMap: Map<string, Set<string>>, visitId: string, eventName: string) {
  return eventMap.get(visitId)?.has(eventName) ?? false
}

function getLatestQuizResponseByUser(quizResponses: QuizResponseRow[]) {
  const byUser = new Map<string, QuizResponseRow[]>()

  for (const response of quizResponses) {
    if (!response.user_id) {
      continue
    }

    const current = byUser.get(response.user_id) ?? []
    current.push(response)
    byUser.set(response.user_id, current)
  }

  const latestByUser = new Map<string, QuizResponseRow>()

  for (const [userId, responses] of byUser.entries()) {
    const sorted = [...responses].sort((left, right) => {
      const completedCompare = (right.completed_at ?? right.created_at).localeCompare(left.completed_at ?? left.created_at)
      if (completedCompare !== 0) {
        return completedCompare
      }

      return right.created_at.localeCompare(left.created_at)
    })

    latestByUser.set(userId, sorted[0])
  }

  return latestByUser
}

function getTopEntry(counts: Map<string, number>) {
  if (counts.size === 0) {
    return null
  }

  return [...counts.entries()].sort(sortByCountThenName)[0][0]
}

function getSourceByVisit(visits: VisitRow[]) {
  const map = new Map<string, VisitRow>()

  for (const visit of visits) {
    map.set(visit.id, visit)
  }

  return map
}

function formatCurrency(cents: number, currency: string) {
  const amount = cents / 100

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatRoas(value: number | null) {
  if (value === null) {
    return '—'
  }

  return `${value.toFixed(2)}x`
}

function getTotalSpendCents(adSpendEntries: DashboardRows['adSpendEntries']) {
  return (adSpendEntries ?? []).reduce((total, entry) => total + entry.spend_cents, 0)
}

function getSpendForVisit(sourceSpend: DashboardRows['adSpendEntries'], visit: VisitRow) {
  return (sourceSpend ?? [])
    .filter((entry) => entry.source === visit.source)
    .filter((entry) => entry.medium === null || entry.medium === visit.medium)
    .filter((entry) => entry.campaign === null || entry.campaign === visit.campaign)
    .filter((entry) => entry.content === null || entry.content === visit.content)
    .reduce((total, entry) => total + entry.spend_cents, 0)
}

function buildFunnelRows(params: {
  visits: VisitRow[]
  eventMap: Map<string, Set<string>>
  totalSpendCents: number
}) {
  const landingUsers = params.visits.filter((visit) => hasEvent(params.eventMap, visit.id, 'landing_viewed')).length
  let previousUsers: number | null = null

  return FUNNEL_STEPS.map((step) => {
    const users = params.visits.filter((visit) => hasEvent(params.eventMap, visit.id, step)).length
    const row = {
      step,
      users,
      conversionFromPrevious: previousUsers === null ? null : divide(users, previousUsers),
      conversionFromLanding: divide(users, landingUsers),
      costPerUserCents: users === 0 ? null : Math.round(params.totalSpendCents / users),
    }

    previousUsers = users
    return row
  })
}

function getGroupLabel(visit: VisitRow, dimension: 'source' | 'campaign' | 'creative') {
  if (dimension === 'source') {
    return visit.source
  }

  if (dimension === 'campaign') {
    return visit.campaign ?? 'direct'
  }

  return visit.content ?? 'direct'
}

function getSpendGroupLabel(
  entry: NonNullable<DashboardRows['adSpendEntries']>[number],
  dimension: 'source' | 'campaign' | 'creative',
) {
  if (dimension === 'source') {
    return entry.source
  }

  if (dimension === 'campaign') {
    return entry.campaign ?? 'direct'
  }

  return entry.content ?? 'direct'
}

function buildTrafficBreakdown(params: {
  visits: VisitRow[]
  eventMap: Map<string, Set<string>>
  adSpendEntries: NonNullable<DashboardRows['adSpendEntries']>
}) {
  const dimensions: Array<'source' | 'campaign' | 'creative'> = ['source', 'campaign', 'creative']

  return dimensions.flatMap((dimension) => {
    const labels = new Set<string>()

    for (const visit of params.visits) {
      labels.add(getGroupLabel(visit, dimension))
    }

    for (const entry of params.adSpendEntries) {
      labels.add(getSpendGroupLabel(entry, dimension))
    }

    return [...labels]
      .map((label) => {
        const visits = params.visits.filter((visit) => getGroupLabel(visit, dimension) === label)
        const spendCents = params.adSpendEntries
          .filter((entry) => getSpendGroupLabel(entry, dimension) === label)
          .reduce((total, entry) => total + entry.spend_cents, 0)
        const landingUsers = visits.filter((visit) => hasEvent(params.eventMap, visit.id, 'landing_viewed')).length
        const paywallClicks = visits.filter((visit) => hasEvent(params.eventMap, visit.id, 'paywall_cta_clicked')).length

        return {
          dimension,
          label,
          spendCents,
          landingUsers,
          paywallClicks,
          ctaRate: divide(paywallClicks, landingUsers),
          costPerPaywallClickCents: paywallClicks === 0 ? null : Math.round(spendCents / paywallClicks),
        }
      })
      .sort((left, right) => {
        if (right.paywallClicks !== left.paywallClicks) {
          return right.paywallClicks - left.paywallClicks
        }

        return left.label.localeCompare(right.label)
      })
  })
}

function getUniqueEventActors(params: {
  eventName: string
  funnelEvents: FunnelEventRow[]
  visitById: Map<string, VisitRow>
}) {
  const actors = new Set<string>()

  for (const event of params.funnelEvents) {
    if (event.event_type !== params.eventName) {
      continue
    }

    const visit = params.visitById.get(event.visit_id)
    const actorKey = visit?.user_id
      ? `user:${visit.user_id}`
      : event.user_id
        ? `user:${event.user_id}`
        : visit?.visitor_id
          ? `visitor:${visit.visitor_id}`
          : `visit:${event.visit_id}`

    actors.add(actorKey)
  }

  return actors.size
}

function countRepeatQuizUsers(quizResponses: QuizResponseRow[]) {
  const completedCountsByUser = new Map<string, number>()

  for (const response of quizResponses) {
    if (!response.user_id || !response.completed_at) {
      continue
    }

    completedCountsByUser.set(response.user_id, (completedCountsByUser.get(response.user_id) ?? 0) + 1)
  }

  return [...completedCountsByUser.values()].filter((completedCount) => completedCount > 1).length
}

export function buildDashboardSummary(rows: DashboardRows): DashboardSummary {
  const eventMap = getVisitEventMap(rows.funnelEvents)
  const visitById = getSourceByVisit(rows.visits)
  const latestQuizResponseByUser = getLatestQuizResponseByUser(rows.quizResponses)
  const adSpendEntries = rows.adSpendEntries ?? []
  const productPriceCents = rows.dashboardSettings?.product_price_cents ?? 900
  const currency = rows.dashboardSettings?.currency ?? 'USD'
  const totalSpendCents = getTotalSpendCents(adSpendEntries)
  const paywallClickActors = getUniqueEventActors({
    eventName: 'paywall_cta_clicked',
    funnelEvents: rows.funnelEvents,
    visitById,
  })
  const paywallClickVisits = rows.visits.filter((visit) => hasEvent(eventMap, visit.id, 'paywall_cta_clicked')).length
  const estimatedRevenueCents = paywallClickVisits * productPriceCents
  const estimatedProfitCents = estimatedRevenueCents - totalSpendCents
  const intentCpaCents = paywallClickVisits === 0 ? null : Math.round(totalSpendCents / paywallClickVisits)

  const anonymousVisits = rows.visits.filter((visit) => !visit.user_id)
  const anonymousVisitors = new Set(anonymousVisits.map((visit) => visit.visitor_id)).size

  const sourceBreakdown = [...new Set(rows.visits.map((visit) => visit.source))]
    .sort()
    .map((source) => {
      const visits = rows.visits.filter((visit) => visit.source === source)
      const visitCount = visits.length
      const firstVisit = visits[0] ?? null
      const quizCompletions = visits.filter((visit) => hasEvent(eventMap, visit.id, 'quiz_completed')).length
      const emailSubmissions = visits.filter((visit) => hasEvent(eventMap, visit.id, 'email_submitted')).length
      const magicLinksSent = visits.filter((visit) => hasEvent(eventMap, visit.id, 'magic_link_sent')).length
      const magicLinksVerified = visits.filter((visit) => hasEvent(eventMap, visit.id, 'magic_link_verified')).length
      const paywallViews = visits.filter((visit) => hasEvent(eventMap, visit.id, 'paywall_viewed')).length
      const paywallClicks = visits.filter((visit) => hasEvent(eventMap, visit.id, 'paywall_cta_clicked')).length
      const spendCents = visits.reduce((total, visit) => total + getSpendForVisit(adSpendEntries, visit), 0)

      return {
        source,
        medium: firstVisit?.medium ?? null,
        campaign: firstVisit?.campaign ?? null,
        content: firstVisit?.content ?? null,
        spendCents,
        visits: visitCount,
        quizCompletions,
        emailSubmissions,
        magicLinksSent,
        magicLinksVerified,
        paywallViews,
        paywallClicks,
        quizCompletionRate: divide(quizCompletions, visitCount),
        emailSubmissionRate: divide(emailSubmissions, visitCount),
        magicLinkVerificationRate: divide(magicLinksVerified, visitCount),
        paywallClickRate: divide(paywallClicks, visitCount),
      }
    })

  const registeredUsers = [...rows.userProfiles]
    .sort((left, right) => {
      const seenCompare = right.last_seen_at.localeCompare(left.last_seen_at)
      if (seenCompare !== 0) {
        return seenCompare
      }

      return left.email.localeCompare(right.email)
    })
    .map((profile) => {
      const latestResponse = latestQuizResponseByUser.get(profile.user_id) ?? null

      return {
        email: profile.email,
        firstTouchSource: profile.first_touch_source,
        firstTouchMedium: profile.first_touch_medium,
        firstTouchCampaign: profile.first_touch_campaign,
        firstTouchContent: profile.first_touch_content,
        lastTouchSource: profile.last_touch_source,
        lastTouchMedium: profile.last_touch_medium,
        lastTouchCampaign: profile.last_touch_campaign,
        lastTouchContent: profile.last_touch_content,
        decisionPattern: latestResponse?.decision_pattern ?? null,
        productInterest: profile.product_interested_at ? 'Interested' : '—',
        productInterestedAt: profile.product_interested_at,
        firstAuthenticatedAt: profile.first_authenticated_at,
        lastSeenAt: profile.last_seen_at,
      }
    })

  const patternRows = new Map<
    string,
    {
      responses: QuizResponseRow[]
      visits: VisitRow[]
    }
  >()

  for (const response of rows.quizResponses) {
    const decisionPattern = response.decision_pattern ?? 'unknown'
    const current = patternRows.get(decisionPattern) ?? { responses: [], visits: [] }
    current.responses.push(response)
    const visit = visitById.get(response.visit_id)
    if (visit) {
      current.visits.push(visit)
    }
    patternRows.set(decisionPattern, current)
  }

  const patternBreakdown = [...patternRows.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([decisionPattern, item]) => {
      const visits = item.visits.length
      const emailSubmissionRate = divide(
        item.visits.filter((visit) => hasEvent(eventMap, visit.id, 'email_submitted')).length,
        visits,
      )
      const magicLinkVerificationRate = divide(
        item.visits.filter((visit) => hasEvent(eventMap, visit.id, 'magic_link_verified')).length,
        visits,
      )
      const paywallViewRate = divide(
        item.visits.filter((visit) => hasEvent(eventMap, visit.id, 'paywall_viewed')).length,
        visits,
      )
      const paywallClickRate = divide(
        item.visits.filter((visit) => hasEvent(eventMap, visit.id, 'paywall_cta_clicked')).length,
        visits,
      )
      const topSourceCounts = new Map<string, number>()

      for (const visit of item.visits) {
        topSourceCounts.set(visit.source, (topSourceCounts.get(visit.source) ?? 0) + 1)
      }

      return {
        decisionPattern,
        usersOrVisits: item.responses.length,
        emailSubmissionRate,
        magicLinkVerificationRate,
        paywallViewRate,
        paywallClickRate,
        topSource: getTopEntry(topSourceCounts),
      }
    })

  const sourceByPattern = [...new Set(rows.visits.map((visit) => visit.source))]
    .sort()
    .map((source) => {
      const responsesForSource = rows.quizResponses.filter((response) => visitById.get(response.visit_id)?.source === source)

      const patternCounts = new Map<string, number>()
      const blockerCounts = new Map<string, number>()
      const patternConversionCounts = new Map<string, { total: number; converted: number }>()

      for (const response of responsesForSource) {
        const pattern = response.decision_pattern ?? 'unknown'
        const blocker = response.primary_blocker ?? 'unknown'
        const visit = visitById.get(response.visit_id)

        patternCounts.set(pattern, (patternCounts.get(pattern) ?? 0) + 1)
        blockerCounts.set(blocker, (blockerCounts.get(blocker) ?? 0) + 1)

        const current = patternConversionCounts.get(pattern) ?? { total: 0, converted: 0 }
        current.total += 1
        if (visit && hasEvent(eventMap, visit.id, 'paywall_cta_clicked')) {
          current.converted += 1
        }
        patternConversionCounts.set(pattern, current)
      }

      let highestConvertingPattern: string | null = null
      let highestConversionRate = -1

      for (const [pattern, stats] of patternConversionCounts.entries()) {
        const rate = divide(stats.converted, stats.total)
        const normalizedRate = rate ?? -1

        if (
          normalizedRate > highestConversionRate ||
          (normalizedRate === highestConversionRate && pattern.localeCompare(highestConvertingPattern ?? '') < 0)
        ) {
          highestConversionRate = normalizedRate
          highestConvertingPattern = pattern
        }
      }

      return {
        source,
        mostCommonDecisionPattern: getTopEntry(patternCounts),
        mostCommonBlocker: getTopEntry(blockerCounts),
        highestConvertingPattern,
      }
    })

  return {
    businessMetrics: [
      { label: 'Ad Spend', value: formatCurrency(totalSpendCents, currency) },
      {
        label: 'Estimated Revenue',
        value: formatCurrency(estimatedRevenueCents, currency),
        description: `Paywall CTA clicks × ${formatCurrency(productPriceCents, currency)}`,
      },
      { label: 'Estimated Profit', value: formatCurrency(estimatedProfitCents, currency) },
      {
        label: 'ROAS',
        value: formatRoas(totalSpendCents === 0 ? null : estimatedRevenueCents / totalSpendCents),
      },
      {
        label: 'Intent CPA',
        value: intentCpaCents === null ? '—' : formatCurrency(intentCpaCents, currency),
        description: 'Spend / paywall CTA clicks',
      },
      {
        label: 'Paywall CTA Clicks',
        value: String(paywallClickVisits),
        description: 'North Star for MVP validation',
      },
    ],
    summaryMetrics: [
      { label: 'Total visits', value: rows.visits.length },
      { label: 'Anonymous visitors', value: anonymousVisitors },
      {
        label: 'Quiz completed',
        value: getUniqueEventActors({ eventName: 'quiz_completed', funnelEvents: rows.funnelEvents, visitById }),
      },
      {
        label: 'Emails submitted',
        value: getUniqueEventActors({ eventName: 'email_submitted', funnelEvents: rows.funnelEvents, visitById }),
      },
      { label: 'Registered users', value: rows.userProfiles.length },
      { label: 'Repeat quiz users', value: countRepeatQuizUsers(rows.quizResponses) },
      {
        label: 'Buy intents',
        value: paywallClickActors,
      },
    ],
    funnelConversion: buildFunnelRows({
      visits: rows.visits,
      eventMap,
      totalSpendCents,
    }),
    sourceBreakdown,
    registeredUsers,
    patternBreakdown,
    sourceByPattern,
    trafficBreakdown: buildTrafficBreakdown({
      visits: rows.visits,
      eventMap,
      adSpendEntries,
    }),
    productPriceCents,
    currency,
    adSpendEntries: adSpendEntries.map((entry) => ({
      id: entry.id,
      source: entry.source,
      medium: entry.medium,
      campaign: entry.campaign,
      content: entry.content,
      spend_cents: entry.spend_cents,
      currency: entry.currency,
    })),
  }
}
