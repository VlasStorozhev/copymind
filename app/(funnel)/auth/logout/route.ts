import { NextResponse } from 'next/server'

import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/', request.url), 303)
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
