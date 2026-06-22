export type QuestionId =
  | 'profile_gender'
  | 'decision_context'
  | 'decision_behavior'
  | 'primary_blocker'
  | 'post_decision_feeling'
  | 'worst_outcome'
  | 'support_preference';

export type ProfileGenderAnswerId = 'woman' | 'man' | 'prefer_not_to_say';
export type DecisionContextAnswerId =
  | 'big_life_decisions'
  | 'career_decisions'
  | 'relationship_decisions'
  | 'daily_priorities'
  | 'financial_decisions'
  | 'emotional_decisions';
export type DecisionBehaviorAnswerId =
  | 'overthink_every_option'
  | 'avoid_until_last_moment'
  | 'ask_too_many_people'
  | 'avoid_conflict_option'
  | 'quick_choice_regret_later'
  | 'know_want_talk_out'
  | 'choose_safest';
export type PrimaryBlockerAnswerId =
  | 'fear_wrong_choice'
  | 'too_many_options'
  | 'not_trusting_myself'
  | 'worrying_others_think'
  | 'not_knowing_want'
  | 'emotionally_overwhelmed';
export type PostDecisionFeelingAnswerId =
  | 'relief'
  | 'doubt'
  | 'regret'
  | 'need_reassurance'
  | 'motivation_to_act'
  | 'emotional_exhaustion';
export type WorstOutcomeAnswerId =
  | 'under_pressure'
  | 'avoid_conflict'
  | 'when_tired'
  | 'from_fear'
  | 'delayed_too_long'
  | 'please_others';
export type SupportPreferenceAnswerId =
  | 'clear_framework'
  | 'calm_reflection_partner'
  | 'challenge_assumptions'
  | 'values_reminder'
  | 'compare_options'
  | 'push_to_act';

export type AnswerIdByQuestion = {
  profile_gender: ProfileGenderAnswerId;
  decision_context: DecisionContextAnswerId;
  decision_behavior: DecisionBehaviorAnswerId;
  primary_blocker: PrimaryBlockerAnswerId;
  post_decision_feeling: PostDecisionFeelingAnswerId;
  worst_outcome: WorstOutcomeAnswerId;
  support_preference: SupportPreferenceAnswerId;
};

export type QuizAnswer = {
  [TQuestionId in QuestionId]: {
    questionId: TQuestionId;
    answerId: AnswerIdByQuestion[TQuestionId];
  };
}[QuestionId];

export type QuizQuestionOption<TAnswerId extends string = string> = {
  id: TAnswerId;
  label: string;
};

export type QuizQuestion<TQuestionId extends QuestionId = QuestionId> = {
  id: TQuestionId;
  prompt: string;
  options: readonly QuizQuestionOption<AnswerIdByQuestion[TQuestionId]>[];
};

export const quizQuestions: readonly QuizQuestion[] = [
  {
    id: 'profile_gender',
    prompt: 'How do you identify?',
    options: [
      { id: 'woman', label: 'Woman' },
      { id: 'man', label: 'Man' },
      { id: 'prefer_not_to_say', label: 'Prefer not to say' },
    ],
  },
  {
    id: 'decision_context',
    prompt: 'What kind of decisions do you get stuck on most often?',
    options: [
      { id: 'big_life_decisions', label: 'Big life decisions' },
      { id: 'career_decisions', label: 'Career decisions' },
      { id: 'relationship_decisions', label: 'Relationship decisions' },
      { id: 'daily_priorities', label: 'Daily priorities' },
      { id: 'financial_decisions', label: 'Financial decisions' },
      { id: 'emotional_decisions', label: 'Emotional decisions' },
    ],
  },
  {
    id: 'decision_behavior',
    prompt: 'What usually happens when you need to make an important choice?',
    options: [
      { id: 'overthink_every_option', label: 'I overthink every option' },
      { id: 'avoid_until_last_moment', label: 'I avoid it until the last moment' },
      { id: 'ask_too_many_people', label: 'I ask too many people for advice' },
      { id: 'avoid_conflict_option', label: 'I avoid the option that might create conflict' },
      { id: 'quick_choice_regret_later', label: 'I make a quick choice and regret it later' },
      { id: 'know_want_talk_out', label: 'I know what I want but talk myself out of it' },
      { id: 'choose_safest', label: 'I choose what feels safest' },
    ],
  },
  {
    id: 'primary_blocker',
    prompt: 'What feels like the biggest blocker?',
    options: [
      { id: 'fear_wrong_choice', label: 'Fear of making the wrong choice' },
      { id: 'too_many_options', label: 'Too many options' },
      { id: 'not_trusting_myself', label: 'Not trusting myself' },
      { id: 'worrying_others_think', label: 'Worrying what others will think' },
      { id: 'not_knowing_want', label: 'Not knowing what I really want' },
      { id: 'emotionally_overwhelmed', label: 'Feeling emotionally overwhelmed' },
    ],
  },
  {
    id: 'post_decision_feeling',
    prompt: 'After making a decision, what do you usually feel?',
    options: [
      { id: 'relief', label: 'Relief' },
      { id: 'doubt', label: 'Doubt' },
      { id: 'regret', label: 'Regret' },
      { id: 'need_reassurance', label: 'Need for reassurance' },
      { id: 'motivation_to_act', label: 'Motivation to act' },
      { id: 'emotional_exhaustion', label: 'Emotional exhaustion' },
    ],
  },
  {
    id: 'worst_outcome',
    prompt: 'Which kind of decision tends to create the worst outcomes for you?',
    options: [
      { id: 'under_pressure', label: 'Decisions made under pressure' },
      { id: 'avoid_conflict', label: 'Decisions made to avoid conflict' },
      { id: 'when_tired', label: 'Decisions made when tired' },
      { id: 'from_fear', label: 'Decisions made from fear' },
      { id: 'delayed_too_long', label: 'Decisions delayed too long' },
      { id: 'please_others', label: 'Decisions made to please others' },
    ],
  },
  {
    id: 'support_preference',
    prompt: 'What kind of support would help you most?',
    options: [
      { id: 'clear_framework', label: 'A clear decision framework' },
      { id: 'calm_reflection_partner', label: 'A calm reflection partner' },
      { id: 'challenge_assumptions', label: 'A challenge to my assumptions' },
      { id: 'values_reminder', label: 'A reminder of my values' },
      { id: 'compare_options', label: 'A way to compare options' },
      { id: 'push_to_act', label: 'A push to take action' },
    ],
  },
] as const;

export const questions = quizQuestions;
