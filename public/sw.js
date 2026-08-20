self.addEventListener('push', function(event) {
  const data = event.data.json();
  const title = data.title || 'Streak';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: data.data || {},
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(clients.openWindow(url));
});
