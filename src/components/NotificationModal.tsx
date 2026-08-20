import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export function NotificationModal() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnread = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Fetch notifications error:', error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchUnread();
      // Poll every 15 seconds for new notifications
      const interval = setInterval(fetchUnread, 15000);
      // Also refetch when the tab becomes visible again
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          fetchUnread();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from('user_notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading || notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: '#1C1C1C',
        maxWidth: '400px',
        width: '100%',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid #2A2A2A',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
      }}>
        <h2 style={{ color: '#F5A623', marginBottom: '0.5rem' }}>📬 You have a nudge!</h2>
        {notifications.map(n => (
          <div key={n.id} style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#F0EDE8', fontSize: '1rem' }}>{n.message}</p>
            <button
              onClick={() => markAsRead(n.id)}
              style={{
                background: '#F5A623',
                color: '#000',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Got it
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
