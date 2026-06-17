export type DashboardSummary = {
  summaryMetrics: Array<{ label: string; value: number; description?: string }>
  anonymousConversion: Array<{ step: string; visits: number; conversionRate: number | null }>
  repeatQuizConversion: Array<{ step: string; visits: number; conversionRate: number | null }>
  sourceBreakdown: Array<{
    source: string
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
    lastTouchSource: string | null
    lastTouchMedium: string | null
    lastTouchCampaign: string | null
    decisionPattern: string | null
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
}

type VisitRow = {
  id: string
  visitor_id: string
  user_id: string | null
  source: string
  medium: string | null
  campaign: string | null
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
  last_seen_at: string
  last_touch_source: string | null
  last_touch_medium: string | null
  last_touch_campaign: string | null
  created_at: string
  updated_at: string
}

type DashboardRows = {
  visits: VisitRow[]
  funnelEvents: FunnelEventRow[]
  quizResponses: QuizResponseRow[]
  userProfiles: UserProfileRow[]
}

const ANONYMOUS_STEPS = [
  'landing_viewed',
  'start_clicked',
  'quiz_completed',
  'email_submitted',
  'magic_link_sent',
  'magic_link_verified',
  'result_viewed',
  'paywall_viewed',
  'paywall_cta_clicked',
]

const REPEAT_QUIZ_STEPS = ['quiz_started', 'quiz_completed', 'result_viewed', 'paywall_viewed']

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

function buildConversionRows(params: {
  visits: VisitRow[]
  eventMap: Map<string, Set<string>>
  visitFilter: (visit: VisitRow) => boolean
  steps: string[]
}) {
  const relevantVisits = params.visits.filter(params.visitFilter)

  return params.steps.map((step) => {
    const visits = relevantVisits.filter((visit) => hasEvent(params.eventMap, visit.id, step)).length

    return {
      step,
      visits,
      conversionRate: divide(visits, relevantVisits.length),
    }
  })
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

export function buildDashboardSummary(rows: DashboardRows): DashboardSummary {
  const eventMap = getVisitEventMap(rows.funnelEvents)
  const visitById = getSourceByVisit(rows.visits)
  const latestQuizResponseByUser = getLatestQuizResponseByUser(rows.quizResponses)

  const anonymousVisits = rows.visits.filter((visit) => !visit.user_id)
  const authenticatedVisits = rows.visits.filter((visit) => !!visit.user_id)

  const sourceBreakdown = [...new Set(rows.visits.map((visit) => visit.source))]
    .sort()
    .map((source) => {
      const visits = rows.visits.filter((visit) => visit.source === source)
      const visitCount = visits.length
      const quizCompletions = visits.filter((visit) => hasEvent(eventMap, visit.id, 'quiz_completed')).length
      const emailSubmissions = visits.filter((visit) => hasEvent(eventMap, visit.id, 'email_submitted')).length
      const magicLinksSent = visits.filter((visit) => hasEvent(eventMap, visit.id, 'magic_link_sent')).length
      const magicLinksVerified = visits.filter((visit) => hasEvent(eventMap, visit.id, 'magic_link_verified')).length
      const paywallViews = visits.filter((visit) => hasEvent(eventMap, visit.id, 'paywall_viewed')).length
      const paywallClicks = visits.filter((visit) => hasEvent(eventMap, visit.id, 'paywall_cta_clicked')).length

      return {
        source,
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
        lastTouchSource: profile.last_touch_source,
        lastTouchMedium: profile.last_touch_medium,
        lastTouchCampaign: profile.last_touch_campaign,
        decisionPattern: latestResponse?.decision_pattern ?? null,
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
    summaryMetrics: [
      { label: 'Total visits', value: rows.visits.length },
      { label: 'Anonymous visits', value: anonymousVisits.length },
      { label: 'Authenticated visits', value: authenticatedVisits.length },
      {
        label: 'Quiz completions',
        value: rows.funnelEvents.filter((event) => event.event_type === 'quiz_completed').length,
      },
      {
        label: 'Email submissions',
        value: rows.funnelEvents.filter((event) => event.event_type === 'email_submitted').length,
      },
      {
        label: 'Magic links verified',
        value: rows.funnelEvents.filter((event) => event.event_type === 'magic_link_verified').length,
      },
      { label: 'Registered users', value: rows.userProfiles.length },
    ],
    anonymousConversion: buildConversionRows({
      visits: rows.visits,
      eventMap,
      visitFilter: (visit) => !visit.user_id,
      steps: ANONYMOUS_STEPS,
    }),
    repeatQuizConversion: buildConversionRows({
      visits: rows.visits,
      eventMap,
      visitFilter: (visit) => !!visit.user_id,
      steps: REPEAT_QUIZ_STEPS,
    }),
    sourceBreakdown,
    registeredUsers,
    patternBreakdown,
    sourceByPattern,
  }
}
