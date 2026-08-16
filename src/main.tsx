import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'
import { registerPushSubscription, getVapidKey } from './lib/backend'
import { supabase } from './lib/supabase'

async function setupPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    console.log('Service worker registered')

    if (Notification.permission !== 'granted') return

    const vapidKey = await getVapidKey()
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await registerPushSubscription(user.id, sub)
      console.log('Push subscription registered')
    }
  } catch (err) {
    console.error('Push setup failed:', err)
  }
}

setupPushNotifications()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
