import type { Database } from '@/lib/database.types'

import { FunnelEventBeacon } from '@/components/funnel/event-beacon'
import { MockPaywall } from '@/components/funnel/MockPaywall'
import { ProfileImage } from '@/components/funnel/ProfileImage'

type QuizResponse = Database['public']['Tables']['quiz_responses']['Row']
type DecisionProfileRow = Pick<
  QuizResponse,
  | 'gender'
  | 'confidence'
  | 'decision_pattern'
  | 'primary_blocker'
  | 'emotional_driver'
  | 'support_preference'
  | 'recommended_starting_point'
>

const PATTERN_LABELS: Record<string, string> = {
  overthinking_delayer: 'Overthinking Delayer',
  approval_seeker: 'Approval Seeker',
  conflict_avoider: 'Conflict Avoider',
  impulsive_reliever: 'Impulsive Reliever',
  safety_chooser: 'Safety Chooser',
  values_disconnected: 'Values Disconnected',
  pressure_reactor: 'Pressure Reactor',
}

const SUPPORT_LABELS: Record<string, string> = {
  clear_framework: 'Clear framework',
  calm_reflection_partner: 'Calm reflection partner',
  challenge_assumptions: 'Challenge assumptions',
  values_reminder: 'Values reminder',
  compare_options: 'Compare options',
  push_to_act: 'Push to act',
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function humanizePattern(value: string | null) {
  if (!value) {
    return 'Latest profile'
  }

  return PATTERN_LABELS[value] ?? sentenceCase(value.replaceAll('_', ' '))
}

function humanizeIdentifier(value: string | null) {
  if (!value) {
    return 'Not specified'
  }

  return sentenceCase(value.replaceAll('_', ' '))
}

function humanizeSupportPreference(value: string | null) {
  if (!value) {
    return 'Not specified'
  }

  return SUPPORT_LABELS[value] ?? sentenceCase(value.replaceAll('_', ' '))
}

export function DecisionProfile({ profile }: { profile: DecisionProfileRow }) {
  const hasPortrait = profile.gender === 'woman' || profile.gender === 'man'

  return (
    <section className="space-y-6">
      <FunnelEventBeacon eventName="result_viewed" />

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Decision profile</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          This profile is built directly from your quiz answers. It is a saved summary of the pattern you reported,
          the blocker that shows up most often, and the starting point we recommend next.
        </p>
      </div>

      <div
        className={
          hasPortrait
            ? 'grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start'
            : 'space-y-6'
        }
      >
        {hasPortrait ? <ProfileImage gender={profile.gender} /> : null}

          <dl className="grid gap-4 sm:grid-cols-2">
            <ProfileField label="Decision pattern" value={humanizePattern(profile.decision_pattern)} />
            <ProfileField
              label="Primary blocker"
              value={humanizeIdentifier(profile.primary_blocker)}
            />
            <ProfileField
              label="Emotional driver"
              value={humanizeIdentifier(profile.emotional_driver)}
            />
            <ProfileField
              label="Support preference"
              value={humanizeSupportPreference(profile.support_preference)}
            />
            <ProfileField
              label="Recommended starting point"
              value={humanizeIdentifier(profile.recommended_starting_point)}
            />
            <ProfileField label="Confidence" value={humanizeIdentifier(profile.confidence)} />
          </dl>
      </div>

      <MockPaywall />
    </section>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/80 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-sm leading-6 text-foreground font-medium">{value}</dd>
    </div>
  )
}
