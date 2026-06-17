export type QuizResponsePreview = {
  id: string
  visit_id: string
  visitor_id: string
}

export type QuizEmailCaptureStartResult =
  | {
      ok: true
      quizResponse: QuizResponsePreview
    }
  | {
      ok: false
      reason: 'missing_context' | 'invalid'
    }

export async function resolveQuizEmailCaptureStart(input: {
  quizResponseId?: string | null
  visitorId?: string | null
  findQuizResponseById: (quizResponseId: string) => Promise<QuizResponsePreview | null>
}): Promise<QuizEmailCaptureStartResult> {
  if (!input.quizResponseId) {
    return { ok: false, reason: 'missing_context' }
  }

  const quizResponse = await input.findQuizResponseById(input.quizResponseId)
  if (!quizResponse) {
    return { ok: false, reason: 'invalid' }
  }

  if (!input.visitorId || quizResponse.visitor_id !== input.visitorId) {
    return { ok: false, reason: 'invalid' }
  }

  return {
    ok: true,
    quizResponse,
  }
}
