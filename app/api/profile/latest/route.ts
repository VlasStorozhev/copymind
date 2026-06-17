import { NextResponse } from 'next/server'

import { resolveAdminAccess } from '@/lib/auth/admin'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminAccess = await resolveAdminAccess()
  const adminClient = createAdminClient()
  const { data: latestResponse, error } = await adminClient
    .from('quiz_responses')
    .select(
      'id, answers, completed_at, confidence, decision_pattern, primary_blocker, emotional_driver, support_preference, recommended_starting_point, gender',
    )
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    profile: latestResponse ?? null,
    is_admin: adminAccess.status === 'authorized',
    user_email: user.email ?? null,
  })
}
