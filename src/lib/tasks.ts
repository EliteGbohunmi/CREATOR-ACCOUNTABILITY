import { supabase } from './supabase'

export type Task = {
  id: string
  user_id: string
  name: string
  points: number
  active: boolean
  created_at: string
}

export type TaskCompletion = {
  id: string
  task_id: string
  user_id: string
  completed_date: string
  completed_at: string
  points: number
  proof_url: string | null
  confirmed: boolean
}

export async function getUserTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: true })
  if (error) { console.error('getUserTasks:', error); return [] }
  return data || []
}

export async function getTodayCompletions(userId: string, date: string): Promise<TaskCompletion[]> {
  const { data, error } = await supabase
    .from('task_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('completed_date', date)
  if (error) { console.error('getTodayCompletions:', error); return [] }
  return data || []
}

export async function completeTask(
  userId: string,
  task: Task,
  date: string,
  proofUrl?: string
): Promise<TaskCompletion | null> {
  const { data, error } = await supabase
    .from('task_completions')
    .upsert({
      task_id: task.id,
      user_id: userId,
      completed_date: date,
      points: task.points,
      proof_url: proofUrl || null,
    }, { onConflict: 'task_id,user_id,completed_date' })
    .select()
    .single()
  if (error) { console.error('completeTask:', error); return null }
  return data
}

export async function uncompleteTask(taskId: string, userId: string, date: string): Promise<boolean> {
  const { error } = await supabase
    .from('task_completions')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .eq('completed_date', date)
  if (error) { console.error('uncompleteTask:', error); return false }
  return true
}

export async function createTask(userId: string, name: string, points: number): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, name, points, active: true })
    .select()
    .single()
  if (error) { console.error('createTask:', error); return null }
  return data
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const { error } = await supabase.from('tasks').update({ active: false }).eq('id', taskId)
  if (error) { console.error('deleteTask:', error); return false }
  return true
}
