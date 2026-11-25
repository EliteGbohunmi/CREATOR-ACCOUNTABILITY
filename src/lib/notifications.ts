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
