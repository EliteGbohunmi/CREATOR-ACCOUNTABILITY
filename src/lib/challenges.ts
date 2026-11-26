import { supabase } from './supabase'

export type Challenge = {
  id: string
  name: string
  days: number
  created_by: string
  created_at: string
  end_date: string
  status: string
  visibility: 'public' | 'private'
  access_code: string | null
  proof_required: boolean
  category: 'content' | 'fitness' | 'learning' | 'creative' | 'other'
  profiles?: { name: string | null }
}

export type UserChallenge = {
  id: string
  user_id: string
  challenge_id: string
  progress: number
  last_checked_in: string | null
  completed_at: string | null
  left_at: string | null
  joined_via_code: boolean
  milestones_awarded: string[]
  challenges?: Challenge
  profiles?: { name: string | null }
}

export const CATEGORIES = ['content', 'fitness', 'learning', 'creative', 'other'] as const

export const TEMPLATES = [
  { label: '7-Day Sprint', name: '7-Day Sprint', days: 7, category: 'content' as const, emoji: '⚡' },
  { label: '30-Day Content', name: '30-Day Content Challenge', days: 30, category: 'content' as const, emoji: '🎬' },
  { label: '100-Day Consistency', name: '100-Day Consistency', days: 100, category: 'content' as const, emoji: '🔥' },
  { label: '21-Day Habit', name: '21-Day Habit Builder', days: 21, category: 'learning' as const, emoji: '📚' },
  { label: 'Morning Routine', name: '14-Day Morning Routine', days: 14, category: 'fitness' as const, emoji: '🌅' },
  { label: 'Write Daily', name: '30-Day Writing Streak', days: 30, category: 'creative' as const, emoji: '✍️' },
]

export function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export function validateCode(code: string): boolean {
  return /^[A-Z0-9]{4,8}$/.test(code.toUpperCase())
}

export async function listChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*, profiles(name)')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
  if (error) { console.error('listChallenges:', error); return [] }
  return data || []
}

export async function listPrivateChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*, profiles(name)')
    .eq('visibility', 'private')
    .order('created_at', { ascending: false })
  if (error) { console.error('listPrivateChallenges:', error); return [] }
  return data || []
}

export async function listMyChallenges(userId: string): Promise<UserChallenge[]> {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*, challenges(*, profiles(name))')
    .eq('user_id', userId)
    .is('left_at', null)
  if (error) { console.error('listMyChallenges:', error); return [] }
  return data || []
}

export async function listAllParticipants(): Promise<UserChallenge[]> {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('challenge_id, user_id, last_checked_in, progress, profiles(name)')
    .is('left_at', null)
  if (error) { console.error('listAllParticipants:', error); return [] }
  return data || []
}

export async function createChallenge(input: {
  userId: string
  name: string
  days: number
  visibility: 'public' | 'private'
  proofRequired: boolean
  category: Challenge['category']
  customCode?: string | null
}): Promise<{ data: Challenge | null; error: string | null }> {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + input.days)

  let code: string | null = null
  if (input.visibility === 'private') {
    if (input.customCode && input.customCode.trim()) {
      const cleaned = input.customCode.trim().toUpperCase()
      if (!validateCode(cleaned)) {
        return { data: null, error: 'Code must be 4–8 letters or numbers' }
      }
      const { data: existing } = await supabase
        .from('challenges')
        .select('id')
        .eq('access_code', cleaned)
        .maybeSingle()
      if (existing) return { data: null, error: 'That code is already taken. Try another.' }
      code = cleaned
    } else {
      let tries = 0
      while (tries < 5) {
        const candidate = generateCode()
        const { data: existing } = await supabase
          .from('challenges')
          .select('id')
          .eq('access_code', candidate)
          .maybeSingle()
        if (!existing) { code = candidate; break }
        tries++
      }
      if (!code) code = generateCode(8)
    }
  }

  const { data, error } = await supabase
    .from('challenges')
    .insert({
      name: input.name,
      days: input.days,
      created_by: input.userId,
      end_date: endDate.toISOString(),
      status: 'active',
      visibility: input.visibility,
      access_code: code,
      proof_required: input.proofRequired,
      category: input.category,
    })
    .select()
    .single()

  if (error) {
    console.error('createChallenge:', error)
    return { data: null, error: error.message }
  }
  return { data, error: null }
}

export async function joinChallenge(
  userId: string,
  challengeId: string,
  viaCode = false
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('user_challenges').insert({
    user_id: userId,
    challenge_id: challengeId,
    progress: 0,
    joined_via_code: viaCode,
  })
  if (error) {
    console.error('joinChallenge:', error)
    return { ok: false, error: error.message }
  }
  return { ok: true, error: null }
}

export async function joinByCode(
  userId: string,
  code: string
): Promise<{ challenge: Challenge | null; error: string | null }> {
  const cleaned = code.trim().toUpperCase()
  if (!validateCode(cleaned)) {
    return { challenge: null, error: 'Code must be 4–8 letters or numbers' }
  }
  const { data: ch, error } = await supabase
    .from('challenges')
    .select('*, profiles(name)')
    .eq('access_code', cleaned)
    .eq('visibility', 'private')
    .maybeSingle()
  if (error) return { challenge: null, error: error.message }
  if (!ch) return { challenge: null, error: 'No private challenge matches that code' }
  const res = await joinChallenge(userId, ch.id, true)
  return res.ok ? { challenge: ch, error: null } : { challenge: null, error: res.error }
}

export async function leaveChallenge(ucId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_challenges')
    .update({ left_at: new Date().toISOString() })
    .eq('id', ucId)
  if (error) { console.error('leaveChallenge:', error); return false }
  const { data: prof } = await supabase
    .from('profiles')
    .select('leaves_used')
    .eq('id', userId)
    .single()
  await supabase
    .from('profiles')
    .update({ leaves_used: (prof?.leaves_used || 0) + 1 })
    .eq('id', userId)
  return true
}

export async function deleteChallenge(
  challengeId: string
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('challenges').delete().eq('id', challengeId)
  if (error) {
    console.error('deleteChallenge:', error)
    return { ok: false, error: error.message }
  }
  return { ok: true, error: null }
}

export async function checkIn(
  ucId: string,
  challengeDays: number
): Promise<{ progress: number; completed: boolean } | null> {
  const today = new Date().toISOString().split('T')[0]
  const { data: uc } = await supabase
    .from('user_challenges')
    .select('progress')
    .eq('id', ucId)
    .single()
  if (!uc) return null
  const newProgress = uc.progress + 1
  const completed = newProgress >= challengeDays
  const { error } = await supabase
    .from('user_challenges')
    .update({
      progress: newProgress,
      last_checked_in: today,
      ...(completed ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq('id', ucId)
  if (error) { console.error('checkIn:', error); return null }
  return { progress: newProgress, completed }
}

export async function listMessages(challengeId: string) {
  const { data, error } = await supabase
    .from('challenge_messages')
    .select('*, profiles(name)')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) { console.error('listMessages:', error); return [] }
  return data || []
}

export async function postMessage(challengeId: string, userId: string, body: string) {
  const { error } = await supabase
    .from('challenge_messages')
    .insert({ challenge_id: challengeId, user_id: userId, body })
  if (error) { console.error('postMessage:', error); return false }
  return true
}

export async function updateChallengeCode(
  challengeId: string,
  newCode: string
): Promise<{ ok: boolean; error: string | null }> {
  const cleaned = newCode.trim().toUpperCase()
  if (!validateCode(cleaned)) {
    return { ok: false, error: 'Code must be 4–8 letters or numbers' }
  }
  const { data: existing } = await supabase
    .from('challenges')
    .select('id')
    .eq('access_code', cleaned)
    .neq('id', challengeId)
    .maybeSingle()
  if (existing) return { ok: false, error: 'That code is already taken' }
  const { error } = await supabase
    .from('challenges')
    .update({ access_code: cleaned })
    .eq('id', challengeId)
  if (error) return { ok: false, error: error.message }
  return { ok: true, error: null }
}

export function daysLeft(uc: UserChallenge): number {
  return Math.max((uc.challenges?.days || 0) - uc.progress, 0)
}

export function percent(uc: UserChallenge): number {
  if (!uc.challenges?.days) return 0
  return Math.min(Math.round((uc.progress / uc.challenges.days) * 100), 100)
}

export function milestonesToAward(p: number): number[] {
  const out: number[] = []
  if (p >= 25) out.push(25)
  if (p >= 50) out.push(50)
  if (p >= 75) out.push(75)
  if (p >= 100) out.push(100)
  return out
}
