export async function setupPushNotifications(userId: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  try {
    const reg = await navigator.serviceWorker.register('/service-worker.js')
    await navigator.serviceWorker.ready

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
    if (!vapidKey) {
      console.error('VITE_VAPID_PUBLIC_KEY is missing')
      return
    }

    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })
    }

    const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || ''
    const res = await fetch(`${apiUrl}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription: sub })
    })

    if (!res.ok) console.error('Failed to save push subscription:', res.status)
  } catch (err) {
    console.error('Push setup failed:', err)
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}
