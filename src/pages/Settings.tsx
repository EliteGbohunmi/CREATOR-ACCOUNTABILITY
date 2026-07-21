import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { Camera, Bell, Shield, LogOut, ChevronRight, User, Sliders } from 'lucide-react'
import { requestNotificationPermission, fireReminder, saveReminderTime, getSavedReminderTime } from '../lib/notifications'

const PLATFORMS = ['Instagram', 'X (Twitter)', 'TikTok', 'YouTube', 'LinkedIn', 'Threads', 'Blog', 'Podcast']

export default function Settings() {
  const { user, signOut } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [defaultPlatform, setDefaultPlatform] = useState('')
  const [weekStart, setWeekStart] = useState('monday')
  const [isPublic, setIsPublic] = useState(true)
  const [showStreak, setShowStreak] = useState(true)
  const [leavesUsed, setLeavesUsed] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [reminderSet, setReminderSet] = useState(false)
  const [notifAllowed, setNotifAllowed] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', user!.id).single()
      .then(({ data }) => {
        if (data) {
          setName(data.name || '')
          setUsername(data.username || '')
          setBio(data.bio || '')
          setAvatarUrl(data.avatar_url || '')
          setDefaultPlatform(data.default_platform || '')
          setWeekStart(data.week_start || 'monday')
          setIsPublic(data.is_public ?? true)
          setShowStreak(data.show_streak ?? true)
          setLeavesUsed(data.leaves_used || 0)
        }
      })

    if ('Notification' in window) setNotifAllowed(Notification.permission === 'granted')

    const savedTime = getSavedReminderTime()
    if (savedTime) {
      setReminderTime(`${String(savedTime.hour).padStart(2,'0')}:${String(savedTime.minute).padStart(2,'0')}`)
      setReminderSet(true)
    }
  }, [])

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      name, username, bio,
      default_platform: defaultPlatform,
      week_start: weekStart,
      is_public: isPublic,
      show_streak: showStreak
    }).eq('id', user!.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user!.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = data.publicUrl + '?t=' + Date.now()
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user!.id)
      setAvatarUrl(url)
    }
    setUploading(false)
  }

  const setReminder = async () => {
    const granted = await requestNotificationPermission()
    if (!granted) { alert('Please allow notifications in your browser settings.'); return }
    const [h, m] = reminderTime.split(':')
    saveReminderTime(parseInt(h), parseInt(m))
    setReminderSet(true)
    setNotifAllowed(true)
    fireReminder()
  }


  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Account</p>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Settings</h1>
      </div>

      {/* Profile card at top */}
      <div style={styles.profileCard}>
        <div style={styles.avatarWrap} onClick={() => fileRef.current?.click()}>
          {avatarUrl
            ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <User size={30} color="#555" />
          }
          <div style={styles.avatarOverlay}>
            <Camera size={12} color="#fff" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '1rem' }}>{name || 'Your Name'}</div>
          <div style={{ color: '#555', fontSize: '0.82rem' }}>@{username || 'username'}</div>
          <div style={{ color: '#444', fontSize: '0.78rem', marginTop: '0.15rem' }}>{user?.email}</div>
        </div>
        <button
          style={{ background: 'none', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#888', padding: '0.5rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer' }}
          onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}
        >
          Edit
        </button>
      </div>

      {/* Edit profile expanded */}
      {activeSection === 'profile' && (
        <div style={styles.expandedCard}>
          <div style={styles.field}>
            <label style={styles.label}>Display Name</label>
            <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }}>@</span>
              <input style={{ ...styles.input, paddingLeft: '1.75rem' }} value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="username" />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Bio</label>
            <textarea style={{ ...styles.input, minHeight: '70px', resize: 'vertical' as const }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell other creators about yourself..." />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={styles.saveBtn} onClick={save} disabled={saving}>
              {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save'}
            </button>
            <button style={styles.cancelBtn} onClick={() => setActiveSection(null)}>Cancel</button>
          </div>
          {uploading && <p style={{ color: '#555', fontSize: '0.8rem', margin: 0 }}>Uploading photo...</p>}
        </div>
      )}

      {/* Settings list */}
      <div style={styles.settingsList}>

        {/* Notifications */}
        <div style={styles.settingsGroup}>
          <div style={styles.groupLabel}>
            <Bell size={13} color="#555" />
            Notifications
          </div>
          <div style={styles.row} onClick={() => setActiveSection(activeSection === 'notif' ? null : 'notif')}>
            <span style={styles.rowLabel}>Daily Reminder</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: notifAllowed ? '#4CAF50' : '#555', fontSize: '0.8rem' }}>
                {reminderSet ? reminderTime : 'Not set'}
              </span>
              <ChevronRight size={15} color="#333" />
            </div>
          </div>
          {activeSection === 'notif' && (
            <div style={styles.expandedInner}>
              <input style={styles.input} type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} />
              <button style={styles.saveBtn} onClick={setReminder}>Set Reminder</button>
              {reminderSet && <p style={{ color: '#4CAF50', fontSize: '0.8rem', margin: 0 }}>✓ Saved for {reminderTime}</p>}
            </div>
          )}
        </div>

        {/* Preferences */}
        <div style={styles.settingsGroup}>
          <div style={styles.groupLabel}>
            <Sliders size={13} color="#555" />
            Preferences
          </div>
          <div style={styles.row} onClick={() => setActiveSection(activeSection === 'prefs' ? null : 'prefs')}>
            <span style={styles.rowLabel}>App Preferences</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#555', fontSize: '0.8rem' }}>{defaultPlatform || 'None'}</span>
              <ChevronRight size={15} color="#333" />
            </div>
          </div>
          {activeSection === 'prefs' && (
            <div style={styles.expandedInner}>
              <div style={styles.field}>
                <label style={styles.label}>Default Platform</label>
                <select style={styles.input} value={defaultPlatform} onChange={e => setDefaultPlatform(e.target.value)}>
                  <option value="">None</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Week Starts On</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['monday', 'sunday'].map(d => (
                    <button key={d} style={{
                      ...styles.toggleBtn,
                      background: weekStart === d ? '#F5A623' : '#0A0A0A',
                      color: weekStart === d ? '#0A0A0A' : '#555',
                      border: weekStart === d ? 'none' : '1px solid #1E1E1E'
                    }} onClick={() => setWeekStart(d)}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button style={styles.saveBtn} onClick={save} disabled={saving}>
                {saved ? 'Saved ✓' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Privacy */}
        <div style={styles.settingsGroup}>
          <div style={styles.groupLabel}>
            <Shield size={13} color="#555" />
            Privacy
          </div>
          <div style={styles.row} onClick={async () => {
  const newVal = !isPublic
  setIsPublic(newVal)
  await supabase.from('profiles').update({ is_public: newVal }).eq('id', user!.id)
}}>
            <span style={styles.rowLabel}>Public Profile</span>
            <div style={{ ...styles.toggleSwitch, background: isPublic ? '#F5A623' : '#1E1E1E' }}>
              <div style={{ ...styles.toggleDot, transform: isPublic ? 'translateX(20px)' : 'translateX(2px)' }} />
            </div>
          </div>
          <div style={{ height: '1px', background: '#1A1A1A' }} />
          
          <div style={styles.row} onClick={async () => {
  const newVal = !showStreak
  setShowStreak(newVal)
  await supabase.from('profiles').update({ show_streak: newVal }).eq('id', user!.id)
}}>
          

            <span style={styles.rowLabel}>Show Streak on Leaderboard</span>
            <div style={{ ...styles.toggleSwitch, background: showStreak ? '#F5A623' : '#1E1E1E' }}>
              <div style={{ ...styles.toggleDot, transform: showStreak ? 'translateX(20px)' : 'translateX(2px)' }} />
            </div>
          </div>
          <div style={styles.expandedInner}>
            <button style={styles.saveBtn} onClick={save} disabled={saving}>
              {saved ? 'Saved ✓' : 'Save Privacy Settings'}
            </button>
          </div>
        </div>

        {/* Plan */}
        <div style={styles.settingsGroup}>
          <div style={styles.groupLabel}>
            <Shield size={13} color="#555" />
            Your Plan
          </div>
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Free Plan</div>
              <div style={{ color: '#555', fontSize: '0.78rem' }}>{5 - leavesUsed} of 5 leaves remaining</div>
            </div>
            <span style={{ background: '#1A1A1A', color: '#555', border: '1px solid #2A2A2A', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.72rem' }}>Free</span>
          </div>
          <div style={{ padding: '0 1rem 1rem' }}>
            <button style={styles.upgradeBtn}>Upgrade to Pro — $5/mo</button>
          </div>
        </div>

        {/* Sign out */}
        <div style={styles.settingsGroup}>
          <button style={styles.signOutRow} onClick={signOut}>
            <LogOut size={16} color="#E53E3E" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  profileCard: {
    background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px',
    padding: '1.1rem', display: 'flex', alignItems: 'center',
    gap: '1rem', marginBottom: '1.5rem'
  },
  avatarWrap: {
    width: '58px', height: '58px', borderRadius: '50%',
    background: '#1A1A1A', border: '2px solid #2A2A2A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0, cursor: 'pointer', position: 'relative'
  },
  avatarOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'rgba(0,0,0,0.55)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '0.2rem'
  },
  expandedCard: {
    background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px',
    padding: '1.1rem', marginBottom: '1.5rem',
    display: 'flex', flexDirection: 'column', gap: '0.75rem'
  },
  settingsList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  settingsGroup: {
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '14px', overflow: 'hidden'
  },
  groupLabel: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    color: '#555', fontSize: '0.72rem', textTransform: 'uppercase',
    letterSpacing: '0.08em', padding: '0.85rem 1rem 0.5rem'
  },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.85rem 1rem', cursor: 'pointer'
  },
  rowLabel: { color: '#F0EDE8', fontSize: '0.9rem' },
  expandedInner: {
    padding: '0.75rem 1rem 1rem',
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
    borderTop: '1px solid #1A1A1A'
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px',
    padding: '0.75rem 1rem', color: '#F0EDE8', fontSize: '0.92rem',
    outline: 'none', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'Inter'
  },
  toggleSwitch: {
    width: '44px', height: '24px', borderRadius: '999px',
    position: 'relative', flexShrink: 0, transition: 'background 0.2s', cursor: 'pointer'
  },
  toggleDot: {
    position: 'absolute', top: '2px', width: '20px', height: '20px',
    borderRadius: '50%', background: '#fff', transition: 'transform 0.2s'
  },
  toggleBtn: {
    flex: 1, borderRadius: '8px', padding: '0.65rem',
    fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem'
  },
  saveBtn: {
    background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '8px', padding: '0.7rem 1.25rem', fontWeight: '600',
    cursor: 'pointer', fontSize: '0.88rem', alignSelf: 'flex-start'
  },
  cancelBtn: {
    background: 'none', border: '1px solid #1E1E1E', borderRadius: '8px',
    padding: '0.7rem 1.25rem', color: '#666', cursor: 'pointer', fontSize: '0.88rem'
  },
  upgradeBtn: {
    background: 'linear-gradient(135deg, #F5A623, #E8900A)',
    color: '#0A0A0A', border: 'none', borderRadius: '8px',
    padding: '0.85rem', fontWeight: '700', cursor: 'pointer',
    fontSize: '0.9rem', width: '100%'
  },
  signOutRow: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    background: 'none', border: 'none', color: '#E53E3E',
    padding: '1rem', fontSize: '0.9rem', fontWeight: '500',
    cursor: 'pointer', width: '100%'
  }
}
