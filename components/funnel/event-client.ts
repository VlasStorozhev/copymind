"use client"

export type FunnelVisitEventName = 'landing_viewed' | 'start_clicked' | 'email_viewed'

export async function sendFunnelVisitEvent(input: {
  eventName: FunnelVisitEventName
  metadata?: Record<string, unknown>
}) {
  try {
    await fetch('/api/visits', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify({
        eventName: input.eventName,
        metadata: input.metadata ?? {},
        url: window.location.href,
        referrer: document.referrer,
      }),
    })
  } catch {
    // Fire-and-forget tracking only.
  }
}

export async function sendQuizEvent(input: {
  action: 'start' | 'answer'
  metadata?: Record<string, unknown>
}) {
  try {
    await fetch('/api/quiz', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify({
        action: input.action,
        metadata: input.metadata ?? {},
      }),
    })
  } catch {
    // Fire-and-forget tracking only.
  }
}

export async function sendAuthStartEvent(input: {
  attemptType: 'quiz_email_capture' | 'returning_login'
  email: string
  quizResponseId?: string | null
}): Promise<Response | null> {
  try {
    return await fetch('/api/auth/start', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        attempt_type: input.attemptType,
        email: input.email,
        quiz_response_id: input.quizResponseId ?? null,
      }),
    })
  } catch {
    return null
  }
}
