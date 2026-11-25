const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || ''

export type AppNotification = {
  id: string
  title: string | null
  body: string | null
  type: string
  action: string | null
  read_at: string | null
  created_at: string
  delivered: boolean
}

export async function fetchNotifications(email: string): Promise<{ notifications: AppNotification[]; unread: number }> {
  try {
    const res = await fetch(`${API_URL}/api/notifications/list?email=${encodeURIComponent(email)}`)
    if (!res.ok) return { notifications: [], unread: 0 }
    return res.json()
  } catch {
    return { notifications: [], unread: 0 }
  }
}

export async function markRead(id: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
  } catch {}
}

export async function markAllRead(email: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/notifications/read-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function fireReminder(title: string, body: string): Promise<void> {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/app-icon.png' })
}

export function saveReminderTime(hour: number, minute: number): void {
  localStorage.setItem('reminder_time', JSON.stringify({ hour, minute }))
}

export function getSavedReminderTime(): { hour: number; minute: number } | null {
  const raw = localStorage.getItem('reminder_time')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
