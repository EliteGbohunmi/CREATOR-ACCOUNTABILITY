const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

export async function registerPushSubscription(userId: string, subscription: PushSubscription) {
  const key = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')
  
  const res = await fetch(`${BASE_URL}/api/notifications/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : '',
      auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : ''
    })
  })
  if (!res.ok) throw new Error(`Failed to save push subscription (${res.status})`)
}

export async function notifyPartnerCheckin(userId: string) {
  const res = await fetch(`${BASE_URL}/api/streaks/checkin-notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  })
  if (!res.ok) throw new Error(`Check-in notification failed (${res.status})`)
}

export async function sendNudge(fromUserId: string, toUserId: string) {
  const res = await fetch(`${BASE_URL}/api/notifications/nudge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from_user_id: fromUserId, to_user_id: toUserId })
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Nudge failed (${res.status}): ${errorText}`)
  }
  return res.json()
}

export async function getVapidKey(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/notifications/vapid-key`)
  if (!res.ok) throw new Error(`Failed to fetch VAPID key (${res.status})`)
  const data = await res.json()
  return data.publicKey || ''
}

export async function callAI(body: object) {
  const res = await fetch(`${BASE_URL}/api/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`AI call failed (${res.status}): ${errorText}`)
  }
  return res.json()
}
