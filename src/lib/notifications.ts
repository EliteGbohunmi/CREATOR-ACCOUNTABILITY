export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export function fireReminder() {
  if (isNotificationSupported() && Notification.permission === 'granted') {
    new Notification('🔥 Creator Accountability', {
      body: "Don't break your streak! Have you posted today?",
      icon: '/vite.svg'
    })
  }
}

export function saveReminderTime(hour: number, minute: number) {
  localStorage.setItem('reminder_hour', String(hour))
  localStorage.setItem('reminder_minute', String(minute))
}

export function getSavedReminderTime(): { hour: number; minute: number } | null {
  const hour = localStorage.getItem('reminder_hour')
  const minute = localStorage.getItem('reminder_minute')
  if (!hour || !minute) return null
  return { hour: parseInt(hour), minute: parseInt(minute) }
}
