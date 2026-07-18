import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { User, Bell, LogOut, Shield, ChevronRight } from 'lucide-react'
import { requestNotificationPermission, fireReminder, saveReminderTime, getSavedReminderTime } from '../lib/notifications'

export default function Settings() {
  const { user, signOut } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [reminderSet, setReminderSet] = useState(false)
  const [notifAllowed, setNotifAllowed] = useState(false)
  const [leavesUsed, setLeavesUsed] = useState(0)

  useEffect(() => {
    supabase.from('profiles').select('name, leaves_used').eq('id', user!.id).single()
      .then(({ data }) => {
        if (data) {
          setName(data.name)
          setLeavesUsed(data.leaves_used || 0)
        }
      })

    if ('Notification' in window) {
      setNotifAllowed(Notification.permission === 'granted')
    }

    const savedTime = getSavedReminderTime()
    if (savedTime) {
      const h = String(savedTime.hour).padStart(2, '0')
      const m = String(savedTime.minute).padStart(2, '0')
      setReminderTime(`${h}:${m}`)
      setReminderSet(true)
    }
  }, [])

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({ name }).eq('id', user!.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const setReminder = async () => {
    const granted = await requestNotificationPermission()
    if (!granted) {
      alert('Please allow notifications in your browser settings.')
      return
    }
    const [h, m] = reminderTime.split(':')
    saveReminderTime(parseInt(h), parseInt(m))
    setReminderSet(true)
    setNotifAllowed(true)
    fireReminder()
  }

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Preferences</p>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Settings</h1>
      </div>

      {/* Profile */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <User size={14} color="#555" />
          Profile
        </div>
        <div style={styles.card}>
          <div style={styles.field}>
            <label style={styles.label}>Display Name</label>
            <input
              style={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={{ ...styles.input, opacity: 0.4 }}
              value={user?.email || ''}
              disabled
            />
          </div>
          <button style={styles.saveBtn} onClick={save} disabled={saving}>
            {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Bell size={14} color="#555" />
          Daily Reminder
        </div>
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>Notifications</span>
            <span style={{ color: notifAllowed ? '#4CAF50' : '#555', fontSize: '0.8rem' }}>
              {notifAllowed ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div style={styles.divider} />
          <div style={styles.field}>
            <label style={styles.label}>Reminder Time</label>
            <input
              style={styles.input}
              type="time"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
            />
          </div>
          <button style={styles.saveBtn} onClick={setReminder}>
            Remind Me 🔔
          </button>
          {reminderSet && (
            <p style={{ color: '#4CAF50', fontSize: '0.82rem', margin: 0 }}>
              ✓ Reminder saved for {reminderTime}
            </p>
          )}
        </div>
      </div>

      {/* Plan */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Shield size={14} color="#555" />
          Your Plan
        </div>
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Free Plan</div>
              <div style={{ color: '#555', fontSize: '0.82rem' }}>{5 - leavesUsed} of 5 challenge leaves remaining</div>
            </div>
            <span style={{ background: '#1A1A1A', color: '#555', border: '1px solid #2A2A2A', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
              Free
            </span>
          </div>
          <div style={styles.divider} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              'Unlimited challenges',
              'Unlimited leaves',
              'AI Coach (unlimited)',
              'Priority leaderboard badge'
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#555', fontSize: '0.85rem' }}>
                <ChevronRight size={13} color="#F5A623" />
                {f}
              </div>
            ))}
          </div>
          <button style={styles.upgradeBtn}>
            Upgrade to Pro — $5/mo
          </button>
        </div>
      </div>

      {/* Account */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <LogOut size={14} color="#555" />
          Account
        </div>
        <div style={styles.card}>
          <button style={styles.signOutBtn} onClick={signOut}>
            <LogOut size={15} color="#E53E3E" />
            Sign Out
          </button>
        </div>
      </div>
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  section: { marginBottom: '1.5rem' },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    color: '#555', fontSize: '0.75rem', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: '0.6rem'
  },
  card: {
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '14px', padding: '1.25rem',
    display: 'flex', flexDirection: 'column', gap: '0.85rem'
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px',
    padding: '0.75rem 1rem', color: '#F0EDE8', fontSize: '0.95rem', outline: 'none'
  },
  divider: { height: '1px', background: '#1E1E1E' },
  saveBtn: {
    background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '8px', padding: '0.75rem', fontWeight: '600',
    cursor: 'pointer', fontSize: '0.9rem', alignSelf: 'flex-start',
    paddingLeft: '1.5rem', paddingRight: '1.5rem'
  },
  upgradeBtn: {
    background: 'linear-gradient(135deg, #F5A623, #E8900A)',
    color: '#0A0A0A', border: 'none', borderRadius: '8px',
    padding: '0.85rem', fontWeight: '700', cursor: 'pointer',
    fontSize: '0.9rem', width: '100%'
  },
  signOutBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: 'none', border: '1px solid #E53E3E30',
    borderRadius: '8px', padding: '0.75rem 1.25rem',
    color: '#E53E3E', fontWeight: '500', cursor: 'pointer',
    fontSize: '0.9rem', alignSelf: 'flex-start'
  }
}
