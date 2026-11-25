import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Bell, CheckCircle, X, Zap, Sparkles } from 'lucide-react';

export default function NotificationModal() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('❌ Fetch error:', error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchAll();
      const interval = setInterval(fetchAll, 15000);
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') fetchAll();
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibility);
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      };
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await supabase.from('user_notifications').update({ read: true }).eq('id', id);
      await fetchAll();
    } catch (err) {
      console.error('❌ Mark read error:', err);
    }
    setIsUpdating(false);
  };

  const markAllAsRead = async () => {
    if (isUpdating) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    setIsUpdating(true);
    try {
      await supabase.from('user_notifications').update({ read: true }).in('id', unreadIds);
      await fetchAll();
    } catch (err) {
      console.error('❌ Mark all read error:', err);
    }
    setIsUpdating(false);
  };

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day === 1) return 'Yesterday';
    if (day < 7) return `${day}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Icon picker — Option B: circular icon per type
  const iconFor = (n: any) => {
    const t = (n.type || '').toLowerCase();
    if (t === 'system') return { Icon: Sparkles, color: '#7C9CF5' };
    if (t === 'push') return { Icon: Zap, color: '#F5A623' };
    return { Icon: Bell, color: '#F5A623' };
  };

  if (loading) return null;

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);
  const hasUnread = unread.length > 0;

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>
      <div className="nm-overlay" style={styles.overlay}>
        <div className="nm-modal" style={styles.modal}>
          <div className="nm-header" style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <Bell size={22} color="#F5A623" strokeWidth={2} style={{ flexShrink: 0 }} />
              <h2 className="nm-title" style={styles.title}>Notifications</h2>
              {hasUnread && <span className="nm-count" style={styles.count}>{unread.length}</span>}
            </div>
            <button
              onClick={() => setNotifications([])}
              style={styles.closeBtn}
              disabled={isUpdating}
              aria-label="Close"
            >
              <X size={18} color="#888" />
            </button>
          </div>

          <div className="nm-list" style={styles.list}>
            {/* "All caught up" hero — shown when there are zero unread */}
            {!hasUnread && (
              <div className="nm-caughtup" style={styles.caughtUp}>
                <div style={styles.caughtUpIconWrap}>
                  <CheckCircle size={34} color="#F5A623" strokeWidth={1.6} />
                </div>
                <p style={styles.caughtUpTitle}>You're all caught up</p>
                <p style={styles.caughtUpSub}>
                  {read.length > 0
                    ? 'Scroll down to see older notifications.'
                    : 'New notifications will show up here.'}
                </p>
              </div>
            )}

            {/* Unread notifications first */}
            {unread.map(n => {
              const { Icon, color } = iconFor(n);
              return (
                <div key={n.id} className="nm-card nm-card--unread" style={styles.cardUnread}>
                  <div className="nm-avatar" style={{ ...styles.avatar, background: `${color}18`, border: `1px solid ${color}33` }}>
                    <Icon size={16} color={color} strokeWidth={2} />
                  </div>
                  <div style={styles.cardBody}>
                    <div className="nm-card-top" style={styles.cardTop}>
                      <p className="nm-message" style={styles.messageUnread}>{n.message || 'Notification'}</p>
                      <span className="nm-time" style={styles.time}>{relativeTime(n.created_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => markAsRead(n.id)}
                    disabled={isUpdating}
                    style={styles.checkBtn}
                    aria-label="Mark as read"
                  >
                    <CheckCircle size={18} color="#F5A623" />
                  </button>
                </div>
              );
            })}

            {/* Section divider + demoted read notifications */}
            {read.length > 0 && (
              <div style={styles.sectionHeader}>
                <span style={styles.sectionLabel}>Older</span>
                <div style={styles.sectionLine} />
              </div>
            )}
            {read.map(n => {
              const { Icon } = iconFor(n);
              return (
                <div key={n.id} className="nm-card nm-card--read" style={styles.cardRead}>
                  <div className="nm-avatar" style={{ ...styles.avatar, ...styles.avatarRead }}>
                    <Icon size={16} color="#666" strokeWidth={2} />
                  </div>
                  <div style={styles.cardBody}>
                    <div className="nm-card-top" style={styles.cardTop}>
                      <p className="nm-message" style={styles.messageRead}>{n.message || 'Notification'}</p>
                      <span className="nm-time" style={styles.time}>{relativeTime(n.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="nm-caughtup" style={styles.caughtUp}>
                <div style={styles.caughtUpIconWrap}>
                  <Bell size={32} color="#555" strokeWidth={1.6} />
                </div>
                <p style={styles.caughtUpTitle}>No notifications</p>
                <p style={styles.caughtUpSub}>You'll see updates from your partner here.</p>
              </div>
            )}
          </div>

          {hasUnread && (
            <button
              onClick={markAllAsRead}
              disabled={isUpdating}
              className="nm-markall"
              style={styles.markAllBtn}
            >
              {isUpdating ? '...' : 'Mark all as read'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

const RESPONSIVE_CSS = `
  @media (max-width: 380px) {
    .nm-overlay { padding: 0.4rem !important; }
    .nm-modal { padding: 0.9rem !important; border-radius: 18px !important; max-height: 90vh !important; }
    .nm-title { font-size: 0.95rem !important; }
    .nm-count { font-size: 0.66rem !important; padding: 1px 6px !important; }
    .nm-card { padding: 0.65rem 0.7rem !important; gap: 0.5rem !important; }
    .nm-avatar { width: 30px !important; height: 30px !important; }
    .nm-message { font-size: 0.84rem !important; }
    .nm-time { font-size: 0.62rem !important; }
    .nm-markall { padding: 0.65rem !important; font-size: 0.85rem !important; }
    .nm-caughtup { padding: 1.4rem 0.6rem !important; }
    .nm-caughtup-title { font-size: 0.95rem !important; }
  }
  @media (min-width: 381px) and (max-width: 640px) {
    .nm-overlay { padding: 0.75rem !important; }
    .nm-modal { max-width: 100% !important; max-height: 88vh !important; }
  }
  @media (min-width: 641px) and (max-width: 1024px) {
    .nm-overlay { padding: 1.25rem !important; }
    .nm-modal { max-width: 500px !important; max-height: 80vh !important; }
    .nm-message { font-size: 0.92rem !important; }
  }
  @media (min-width: 1025px) {
    .nm-overlay { padding: 2rem !important; }
    .nm-modal { max-width: 480px !important; max-height: 78vh !important; }
  }
  @media (max-height: 500px) and (orientation: landscape) {
    .nm-modal { max-height: 96vh !important; padding: 0.85rem !important; }
    .nm-card { padding: 0.55rem 0.7rem !important; }
    .nm-list { gap: 0.35rem !important; }
    .nm-caughtup { padding: 1rem 0.6rem !important; }
  }
  .nm-card, .nm-markall, .nm-overlay button { -webkit-tap-highlight-color: transparent; }
  @media (hover: hover) and (pointer: fine) {
    .nm-card--unread:hover { background: rgba(245,166,35,0.06) !important; border-color: rgba(245,166,35,0.28) !important; }
    .nm-card--read:hover { background: rgba(255,255,255,0.05) !important; }
    .nm-overlay button:hover { opacity: 1 !important; }
  }
  @supports (padding: max(0px)) {
    .nm-modal { padding-bottom: max(1.15rem, env(safe-area-inset-bottom)); }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 1000, padding: '0.75rem',
  },
  modal: {
    background: 'rgba(24,24,24,0.94)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    maxWidth: '440px', width: '100%',
    borderRadius: '20px', padding: '1.15rem',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
    color: '#F0EDE8', maxHeight: '86vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '0.85rem', paddingBottom: '0.7rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
  },
  title: {
    margin: 0, fontSize: '1.02rem', fontWeight: 600,
    fontFamily: 'Space Grotesk, sans-serif', color: '#F0EDE8',
    letterSpacing: '-0.01em', whiteSpace: 'nowrap',
    overflow: 'hidden', textOverflow: 'ellipsis',
  },
  count: {
    fontSize: '0.7rem', fontWeight: 700, color: '#0A0A0A',
    background: '#F5A623', borderRadius: '10px', padding: '2px 8px', flexShrink: 0,
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '0.35rem', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  list: {
    flex: 1, overflowY: 'auto', overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    marginBottom: '0.85rem', display: 'flex', flexDirection: 'column',
    gap: '0.5rem', minHeight: 0,
  },
  caughtUp: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', textAlign: 'center',
    padding: '1.8rem 1rem', gap: '0.4rem',
  },
  caughtUpIconWrap: {
    width: '64px', height: '64px', borderRadius: '50%',
    background: 'rgba(245,166,35,0.1)',
    border: '1px solid rgba(245,166,35,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '0.4rem',
  },
  caughtUpTitle: {
    margin: 0, fontSize: '1.05rem', fontWeight: 600,
    fontFamily: 'Space Grotesk, sans-serif', color: '#F0EDE8',
  },
  caughtUpSub: {
    margin: 0, fontSize: '0.82rem', color: '#888', lineHeight: 1.4, maxWidth: '260px',
  },
  cardUnread: {
    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
    background: 'rgba(245,166,35,0.05)',
    borderRadius: '14px', padding: '0.75rem 0.85rem',
    border: '1px solid rgba(245,166,35,0.18)',
    transition: 'background 0.15s, border-color 0.15s', flexShrink: 0,
  },
  cardRead: {
    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '14px', padding: '0.7rem 0.85rem',
    border: '1px solid rgba(255,255,255,0.04)',
    transition: 'background 0.15s', flexShrink: 0, opacity: 0.7,
  },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: '1px',
  },
  avatarRead: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTop: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap',
  },
  messageUnread: {
    margin: 0, fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.4,
    color: '#F0EDE8', wordBreak: 'break-word', overflowWrap: 'anywhere',
    flex: '1 1 auto', minWidth: 0,
  },
  messageRead: {
    margin: 0, fontSize: '0.88rem', fontWeight: 400, lineHeight: 1.4,
    color: '#9A9A9A', wordBreak: 'break-word', overflowWrap: 'anywhere',
    flex: '1 1 auto', minWidth: 0,
  },
  time: {
    fontSize: '0.68rem', color: '#888', flexShrink: 0,
    marginTop: '2px', whiteSpace: 'nowrap', marginLeft: 'auto',
  },
  checkBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem',
    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: '6px', opacity: 0.75, transition: 'opacity 0.15s',
    WebkitTapHighlightColor: 'transparent',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    margin: '0.6rem 0 0.1rem', padding: '0 0.2rem',
  },
  sectionLabel: {
    fontSize: '0.68rem', fontWeight: 700, color: '#666',
    textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0,
  },
  sectionLine: {
    flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)',
  },
  markAllBtn: {
    background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '12px', padding: '0.7rem', fontWeight: 700,
    fontSize: '0.9rem', cursor: 'pointer', width: '100%',
    fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.01em',
    flexShrink: 0,
  },
};
