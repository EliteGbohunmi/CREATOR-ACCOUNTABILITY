import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import {
  Camera, Shield, LogOut, ChevronRight, User, Sliders, Sparkles, Calendar,
  Copy, Bell, Award, Eye, EyeOff, UserCircle, PenTool, Check, Crown,
  Fingerprint, Zap, ArrowUpRight, AlertCircle, Clock, Target, Info,
} from 'lucide-react'
import {
  requestNotificationPermission, fireReminder, saveReminderTime, getSavedReminderTime,
} from '../lib/notifications'

const PLATFORMS = ['Instagram', 'X (Twitter)', 'TikTok', 'YouTube', 'LinkedIn', 'Threads', 'Blog', 'Podcast']

const PERSONA_TEMPLATE = `Based on our past conversations, analyze my writing style and create a detailed persona description.

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

type SectionId = 'profile' | 'reminders' | 'preferences' | 'privacy' | 'persona' | null

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
  const [activeSection, setActiveSection] = useState<SectionId>(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [icsContent, setIcsContent] = useState('')
  const [aiPersona, setAiPersona] = useState('')
  const [showPersonaTemplate, setShowPersonaTemplate] = useState(false)
  const [originalUsername, setOriginalUsername] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
      if (data) {
        setName(data.name || '')
        setUsername(data.username || '')
        setOriginalUsername(data.username || '')
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url || '')
        setDefaultPlatform(data.default_platform || '')
        setWeekStart(data.week_start || 'monday')
        setIsPublic(data.is_public ?? true)
        setShowStreak(data.show_streak ?? true)
        setLeavesUsed(data.leaves_used || 0)
        setWeeklyTarget(data.weekly_target || 7)
        setAiPersona(data.ai_persona || '')
        if (data.reminder_hour !== null && data.reminder_minute !== null) {
          const h = String(data.reminder_hour).padStart(2, '0')
          const m = String(data.reminder_minute).padStart(2, '0')
          setReminderTime(`${h}:${m}`)
          setReminderSet(true)
        } else {
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
      .then(({ data }) => { if (data) setCurrentStreak(data.current_streak || 0) })

    if ('Notification' in window) setNotifAllowed(Notification.permission === 'granted')
  }, [user])

  const save = async () => {
    setSaving(true)
    setSaveError('')
    const trimmedUsername = username.trim()
    const usernameChanged = trimmedUsername !== originalUsername

    if (usernameChanged) {
      if (!trimmedUsername) { setSaving(false); setSaveError('Username cannot be empty.'); return }
      const { data: existing, error: checkError } = await supabase
        .from('profiles').select('id').eq('username', trimmedUsername).neq('id', user!.id).maybeSingle()
      if (checkError) { setSaving(false); setSaveError('Could not validate username. Please try again.'); return }
      if (existing) { setSaving(false); setSaveError('Username is already taken.'); return }
    }

    const updates: any = {
      name, bio, default_platform: defaultPlatform, week_start: weekStart,
      weekly_target: weeklyTarget, is_public: isPublic, show_streak: showStreak,
    }
    if (usernameChanged) updates.username = trimmedUsername

    const { error } = await supabase.from('profiles').update(updates).eq('id', user!.id)
    if (error) {
      if (error.code === '23505') setSaveError('Username is already taken.')
      else setSaveError(error.message || 'Could not save changes.')
      setSaving(false)
      return
    }

    if (name !== user?.user_metadata?.name) {
      const { error: authError } = await supabase.auth.updateUser({ data: { name } })
      if (authError) {
        setSaving(false)
        setSaveError(authError.message || 'Saved profile, but could not update account name.')
        return
      }
    }

    if (usernameChanged) setOriginalUsername(trimmedUsername)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const savePersona = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ ai_persona: aiPersona.trim() }).eq('id', user!.id)
    setSaving(false)
    if (error) { alert('Could not save persona: ' + error.message); return }
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
    } else {
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
    const streakMsg = currentStreak > 0
      ? `You're on a ${currentStreak}-day streak! Keep it going!`
      : 'Every day counts. Start your streak today!'
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
    const { error } = await supabase.from('profiles').update({
      reminder_hour: h, reminder_minute: m,
    }).eq('id', user!.id)
    if (error) { alert('Could not save reminder time: ' + error.message); return }
    saveReminderTime(h, m)
    setReminderSet(true)
    setNotifAllowed(true)
    const content = generateICS(h, m)
    setIcsContent(content)
    const dataUri = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(content)
    window.open(dataUri, '_blank')
    if (Notification.permission === 'granted') fireReminder()
    else requestNotificationPermission().then(granted => { if (granted) fireReminder() })
    alert('📅 Reminder file opened! If it didn\'t download, use the copy button below.')
  }

  const copyICS = async () => {
    if (!icsContent) return
    try { await navigator.clipboard.writeText(icsContent); alert('✅ Copied! Paste into a .ics file.') }
    catch { alert('Could not copy. Select and copy manually.') }
  }

  const togglePublic = async () => {
    const newVal = !isPublic
    setIsPublic(newVal)
    const { error } = await supabase.from('profiles').update({ is_public: newVal }).eq('id', user!.id)
    if (error) { setIsPublic(!newVal); alert('Could not update: ' + error.message) }
  }
  const toggleStreak = async () => {
    const newVal = !showStreak
    setShowStreak(newVal)
    const { error } = await supabase.from('profiles').update({ show_streak: newVal }).eq('id', user!.id)
    if (error) { setShowStreak(!newVal); alert('Could not update: ' + error.message) }
  }

  const leavesLeft = Math.max(0, 5 - leavesUsed)
  const isPro = false
  const initials = (name || username || 'U').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <Layout>
      <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '140px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={styles.eyebrow}>Account</p>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Tune your profile, reminders, and how the world sees you.</p>
        </div>

        <div className="card-hero" style={{ padding: '1.25rem', marginBottom: '1.1rem' }}>
          <div className="card-glow" />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={styles.avatarWrap} onClick={() => fileRef.current?.click()}>
              {avatarUrl
                ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
                : <span style={styles.avatarInitials}>{initials}</span>}
              <div style={styles.avatarOverlay}>
                {uploading ? <span style={{ color: '#fff', fontSize: '0.6rem' }}>…</span> : <Camera size={14} color="#fff" />}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.displayName}>{name || 'Your Name'}</div>
              <div style={styles.username}>@{username || 'username'}</div>
              <div style={styles.email}>{user?.email}</div>
            </div>

            <button
              className="btn btn-subtle"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.78rem', flexShrink: 0 }}
              onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}
            >
              <PenTool size={13} color="#F5A623" /> Edit
            </button>
          </div>

          <div className="profile-stats" style={{ position: 'relative' }}>
            <div style={styles.statCell}>
              <div style={styles.statValue}>{currentStreak}</div>
              <div style={styles.statLabel}>Day streak</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statCell}>
              <div style={{ ...styles.statValue, color: leavesLeft <= 1 ? '#E53E3E' : '#F5A623' }}>{leavesLeft}</div>
              <div style={styles.statLabel}>Leaves left</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statCell}>
              <div style={styles.statValue}>{weeklyTarget}<span style={{ fontSize: '0.7rem', color: '#6B6B6B' }}>/wk</span></div>
              <div style={styles.statLabel}>Target</div>
            </div>
          </div>
        </div>

        {activeSection === 'profile' && (
          <div className="card" style={{ padding: '1.1rem', marginBottom: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={styles.cardTitle}><UserCircle size={14} color="#F5A623" /> Edit profile</div>
            <div style={styles.field}>
              <label style={styles.label}>Display name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={styles.inputPrefix}>@</span>
                <input
                  className="input"
                  style={{ paddingLeft: '2rem' }}
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="username"
                />
              </div>
            </div>
            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Bio</label>
                <span style={styles.counter}>{bio.length}/160</span>
              </div>
              <textarea
                className="input"
                style={{ minHeight: '80px' }}
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 160))}
                placeholder="Tell other creators about yourself…"
              />
            </div>
            {saveError && <div style={styles.errorBox}><AlertCircle size={13} color="#E53E3E" /><span>{saveError}</span></div>}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saved ? <><Check size={15} /> Saved</> : saving ? 'Saving…' : 'Save changes'}
              </button>
              <button className="btn btn-ghost" onClick={() => { setActiveSection(null); setSaveError('') }}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card" style={{ overflow: 'hidden', marginBottom: '0.9rem' }}>
          <div style={styles.groupHeader}>
            <div style={styles.groupIcon}><Bell size={14} color="#F5A623" /></div>
            <div>
              <div style={styles.groupTitle}>Daily reminders</div>
              <div style={styles.groupSub}>Nudges so the streak never dies</div>
            </div>
          </div>

          <div className="row" onClick={() => setActiveSection(activeSection === 'reminders' ? null : 'reminders')}>
            <span style={styles.rowLabel}>Reminder time</span>
            <div style={styles.rowRight}>
              <span style={{ ...styles.rowValue, color: reminderSet ? '#4CAF50' : '#777' }}>
                {reminderSet ? reminderTime : 'Not set'}
              </span>
              <ChevronRight size={16} color="#5C5C5C" style={{ transform: activeSection === 'reminders' ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
          </div>

          {activeSection === 'reminders' && (
            <div style={styles.expandedInner}>
              <p style={styles.helpText}>
                We'll generate a calendar alarm at this time every day.
                {currentStreak > 0 && <span style={{ color: '#F5A623' }}> 🔥 {currentStreak}-day streak on the line.</span>}
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'stretch' }}>
                <input className="input" style={{ flex: 1 }} type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} />
                <button className="btn btn-primary" style={{ alignSelf: 'auto' }} onClick={setReminder}>Open .ics</button>
              </div>
              {reminderSet && (
                <div style={styles.successBox}>
                  <div style={styles.successLine}><Check size={14} color="#4CAF50" /> Reminder set for {reminderTime}</div>
                  <div style={styles.successHelp}>Tab opened with the file. If it didn't download, copy below.</div>
                  {icsContent && (
                    <>
                      <button className="btn btn-subtle" style={{ padding: '0.45rem 0.8rem', fontSize: '0.75rem', marginTop: '0.5rem' }} onClick={copyICS}><Copy size={12} /> Copy ICS</button>
                      <textarea value={icsContent} readOnly className="input" style={{ marginTop: '0.55rem', fontSize: '0.7rem', minHeight: '70px', fontFamily: 'monospace' }} />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card" style={{ overflow: 'hidden', marginBottom: '0.9rem' }}>
          <div style={styles.groupHeader}>
            <div style={styles.groupIcon}><Sliders size={14} color="#F5A623" /></div>
            <div>
              <div style={styles.groupTitle}>Preferences</div>
              <div style={styles.groupSub}>Defaults for your challenges</div>
            </div>
          </div>

          <div className="row" onClick={() => setActiveSection(activeSection === 'preferences' ? null : 'preferences')}>
            <span style={styles.rowLabel}>App preferences</span>
            <div style={styles.rowRight}>
              <span style={styles.rowValue}>{defaultPlatform || 'None'}</span>
              <ChevronRight size={16} color="#5C5C5C" style={{ transform: activeSection === 'preferences' ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
          </div>

          {activeSection === 'preferences' && (
            <div style={styles.expandedInner}>
              <div style={styles.field}>
                <label style={styles.label}><Target size={11} color="#F5A623" /> Default platform</label>
                <select className="input" value={defaultPlatform} onChange={e => setDefaultPlatform(e.target.value)}>
                  <option value="">None</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}><Calendar size={11} color="#F5A623" /> Weekly posting target</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <button
                      key={n}
                      className={`chip chip-square ${weeklyTarget === n ? 'chip-active' : ''}`}
                      onClick={() => setWeeklyTarget(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p style={styles.helpText}>
                  {weeklyTarget === 7 ? 'Daily — every day counts.' : `${weeklyTarget}× per week — resets if you miss your target.`}
                </p>
              </div>

              <div style={styles.field}>
                <label style={styles.label}><Clock size={11} color="#F5A623" /> Week starts on</label>
                <div className="segment">
                  {['monday', 'sunday'].map(d => (
                    <button
                      key={d}
                      className={`segment-btn ${weekStart === d ? 'segment-btn-active' : ''}`}
                      onClick={() => setWeekStart(d)}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {saveError && <div style={styles.errorBox}><AlertCircle size={13} color="#E53E3E" /><span>{saveError}</span></div>}
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saved ? <><Check size={15} /> Saved</> : 'Save preferences'}
              </button>
            </div>
          )}
        </div>

        <div className="card" style={{ overflow: 'hidden', marginBottom: '0.9rem' }}>
          <div style={styles.groupHeader}>
            <div style={styles.groupIcon}><Shield size={14} color="#F5A623" /></div>
            <div>
              <div style={styles.groupTitle}>Privacy</div>
              <div style={styles.groupSub}>Who sees what</div>
            </div>
          </div>

          <button className="row" style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left' }} onClick={togglePublic}>
            <div style={styles.toggleLeft}>
              {isPublic ? <Eye size={16} color="#666" /> : <EyeOff size={16} color="#666" />}
              <div>
                <div style={styles.toggleTitle}>Public profile</div>
                <div style={styles.toggleSub}>Others can find and follow you</div>
              </div>
            </div>
            <div className="switch" style={{ background: isPublic ? '#F5A623' : '#2A2A2A' }}>
              <div className="switch-dot" style={{ transform: isPublic ? 'translateX(20px)' : 'translateX(2px)' }} />
            </div>
          </button>

          <div style={{ height: '1px', background: '#1A1A1A' }} />

          <button className="row" style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left' }} onClick={toggleStreak}>
            <div style={styles.toggleLeft}>
              <Award size={16} color="#666" />
              <div>
                <div style={styles.toggleTitle}>Show streak on leaderboard</div>
                <div style={styles.toggleSub}>Hide your number while competing</div>
              </div>
            </div>
            <div className="switch" style={{ background: showStreak ? '#F5A623' : '#2A2A2A' }}>
              <div className="switch-dot" style={{ transform: showStreak ? 'translateX(20px)' : 'translateX(2px)' }} />
            </div>
          </button>
        </div>

        <div className="card" style={{ overflow: 'hidden', marginBottom: '0.9rem' }}>
          <div style={styles.groupHeader}>
            <div style={styles.groupIcon}><Sparkles size={14} color="#F5A623" /></div>
            <div>
              <div style={styles.groupTitle}>AI persona</div>
              <div style={styles.groupSub}>Make the AI sound like you</div>
            </div>
          </div>

          <div className="row" onClick={() => setActiveSection(activeSection === 'persona' ? null : 'persona')}>
            <span style={styles.rowLabel}>Content voice</span>
            <div style={styles.rowRight}>
              <span style={{ ...styles.rowValue, color: aiPersona ? '#4CAF50' : '#777' }}>
                {aiPersona ? '✓ Set' : 'Not set'}
              </span>
              <ChevronRight size={16} color="#5C5C5C" style={{ transform: activeSection === 'persona' ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
          </div>

          {activeSection === 'persona' && (
            <div style={styles.expandedInner}>
              {!aiPersona ? (
                <>
                  <div style={styles.stepsBox}>
                    <div style={styles.step}><span style={styles.stepNum}>1</span><span>Copy the prompt below</span></div>
                    <div style={styles.step}><span style={styles.stepNum}>2</span><span>Paste into ChatGPT / Claude, then paste the reply here</span></div>
                  </div>
                  <button className="btn btn-subtle" style={{ alignSelf: 'flex-start', padding: '0.45rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setShowPersonaTemplate(!showPersonaTemplate)}>
                    <Info size={12} /> {showPersonaTemplate ? 'Hide prompt' : 'Show prompt'}
                  </button>
                  {showPersonaTemplate && (
                    <div style={styles.promptBox}>
                      <button className="btn btn-primary" style={{ position: 'absolute', top: '0.55rem', right: '0.55rem', padding: '0.3rem 0.65rem', fontSize: '0.7rem', zIndex: 1 }} onClick={() => { navigator.clipboard.writeText(PERSONA_TEMPLATE); alert('Template copied!') }}>
                        <Copy size={11} /> Copy
                      </button>
                      <pre style={styles.promptPre}>{PERSONA_TEMPLATE}</pre>
                    </div>
                  )}
                  <textarea
                    className="input"
                    style={{ minHeight: '120px' }}
                    placeholder="Paste your AI's response here…"
                    value={aiPersona}
                    onChange={e => setAiPersona(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={savePersona} disabled={saving}>
                    {saving ? 'Saving…' : 'Save persona'}
                  </button>
                </>
              ) : (
                <>
                  <div style={styles.successBox}>
                    <div style={styles.successLine}><Check size={14} color="#4CAF50" /> Persona set — content will sound like you.</div>
                  </div>
                  <div style={styles.personaPreview}>
                    <pre style={styles.personaPre}>{aiPersona.slice(0, 300)}{aiPersona.length > 300 ? '…' : ''}</pre>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button className="btn btn-danger" onClick={() => { setAiPersona(''); savePersona() }}>
                      Remove persona
                    </button>
                    <button className="btn btn-ghost" onClick={() => setActiveSection(null)}>Done</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="card-hero" style={{ padding: '1.1rem', marginBottom: '0.9rem' }}>
          <div className="card-glow" />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={styles.planIcon}><Crown size={18} color="#0A0A0A" /></div>
            <div style={{ flex: 1 }}>
              <div style={styles.planTitle}>{isPro ? 'Pro Plan' : 'Free Plan'}</div>
              <div style={styles.planSub}>{isPro ? 'All features unlocked' : `${leavesLeft} of 5 leaves remaining`}</div>
            </div>
            <span style={isPro ? styles.proBadge : styles.freeBadge}>{isPro ? 'PRO' : 'Free'}</span>
          </div>
          {!isPro && (
            <>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.9rem 0', position: 'relative' }} />
              <div className="feature-grid" style={{ position: 'relative', marginBottom: '0.9rem' }}>
                <div style={styles.planFeature}><Zap size={12} color="#F5A623" /> Unlimited challenges</div>
                <div style={styles.planFeature}><Award size={12} color="#F5A623" /> Unlimited leaves</div>
                <div style={styles.planFeature}><Shield size={12} color="#F5A623" /> Streak freeze</div>
                <div style={styles.planFeature}><Fingerprint size={12} color="#F5A623" /> Pro badge + analytics</div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', position: 'relative' }}>
                <Crown size={15} color="#0A0A0A" /> Upgrade to Pro — $5/mo <ArrowUpRight size={14} color="#0A0A0A" />
              </button>
            </>
          )}
        </div>

        <button className="btn btn-danger" style={{ width: '100%', gap: '0.5rem', marginTop: '0.4rem' }} onClick={signOut}>
          <LogOut size={16} color="#E53E3E" /> Sign out
        </button>

        <p style={styles.footerNote}>Creator Accountability · v1.0</p>
      </div>
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  eyebrow: { color: '#5C5C5C', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.25rem', fontWeight: 700 },
  title: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.9rem', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #F5F1EA 50%, #F5A623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 },
  subtitle: { color: '#7A7A7A', fontSize: '0.85rem', marginTop: '0.4rem' },
  avatarWrap: { width: '68px', height: '68px', borderRadius: '20px', background: '#1A1A1A', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', position: 'relative' },
  avatarInitials: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.4rem', color: '#F5A623' },
  avatarOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 50%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0.35rem' },
  displayName: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.15rem', color: '#F5F1EA', letterSpacing: '-0.01em' },
  username: { color: '#F5A623', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.1rem' },
  email: { color: '#6B6B6B', fontSize: '0.72rem', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statCell: { flex: 1, textAlign: 'center' },
  statValue: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.15rem', color: '#F5F1EA', lineHeight: 1 },
  statLabel: { fontSize: '0.62rem', color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: '0.3rem', fontWeight: 600 },
  statDivider: { width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)' },
  groupHeader: { display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.95rem 1.1rem 0.4rem' },
  groupIcon: { width: '30px', height: '30px', borderRadius: '10px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  groupTitle: { fontSize: '0.88rem', fontWeight: 700, color: '#F5F1EA' },
  groupSub: { fontSize: '0.72rem', color: '#6B6B6B', marginTop: '0.1rem' },
  rowLabel: { color: '#DADADA', fontSize: '0.88rem', fontWeight: 500 },
  rowRight: { display: 'flex', alignItems: 'center', gap: '0.55rem' },
  rowValue: { color: '#8A8A8A', fontSize: '0.8rem', fontWeight: 600 },
  cardTitle: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: '#F5F1EA', textTransform: 'uppercase', letterSpacing: '0.06em' },
  expandedInner: { padding: '0.6rem 1.1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid #1A1A1A' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#8A8A8A', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 },
  counter: { color: '#5C5C5C', fontSize: '0.66rem', fontWeight: 600 },
  inputPrefix: { position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#6B6B6B', fontSize: '0.9rem' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', color: '#E53E3E', fontSize: '0.78rem', padding: '0.6rem 0.8rem', borderRadius: '10px' },
  helpText: { color: '#7A7A7A', fontSize: '0.75rem', lineHeight: 1.5, margin: 0 },
  successBox: { background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: '12px', padding: '0.75rem 0.9rem', marginTop: '0.4rem' },
  successLine: { color: '#4CAF50', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 },
  successHelp: { color: '#7A7A7A', fontSize: '0.73rem', marginTop: '0.25rem' },
  toggleLeft: { display: 'flex', alignItems: 'center', gap: '0.7rem' },
  toggleTitle: { fontSize: '0.88rem', fontWeight: 600, color: '#F5F1EA' },
  toggleSub: { fontSize: '0.72rem', color: '#6B6B6B', marginTop: '0.1rem' },
  stepsBox: { background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.18)', borderRadius: '12px', padding: '0.8rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' },
  step: { display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#DADADA' },
  stepNum: { width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(245,166,35,0.15)', color: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 },
  promptBox: { position: 'relative', background: '#0A0A0A', border: '1px solid rgba(245,166,35,0.25)', borderRadius: '12px', padding: '0.9rem', marginTop: '0.4rem' },
  promptPre: { color: '#9A9A9A', fontSize: '0.78rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: 'Inter', margin: 0, paddingRight: '3.5rem' },
  personaPreview: { background: '#0A0A0A', border: '1px solid #262626', borderRadius: '10px', padding: '0.7rem 0.9rem', maxHeight: '100px', overflow: 'auto' },
  personaPre: { color: '#8A8A8A', fontSize: '0.76rem', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'Inter' },
  planIcon: { width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #F5A623, #E1921D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 20px -8px rgba(245,166,35,0.7)' },
  planTitle: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.05rem', color: '#F5F1EA' },
  planSub: { fontSize: '0.76rem', color: '#8A8A8A', marginTop: '0.15rem' },
  proBadge: { background: 'linear-gradient(135deg, #F5A623, #D9821A)', color: '#0A0A0A', fontSize: '0.65rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' },
  freeBadge: { background: 'rgba(255,255,255,0.06)', border: '1px solid #2A2A2A', color: '#8A8A8A', fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '20px' },
  planFeature: { display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#B0B0B0', fontSize: '0.76rem' },
  footerNote: { textAlign: 'center', color: '#3A3A3A', fontSize: '0.7rem', marginTop: '1.25rem' },
}
