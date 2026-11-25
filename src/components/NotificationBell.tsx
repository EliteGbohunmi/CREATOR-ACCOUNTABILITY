import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { fetchNotifications, markRead, markAllRead, type AppNotification } from '../lib/notifications'

export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user?.email) return
    let mounted = true
    const load = async () => {
      const res = await fetchNotifications(user.email!)
      if (!mounted) return
      setItems(res.notifications)
      setUnread(res.unread)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [user?.email])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleItemClick = async (n: AppNotification) => {
    if (!n.read_at) {
      await markRead(n.id)
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      setUnread(u => Math.max(0, u - 1))
    }
  }

  const handleMarkAll = async () => {
    if (!user?.email) return
    await markAllRead(user.email)
    setItems(prev => prev.map(x => ({ ...x, read_at: x.read_at || new Date().toISOString() })))
    setUnread(0)
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString()
  }

  if (!user) return null

  return (
    <div ref={ref} style={styles.wrapper}>
      <button style={styles.bell} onClick={() => setOpen(!open)} aria-label="Notifications">
        <Bell size={19} color="#F0EDE8" strokeWidth={1.8} />
        {unread > 0 && (
          <span style={styles.badge}>{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>Notifications</span>
            {unread > 0 && (
              <button style={styles.markAll} onClick={handleMarkAll}>Mark all read</button>
            )}
          </div>
          <div style={styles.panelBody}>
            {items.length === 0 ? (
              <div style={styles.empty}>No notifications yet</div>
            ) : (
              items.map(n => (
                <button
                  key={n.id}
                  style={{
                    ...styles.item,
                    background: n.read_at ? 'transparent' : 'rgba(245,166,35,0.04)'
                  }}
                  onClick={() => handleItemClick(n)}
                >
                  <div style={styles.itemTop}>
                    <span style={styles.itemTitle}>{n.title || 'Notification'}</span>
                    <span style={styles.itemTime}>{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body && <div style={styles.itemBody}>{n.body}</div>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { position: 'relative' },
  bell: {
    position: 'relative',
    width: '38px',
    height: '38px',
    borderRadius: '11px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid #1E1E1E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0
  },
  badge: {
    position: 'absolute',
    top: '-3px',
    right: '-3px',
    minWidth: '17px',
    height: '17px',
    borderRadius: '9px',
    background: '#F5A623',
    color: '#0A0A0A',
    fontSize: '10px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    fontFamily: 'Space Grotesk',
    boxShadow: '0 0 0 2px #0A0A0A'
  },
  panel: {
    position: 'absolute',
    top: '46px',
    right: 0,
    width: '340px',
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: '460px',
    background: '#0F0F0F',
    border: '1px solid #1E1E1E',
    borderRadius: '14px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
    zIndex: 300,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.9rem 1rem',
    borderBottom: '1px solid #1E1E1E'
  },
  panelTitle: {
    color: '#F0EDE8',
    fontFamily: 'Space Grotesk',
    fontWeight: '700',
    fontSize: '0.92rem'
  },
  markAll: {
    background: 'none',
    border: 'none',
    color: '#F5A623',
    fontSize: '0.72rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0
  },
  panelBody: {
    overflowY: 'auto',
    flex: 1
  },
  empty: {
    padding: '2rem 1rem',
    textAlign: 'center',
    color: '#555',
    fontSize: '0.85rem'
  },
  item: {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid #161616',
    padding: '0.85rem 1rem',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  itemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '0.5rem'
  },
  itemTitle: {
    color: '#F0EDE8',
    fontSize: '0.83rem',
    fontWeight: '600'
  },
  itemTime: {
    color: '#555',
    fontSize: '0.68rem',
    flexShrink: 0
  },
  itemBody: {
    color: '#7A7A7A',
    fontSize: '0.78rem',
    lineHeight: 1.45
  }
}
