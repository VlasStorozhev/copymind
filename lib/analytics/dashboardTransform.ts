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
  pendingEmailLeads: Array<{
    email: string
    submittedAt: string
    source: string | null
    medium: string | null
    campaign: string | null
    content: string | null
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

type EmailLeadRow = {
  id: string
  email: string
  status: string
  visitor_id: string | null
  visit_id: string | null
  first_submitted_at: string
  last_submitted_at: string
}

type DashboardRows = {
  visits: VisitRow[]
  funnelEvents: FunnelEventRow[]
  quizResponses: QuizResponseRow[]
  userProfiles: UserProfileRow[]
  emailLeads?: EmailLeadRow[]
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

const FUNNEL_STEPS: Array<{ label: string; eventNames: string[] | null }> = [
  { label: 'Visitors', eventNames: null },
  { label: 'Quiz Started', eventNames: ['quiz_started'] },
  { label: 'Quiz Completed', eventNames: ['quiz_completed'] },
  { label: 'Email Submitted', eventNames: ['email_submitted'] },
  { label: 'Email Verified', eventNames: ['email_verified', 'magic_link_verified'] },
  { label: 'Result Viewed', eventNames: ['result_viewed'] },
  { label: 'Purchase Intent', eventNames: ['paywall_cta_clicked'] },
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

function getAcquisitionVisitorIds(visits: VisitRow[], eventMap: Map<string, Set<string>>) {
  const visitorIds = new Set<string>()

  for (const visit of visits) {
    if (isAcquisitionEntryVisit(visit, eventMap)) {
      visitorIds.add(visit.visitor_id)
    }
  }

  return visitorIds
}

function countVisitorIdsWithAnyEvent(params: {
  visits: VisitRow[]
  eventMap: Map<string, Set<string>>
  visitorIds: Set<string>
  eventNames: string[]
}) {
  const visitors = new Set<string>()

  for (const visit of params.visits) {
    const eventSet = params.eventMap.get(visit.id)

    if (!params.visitorIds.has(visit.visitor_id) || !eventSet) {
      continue
    }

    if (params.eventNames.some((eventName) => eventSet.has(eventName))) {
      visitors.add(visit.visitor_id)
    }
  }

  return visitors.size
}

function countVisitorIdsWithCompletedQuiz(params: {
  quizResponses: QuizResponseRow[]
  visitorIds: Set<string>
}) {
  const visitors = new Set<string>()

  for (const response of params.quizResponses) {
    if (response.completed_at && params.visitorIds.has(response.visitor_id)) {
      visitors.add(response.visitor_id)
    }
  }

  return visitors.size
}

function getEmailLeadVisitorId(lead: EmailLeadRow, visitById: Map<string, VisitRow>) {
  if (lead.visitor_id) {
    return lead.visitor_id
  }

  return lead.visit_id ? (visitById.get(lead.visit_id)?.visitor_id ?? null) : null
}

function countVisitorIdsWithEmailLead(params: {
  emailLeads: EmailLeadRow[]
  visitById: Map<string, VisitRow>
  visitorIds: Set<string>
  status?: string
}) {
  const visitors = new Set<string>()

  for (const lead of params.emailLeads) {
    if (params.status && lead.status !== params.status) {
      continue
    }

    const visitorId = getEmailLeadVisitorId(lead, params.visitById)

    if (visitorId && params.visitorIds.has(visitorId)) {
      visitors.add(visitorId)
    }
  }

  return visitors.size
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

function formatPercent(value: number | null) {
  if (value === null) {
    return '—'
  }

  return `${Math.round(value * 100)}%`
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
  visitById: Map<string, VisitRow>
  quizResponses: QuizResponseRow[]
  emailLeads: EmailLeadRow[]
  totalSpendCents: number
}) {
  const acquisitionVisitorIds = getAcquisitionVisitorIds(params.visits, params.eventMap)
  const visitors = acquisitionVisitorIds.size
  let previousUsers: number | null = null

  return FUNNEL_STEPS.map((step) => {
    let users: number

    if (step.label === 'Visitors') {
      users = visitors
    } else if (step.label === 'Quiz Completed') {
      users = countVisitorIdsWithCompletedQuiz({
        quizResponses: params.quizResponses,
        visitorIds: acquisitionVisitorIds,
      })
    } else if (step.label === 'Email Submitted') {
      users = countVisitorIdsWithEmailLead({
        emailLeads: params.emailLeads,
        visitById: params.visitById,
        visitorIds: acquisitionVisitorIds,
      })
    } else if (step.label === 'Email Verified') {
      users = countVisitorIdsWithEmailLead({
        emailLeads: params.emailLeads,
        visitById: params.visitById,
        visitorIds: acquisitionVisitorIds,
        status: 'verified',
      })
    } else {
      users = countVisitorIdsWithAnyEvent({
        visits: params.visits,
        eventMap: params.eventMap,
        visitorIds: acquisitionVisitorIds,
        eventNames: step.eventNames ?? [],
      })
    }

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
  visitById: Map<string, VisitRow>
  quizResponses: QuizResponseRow[]
  emailLeads: EmailLeadRow[]
  children?: TrafficTreeNode[]
}): TrafficTreeNode {
  const visitorIds = getAcquisitionVisitorIds(params.visits, params.eventMap)
  const visitors = visitorIds.size
  const quizStarted = countVisitorIdsWithAnyEvent({
    visits: params.visits,
    eventMap: params.eventMap,
    visitorIds,
    eventNames: ['quiz_started'],
  })
  const quizCompleted = countVisitorIdsWithCompletedQuiz({
    quizResponses: params.quizResponses,
    visitorIds,
  })
  const emailSubmitted = countVisitorIdsWithEmailLead({
    emailLeads: params.emailLeads,
    visitById: params.visitById,
    visitorIds,
  })
  const purchaseIntent = countVisitorIdsWithAnyEvent({
    visits: params.visits,
    eventMap: params.eventMap,
    visitorIds,
    eventNames: ['paywall_cta_clicked'],
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
  visitById: Map<string, VisitRow>
  quizResponses: QuizResponseRow[]
  emailLeads: EmailLeadRow[]
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
                visitById: params.visitById,
                quizResponses: params.quizResponses,
                emailLeads: params.emailLeads,
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
            visitById: params.visitById,
            quizResponses: params.quizResponses,
            emailLeads: params.emailLeads,
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
        visitById: params.visitById,
        quizResponses: params.quizResponses,
        emailLeads: params.emailLeads,
        children: campaignChildren,
      })
    })
    .sort(sortTrafficNodes)
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
  const emailLeads = rows.emailLeads ?? []
  const productPriceCents = rows.dashboardSettings?.product_price_cents ?? 900
  const currency = rows.dashboardSettings?.currency ?? 'USD'
  const totalSpendCents = getTotalSpendCents(adSpendEntries)
  const acquisitionVisitorIds = getAcquisitionVisitorIds(rows.visits, eventMap)
  const emailSubmittedActors = countVisitorIdsWithEmailLead({
    emailLeads,
    visitById,
    visitorIds: acquisitionVisitorIds,
  })
  const emailVerifiedActors = countVisitorIdsWithEmailLead({
    emailLeads,
    visitById,
    visitorIds: acquisitionVisitorIds,
    status: 'verified',
  })
  const purchaseIntentActors = countVisitorIdsWithAnyEvent({
    visits: rows.visits,
    eventMap,
    visitorIds: acquisitionVisitorIds,
    eventNames: ['paywall_cta_clicked'],
  })
  const quizCompletedVisitors = countVisitorIdsWithCompletedQuiz({
    quizResponses: rows.quizResponses,
    visitorIds: acquisitionVisitorIds,
  })
  const paywallClickActors = purchaseIntentActors
  const estimatedRevenueCents = purchaseIntentActors * productPriceCents
  const estimatedProfitCents = estimatedRevenueCents - totalSpendCents
  const intentCpaCents = purchaseIntentActors === 0 ? null : Math.round(totalSpendCents / purchaseIntentActors)

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

  const registeredEmailSet = new Set(rows.userProfiles.map((profile) => profile.email.trim().toLowerCase()))
  const pendingEmailLeads = [...(rows.emailLeads ?? [])]
    .filter((lead) => lead.status === 'pending_verification')
    .filter((lead) => !registeredEmailSet.has(lead.email.trim().toLowerCase()))
    .sort((left, right) => {
      const submittedCompare = right.last_submitted_at.localeCompare(left.last_submitted_at)
      if (submittedCompare !== 0) {
        return submittedCompare
      }

      return left.email.localeCompare(right.email)
    })
    .map((lead) => {
      const visit = lead.visit_id ? (visitById.get(lead.visit_id) ?? null) : null

      return {
        email: lead.email,
        submittedAt: lead.last_submitted_at,
        source: visit?.source ?? null,
        medium: visit?.medium ?? null,
        campaign: visit?.campaign ?? null,
        content: visit?.content ?? null,
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
        label: 'Intent Revenue',
        value: formatCurrency(estimatedRevenueCents, currency),
        description: `Purchase intent × ${formatCurrency(productPriceCents, currency)}`,
      },
      { label: 'Intent Profit', value: formatCurrency(estimatedProfitCents, currency) },
      {
        label: 'ROAS',
        value: formatRoas(totalSpendCents === 0 ? null : estimatedRevenueCents / totalSpendCents),
      },
      {
        label: 'Intent CPA',
        value: intentCpaCents === null ? '—' : formatCurrency(intentCpaCents, currency),
        description: 'Spend / purchase intent',
      },
      {
        label: 'Purchase Intent',
        value: String(purchaseIntentActors),
        description: 'Unique users who clicked the paywall CTA',
      },
      { label: 'Email Submitted', value: String(emailSubmittedActors) },
      { label: 'Email Verified', value: String(emailVerifiedActors) },
      {
        label: 'Verification Rate',
        value: formatPercent(divide(emailVerifiedActors, emailSubmittedActors)),
        description: 'Email verified / email submitted',
      },
    ],
    summaryMetrics: [
      { label: 'Total visits', value: rows.visits.length },
      { label: 'Anonymous visitors', value: anonymousVisitors },
      {
        label: 'Quiz completed',
        value: quizCompletedVisitors,
      },
      {
        label: 'Emails submitted',
        value: emailSubmittedActors,
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
      visitById,
      quizResponses: rows.quizResponses,
      emailLeads,
      totalSpendCents,
    }),
    sourceBreakdown,
    registeredUsers,
    patternBreakdown,
    sourceByPattern,
    trafficTree: buildTrafficTree({
      visits: rows.visits,
      eventMap,
      visitById,
      quizResponses: rows.quizResponses,
      emailLeads,
      adSpendEntries,
    }),
    pendingEmailLeads,
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
