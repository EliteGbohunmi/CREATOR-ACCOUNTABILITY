import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { fetchNotifications, type AppNotification } from './notifications'

export function useNotificationsLive(email?: string) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!email) return
    let mounted = true

    const load = async () => {
      const res = await fetchNotifications(email)
      if (!mounted) return
      setItems(res.notifications)
      setUnread(res.unread)
      setLoading(false)
    }

    load()

    // Resolve the profile id for the subscription filter
    let channel: ReturnType<typeof supabase.channel> | null = null

    ;(async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (!profile || !mounted) return

      channel = supabase
        .channel('notification_log_live')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notification_log',
            filter: `user_id=eq.${profile.id}`,
          },
          (payload) => {
            const row = payload.new as any
            const newItem: AppNotification = {
              id: row.id,
              title: row.title,
              body: row.body,
              type: row.type,
              action: row.action,
              read_at: row.read_at,
              sent_at: row.sent_at,
              delivered: row.delivered,
            }
            setItems(prev => [newItem, ...prev])
            setUnread(u => u + 1)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notification_log',
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            // Re-fetch on update so read_at state stays in sync
            load()
          }
        )
        .subscribe()
    })()

    // Re-fetch when tab becomes visible (covers missed events while backgrounded)
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      mounted = false
      if (channel) supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [email])

  return { items, unread, loading, reload: () => { if (email) fetchNotifications(email).then(r => { setItems(r.notifications); setUnread(r.unread) }) } }
}
