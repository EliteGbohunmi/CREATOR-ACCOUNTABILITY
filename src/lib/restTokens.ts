import { supabase } from './supabase'

export async function checkAndAwardToken(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('rest_tokens, last_token_earned, leaves_used')
    .eq('id', userId)
    .single()

  if (!profile) return

  const { data: streak } = await supabase
    .from('streaks')
    .select('current_streak, last_checked_in')
    .eq('user_id', userId)
    .single()

  if (!streak) return

  const today = new Date().toISOString().split('T')[0]
  const lastEarned = profile.last_token_earned

  // Award a token every 14 days of consistent posting, max 3 on free plan
  if (streak.current_streak > 0 && streak.current_streak % 14 === 0) {
    if (lastEarned !== today && (profile.rest_tokens || 0) < 3) {
      await supabase.from('profiles').update({
        rest_tokens: (profile.rest_tokens || 0) + 1,
        last_token_earned: today
      }).eq('id', userId)
      return true // token awarded
    }
  }
  return false
}

export async function useRestToken(userId: string): Promise<{ success: boolean; message: string }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('rest_tokens')
    .eq('id', userId)
    .single()

  if (!profile) return { success: false, message: 'Profile not found' }
  if ((profile.rest_tokens || 0) <= 0) {
    return { success: false, message: 'No rest tokens remaining. Upgrade to Pro for unlimited tokens.' }
  }

  const today = new Date().toISOString().split('T')[0]

  // Mark streak as on rest day — don't reset, don't increment
  await supabase.from('streaks').update({
    last_checked_in: today,
    on_rest_day: true
  }).eq('user_id', userId)

  await supabase.from('profiles').update({
    rest_tokens: (profile.rest_tokens || 0) - 1
  }).eq('id', userId)

  return { success: true, message: 'Rest day applied. Your streak is protected.' }
}
