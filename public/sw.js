self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data || {}
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const action = event.notification.data?.action || 'dashboard'
  const url = action === 'checkin' ? '/dashboard'
    : action === 'analytics' ? '/analytics'
    : action === 'reflection' ? '/dashboard'
    : '/dashboard'
  event.waitUntil(clients.openWindow(url))
})
