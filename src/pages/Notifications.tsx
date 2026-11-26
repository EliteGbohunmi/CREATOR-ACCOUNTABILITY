import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, CheckCircle2, Zap, Sparkles } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../lib/AuthContext'
import { markRead, markAllRead, type AppNotification } from '../lib/notifications'
import { useNotificationsLive } from '../lib/useNotificationsLive'

function iconFor(n: AppNotification) {
  const t = (n.type || '').toLowerCase()
  if (t === 'system') return { Icon: Sparkles, color: '#7C9CF5' }
  if (t === 'push') return { Icon: Zap, color: '#F5A623' }
  return { Icon: Bell, color: '#F5A623' }
}

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { items, unread, loading, reload } = useNotificationsLive(user?.email)
  const [setItemsLocal] = useState(() => (fn: any) => fn)
  const setItems = (updater: (prev: AppNotification[]) => AppNotification[]) => {
    // called after mark-read; just trigger a refetch via the hook
    reload()
  }
  const setUnread = (_: any) => { /* handled by reload */ }

  const handleItemClick = async (n: AppNotification) => {
    if (!n.read_at) {
      await markRead(n.id)
      reload()
      window.dispatchEvent(new Event('notifications:refresh'))
    }
  }

  const handleMarkAll = async () => {
    if (!user?.email) return
    await markAllRead(user.email)
    reload()
    window.dispatchEvent(new Event('notifications:refresh'))
  }

  const timeAgo = (iso: string) => {
    const normalized = (iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) ? iso : iso + 'Z'
    const diff = Date.now() - new Date(normalized).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString()
  }

  const unreadItems = items.filter(n => !n.read_at)
  const readItems = items.filter(n => n.read_at)
  const hasUnread = unreadItems.length > 0

  const renderCard = (n: AppNotification, isRead: boolean) => {
    const { Icon, color } = iconFor(n)
    return (
      <button
        key={n.id}
        onClick={() => handleItemClick(n)}
        className="nf-card"
        style={{
          ...styles.card,
          ...(isRead ? styles.cardRead : styles.cardUnread),
        }}
        aria-label={n.title || 'Notification'}
      >
        <div
          className="nf-avatar"
          style={{
            ...styles.avatar,
            background: isRead ? 'rgba(255,255,255,0.04)' : `${color}18`,
            border: isRead ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${color}33`,
          }}
        >
          <Icon size={16} color={isRead ? '#666' : color} strokeWidth={2} />
        </div>
        <div style={styles.cardBody}>
          <div style={styles.cardTop}>
            <span style={{ ...styles.cardTitle, color: isRead ? '#9A9A9A' : '#F0EDE8', fontWeight: isRead ? 500 : 600 }}>
              {n.title || 'Notification'}
            </span>
            <span style={styles.cardTime}>{timeAgo(n.sent_at)}</span>
          </div>
          {n.body && (
            <div style={{ ...styles.cardBodyText, color: isRead ? '#777' : '#888' }}>
              {n.body}
            </div>
          )}
        </div>
      </button>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="nf-shell" style={styles.shell}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ height: '76px', borderRadius: '14px', background: '#111', border: '1px solid #1A1A1A' }} />
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="nf-shell" style={styles.shell}>
        <style>{RESPONSIVE_CSS}</style>

        <div className="nf-header" style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={() => navigate(-1)} style={styles.backBtn} aria-label="Back">
              <ArrowLeft size={18} color="#F0EDE8" />
            </button>
            <div style={styles.headerText}>
              <p style={styles.eyebrow}>Inbox</p>
              <h1 style={styles.title}>Notifications</h1>
              <p style={styles.subtitle}>
                {hasUnread ? `${unreadItems.length} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          {hasUnread && (
            <button style={styles.markAllBtn} onClick={handleMarkAll}>
              <CheckCircle2 size={14} color="#F5A623" />
              Mark all read
            </button>
          )}
        </div>

        {/* All caught up hero — shown when zero unread */}
        {!hasUnread && (
          <div className="nf-hero" style={styles.hero}>
            <div style={styles.heroIconWrap}>
              <CheckCircle2 size={34} color="#4CAF50" strokeWidth={1.8} />
            </div>
            <h2 style={styles.heroTitle}>You're all caught up</h2>
            <p style={styles.heroSub}>
              {readItems.length > 0
                ? 'Scroll down to see older notifications.'
                : 'No notifications right now. We\'ll let you know when your partner nudges you or something new ships.'}
            </p>
          </div>
        )}

        {/* Unread first */}
        {hasUnread && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionLabel}>New</span>
              <div style={styles.sectionLine} />
            </div>
            <div className="nf-list" style={styles.list}>
              {unreadItems.map(n => renderCard(n, false))}
            </div>
          </div>
        )}

        {/* Demoted read history */}
        {readItems.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionLabel}>Older</span>
              <div style={styles.sectionLine} />
            </div>
            <div className="nf-list" style={styles.list}>
              {readItems.map(n => renderCard(n, true))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="nf-hero" style={styles.hero}>
            <div style={styles.heroIconWrapNeutral}>
              <Bell size={32} color="#555" strokeWidth={1.6} />
            </div>
            <h2 style={styles.heroTitle}>No notifications</h2>
            <p style={styles.heroSub}>You'll see updates from your partner here.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

const RESPONSIVE_CSS = `
  .nf-shell {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem;
    width: 100%;
  }
  .nf-card { -webkit-tap-highlight-color: transparent; }
  @media (hover: hover) and (pointer: fine) {
    .nf-card:hover { border-color: rgba(245,166,35,0.3) !important; }
  }
  @media (max-width: 480px) {
    .nf-shell { padding: 0 0.75rem !important; }
    .nf-header { flex-wrap: wrap !important; gap: 0.6rem !important; }
    .nf-hero { padding: 2.25rem 1rem !important; }
  }
  @media (max-width: 360px) {
    .nf-shell { padding: 0 0.6rem !important; }
    .nf-card { padding: 0.7rem 0.75rem !important; gap: 0.5rem !important; }
    .nf-avatar { width: 30px !important; height: 30px !important; }
  }
  @media (min-width: 900px) {
    .nf-hero { padding: 3.5rem 2rem !important; }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  shell: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '0 1rem',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    gap: '1rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    minWidth: 0,
  },
  headerText: { minWidth: 0 },
  backBtn: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: '#111', border: '1px solid #1E1E1E',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0, flexShrink: 0,
  },
  eyebrow: {
    color: '#555', fontSize: '0.72rem',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15rem',
  },
  title: {
    fontFamily: 'Space Grotesk', fontWeight: 700,
    fontSize: '1.6rem', color: '#F0EDE8', lineHeight: 1.1,
  },
  subtitle: {
    color: '#666', fontSize: '0.82rem', marginTop: '0.2rem',
  },
  markAllBtn: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    background: '#1A1400', border: '1px solid rgba(245,166,35,0.25)',
    borderRadius: '10px', padding: '0.55rem 0.85rem',
    color: '#F5A623', fontSize: '0.78rem', fontWeight: 600,
    cursor: 'pointer', flexShrink: 0,
  },
  hero: {
    background: 'linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%)',
    border: '1px solid #1A1A1A',
    borderRadius: '18px',
    padding: '3rem 2rem',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  heroIconWrap: {
    width: '68px', height: '68px', borderRadius: '20px',
    background: 'rgba(76,175,80,0.08)',
    border: '1px solid rgba(76,175,80,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1.1rem',
  },
  heroIconWrapNeutral: {
    width: '68px', height: '68px', borderRadius: '20px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1.1rem',
  },
  heroTitle: {
    fontFamily: 'Space Grotesk', fontSize: '1.15rem',
    fontWeight: 700, color: '#F0EDE8', marginBottom: '0.5rem',
  },
  heroSub: {
    color: '#666', fontSize: '0.85rem',
    lineHeight: 1.55, maxWidth: '360px',
  },
  section: { marginBottom: '1.25rem' },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    marginBottom: '0.6rem', padding: '0 0.2rem',
  },
  sectionLabel: {
    fontSize: '0.68rem', fontWeight: 700, color: '#666',
    textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0,
  },
  sectionLine: {
    flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  card: {
    position: 'relative', width: '100%',
    borderRadius: '14px', padding: '0.8rem 0.9rem',
    textAlign: 'left', cursor: 'pointer',
    display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
    transition: 'background 0.15s, border-color 0.15s',
  },
  cardUnread: {
    background: 'rgba(245,166,35,0.05)',
    border: '1px solid rgba(245,166,35,0.18)',
  },
  cardRead: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    opacity: 0.85,
  },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: '1px',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTop: {
    display: 'flex', alignItems: 'baseline',
    justifyContent: 'space-between', gap: '0.5rem',
  },
  cardTitle: {
    fontSize: '0.88rem', color: '#F0EDE8',
    wordBreak: 'break-word', overflowWrap: 'anywhere', minWidth: 0,
  },
  cardTime: {
    color: '#555', fontSize: '0.7rem', flexShrink: 0, whiteSpace: 'nowrap',
  },
  cardBodyText: {
    fontSize: '0.82rem', lineHeight: 1.45,
    marginTop: '0.3rem', wordBreak: 'break-word', overflowWrap: 'anywhere',
  },
}
