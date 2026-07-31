import { supabase } from './supabase'

export async function getUserPersona(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_persona')
    .eq('id', userId)
    .single()

  return profile?.ai_persona || ''
}

export function buildPersonaSystemPrompt(persona: string): { role: 'system'; content: string } {
  if (!persona) {
    return {
      role: 'system',
      content: 'You are a helpful content assistant. Write in a natural, authentic voice.'
    }
  }

  return {
    role: 'system',
    content: `You are an AI content assistant. You must write in the voice of the creator.

Here is their persona:

${persona}

CRITICAL INSTRUCTION: ALL content you generate MUST sound like this creator wrote it. Never use generic phrases. Never sound like a robot. Match their tone, style, and voice exactly.`
  }
}
