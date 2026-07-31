import { supabase } from './supabase'

export const SCORE_ACTIONS = {
  POST_CONFIRMED: { label: 'Post confirmed by partner', points: 10 },
  PARTNER_BONUS: { label: 'Partner accountability bonus', points: 5 },
  CHALLENGE_COMPLETE: { label: 'Challenge completed', points: 50 },
  STREAK_7: { label: '7-day streak milestone', points: 25 },
  STREAK_30: { label: '30-day streak milestone', points: 75 },
  STREAK_60: { label: '60-day streak milestone', points: 150 },
  STREAK_100: { label: '100-day streak milestone', points: 300 },
  WEEKLY_TARGET: { label: 'Weekly target hit', points: 15 },
  MISSED_DAY: { label: 'Missed posting day', points: -5 },
  SELF_CHECKIN: { label: 'Self check-in (no partner)', points: 7 },
}

export function getScoreLabel(score: number): { label: string; color: string; next: number | null; nextLabel: string | null } {
  if (score >= 700) return { label: 'Elite Creator', color: '#F5A623', next: 1000, nextLabel: 'Legend' }
  if (score >= 400) return { label: 'Established', color: '#2196F3', next: 700, nextLabel: 'Elite Creator' }
  if (score >= 200) return { label: 'Consistent', color: '#4CAF50', next: 400, nextLabel: 'Established' }
  if (score >= 1000) return { label: 'Legend', color: '#9C27B0', next: null, nextLabel: null }
  return { label: 'Building', color: '#888', next: 200, nextLabel: 'Consistent' }
}

export async function awardScore(userId: string, action: keyof typeof SCORE_ACTIONS) {
  const { points, label } = SCORE_ACTIONS[action]

  // Add to history
  await supabase.from('score_history').insert({
    user_id: userId,
    action: label,
    points
  })

  // Update profile score
  const { data: profile } = await supabase
    .from('profiles')
    .select('creator_score')
    .eq('id', userId)
    .single()

  const currentScore = profile?.creator_score || 0
  const newScore = Math.max(0, currentScore + points)

  await supabase.from('profiles')
    .update({ creator_score: newScore })
    .eq('id', userId)

  return newScore
}

export async function getScoreHistory(userId: string) {
  const { data } = await supabase
    .from('score_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data || []
}
