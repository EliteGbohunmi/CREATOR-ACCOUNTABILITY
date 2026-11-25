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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={22} color="#F5A623" strokeWidth={2} />
            <h2 style={styles.title}>Notifications</h2>
            <span style={styles.count}>{notifications.length}</span>
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

        <div style={styles.list}>
          {notifications.map(n => (
            <div key={n.id} style={styles.card}>
              <div style={styles.dot} />
              <div style={styles.cardBody}>
                <div style={styles.cardTop}>
                  <p style={styles.message}>{n.message || 'Notification'}</p>
                  <span style={styles.time}>{relativeTime(n.created_at)}</span>
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
            style={styles.markAllBtn}
          >
            {isUpdating ? '...' : 'Mark all as read'}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    background: 'rgba(24,24,24,0.92)',
    backdropFilter: 'blur(16px)',
    maxWidth: '440px',
    width: '100%',
    borderRadius: '20px',
    padding: '1.25rem',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
    color: '#F0EDE8',
    maxHeight: '82vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  title: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 600,
    fontFamily: 'Space Grotesk, sans-serif',
    color: '#F0EDE8',
    letterSpacing: '-0.01em',
  },
  count: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#0A0A0A',
    background: '#F5A623',
    borderRadius: '10px',
    padding: '2px 8px',
    marginLeft: '2px',
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
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.65rem',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '14px',
    padding: '0.8rem 0.9rem',
    border: '1px solid rgba(245,166,35,0.12)',
    transition: 'background 0.15s, border-color 0.15s',
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
  },
  message: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: 500,
    lineHeight: 1.4,
    color: '#F0EDE8',
    wordBreak: 'break-word',
  },
  time: {
    fontSize: '0.68rem',
    color: '#888',
    flexShrink: 0,
    marginTop: '2px',
    whiteSpace: 'nowrap',
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
  },
};
