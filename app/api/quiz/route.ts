import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { getOrCreateVisitorId } from '@/lib/analytics/visitor'
import { getOrCreateVisit, recordFunnelEvent } from '@/lib/funnel/db'
import { quizQuestions, type QuizAnswer } from '@/lib/quiz/questions'
import { scoreQuiz } from '@/lib/quiz/scoring'

function isQuizAnswerPayload(value: unknown): value is { questionId: string; answerId: string }[] {
  return Array.isArray(value) && value.every((item) => item && typeof item.questionId === 'string' && typeof item.answerId === 'string')
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    action?: 'start' | 'answer' | 'submit'
    metadata?: Record<string, unknown>
    answers?: { questionId: string; answerId: string }[]
  }

  if (!body.action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 })
  }

  const authClient = await createServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  const cookieStore = await cookies()
  const existingVisitorId = cookieStore.get('visitor_id')?.value ?? null
  const { visitorId, shouldSetCookie } = getOrCreateVisitorId({ existingVisitorId })

  if (shouldSetCookie) {
    cookieStore.set('visitor_id', visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
  }

  const adminClient = createAdminClient()
  const visit = await getOrCreateVisit({
    client: adminClient,
    visitorId,
    url: request.headers.get('referer') ?? request.url,
    referrer: request.headers.get('referer') ?? '',
    userId: user?.id ?? null,
  })

  if (!visit) {
    return NextResponse.json({ error: 'Could not load visit context' }, { status: 500 })
  }

  if (body.action === 'start') {
    await recordFunnelEvent({
      client: adminClient,
      visitId: visit.id,
      eventName: 'quiz_started',
      userId: user?.id ?? null,
      metadata: { authenticated: !!user },
    })

    return NextResponse.json({ ok: true })
  }

  if (body.action === 'answer') {
    const questionId = typeof body.metadata?.question_id === 'string' ? body.metadata.question_id : null
    const answerId = typeof body.metadata?.answer_id === 'string' ? body.metadata.answer_id : null

    if (!questionId || !answerId) {
      return NextResponse.json({ error: 'question_id and answer_id are required' }, { status: 400 })
    }

    await recordFunnelEvent({
      client: adminClient,
      visitId: visit.id,
      eventName: 'quiz_question_answered',
      userId: user?.id ?? null,
      metadata: {
        question_id: questionId,
        answer_id: answerId,
      },
    })

    return NextResponse.json({ ok: true })
  }

  if (body.action === 'submit') {
    if (!isQuizAnswerPayload(body.answers)) {
      return NextResponse.json({ error: 'answers are required' }, { status: 400 })
    }

    const quizAnswers = body.answers.filter((item) => item.answerId) as QuizAnswer[]
    const requiredQuestionIds = quizQuestions.map((question) => question.id)
    const missingQuestion = requiredQuestionIds.find(
      (questionId) => !quizAnswers.some((item) => item.questionId === questionId),
    )

    if (missingQuestion) {
      return NextResponse.json({ error: `${missingQuestion} is required` }, { status: 400 })
    }

    const result = scoreQuiz(quizAnswers)
    const { data: quizResponse, error } = await adminClient
      .from('quiz_responses')
      .insert({
        visit_id: visit.id,
        visitor_id: visitorId,
        user_id: user?.id ?? null,
        answers: quizAnswers,
        completed_at: new Date().toISOString(),
        gender: result.gender,
        decision_context: result.decision_context,
        decision_pattern: result.decision_pattern,
        primary_blocker: result.primary_blocker,
        emotional_driver: result.emotional_driver,
        support_preference: result.support_preference,
        recommended_starting_point: result.recommended_starting_point,
        confidence: result.confidence,
      })
      .select('id')
      .single()

    if (error || !quizResponse) {
      return NextResponse.json({ error: error?.message ?? 'Could not save quiz response' }, { status: 500 })
    }

    await recordFunnelEvent({
      client: adminClient,
      visitId: visit.id,
      eventName: 'quiz_completed',
      userId: user?.id ?? null,
      metadata: {
        result_pattern: result.decision_pattern,
        profile_gender: result.gender,
      },
    })

    return NextResponse.json({
      ok: true,
      quiz_response_id: quizResponse.id,
      next_url: user ? '/app' : `/email?quiz_response_id=${quizResponse.id}`,
    })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
