import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { Camera, Shield, LogOut, ChevronRight, User, Sliders, Sparkles, Calendar, Copy } from 'lucide-react'
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
  const [weeklyTarget, setWeeklyTarget] = useState(7)
  const [leavesUsed, setLeavesUsed] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [reminderSet, setReminderSet] = useState(false)
  const [notifAllowed, setNotifAllowed] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [icsContent, setIcsContent] = useState('')

  // Persona state
  const [aiPersona, setAiPersona] = useState('')
  const [showPersonaTemplate, setShowPersonaTemplate] = useState(false)

  const personaTemplate = `Based on our past conversations, analyze my writing style and create a detailed persona description.

Create a persona description with these sections:

CONTENT VOICE:
(2-3 sentences describing my overall voice)

WRITING STYLE:
(Specific details about my sentence structure, length, format, vocabulary)

TONE:
(My emotional tone – e.g., "warm and encouraging", "direct and honest", "witty and sarcastic")

COMMON PATTERNS:
(Phrases I use often, topics I cover, formats I prefer)

AUDIENCE:
(Who I'm writing for – e.g., "young entrepreneurs", "busy moms", "tech enthusiasts")

UNIQUE FLAVOR:
(What makes my writing distinct – e.g., "uses personal stories", "breaks down complex topics simply")

Also include a section called:

STRATEGIC GOALS:
(My content goals – e.g., "build authority", "educate beginners", "inspire action")

Be specific. Use what you know about me from our conversations.`

  const savePersona = async () => {
    if (!aiPersona.trim() && aiPersona !== '') return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ ai_persona: aiPersona.trim() }).eq('id', user!.id)
    setSaving(false)
    if (error) {
      console.error('Persona save failed:', error)
      alert('Could not save persona: ' + error.message)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
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
        setWeeklyTarget(data.weekly_target || 7)
        setAiPersona(data.ai_persona || '')
        // Load reminder from profile
        if (data.reminder_hour !== null && data.reminder_minute !== null) {
          const h = String(data.reminder_hour).padStart(2, '0')
          const m = String(data.reminder_minute).padStart(2, '0')
          setReminderTime(`${h}:${m}`)
          setReminderSet(true)
        } else {
          // fallback to localStorage
          const savedTime = getSavedReminderTime()
          if (savedTime) {
            setReminderTime(`${String(savedTime.hour).padStart(2, '0')}:${String(savedTime.minute).padStart(2, '0')}`)
            setReminderSet(true)
          }
        }
      }
    }

    fetchProfile()

    supabase.from('streaks').select('current_streak').eq('user_id', user!.id).single()
      .then(({ data }) => {
        if (data) setCurrentStreak(data.current_streak || 0)
      })

    if ('Notification' in window) setNotifAllowed(Notification.permission === 'granted')
  }, [user])

  // ---------- FIXED save function with username uniqueness check ----------
  const save = async () => {
    setSaving(true)
    setSaveError('')

    const trimmedUsername = username.trim()

    // 1. Check if the new username is already taken by another user
    if (trimmedUsername) {
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmedUsername)
        .neq('id', user!.id)
        .maybeSingle()

      if (checkError) {
        console.error('Username check failed:', checkError)
        setSaving(false)
        setSaveError('Could not validate username. Please try again.')
        return
      }

      if (existing) {
        setSaving(false)
        setSaveError('Username is already taken. Please choose another.')
        return
      }
    }

    // 2. Update profile
    const { error } = await supabase.from('profiles').update({
      name,
      username: trimmedUsername,
      bio,
      default_platform: defaultPlatform,
      week_start: weekStart,
      weekly_target: weeklyTarget,
      is_public: isPublic,
      show_streak: showStreak
    }).eq('id', user!.id)

    if (error) {
      // Handle possible duplicate from the update itself (just in case)
      if (error.code === '23505') {
        setSaveError('Username is already taken. Please choose another.')
      } else {
        setSaveError(error.message || 'Could not save changes.')
      }
      setSaving(false)
      return
    }

    // 3. Update auth metadata only if name changed
    if (name !== user?.user_metadata?.name) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { name }
      })
      if (authError) {
        console.error('Auth metadata update failed:', authError)
        setSaving(false)
        setSaveError(authError.message || 'Saved profile, but could not update account name.')
        return
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  // ---------- END fixed save ----------

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
    } else {
      console.error('Avatar upload failed:', error)
      alert('Could not upload photo: ' + error.message)
    }
    setUploading(false)
  }

  const generateICS = (hour: number, minute: number): string => {
    const now = new Date()
    const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute)
    if (eventDate < now) eventDate.setDate(eventDate.getDate() + 1)
    const formattedDate = eventDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    const displayName = name.trim() || 'Creator'
    const streakMsg = currentStreak > 0 ? `You're on a ${currentStreak}-day streak! Keep it going!` : 'Every day counts. Start your streak today!'

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Streak//Reminder//EN
BEGIN:VEVENT
UID:${Date.now()}@streak.app
DTSTAMP:${formattedDate}
DTSTART:${formattedDate}
DURATION:PT0H0M
SUMMARY:🔥 ${displayName}, post today! Keep your streak alive!
DESCRIPTION:${streakMsg}\n\nPost your content and stay consistent. Your audience is waiting. You've got this!\n\nOpen the app now and check in.
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Time to post! Don't break your streak!
END:VALARM
END:VEVENT
END:VCALENDAR`
  }

  const setReminder = async () => {
    const [h, m] = reminderTime.split(':').map(Number)
    // Save to profile so scheduler can use it
    const { error } = await supabase.from('profiles').update({
      reminder_hour: h,
      reminder_minute: m
    }).eq('id', user!.id)

    if (error) {
      console.error('Reminder save failed:', error)
      alert('Could not save reminder time: ' + error.message)
      return
    }

    saveReminderTime(h, m)
    setReminderSet(true)
    setNotifAllowed(true)

    const content = generateICS(h, m)
    setIcsContent(content)
    const dataUri = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(content)
    window.open(dataUri, '_blank')

    if (Notification.permission === 'granted') {
      fireReminder()
    } else {
      requestNotificationPermission().then(granted => {
        if (granted) fireReminder()
      })
    }

    alert('📅 Reminder file opened in new tab! If it doesn\'t download automatically, copy the text below and save it as a .ics file.')
  }

  const copyICS = async () => {
    if (!icsContent) return
    try {
      await navigator.clipboard.writeText(icsContent)
      alert('✅ Calendar content copied! Paste it into a text file and save as .ics')
    } catch {
      alert('Could not copy. Please select the text and copy manually.')
    }
  }

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Account</p>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Settings</h1>
      </div>

      {/* Profile card */}
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
          {saveError && (
            <p style={{ color: '#E53E3E', fontSize: '0.8rem', margin: 0 }}>{saveError}</p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={styles.saveBtn} onClick={save} disabled={saving}>
              {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save'}
            </button>
            <button style={styles.cancelBtn} onClick={() => { setActiveSection(null); setSaveError('') }}>Cancel</button>
          </div>
          {uploading && <p style={{ color: '#555', fontSize: '0.8rem', margin: 0 }}>Uploading photo...</p>}
        </div>
      )}

      <div style={styles.settingsList}>

        {/* Reminder */}
        <div style={styles.settingsGroup}>
          <div style={styles.groupLabel}>
            <Calendar size={13} color="#555" />
            Daily Reminder
          </div>
          <div style={styles.row} onClick={() => setActiveSection(activeSection === 'notif' ? null : 'notif')}>
            <span style={styles.rowLabel}>Set Posting Reminder</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: notifAllowed ? '#4CAF50' : '#555', fontSize: '0.8rem' }}>
                {reminderSet ? reminderTime : 'Not set'}
              </span>
              <ChevronRight size={15} color="#333" />
            </div>
          </div>
          {activeSection === 'notif' && (
            <div style={styles.expandedInner}>
              <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                Set a time and we'll open a calendar file with an alarm.
                {currentStreak > 0 && ` 🔥 You're on a ${currentStreak}-day streak!`}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  style={{ ...styles.input, flex: 1 }} 
                  type="time" 
                  value={reminderTime} 
                  onChange={e => setReminderTime(e.target.value)} 
                />
                <button 
                  style={{ ...styles.saveBtn, flexShrink: 0, alignSelf: 'stretch' }} 
                  onClick={setReminder}
                >
                  Open .ics
                </button>
              </div>
              {reminderSet && (
                <div style={{ 
                  background: '#0D2010', 
                  border: '1px solid #4CAF5030', 
                  borderRadius: '8px', 
                  padding: '0.75rem 1rem',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ color: '#4CAF50', fontSize: '0.85rem' }}>
                    ✓ Reminder set for {reminderTime}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                    A new tab opened with the calendar file. If it didn't download, use the copy button below.
                  </div>
                  {icsContent && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <button 
                        onClick={copyICS}
                        style={{ ...styles.saveBtn, padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                      >
                        <Copy size={14} /> Copy ICS Content
                      </button>
                      <textarea 
                        value={icsContent}
                        readOnly
                        style={{ ...styles.input, marginTop: '0.5rem', fontSize: '0.7rem', minHeight: '80px', fontFamily: 'monospace' }}
                      />
                    </div>
                  )}
                </div>
              )}
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
                <label style={styles.label}>Weekly Posting Target</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[1,2,3,4,5,6,7].map(n => (
                    <button
                      key={n}
                      style={{
                        width: '40px', height: '40px', borderRadius: '8px',
                        background: weeklyTarget === n ? '#F5A623' : '#0A0A0A',
                        color: weeklyTarget === n ? '#0A0A0A' : '#555',
                        fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
                        border: weeklyTarget === n ? 'none' : '1px solid #1E1E1E'
                      }}
                      onClick={() => setWeeklyTarget(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p style={{ color: '#444', fontSize: '0.75rem', margin: 0 }}>
                  {weeklyTarget === 7 ? 'Daily — every day counts' : `${weeklyTarget}x per week — streak resets if you miss your weekly target`}
                </p>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Week Starts On</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['monday', 'sunday'].map(d => (
                    <button
                      key={d}
                      style={{
                        flex: 1, borderRadius: '8px', padding: '0.65rem',
                        fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem',
                        background: weekStart === d ? '#F5A623' : '#0A0A0A',
                        color: weekStart === d ? '#0A0A0A' : '#555',
                        border: weekStart === d ? 'none' : '1px solid #1E1E1E'
                      }}
                      onClick={() => setWeekStart(d)}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {saveError && (
                <p style={{ color: '#E53E3E', fontSize: '0.8rem', margin: 0 }}>{saveError}</p>
              )}
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
            const { error } = await supabase.from('profiles').update({ is_public: newVal }).eq('id', user!.id)
            if (error) {
              console.error('Public profile toggle failed:', error)
              setIsPublic(!newVal) // revert the toggle if it didn't actually save
              alert('Could not update privacy setting: ' + error.message)
            }
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
            const { error } = await supabase.from('profiles').update({ show_streak: newVal }).eq('id', user!.id)
            if (error) {
              console.error('Show streak toggle failed:', error)
              setShowStreak(!newVal) // revert the toggle if it didn't actually save
              alert('Could not update privacy setting: ' + error.message)
            }
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

        {/* AI Persona */}
        <div style={styles.settingsGroup}>
          <div style={styles.groupLabel}>
            <Sparkles size={13} color="#555" />
            AI Persona
          </div>
          <div style={styles.row} onClick={() => setActiveSection(activeSection === 'persona' ? null : 'persona')}>
            <span style={styles.rowLabel}>Your Content Voice</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#555', fontSize: '0.8rem' }}>
                {aiPersona ? '✓ Persona set' : 'Not set'}
              </span>
              <ChevronRight size={15} color="#333" />
            </div>
          </div>
          {activeSection === 'persona' && (
            <div style={styles.expandedInner}>
              {!aiPersona ? (
                <>
                  <p style={{ color: '#555', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    To make our AI sound like <strong>you</strong>, we need to understand your unique voice. Just 2 steps:
                  </p>
                  <div style={{ background: '#0A0A0A', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#F5A623', fontWeight: '700' }}>1.</span>
                      <span style={{ color: '#F0EDE8' }}>Copy the prompt below</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <span style={{ color: '#F5A623', fontWeight: '700' }}>2.</span>
                      <span style={{ color: '#F0EDE8' }}>Paste into ChatGPT/Claude, then paste the response here</span>
                    </div>
                  </div>
                  <button
                    style={styles.templateBtn}
                    onClick={() => setShowPersonaTemplate(!showPersonaTemplate)}
                  >
                    {showPersonaTemplate ? 'Hide Prompt' : 'Show Prompt'}
                  </button>
                  {showPersonaTemplate && (
                    <div style={{ background: '#0A0A0A', border: '1px solid #F5A62330', borderRadius: '10px', padding: '1rem', margin: '0.75rem 0', position: 'relative' }}>
                      <button
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#F5A623', border: 'none', borderRadius: '6px', padding: '0.25rem 0.75rem', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', color: '#0A0A0A' }}
                        onClick={() => { navigator.clipboard.writeText(personaTemplate); alert('Template copied!') }}
                      >
                        Copy
                      </button>
                      <pre style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'Inter', margin: 0, paddingRight: '3rem' }}>
                        {personaTemplate}
                      </pre>
                    </div>
                  )}
                  <textarea
                    style={{ ...styles.input, minHeight: '120px', resize: 'vertical', marginTop: '0.75rem' }}
                    placeholder="Paste your AI's response here..."
                    value={aiPersona}
                    onChange={e => setAiPersona(e.target.value)}
                  />
                  <button style={styles.saveBtn} onClick={savePersona} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Persona'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ background: '#0D2010', border: '1px solid #4CAF5030', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                    <div style={{ color: '#4CAF50', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ✓ Persona set! Your content will now sound like you.
                    </div>
                  </div>
                  <div style={{ background: '#0A0A0A', borderRadius: '8px', padding: '0.75rem 1rem', maxHeight: '100px', overflow: 'auto', marginBottom: '0.75rem' }}>
                    <pre style={{ color: '#888', fontSize: '0.78rem', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'Inter' }}>
                      {aiPersona.slice(0, 300)}{aiPersona.length > 300 ? '...' : ''}
                    </pre>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ ...styles.saveBtn, background: '#E53E3E', color: '#fff' }} onClick={() => { setAiPersona(''); savePersona() }}>
                      Remove Persona
                    </button>
                    <button style={styles.saveBtn} onClick={() => setActiveSection(null)}>
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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

        {/* Sign Out */}
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
  saveBtn: {
    background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '8px', padding: '0.7rem 1.25rem', fontWeight: '600',
    cursor: 'pointer', fontSize: '0.88rem', alignSelf: 'flex-start'
  },
  cancelBtn: {
    background: 'none', border: '1px solid #1E1E1E', borderRadius: '8px',
    padding: '0.7rem 1.25rem', color: '#666', cursor: 'pointer', fontSize: '0.88rem'
  },
  templateBtn: {
    background: '#1A1A1A', color: '#F0EDE8',
    border: '1px solid #2A2A2A', borderRadius: '8px',
    padding: '0.65rem 1rem', fontSize: '0.85rem',
    cursor: 'pointer', marginBottom: '0.5rem'
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
