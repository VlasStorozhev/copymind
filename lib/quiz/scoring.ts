import {
  type DecisionBehaviorAnswerId,
  type DecisionContextAnswerId,
  type PrimaryBlockerAnswerId,
  type ProfileGenderAnswerId,
  type QuizAnswer,
  type SupportPreferenceAnswerId,
  type WorstOutcomeAnswerId,
} from '@/lib/quiz/questions';

export type DecisionPattern =
  | 'overthinking_delayer'
  | 'approval_seeker'
  | 'conflict_avoider'
  | 'impulsive_reliever'
  | 'safety_chooser'
  | 'values_disconnected'
  | 'pressure_reactor';

export type Confidence = 'high' | 'low';

export type QuizScoreResult = {
  gender: ProfileGenderAnswerId;
  decision_context: DecisionContextAnswerId | null;
  decision_pattern: DecisionPattern;
  primary_blocker: PrimaryBlockerAnswerId | null;
  emotional_driver: string;
  support_preference: SupportPreferenceAnswerId | null;
  recommended_starting_point: string;
  confidence: Confidence;
};

type SegmentScoreMap = Record<DecisionPattern, number>;
type SegmentContributionMap = Partial<Record<DecisionPattern, number>>;

const SEGMENT_PRIORITY: readonly DecisionPattern[] = [
  'overthinking_delayer',
  'approval_seeker',
  'conflict_avoider',
  'impulsive_reliever',
  'safety_chooser',
  'values_disconnected',
  'pressure_reactor',
];

const QUESTION_PRIORITY: readonly (
  | 'decision_behavior'
  | 'primary_blocker'
  | 'worst_outcome'
  | 'support_preference'
)[] = ['decision_behavior', 'primary_blocker', 'worst_outcome', 'support_preference'];

const PATTERN_METADATA: Record<
  DecisionPattern,
  {
    emotional_driver: string;
    recommended_starting_point: string;
  }
> = {
  overthinking_delayer: {
    emotional_driver: 'Wanting certainty before acting',
    recommended_starting_point: 'Decision clarity check-in',
  },
  approval_seeker: {
    emotional_driver: 'Wanting reassurance before trusting your own read',
    recommended_starting_point: 'Self-trust and advice filter',
  },
  conflict_avoider: {
    emotional_driver: 'Wanting to avoid disappointing or upsetting others',
    recommended_starting_point: 'Boundary and trade-off check',
  },
  impulsive_reliever: {
    emotional_driver: 'Wanting discomfort to end quickly',
    recommended_starting_point: 'Pause-before-choice reflection',
  },
  safety_chooser: {
    emotional_driver: 'Wanting protection from regret or risk',
    recommended_starting_point: 'Risk and values comparison',
  },
  values_disconnected: {
    emotional_driver: 'Losing contact with what matters most under pressure',
    recommended_starting_point: 'Values reconnection prompt',
  },
  pressure_reactor: {
    emotional_driver: 'Waiting until urgency creates forced clarity',
    recommended_starting_point: 'Early-warning decision plan',
  },
};

const SCORING_RULES: {
  decision_behavior: Record<DecisionBehaviorAnswerId, SegmentContributionMap>;
  primary_blocker: Record<PrimaryBlockerAnswerId, SegmentContributionMap>;
  post_decision_feeling: Record<string, SegmentContributionMap>;
  worst_outcome: Record<WorstOutcomeAnswerId, SegmentContributionMap>;
  support_preference: Record<SupportPreferenceAnswerId, SegmentContributionMap>;
} = {
  decision_behavior: {
    overthink_every_option: { overthinking_delayer: 2 },
    avoid_until_last_moment: { pressure_reactor: 2 },
    ask_too_many_people: { approval_seeker: 2 },
    avoid_conflict_option: { conflict_avoider: 2 },
    quick_choice_regret_later: { impulsive_reliever: 2 },
    know_want_talk_out: { values_disconnected: 2 },
    choose_safest: { safety_chooser: 2 },
  },
  primary_blocker: {
    fear_wrong_choice: { overthinking_delayer: 2, safety_chooser: 1 },
    too_many_options: { overthinking_delayer: 1 },
    not_trusting_myself: { values_disconnected: 2 },
    worrying_others_think: { approval_seeker: 2, conflict_avoider: 1 },
    not_knowing_want: { values_disconnected: 2 },
    emotionally_overwhelmed: { impulsive_reliever: 1 },
  },
  post_decision_feeling: {
    relief: {},
    doubt: { overthinking_delayer: 1 },
    regret: { impulsive_reliever: 2 },
    need_reassurance: { approval_seeker: 2 },
    motivation_to_act: {},
    emotional_exhaustion: { pressure_reactor: 1 },
  },
  worst_outcome: {
    under_pressure: { pressure_reactor: 2 },
    avoid_conflict: { conflict_avoider: 2 },
    when_tired: { pressure_reactor: 1 },
    from_fear: { safety_chooser: 2 },
    delayed_too_long: { overthinking_delayer: 2 },
    please_others: { approval_seeker: 2 },
  },
  support_preference: {
    clear_framework: { overthinking_delayer: 1 },
    calm_reflection_partner: { pressure_reactor: 1 },
    challenge_assumptions: { safety_chooser: 1, conflict_avoider: 1 },
    values_reminder: { values_disconnected: 2 },
    compare_options: { overthinking_delayer: 1 },
    push_to_act: { pressure_reactor: 1 },
  },
};

function getAnswerMap(answers: readonly QuizAnswer[]) {
  return new Map(answers.map((answer) => [answer.questionId, answer.answerId] as const));
}

function applyContribution(scores: SegmentScoreMap, contribution: SegmentContributionMap) {
  for (const segment of SEGMENT_PRIORITY) {
    scores[segment] += contribution[segment] ?? 0;
  }
}

function getTopScores(scores: SegmentScoreMap) {
  const ordered = [...SEGMENT_PRIORITY].sort((left, right) => {
    const scoreDifference = scores[right] - scores[left];
    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return SEGMENT_PRIORITY.indexOf(left) - SEGMENT_PRIORITY.indexOf(right);
  });

  return {
    topSegment: ordered[0],
    topScore: scores[ordered[0]],
    nextScore: scores[ordered[1]] ?? 0,
  };
}

function chooseByPriority(candidates: readonly DecisionPattern[]) {
  return SEGMENT_PRIORITY.find((segment) => candidates.includes(segment));
}

function chooseTieBreakWinner(
  scores: SegmentScoreMap,
  contributionsByQuestion: Partial<Record<string, SegmentContributionMap>>,
) {
  const { topScore } = getTopScores(scores);
  const candidateSegments = SEGMENT_PRIORITY.filter((segment) => scores[segment] >= topScore - 1);

  for (const questionId of QUESTION_PRIORITY) {
    const contribution = contributionsByQuestion[questionId];
    if (!contribution) {
      continue;
    }

    const matches = candidateSegments.filter((segment) => {
      const points = contribution[segment] ?? 0;

      if (questionId === 'support_preference') {
        return points > 0;
      }

      return points === 2;
    });

    if (matches.length > 0) {
      const bestByPriority = chooseByPriority(matches);
      if (bestByPriority) {
        return bestByPriority;
      }
    }
  }

  return chooseByPriority(candidateSegments) ?? SEGMENT_PRIORITY[0];
}

export function scoreQuiz(answers: readonly QuizAnswer[]): QuizScoreResult {
  const answerMap = getAnswerMap(answers);
  const gender = answerMap.get('profile_gender') as ProfileGenderAnswerId | undefined;

  if (!gender) {
    throw new Error('profile_gender is required');
  }

  const decisionContext = answerMap.get('decision_context') as DecisionContextAnswerId | undefined;

  const scores: SegmentScoreMap = {
    overthinking_delayer: 0,
    approval_seeker: 0,
    conflict_avoider: 0,
    impulsive_reliever: 0,
    safety_chooser: 0,
    values_disconnected: 0,
    pressure_reactor: 0,
  };

  const contributionsByQuestion: Partial<Record<string, SegmentContributionMap>> = {};

  for (const [questionId, answerId] of answerMap.entries()) {
    if (questionId === 'profile_gender' || questionId === 'decision_context') {
      continue;
    }

    const questionScores =
      questionId === 'decision_behavior'
        ? SCORING_RULES.decision_behavior[answerId as DecisionBehaviorAnswerId]
        : questionId === 'primary_blocker'
          ? SCORING_RULES.primary_blocker[answerId as PrimaryBlockerAnswerId]
          : questionId === 'post_decision_feeling'
            ? SCORING_RULES.post_decision_feeling[answerId]
            : questionId === 'worst_outcome'
              ? SCORING_RULES.worst_outcome[answerId as WorstOutcomeAnswerId]
              : questionId === 'support_preference'
                ? SCORING_RULES.support_preference[answerId as SupportPreferenceAnswerId]
                : undefined;

    if (!questionScores) {
      continue;
    }

    contributionsByQuestion[questionId] = questionScores;
    applyContribution(scores, questionScores);
  }

  const { topSegment, topScore, nextScore } = getTopScores(scores);
  const confidence: Confidence = topScore - nextScore >= 2 ? 'high' : 'low';
  const decisionPattern =
    confidence === 'high' ? topSegment : chooseTieBreakWinner(scores, contributionsByQuestion);

  const metadata = PATTERN_METADATA[decisionPattern];

  return {
    gender,
    decision_context: decisionContext ?? null,
    decision_pattern: decisionPattern,
    primary_blocker:
      (answerMap.get('primary_blocker') as PrimaryBlockerAnswerId | undefined) ?? null,
    emotional_driver: metadata.emotional_driver,
    support_preference:
      (answerMap.get('support_preference') as SupportPreferenceAnswerId | undefined) ?? null,
    recommended_starting_point: metadata.recommended_starting_point,
    confidence,
  };
}
