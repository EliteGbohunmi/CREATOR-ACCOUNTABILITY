import { supabase } from './supabase'

export const ACHIEVEMENTS = [
  { type: 'first_checkin', label: 'First Step', desc: 'Checked in for the first time', icon: '🎯' },
  { type: 'streak_7', label: '7 Day Streak', desc: 'Maintained a 7-day streak', icon: '🔥' },
  { type: 'streak_30', label: '30 Day Streak', desc: 'Maintained a 30-day streak', icon: '⚡' },
  { type: 'streak_60', label: '60 Day Streak', desc: 'Maintained a 60-day streak', icon: '💎' },
  { type: 'streak_100', label: '100 Day Streak', desc: 'Maintained a 100-day streak', icon: '👑' },
  { type: 'streak_365', label: '365 Day Streak', desc: 'A full year of consistency', icon: '🏆' },
  { type: 'tasks_10', label: 'Getting Started', desc: 'Completed 10 tasks', icon: '✅' },
  { type: 'tasks_50', label: 'Consistent', desc: 'Completed 50 tasks', icon: '📈' },
  { type: 'tasks_100', label: 'Century', desc: 'Completed 100 tasks', icon: '💯' },
  { type: 'first_challenge', label: 'Challenger', desc: 'Joined your first challenge', icon: '🏅' },
  { type: 'challenge_complete', label: 'Finisher', desc: 'Completed a challenge', icon: '🎖️' },
  { type: 'created_challenge', label: 'Leader', desc: 'Created a challenge', icon: '🚀' },
  { type: 'top_10', label: 'Top 10', desc: 'Reached top 10 on leaderboard', icon: '⭐' },
]

export async function checkAndAwardAchievements(userId: string) {
  const [
    { data: streak },
    { data: tasks },
    { data: challenges },
    { data: created },
    { data: existing },
    { data: leaderboard }
  ] = await Promise.all([
    supabase.from('streaks').select('current_streak, best_streak').eq('user_id', userId).single(),
    supabase.from('tasks').select('id').eq('user_id', userId).eq('completed', true),
    supabase.from('user_challenges').select('id, completed_at').eq('user_id', userId),
    supabase.from('challenges').select('id').eq('created_by', userId),
    supabase.from('achievements').select('type').eq('user_id', userId),
    supabase.from('streaks').select('user_id').order('current_streak', { ascending: false }).limit(10)
  ])

  const earned = new Set((existing || []).map((a: any) => a.type))
  const toAward: string[] = []

  const s = streak?.current_streak || 0
  const best = streak?.best_streak || 0
  const taskCount = tasks?.length || 0
  const challengeCount = challenges?.length || 0
  const completedChallenges = (challenges || []).filter((c: any) => c.completed_at).length
  const createdCount = created?.length || 0
  const inTop10 = (leaderboard || []).some((r: any) => r.user_id === userId)

  const checks: Record<string, boolean> = {
    first_checkin: s >= 1 || best >= 1,
    streak_7: best >= 7,
    streak_30: best >= 30,
    streak_60: best >= 60,
    streak_100: best >= 100,
    streak_365: best >= 365,
    tasks_10: taskCount >= 10,
    tasks_50: taskCount >= 50,
    tasks_100: taskCount >= 100,
    first_challenge: challengeCount >= 1,
    challenge_complete: completedChallenges >= 1,
    created_challenge: createdCount >= 1,
    top_10: inTop10
  }

  for (const [type, met] of Object.entries(checks)) {
    if (met && !earned.has(type)) {
      toAward.push(type)
    }
  }

  if (toAward.length > 0) {
    await supabase.from('achievements').insert(
      toAward.map(type => ({ user_id: userId, type }))
    )
  }

  return toAward
}
