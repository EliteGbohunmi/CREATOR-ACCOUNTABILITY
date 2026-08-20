import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Bell, CheckCircle, X } from 'lucide-react';

export function NotificationModal() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUnread = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('❌', error);
    } else {
      setNotifications(data || []);
      if (data && data.length > 0) setShow(true);
      else setShow(false);
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
      };
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    await supabase.from('user_notifications').update({ read: true }).eq('id', id);
    await fetchUnread();
    setIsUpdating(false);
  };

  const markAllAsRead = async () => {
    if (isUpdating || notifications.length === 0) return;
    setIsUpdating(true);
    const ids = notifications.map(n => n.id);
    await supabase.from('user_notifications').update({ read: true }).in('id', ids);
    await fetchUnread(); // refresh immediately
    setIsUpdating(false);
  };

  if (!user || loading) return null;
  if (!show || notifications.length === 0) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={24} color="#F5A623" />
            <h2 style={styles.title}>Nudges</h2>
          </div>
          <button onClick={() => setShow(false)} style={styles.closeBtn}>
            <X size={20} color="#888" />
          </button>
        </div>

        <div style={styles.list}>
          {notifications.map(n => (
            <div key={n.id} style={styles.item}>
              <div style={styles.itemContent}>
                <p style={styles.message}>{n.message}</p>
                <span style={styles.time}>
                  {new Date(n.created_at).toLocaleTimeString()}
                </span>
              </div>
              <button
                onClick={() => markAsRead(n.id)}
                disabled={isUpdating}
                style={styles.itemBtn}
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
            {isUpdating ? '...' : notifications.length === 1 ? 'Got it' : 'Got it (All)'}
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
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    background: 'rgba(30,30,30,0.85)',
    backdropFilter: 'blur(12px)',
    maxWidth: '420px',
    width: '100%',
    borderRadius: '24px',
    padding: '1.5rem',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
    color: '#F0EDE8',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  title: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: '600',
    fontFamily: 'Space Grotesk, sans-serif',
    color: '#F0EDE8',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    transition: 'background 0.2s',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  itemContent: {
    flex: 1,
    marginRight: '0.5rem',
  },
  message: {
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: 1.4,
    color: '#F0EDE8',
  },
  time: {
    fontSize: '0.7rem',
    color: '#888',
    marginTop: '0.2rem',
    display: 'block',
  },
  itemBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    transition: 'transform 0.2s',
    flexShrink: 0,
  },
  markAllBtn: {
    background: '#F5A623',
    color: '#0A0A0A',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
    width: '100%',
    marginTop: '0.5rem',
  },
};
