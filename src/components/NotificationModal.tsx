import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Bell, CheckCircle, X } from 'lucide-react';

export default function NotificationModal() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUnread = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
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
      fetchUnread();
      const interval = setInterval(fetchUnread, 15000);
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') fetchUnread();
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
      await fetchUnread();
    } catch (err) {
      console.error('❌ Mark read error:', err);
    }
    setIsUpdating(false);
  };

  const markAllAsRead = async () => {
    if (isUpdating || notifications.length === 0) return;
    setIsUpdating(true);
    const ids = notifications.map(n => n.id);
    try {
      await supabase.from('user_notifications').update({ read: true }).in('id', ids);
      await fetchUnread();
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

  if (loading || notifications.length === 0) return null;

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>
      <div className="nm-overlay" style={styles.overlay}>
        <div className="nm-modal" style={styles.modal}>
          <div className="nm-header" style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <Bell size={22} color="#F5A623" strokeWidth={2} style={{ flexShrink: 0 }} />
              <h2 className="nm-title" style={styles.title}>Notifications</h2>
              <span className="nm-count" style={styles.count}>{notifications.length}</span>
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
            {notifications.map(n => (
              <div key={n.id} className="nm-card" style={styles.card}>
                <div style={styles.dot} />
                <div style={styles.cardBody}>
                  <div className="nm-card-top" style={styles.cardTop}>
                    <p className="nm-message" style={styles.message}>{n.message || 'Notification'}</p>
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
            ))}
          </div>

          {notifications.length > 0 && (
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
  /* Mobile-first base, refined at breakpoints */

  /* Small phones (≤380px) */
  @media (max-width: 380px) {
    .nm-overlay { padding: 0.4rem !important; align-items: flex-end !important; }
    .nm-modal {
      padding: 0.9rem !important;
      border-radius: 18px !important;
      max-height: 90vh !important;
      max-width: 100% !important;
    }
    .nm-title { font-size: 0.95rem !important; }
    .nm-count { font-size: 0.66rem !important; padding: 1px 6px !important; }
    .nm-card { padding: 0.65rem 0.7rem !important; gap: 0.5rem !important; }
    .nm-message { font-size: 0.84rem !important; }
    .nm-time { font-size: 0.62rem !important; }
    .nm-markall { padding: 0.65rem !important; font-size: 0.85rem !important; }
  }

  /* Standard phones (381–640px) */
  @media (min-width: 381px) and (max-width: 640px) {
    .nm-overlay { padding: 0.75rem !important; align-items: flex-end !important; }
    .nm-modal {
      max-width: 100% !important;
      max-height: 88vh !important;
      border-radius: 20px !important;
    }
  }

  /* Tablets (641–1024px) */
  @media (min-width: 641px) and (max-width: 1024px) {
    .nm-overlay { padding: 1.25rem !important; align-items: center !important; }
    .nm-modal { max-width: 500px !important; max-height: 80vh !important; }
    .nm-message { font-size: 0.92rem !important; }
  }

  /* Desktops (≥1025px) */
  @media (min-width: 1025px) {
    .nm-overlay { padding: 2rem !important; align-items: center !important; }
    .nm-modal { max-width: 480px !important; max-height: 78vh !important; }
  }

  /* Landscape phones — keep card horizontal, shrink height */
  @media (max-height: 500px) and (orientation: landscape) {
    .nm-overlay { align-items: center !important; padding: 0.5rem !important; }
    .nm-modal { max-height: 96vh !important; padding: 0.85rem !important; }
    .nm-card { padding: 0.55rem 0.7rem !important; }
    .nm-list { gap: 0.35rem !important; }
  }

  /* Prevent iOS zoom on input (irrelevant here) and tap highlight */
  .nm-card, .nm-markall, .nm-overlay button { -webkit-tap-highlight-color: transparent; }

  /* Card hover (desktop only) */
  @media (hover: hover) and (pointer: fine) {
    .nm-card:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(245,166,35,0.24) !important; }
    .nm-overlay button:hover { opacity: 1 !important; }
  }

  /* Safe area for notched phones */
  @supports (padding: max(0px)) {
    .nm-modal {
      padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
    }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '0.75rem',
  },
  modal: {
    background: 'rgba(24,24,24,0.94)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    maxWidth: '440px',
    width: '100%',
    borderRadius: '20px',
    padding: '1.15rem',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
    color: '#F0EDE8',
    maxHeight: '86vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.85rem',
    paddingBottom: '0.7rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: '1.02rem',
    fontWeight: 600,
    fontFamily: 'Space Grotesk, sans-serif',
    color: '#F0EDE8',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  count: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#0A0A0A',
    background: '#F5A623',
    borderRadius: '10px',
    padding: '2px 8px',
    flexShrink: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.35rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    marginBottom: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minHeight: 0,
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '14px',
    padding: '0.75rem 0.85rem',
    border: '1px solid rgba(245,166,35,0.12)',
    transition: 'background 0.15s, border-color 0.15s',
    flexShrink: 0,
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#F5A623',
    marginTop: '7px',
    flexShrink: 0,
    boxShadow: '0 0 8px rgba(245,166,35,0.6)',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  message: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: 500,
    lineHeight: 1.4,
    color: '#F0EDE8',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
    flex: '1 1 auto',
    minWidth: 0,
  },
  time: {
    fontSize: '0.68rem',
    color: '#888',
    flexShrink: 0,
    marginTop: '2px',
    whiteSpace: 'nowrap',
    marginLeft: 'auto',
  },
  checkBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.15rem',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '2px',
    opacity: 0.7,
    transition: 'opacity 0.15s',
    WebkitTapHighlightColor: 'transparent',
  },
  markAllBtn: {
    background: '#F5A623',
    color: '#0A0A0A',
    border: 'none',
    borderRadius: '12px',
    padding: '0.7rem',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'Space Grotesk, sans-serif',
    letterSpacing: '-0.01em',
    flexShrink: 0,
  },
};
