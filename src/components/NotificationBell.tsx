import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { fetchNotifications } from '../lib/notifications'

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user?.email) return
    let mounted = true
    const load = async () => {
      const res = await fetchNotifications(user.email!)
      if (mounted) setUnread(res.unread)
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [user?.email])

  if (!user) return null

  return (
    <button
      style={styles.bell}
      onClick={() => navigate('/notifications')}
      aria-label="Notifications"
    >
      <Bell size={19} color="#F0EDE8" strokeWidth={1.8} />
      {unread > 0 && (
        <span style={styles.badge}>{unread > 99 ? '99+' : unread}</span>
      )}
    </button>
  )
}

const styles: Record<string, React.CSSProperties> = {
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
  }
}
