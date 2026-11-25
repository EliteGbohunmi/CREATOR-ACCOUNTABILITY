import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, CheckCircle2 } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../lib/AuthContext'
import { fetchNotifications, markRead, markAllRead, type AppNotification } from '../lib/notifications'

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) return
    let mounted = true
    const load = async () => {
      try {
        const res = await fetchNotifications(user.email!)
        if (!mounted) return
        setItems(res.notifications)
        setUnread(res.unread)
      } catch (err) {
        console.error('Failed to load notifications:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user?.email])

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

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: '76px', borderRadius: '12px', background: '#111', border: '1px solid #1A1A1A' }} />
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => navigate(-1)} style={styles.backBtn} aria-label="Back">
              <ArrowLeft size={18} color="#F0EDE8" />
            </button>
            <div>
              <p style={styles.eyebrow}>Inbox</p>
              <h1 style={styles.title}>Notifications</h1>
              <p style={styles.subtitle}>
                {unread > 0 ? `${unread} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          {unread > 0 && (
            <button style={styles.markAllBtn} onClick={handleMarkAll}>
              <CheckCircle2 size={14} color="#F5A623" />
              Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconWrap}>
              <CheckCircle2 size={36} color="#4CAF50" strokeWidth={2} />
            </div>
            <h2 style={styles.emptyTitle}>You're all caught up</h2>
            <p style={styles.emptySub}>
              No notifications right now. We'll let you know when your partner nudges you, your streak is at risk, or something new ships.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {items.map(n => (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                style={{
                  ...styles.card,
                  borderColor: n.read_at ? '#222222' : 'rgba(229,62,62,0.25)',
                  background: n.read_at ? '#151515' : 'rgba(229,62,62,0.04)',
                  opacity: n.read_at ? 0.75 : 1
                }}
              >
                {!n.read_at && <span style={styles.unreadDot} />}
                <div style={styles.cardTop}>
                  <span style={styles.cardTitle}>{n.title || 'Notification'}</span>
                  <span style={styles.cardTime}>{timeAgo(n.sent_at)}</span>
                </div>
                {n.body && <div style={styles.cardBody}>{n.body}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: '#111',
    border: '1px solid #1E1E1E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0
  },
  eyebrow: {
    color: '#555',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.15rem'
  },
  title: {
    fontFamily: 'Space Grotesk',
    fontWeight: '700',
    fontSize: '1.6rem',
    color: '#F0EDE8',
    lineHeight: 1.1
  },
  subtitle: {
    color: '#666',
    fontSize: '0.82rem',
    marginTop: '0.2rem'
  },
  markAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: '#1A1400',
    border: '1px solid rgba(245,166,35,0.25)',
    borderRadius: '10px',
    padding: '0.55rem 0.85rem',
    color: '#F5A623',
    fontSize: '0.78rem',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0
  },
  emptyState: {
    background: 'linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%)',
    border: '1px solid #1A1A1A',
    borderRadius: '18px',
    padding: '3.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  emptyIconWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    background: 'rgba(76,175,80,0.08)',
    border: '1px solid rgba(76,175,80,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem'
  },
  emptyTitle: {
    fontFamily: 'Space Grotesk',
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#F0EDE8',
    marginBottom: '0.5rem'
  },
  emptySub: {
    color: '#666',
    fontSize: '0.85rem',
    lineHeight: 1.55,
    maxWidth: '360px'
  },
  card: {
    position: 'relative',
    width: '100%',
    border: '1px solid #1A1A1A',
    borderRadius: '12px',
    padding: '0.9rem 1rem',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem'
  },
  unreadDot: {
    position: 'absolute',
    left: '0',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '24px',
    background: '#E53E3E',
    borderRadius: '0 3px 3px 0'
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '0.5rem'
  },
  cardTitle: {
    color: '#F0EDE8',
    fontSize: '0.88rem',
    fontWeight: '600'
  },
  cardTime: {
    color: '#555',
    fontSize: '0.7rem',
    flexShrink: 0
  },
  cardBody: {
    color: '#888',
    fontSize: '0.82rem',
    lineHeight: 1.45
  }
}
