const API_URL = 'https://streak-backend-ar7h.onrender.com';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Creator Accountability', {
      body: data.body || '',
      icon: data.icon || '/app-icon.png',
      image: data.image,
      badge: data.badge || '/badge-icon.svg',
      vibrate: data.vibrate || [200, 100, 200],
      actions: data.actions || [],
      data: data.data || {}
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  const actionType = data.action || 'checkin';

  if (action === 'dismiss') return;

  if (action === 'accept' && data.proofId && data.partnerEmail) {
    event.waitUntil(
      fetch(API_URL + '/api/proof/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofId: data.proofId, partnerEmail: data.partnerEmail })
      }).catch(() => {})
    );
    return;
  }

  let path = '/dashboard';
  if (actionType === 'checkin' || action === 'checkin') {
    path = '/dashboard?proof=open';
  } else if (action === 'view' && data.proofId) {
    path = '/dashboard?proof=' + data.proofId + '&view=1';
  }

  const absoluteUrl = new URL(path, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // If app is open, focus + navigate it
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(absoluteUrl);
          return client.focus();
        }
      }
      // If app is closed, open within scope (Chrome will use PWA if installed)
      return clients.openWindow(absoluteUrl);
    })
  );
});
