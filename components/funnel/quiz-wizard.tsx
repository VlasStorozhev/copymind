"use client"

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'

import { quizQuestions } from '@/lib/quiz/questions'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sendQuizEvent } from '@/components/funnel/event-client'

type QuizAnswers = Record<string, string>

export function QuizWizard({ authenticated }: { authenticated: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [submitting, startTransition] = useTransition()
  const question = quizQuestions[step]
  const selectedAnswer = question ? answers[question.id] ?? '' : ''
  const progress = ((step + 1) / quizQuestions.length) * 100

  useEffect(() => {
    void sendQuizEvent({
      action: 'start',
      metadata: { authenticated },
    })
  }, [authenticated])

  const canGoBack = step > 0
  const isLastStep = step === quizQuestions.length - 1
  if (!question) {
    return null
  }

  return (
    <Card className="mx-auto w-full max-w-xl border-border/60 bg-card/95 shadow-sm shadow-black/5">
      <CardHeader className="space-y-3 border-b border-border/60 pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Decision profile</CardTitle>
          <span className="text-sm text-muted-foreground">
            {step + 1}/{quizQuestions.length}
          </span>
        </div>
        <Progress value={progress} aria-label="Quiz progress" />
        <CardDescription className="text-sm text-muted-foreground">
          Answer one question at a time. You can move back before you submit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Question {step + 1}
            </p>
            <h1 className="text-xl leading-snug font-semibold text-balance">{question.prompt}</h1>
          </div>

          <RadioGroup
            aria-label={question.prompt}
            className="grid gap-2"
            value={selectedAnswer}
            onValueChange={(value) => {
              setAnswers((current) => ({ ...current, [question.id]: value }))
              void sendQuizEvent({
                action: 'answer',
                metadata: {
                  question_id: question.id,
                  answer_id: value,
                },
              })
            }}
          >
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 transition-colors hover:bg-muted/60 has-data-[state=checked]:border-foreground/30 has-data-[state=checked]:bg-muted"
              >
                <RadioGroupItem value={option.id} aria-label={option.label} />
                <span className="min-w-0 flex-1 text-sm leading-5">{option.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="gap-2"
            disabled={!canGoBack || submitting}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button
            type="button"
            size="lg"
            className="gap-2"
            disabled={!selectedAnswer || submitting}
            onClick={() => {
              if (!isLastStep) {
                setStep((current) => Math.min(quizQuestions.length - 1, current + 1))
                return
              }

              startTransition(async () => {
                const response = await fetch('/api/quiz', {
                  method: 'POST',
                  headers: {
                    'content-type': 'application/json',
                  },
                  credentials: 'same-origin',
                  body: JSON.stringify({
                    action: 'submit',
                    answers: quizQuestions.map((item) => ({
                      questionId: item.id,
                      answerId: answers[item.id],
                    })),
                  }),
                })

                const payload = (await response.json().catch(() => null)) as
                  | { next_url?: string }
                  | null

                if (response.ok && payload?.next_url) {
                  router.push(payload.next_url)
                }
              })
            }}
          >
            {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isLastStep ? 'Finish' : 'Next'}
            {!isLastStep ? <ChevronRight className="size-4" /> : null}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
