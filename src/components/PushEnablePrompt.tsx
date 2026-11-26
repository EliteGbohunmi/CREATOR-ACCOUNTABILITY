import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'https://streak-backend-ar7h.onrender.com'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export default function PushEnablePrompt({ email }: { email: string }) {
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (Notification.permission === 'denied') { setDenied(true); return }
    if (Notification.permission === 'granted') return
    if (localStorage.getItem('push_prompt_dismissed') === '1') return
    setShow(true)
  }, [])

  const enable = async () => {
    if (!VAPID_PUBLIC_KEY) { console.error('Missing VITE_VAPID_PUBLIC_KEY'); return }
    setBusy(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setShow(false); return }
      const reg = await navigator.serviceWorker.register('/service-worker.js')
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await fetch(`${API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subscription: sub }),
      })
      setShow(false)
    } catch (e) {
      console.error('Push enable failed:', e)
    } finally {
      setBusy(false)
    }
  }

  const dismiss = () => {
    localStorage.setItem('push_prompt_dismissed', '1')
    setShow(false)
  }

  if (denied) {
    return (
      <div style={styles.bannerDenied}>
        Notifications are blocked. Enable them in your browser settings to get nudges.
      </div>
    )
  }
  if (!show) return null

  return (
    <div style={styles.banner}>
      <Bell size={18} color="#F5A623" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={styles.title}>Turn on nudges</p>
        <p style={styles.sub}>Get notified when your partner nudges you or your streak is at risk.</p>
      </div>
      <button onClick={enable} disabled={busy} style={styles.enableBtn}>
        {busy ? '...' : 'Enable'}
      </button>
      <button onClick={dismiss} style={styles.closeBtn} aria-label="Dismiss">
        <X size={16} color="#888" />
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    display: 'flex', alignItems: 'center', gap: '0.7rem',
    background: 'rgba(245,166,35,0.06)',
    border: '1px solid rgba(245,166,35,0.22)',
    borderRadius: '12px', padding: '0.7rem 0.85rem',
    marginBottom: '1rem',
  },
  bannerDenied: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', padding: '0.7rem 0.85rem',
    marginBottom: '1rem', color: '#888', fontSize: '0.8rem',
  },
  title: { margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#F0EDE8' },
  sub: { margin: '0.15rem 0 0', fontSize: '0.76rem', color: '#888', lineHeight: 1.4 },
  enableBtn: {
    background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '8px', padding: '0.45rem 0.8rem',
    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '0.2rem', display: 'flex', flexShrink: 0,
  },
}
