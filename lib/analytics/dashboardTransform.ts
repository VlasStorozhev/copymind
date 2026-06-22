export type DashboardSummary = {
  businessMetrics: Array<{ label: string; value: string; description?: string }>
  summaryMetrics: Array<{ label: string; value: number; description?: string }>
  funnelConversion: Array<{
    step: string
    users: number
    conversionFromPrevious: number | null
    conversionFromVisitors: number | null
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
  trafficTree: TrafficTreeNode[]
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

export type TrafficTreeNode = {
  id: string
  level: 'source' | 'campaign' | 'creative'
  label: string
  spendCents: number
  visitors: number
  quizStarted: number
  quizCompleted: number
  emailSubmitted: number
  purchaseIntent: number
  intentRate: number | null
  costPerIntentCents: number | null
  children: TrafficTreeNode[]
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

const FUNNEL_STEPS: Array<{ label: string; eventName: string | null }> = [
  { label: 'Visitors', eventName: null },
  { label: 'Quiz Started', eventName: 'quiz_started' },
  { label: 'Quiz Completed', eventName: 'quiz_completed' },
  { label: 'Email Submitted', eventName: 'email_submitted' },
  { label: 'Result Viewed', eventName: 'result_viewed' },
  { label: 'Purchase Intent', eventName: 'paywall_cta_clicked' },
]

const EXCLUDED_ACQUISITION_PATH_PREFIXES = [
  '/privacy',
  '/privacy-policy',
  '/terms',
  '/contact',
  '/about',
  '/blog',
  '/dashboard',
  '/email',
  '/login',
  '/auth',
  '/api',
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

function getVisitActorKey(visit: VisitRow) {
  return visit.user_id ? `user:${visit.user_id}` : `visitor:${visit.visitor_id}`
}

function getVisitPath(landingUrl: string | null) {
  if (!landingUrl) {
    return '/'
  }

  try {
    return new URL(landingUrl, 'https://decisionmind.local').pathname || '/'
  } catch {
    return '/'
  }
}

function isExcludedAcquisitionPath(path: string) {
  return EXCLUDED_ACQUISITION_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

function isAcquisitionEntryVisit(visit: VisitRow, eventMap: Map<string, Set<string>>) {
  const path = getVisitPath(visit.landing_url)

  if (isExcludedAcquisitionPath(path)) {
    return false
  }

  return path === '/' || path === '/quiz' || hasEvent(eventMap, visit.id, 'landing_viewed') || hasEvent(eventMap, visit.id, 'quiz_started')
}

function getAcquisitionVisitorActors(visits: VisitRow[], eventMap: Map<string, Set<string>>) {
  const firstEntryByActor = new Map<string, VisitRow>()

  for (const visit of visits) {
    if (!isAcquisitionEntryVisit(visit, eventMap)) {
      continue
    }

    const actorKey = getVisitActorKey(visit)
    const current = firstEntryByActor.get(actorKey)

    if (!current || visit.created_at.localeCompare(current.created_at) < 0) {
      firstEntryByActor.set(actorKey, visit)
    }
  }

  return new Set(firstEntryByActor.keys())
}

function countAcquisitionActorsWithEvent(params: {
  visits: VisitRow[]
  eventMap: Map<string, Set<string>>
  acquisitionActors: Set<string>
  eventName: string
}) {
  const actors = new Set<string>()

  for (const visit of params.visits) {
    const actorKey = getVisitActorKey(visit)

    if (!params.acquisitionActors.has(actorKey) || !hasEvent(params.eventMap, visit.id, params.eventName)) {
      continue
    }

    actors.add(actorKey)
  }

  return actors.size
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
  const acquisitionActors = getAcquisitionVisitorActors(params.visits, params.eventMap)
  const visitors = acquisitionActors.size
  let previousUsers: number | null = null

  return FUNNEL_STEPS.map((step) => {
    const users =
      step.eventName === null
        ? visitors
        : countAcquisitionActorsWithEvent({
            visits: params.visits,
            eventMap: params.eventMap,
            acquisitionActors,
            eventName: step.eventName,
          })
    const row = {
      step: step.label,
      users,
      conversionFromPrevious: previousUsers === null ? null : divide(users, previousUsers),
      conversionFromVisitors: divide(users, visitors),
      costPerUserCents: users === 0 ? null : Math.round(params.totalSpendCents / users),
    }

    previousUsers = users
    return row
  })
}

function escapeTreeIdPart(value: string) {
  return value.replaceAll('/', '%2F')
}

function getCampaignLabel(visit: Pick<VisitRow, 'campaign'>) {
  return visit.campaign ?? 'direct'
}

function getCreativeLabel(visit: Pick<VisitRow, 'content'>) {
  return visit.content ?? 'direct'
}

function sortTrafficNodes(left: TrafficTreeNode, right: TrafficTreeNode) {
  if (right.purchaseIntent !== left.purchaseIntent) {
    return right.purchaseIntent - left.purchaseIntent
  }

  const leftIntentEfficiency = left.intentRate ?? -1
  const rightIntentEfficiency = right.intentRate ?? -1
  if (rightIntentEfficiency !== leftIntentEfficiency) {
    return rightIntentEfficiency - leftIntentEfficiency
  }

  if (left.costPerIntentCents !== right.costPerIntentCents) {
    if (left.costPerIntentCents === null) {
      return 1
    }

    if (right.costPerIntentCents === null) {
      return -1
    }

    return left.costPerIntentCents - right.costPerIntentCents
  }

  if (right.visitors !== left.visitors) {
    return right.visitors - left.visitors
  }

  return left.label.localeCompare(right.label)
}

function buildTrafficNode(params: {
  id: string
  level: TrafficTreeNode['level']
  label: string
  visits: VisitRow[]
  spendCents: number
  eventMap: Map<string, Set<string>>
  children?: TrafficTreeNode[]
}): TrafficTreeNode {
  const acquisitionActors = getAcquisitionVisitorActors(params.visits, params.eventMap)
  const visitors = acquisitionActors.size
  const quizStarted = countAcquisitionActorsWithEvent({
    visits: params.visits,
    eventMap: params.eventMap,
    acquisitionActors,
    eventName: 'quiz_started',
  })
  const quizCompleted = countAcquisitionActorsWithEvent({
    visits: params.visits,
    eventMap: params.eventMap,
    acquisitionActors,
    eventName: 'quiz_completed',
  })
  const emailSubmitted = countAcquisitionActorsWithEvent({
    visits: params.visits,
    eventMap: params.eventMap,
    acquisitionActors,
    eventName: 'email_submitted',
  })
  const purchaseIntent = countAcquisitionActorsWithEvent({
    visits: params.visits,
    eventMap: params.eventMap,
    acquisitionActors,
    eventName: 'paywall_cta_clicked',
  })

  return {
    id: params.id,
    level: params.level,
    label: params.label,
    spendCents: params.spendCents,
    visitors,
    quizStarted,
    quizCompleted,
    emailSubmitted,
    purchaseIntent,
    intentRate: divide(purchaseIntent, visitors),
    costPerIntentCents: purchaseIntent === 0 ? null : Math.round(params.spendCents / purchaseIntent),
    children: params.children ?? [],
  }
}

function buildTrafficTree(params: {
  visits: VisitRow[]
  eventMap: Map<string, Set<string>>
  adSpendEntries: NonNullable<DashboardRows['adSpendEntries']>
}) {
  const sourceLabels = new Set<string>()

  for (const visit of params.visits) {
    sourceLabels.add(visit.source)
  }

  for (const entry of params.adSpendEntries) {
    sourceLabels.add(entry.source)
  }

  return [...sourceLabels]
    .map((source) => {
      const sourceVisits = params.visits.filter((visit) => visit.source === source)
      const sourceSpendEntries = params.adSpendEntries.filter((entry) => entry.source === source)
      const campaignLabels = new Set<string>()

      for (const visit of sourceVisits) {
        campaignLabels.add(getCampaignLabel(visit))
      }

      for (const entry of sourceSpendEntries) {
        campaignLabels.add(entry.campaign ?? 'direct')
      }

      const campaignChildren = [...campaignLabels]
        .map((campaign) => {
          const campaignVisits = sourceVisits.filter((visit) => getCampaignLabel(visit) === campaign)
          const campaignSpendEntries = sourceSpendEntries.filter((entry) => (entry.campaign ?? 'direct') === campaign)
          const creativeLabels = new Set<string>()

          for (const visit of campaignVisits) {
            creativeLabels.add(getCreativeLabel(visit))
          }

          for (const entry of campaignSpendEntries) {
            creativeLabels.add(entry.content ?? 'direct')
          }

          const creativeChildren = [...creativeLabels]
            .map((creative) => {
              const creativeVisits = campaignVisits.filter((visit) => getCreativeLabel(visit) === creative)
              const creativeSpendCents = campaignSpendEntries
                .filter((entry) => (entry.content ?? 'direct') === creative)
                .reduce((total, entry) => total + entry.spend_cents, 0)

              return buildTrafficNode({
                id: `source:${escapeTreeIdPart(source)}/campaign:${escapeTreeIdPart(campaign)}/creative:${escapeTreeIdPart(creative)}`,
                level: 'creative',
                label: creative,
                visits: creativeVisits,
                spendCents: creativeSpendCents,
                eventMap: params.eventMap,
              })
            })
            .sort(sortTrafficNodes)

          return buildTrafficNode({
            id: `source:${escapeTreeIdPart(source)}/campaign:${escapeTreeIdPart(campaign)}`,
            level: 'campaign',
            label: campaign,
            visits: campaignVisits,
            spendCents: campaignSpendEntries.reduce((total, entry) => total + entry.spend_cents, 0),
            eventMap: params.eventMap,
            children: creativeChildren,
          })
        })
        .sort(sortTrafficNodes)

      return buildTrafficNode({
        id: `source:${escapeTreeIdPart(source)}`,
        level: 'source',
        label: source,
        visits: sourceVisits,
        spendCents: sourceSpendEntries.reduce((total, entry) => total + entry.spend_cents, 0),
        eventMap: params.eventMap,
        children: campaignChildren,
      })
    })
    .sort(sortTrafficNodes)
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
    trafficTree: buildTrafficTree({
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
