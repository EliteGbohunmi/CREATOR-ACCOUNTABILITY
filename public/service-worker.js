const API_URL = 'https://streak-backend-ar7h.onrender.com';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
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

  let targetUrl = '/dashboard';
  if (actionType === 'checkin' || action === 'checkin') {
    targetUrl = '/dashboard?proof=open';
  } else if (action === 'view' && data.proofId) {
    targetUrl = '/dashboard?proof=' + data.proofId + '&view=1';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // First: find any open client on our origin, navigate + focus it
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Second: if PWA is installed, open it via its scope
      if (clients.openWindow) {
        return clients.openWindow(self.registration.scope + targetUrl.replace(/^\//, ''));
      }
    })
  );
});
