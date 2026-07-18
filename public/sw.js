self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

self.addEventListener('message', e => {
  if (e.data.type === 'SCHEDULE_REMINDER') {
    const { hour, minute } = e.data

    const now = new Date()
    const target = new Date()
    target.setHours(hour, minute, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)

    const delay = target.getTime() - now.getTime()

    setTimeout(() => {
      self.registration.showNotification('🔥 Creator Accountability', {
        body: "Don't break your streak! Have you posted today?",
        icon: '/vite.svg',
        badge: '/vite.svg'
      })
    }, delay)
  }
})
