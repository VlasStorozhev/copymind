import { normalizeEmail } from '@/lib/auth/profiles'
import type { createClient as createAdminClient } from '@/lib/supabase/admin'

export type EmailLeadStatus = 'pending_verification' | 'verified'

type AdminClient = ReturnType<typeof createAdminClient>

type EmailLeadRow = {
  id: string
  normalized_email: string
  email: string
  status: EmailLeadStatus
  user_id: string | null
  visitor_id: string | null
  visit_id: string | null
  first_submitted_at: string
  last_submitted_at: string
  verified_at: string | null
  created_at: string
  updated_at: string
}

export async function savePendingEmailLead({
  client,
  email,
  visitorId,
  visitId,
  userId,
  submittedAt = new Date().toISOString(),
}: {
  client: AdminClient
  email: string
  visitorId: string | null
  visitId: string | null
  userId: string | null
  submittedAt?: string
}) {
  const normalizedEmail = normalizeEmail(email)
  const { data: existing, error: selectError } = await client
    .from('email_leads')
    .select('id, normalized_email, email, status, user_id, visitor_id, visit_id, first_submitted_at, last_submitted_at, verified_at, created_at, updated_at')
    .eq('normalized_email', normalizedEmail)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Could not load email lead: ${selectError.message}`)
  }

  if (existing) {
    const current = existing as EmailLeadRow
    const { error } = await client
      .from('email_leads')
      .update({
        email: email.trim(),
        status: current.status === 'verified' ? 'verified' : 'pending_verification',
        user_id: userId ?? current.user_id,
        visitor_id: visitorId ?? current.visitor_id,
        visit_id: visitId ?? current.visit_id,
        last_submitted_at: submittedAt,
        updated_at: submittedAt,
      })
      .eq('normalized_email', normalizedEmail)

    if (error) {
      throw new Error(`Could not update email lead: ${error.message}`)
    }

    return
  }

  const { error } = await client.from('email_leads').insert({
    normalized_email: normalizedEmail,
    email: email.trim(),
    status: 'pending_verification',
    user_id: userId,
    visitor_id: visitorId,
    visit_id: visitId,
    first_submitted_at: submittedAt,
    last_submitted_at: submittedAt,
    created_at: submittedAt,
    updated_at: submittedAt,
  })

  if (error) {
    throw new Error(`Could not save email lead: ${error.message}`)
  }
}

export async function markEmailLeadVerified({
  client,
  normalizedEmail,
  userId,
  verifiedAt = new Date().toISOString(),
}: {
  client: AdminClient
  normalizedEmail: string
  userId: string
  verifiedAt?: string
}) {
  const { error } = await client
    .from('email_leads')
    .update({
      status: 'verified',
      user_id: userId,
      verified_at: verifiedAt,
      updated_at: verifiedAt,
    })
    .eq('normalized_email', normalizeEmail(normalizedEmail))

  if (error) {
    throw new Error(`Could not verify email lead: ${error.message}`)
  }
}
