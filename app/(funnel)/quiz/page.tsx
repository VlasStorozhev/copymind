import { QuizWizard } from '@/components/funnel/quiz-wizard'
import { Badge } from '@/components/ui/badge'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function QuizPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.9),rgba(255,255,255,1)_42%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Badge variant="outline" className="w-fit border-border/70 bg-background/90 px-3 py-1">
            Decision profile assessment
          </Badge>
          {user ? <span className="text-sm text-muted-foreground">Signed in</span> : null}
        </div>
        <QuizWizard authenticated={!!user} />
      </div>
    </main>
  )
}
