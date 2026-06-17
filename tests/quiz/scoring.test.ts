import { describe, expect, it } from 'vitest';

import { scoreQuiz } from '@/lib/quiz/scoring';

describe('scoreQuiz', () => {
  it('requires profile gender', () => {
    expect(() =>
      scoreQuiz([
        { questionId: 'decision_context', answerId: 'career_decisions' },
      ]),
    ).toThrow();
  });

  it('stores profile_gender and decision_context without scoring them', () => {
    const result = scoreQuiz([
      { questionId: 'profile_gender', answerId: 'woman' },
      { questionId: 'decision_context', answerId: 'career_decisions' },
      { questionId: 'decision_behavior', answerId: 'overthink_every_option' },
      { questionId: 'support_preference', answerId: 'clear_framework' },
    ]);

    expect(result.gender).toBe('woman');
    expect(result.decision_context).toBe('career_decisions');
    expect(result.decision_pattern).toBe('overthinking_delayer');
    expect(result.confidence).toBe('high');
  });

  it('returns low confidence and uses tie-break order for close profiles', () => {
    const result = scoreQuiz([
      { questionId: 'profile_gender', answerId: 'prefer_not_to_say' },
      { questionId: 'decision_context', answerId: 'daily_priorities' },
      { questionId: 'decision_behavior', answerId: 'ask_too_many_people' },
      { questionId: 'primary_blocker', answerId: 'fear_wrong_choice' },
      { questionId: 'support_preference', answerId: 'clear_framework' },
    ]);

    expect(result.decision_pattern).toBe('approval_seeker');
    expect(result.confidence).toBe('low');
  });
});
