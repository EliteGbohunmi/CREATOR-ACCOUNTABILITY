import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { Trophy, Users, CheckCircle2, Clock, Award, Flame, Plus, X, AlertCircle, LogOut, Calendar } from 'lucide-react'

const MAX_LEAVES = 5

const COLORS = {
  bg: '#0A0A0A',
  surface: '#111111',
  surfaceRaised: 'linear-gradient(180deg, #141414 0%, #0D0D0D 100%)',
  border: '#1E1E1E',
  borderSoft: 'rgba(255,255,255,0.06)',
  gold: '#F5A623',
  goldSoft: 'rgba(245,166,35,0.12)',
  goldBorder: 'rgba(245,166,35,0.28)',
  goldGlow: '0 0 22px rgba(245,166,35,0.25)',
  text: '#F0EDE8',
  textDim: '#8A8A8A',
  textFaint: '#5C5C5C',
  green: '#4CAF50',
  greenSoft: 'rgba(76,175,80,0.12)',
  greenBorder: 'rgba(76,175,80,0.28)',
  red: '#E53E3E',
  redSoft: 'rgba(229,62,62,0.12)',
  redBorder: 'rgba(229,62,62,0.28)',
}

export default function Challenges() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<any[]>([])
  const [joined, setJoined] = useState<any[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [participants, setParticipants] = useState<Record<string, any[]>>({})
  const [joining, setJoining] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [leaving, setLeaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newDays, setNewDays] = useState('')
  const [creating, setCreating] = useState(false)
  const [leavesUsed, setLeavesUsed] = useState(0)
  const [confirmLeave, setConfirmLeave] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data: c, error: cErr } = await supabase
      .from('challenges')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false })
    if (cErr) console.error(cErr)

    const { data: j } = await supabase
      .from('user_challenges')
      .select('*, challenges(*)')
      .eq('user_id', user!.id)
      .is('left_at', null)

    const { data: countData } = await supabase
      .from('user_challenges')
      .select('challenge_id, user_id, last_checked_in, progress, profiles(name)')
      .is('left_at', null)

    const { data: prof } = await supabase
      .from('profiles')
      .select('leaves_used')
      .eq('id', user!.id)
      .single()

    setLeavesUsed(prof?.leaves_used || 0)

    const now = new Date()
    const challengesWithEnd = (c || []).map(ch => {
      const start = new Date(ch.created_at)
      const end = new Date(start)
      end.setDate(end.getDate() + ch.days)
      const ended = end < now
      return { ...ch, end_date: end.toISOString().split('T')[0], ended }
    })
    setChallenges(challengesWithEnd)

    const activeJoined = (j || []).filter(uc => {
      const ch = challengesWithEnd.find(c => c.id === uc.challenge_id)
      return ch && !ch.ended
    })
    setJoined(activeJoined)

    const countMap: Record<string, number> = {}
    const participantMap: Record<string, any[]> = {}
    for (const row of (countData || [])) {
      countMap[row.challenge_id] = (countMap[row.challenge_id] || 0) + 1
      if (!participantMap[row.challenge_id]) participantMap[row.challenge_id] = []
      participantMap[row.challenge_id].push(row)
    }
    setCounts(countMap)
    setParticipants(participantMap)
    setLoading(false)
  }

  const createChallenge = async () => {
    if (!newName.trim() || !newDays) return
    setCreating(true)

    const days = parseInt(newDays)
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + days)

    await supabase.from('challenges').insert({
      name: newName.trim(),
      days: days,
      created_by: user!.id,
      end_date: endDate.toISOString(),
      status: 'active'
    })

    setNewName('')
    setNewDays('')
    setShowForm(false)
    await fetchAll()
    setCreating(false)
  }

  const joinChallenge = async (challengeId: string) => {
    setJoining(challengeId)
    await supabase.from('user_challenges').insert({
      user_id: user!.id, challenge_id: challengeId, progress: 0
    })
    await fetchAll()
    setJoining(null)
  }

  const leaveChallenge = async (uc: any) => {
    if (leavesUsed >= MAX_LEAVES) return
    setLeaving(uc.id)
    await supabase.from('user_challenges').update({
      left_at: new Date().toISOString()
    }).eq('id', uc.id)
    await supabase.from('profiles').update({
      leaves_used: leavesUsed + 1
    }).eq('id', user!.id)
    setConfirmLeave(null)
    await fetchAll()
    setLeaving(null)
  }

  const checkInChallenge = async (uc: any) => {
    if (uc.last_checked_in === today) return
    setCheckingIn(uc.id)
    const newProgress = uc.progress + 1
    const completed = newProgress >= uc.challenges.days
    await supabase.from('user_challenges').update({
      progress: newProgress,
      last_checked_in: today,
      ...(completed ? { completed_at: new Date().toISOString() } : {})
    }).eq('id', uc.id)
    await fetchAll()
    setCheckingIn(null)
  }

  const isJoined = (id: string) => joined.some(j => j.challenge_id === id)
  const daysLeft = (uc: any) => Math.max(uc.challenges.days - uc.progress, 0)
  const leavesLeft = MAX_LEAVES - leavesUsed

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              style={{ height: '120px', borderRadius: '16px', background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
            />
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.eyebrow}>
            <span style={styles.eyebrowDot} />
            Compete
          </div>
          <h1 style={styles.title}>Challenges</h1>
          <p style={styles.subtitle}>Commit publicly. Build unstoppable momentum.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={showForm ? styles.cancelBtn : styles.addBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X size={16} color={COLORS.textDim} /> : <Plus size={16} color={COLORS.bg} />}
          {showForm ? 'Cancel' : 'Create'}
        </motion.button>
      </div>

      <div style={styles.leavesBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <div style={{
            ...styles.iconChip,
            background: leavesLeft > 0 ? 'rgba(255,255,255,0.05)' : COLORS.redSoft,
          }}>
            <LogOut size={13} color={leavesLeft > 0 ? COLORS.textDim : COLORS.red} />
          </div>
          <span style={{ color: leavesLeft > 0 ? COLORS.textDim : COLORS.red, fontSize: '0.82rem', fontWeight: 500 }}>
            {leavesLeft > 0 ? `${leavesLeft} of ${MAX_LEAVES} leaves remaining` : 'No leaves left — upgrade to Pro to leave more challenges'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {Array.from({ length: MAX_LEAVES }).map((_, i) => (
            <div key={i} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: i < leavesLeft ? COLORS.gold : '#242424',
              boxShadow: i < leavesLeft ? '0 0 8px rgba(245,166,35,0.55)' : 'none',
              transition: 'background 0.2s, box-shadow 0.2s'
            }} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            style={styles.form}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div style={styles.formAccent} />
            <p style={styles.formLabel}>New Challenge</p>
            <input
              style={styles.input}
              placeholder="Challenge name (e.g. 30 Days of Reels)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                style={{ ...styles.input, maxWidth: '140px' }}
                placeholder="Days (e.g. 30)"
                type="number"
                min="1"
                max="365"
                value={newDays}
                onChange={e => setNewDays(e.target.value)}
              />
              <span style={{ color: COLORS.textFaint, fontSize: '0.85rem' }}>days long</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={styles.saveBtn}
              onClick={createChallenge}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Challenge'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {joined.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={styles.sectionLabel}>
            <div style={{ ...styles.iconChipSmall, background: COLORS.goldSoft }}>
              <Flame size={12} color={COLORS.gold} />
            </div>
            Active
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {joined.map((uc: any) => {
              const isComplete = uc.progress >= uc.challenges.days
              const checkedInToday = uc.last_checked_in === today
              const pct = Math.min((uc.progress / uc.challenges.days) * 100, 100)
              const allParticipants = participants[uc.challenge_id] || []
              const missedToday = allParticipants.filter(p => p.last_checked_in !== today)
              const checkedInList = allParticipants.filter(p => p.last_checked_in === today)
              const isExpanded = expandedChallenge === uc.id
              const isConfirmingLeave = confirmLeave === uc.id

              return (
                <motion.div
                  key={uc.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    ...styles.card,
                    borderColor: isComplete ? COLORS.goldBorder : COLORS.border,
                    boxShadow: isComplete ? COLORS.goldGlow : styles.card.boxShadow,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        {isComplete && (
                          <div style={{ ...styles.iconChipSmall, background: COLORS.goldSoft }}>
                            <Award size={12} color={COLORS.gold} />
                          </div>
                        )}
                        <span style={{ fontWeight: 600, fontSize: '0.97rem', color: COLORS.text, letterSpacing: '-0.01em' }}>
                          {uc.challenges?.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', flexWrap: 'wrap' }}>
                        <span style={styles.metaItem}>
                          <Clock size={12} color={COLORS.textFaint} />
                          {isComplete ? 'Completed!' : `${daysLeft(uc)} days left`}
                        </span>
                        <span
                          style={{ ...styles.metaItem, cursor: 'pointer' }}
                          onClick={() => setExpandedChallenge(isExpanded ? null : uc.id)}
                        >
                          <Users size={12} color={COLORS.textFaint} />
                          {counts[uc.challenge_id] || 0} joined
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={styles.progressNumber}>
                        {uc.progress}<span style={{ color: COLORS.textFaint, fontWeight: 500 }}>/{uc.challenges?.days}</span>
                      </div>
                      <div style={{ color: COLORS.textFaint, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>days</div>
                    </div>
                  </div>

                  <div style={styles.progressTrack}>
                    <motion.div
                      style={{
                        ...styles.progressFill,
                        background: isComplete
                          ? `linear-gradient(90deg, ${COLORS.green}, #6FCB73)`
                          : `linear-gradient(90deg, #D98E1B, ${COLORS.gold})`,
                        boxShadow: isComplete ? '0 0 10px rgba(76,175,80,0.5)' : '0 0 10px rgba(245,166,35,0.4)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '0.9rem' }}
                      >
                        {checkedInList.length > 0 && (
                          <div style={{ marginBottom: '0.8rem', marginTop: '0.5rem' }}>
                            <p style={styles.subLabel(COLORS.green)}>Checked in today</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {checkedInList.map((p: any, i: number) => (
                                <span key={i} style={{ ...styles.pill, background: COLORS.greenSoft, color: COLORS.green, border: `1px solid ${COLORS.greenBorder}` }}>
                                  <CheckCircle2 size={11} color={COLORS.green} />
                                  {p.profiles?.name || 'Creator'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {missedToday.length > 0 && (
                          <div>
                            <p style={styles.subLabel(COLORS.red)}>Missed today</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {missedToday.map((p: any, i: number) => (
                                <span key={i} style={{ ...styles.pill, background: COLORS.redSoft, color: COLORS.red, border: `1px solid ${COLORS.redBorder}` }}>
                                  <AlertCircle size={11} color={COLORS.red} />
                                  {p.profiles?.name || 'Creator'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isComplete && (
                    <motion.button
                      whileHover={checkedInToday ? {} : { scale: 1.01 }}
                      whileTap={checkedInToday ? {} : { scale: 0.98 }}
                      style={{
                        ...styles.checkInBtn,
                        background: checkedInToday ? '#161616' : COLORS.gold,
                        color: checkedInToday ? COLORS.textFaint : COLORS.bg,
                        border: checkedInToday ? `1px solid ${COLORS.border}` : 'none',
                        boxShadow: checkedInToday ? 'none' : '0 6px 18px -6px rgba(245,166,35,0.55)',
                        cursor: checkedInToday ? 'default' : 'pointer'
                      }}
                      onClick={() => !checkedInToday && checkInChallenge(uc)}
                      disabled={checkingIn === uc.id || checkedInToday}
                    >
                      <CheckCircle2 size={15} color={checkedInToday ? COLORS.textFaint : COLORS.bg} />
                      {checkingIn === uc.id ? 'Saving...' : checkedInToday ? 'Checked in today' : 'Check In Today'}
                    </motion.button>
                  )}

                  {isComplete && (
                    <div style={styles.badge}>
                      <div style={{ ...styles.iconChipSmall, background: 'rgba(245,166,35,0.18)' }}>
                        <Award size={14} color={COLORS.gold} />
                      </div>
                      Challenge complete! You earned this badge.
                    </div>
                  )}

                  {!isComplete && (
                    <div style={{ marginTop: '0.85rem' }}>
                      {!isConfirmingLeave ? (
                        <button
                          style={styles.leaveBtn}
                          onClick={() => setConfirmLeave(uc.id)}
                          disabled={leavesLeft <= 0}
                        >
                          <LogOut size={13} color={leavesLeft > 0 ? COLORS.textFaint : '#333'} />
                          {leavesLeft > 0 ? `Leave challenge (${leavesLeft} left)` : 'No leaves remaining'}
                        </button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={styles.confirmBox}
                        >
                          <p style={{ color: COLORS.red, fontSize: '0.85rem', margin: 0, marginBottom: '0.75rem' }}>
                            Leave this challenge? This uses 1 of your {leavesLeft} remaining leaves.
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              style={styles.confirmLeaveBtn}
                              onClick={() => leaveChallenge(uc)}
                              disabled={leaving === uc.id}
                            >
                              {leaving === uc.id ? 'Leaving...' : 'Yes, leave'}
                            </button>
                            <button style={styles.cancelLeaveBtn} onClick={() => setConfirmLeave(null)}>
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      <div style={styles.sectionLabel}>
        <div style={{ ...styles.iconChipSmall, background: 'rgba(255,255,255,0.05)' }}>
          <Trophy size={12} color={COLORS.textDim} />
        </div>
        All Challenges
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {challenges.filter(c => !c.ended).map(c => (
          <motion.div key={c.id} whileHover={{ y: -2 }} transition={{ duration: 0.18 }} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem', color: COLORS.text, letterSpacing: '-0.01em' }}>
                  {c.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', rowGap: '0.35rem' }}>
                  <span style={styles.metaItem}>
                    <Clock size={12} color={COLORS.textFaint} />
                    {c.days} days
                  </span>
                  <span style={styles.metaItem}>
                    <Users size={12} color={COLORS.textFaint} />
                    {counts[c.id] || 0} joined
                  </span>
                  {c.profiles?.name && (
                    <span style={{ color: COLORS.textFaint, fontSize: '0.78rem' }}>by {c.profiles.name}</span>
                  )}
                  <span style={styles.metaItem}>
                    <Calendar size={12} color={COLORS.textFaint} />
                    Ends {c.end_date}
                  </span>
                </div>
              </div>
              {isJoined(c.id) ? (
                <div style={styles.joinedChip}>
                  <CheckCircle2 size={15} color={COLORS.green} />
                  Joined
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={styles.joinBtn}
                  onClick={() => joinChallenge(c.id)}
                  disabled={joining === c.id}
                >
                  {joining === c.id ? '...' : 'Join'}
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
        {challenges.filter(c => !c.ended).length === 0 && (
          <div style={styles.emptyState}>
            <Trophy size={22} color={COLORS.textFaint} />
            <p style={{ color: COLORS.textDim, marginTop: '0.6rem', fontSize: '0.88rem' }}>
              No active challenges right now. Create one!
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

const styles: Record<string, any> = {
  headerRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem'
  },
  eyebrow: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    color: COLORS.textFaint, fontSize: '0.78rem', textTransform: 'uppercase',
    letterSpacing: '0.1em', marginBottom: '0.4rem', fontWeight: 600
  },
  eyebrowDot: {
    width: '5px', height: '5px', borderRadius: '50%',
    background: COLORS.gold, boxShadow: '0 0 6px rgba(245,166,35,0.7)', display: 'inline-block'
  },
  title: {
    fontSize: '1.9rem', fontFamily: 'Space Grotesk', fontWeight: 700,
    letterSpacing: '-0.02em', color: COLORS.text, lineHeight: 1.1
  },
  subtitle: {
    color: COLORS.textDim, marginTop: '0.4rem', fontSize: '0.9rem', letterSpacing: '-0.005em'
  },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: COLORS.gold, color: COLORS.bg, border: 'none',
    borderRadius: '11px', padding: '0.7rem 1.15rem', fontWeight: 600,
    cursor: 'pointer', fontSize: '0.85rem',
    boxShadow: '0 6px 18px -6px rgba(245,166,35,0.55)'
  },
  cancelBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: COLORS.surface, color: COLORS.textDim, border: `1px solid ${COLORS.border}`,
    borderRadius: '11px', padding: '0.7rem 1.15rem', fontWeight: 500,
    cursor: 'pointer', fontSize: '0.85rem'
  },
  leavesBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: '12px',
    padding: '0.8rem 1.1rem', marginBottom: '1.4rem',
    boxShadow: '0 4px 18px -10px rgba(0,0,0,0.6)'
  },
  iconChip: {
    width: '26px', height: '26px', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  iconChipSmall: {
    width: '20px', height: '20px', borderRadius: '6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  form: {
    position: 'relative', overflow: 'hidden',
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: '16px',
    padding: '1.4rem', marginBottom: '1.6rem', display: 'flex',
    flexDirection: 'column', gap: '0.8rem',
    boxShadow: '0 10px 30px -14px rgba(0,0,0,0.7)'
  },
  formAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
    background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`
  },
  formLabel: {
    color: COLORS.textFaint, fontSize: '0.78rem', textTransform: 'uppercase',
    letterSpacing: '0.08em', fontWeight: 600, margin: 0
  },
  input: {
    background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '10px',
    padding: '0.8rem 1rem', color: COLORS.text, fontSize: '0.95rem',
    outline: 'none', flex: 1
  },
  saveBtn: {
    background: COLORS.gold, color: COLORS.bg, border: 'none',
    borderRadius: '10px', padding: '0.8rem', fontWeight: 600,
    cursor: 'pointer', fontSize: '0.9rem', letterSpacing: '-0.005em',
    boxShadow: '0 6px 18px -6px rgba(245,166,35,0.5)'
  },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '0.55rem',
    color: COLORS.textDim, fontSize: '0.76rem', textTransform: 'uppercase',
    letterSpacing: '0.09em', marginBottom: '0.85rem', fontWeight: 600
  },
  card: {
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`,
    borderRadius: '16px', padding: '1.3rem',
    boxShadow: '0 6px 20px -14px rgba(0,0,0,0.7)'
  },
  metaItem: {
    color: COLORS.textDim, fontSize: '0.8rem', display: 'flex',
    alignItems: 'center', gap: '0.35rem'
  },
  progressNumber: {
    color: COLORS.gold, fontFamily: 'Space Grotesk', fontWeight: 700,
    fontSize: '1.15rem', letterSpacing: '-0.01em'
  },
  progressTrack: {
    height: '6px', background: '#1A1A1A',
    borderRadius: '999px', overflow: 'hidden', marginBottom: '0.9rem'
  },
  progressFill: { height: '100%', borderRadius: '999px' },
  subLabel: (color: string) => ({
    color, fontSize: '0.72rem', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: '0.4rem', fontWeight: 600
  }),
  checkInBtn: {
    width: '100%', borderRadius: '10px', padding: '0.75rem',
    fontWeight: 600, fontSize: '0.85rem',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '0.5rem', transition: 'box-shadow 0.2s'
  },
  badge: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    background: 'linear-gradient(180deg, #1A1400 0%, #171200 100%)', border: `1px solid ${COLORS.goldBorder}`,
    borderRadius: '10px', padding: '0.8rem 0.9rem',
    color: COLORS.gold, fontSize: '0.85rem', fontWeight: 500
  },
  joinBtn: {
    background: COLORS.goldSoft, color: COLORS.gold,
    border: `1px solid ${COLORS.goldBorder}`, borderRadius: '9px',
    padding: '0.55rem 1.2rem', fontWeight: 600,
    fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0
  },
  joinedChip: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    color: COLORS.green, fontSize: '0.85rem', fontWeight: 500,
    background: COLORS.greenSoft, border: `1px solid ${COLORS.greenBorder}`,
    borderRadius: '9px', padding: '0.5rem 0.9rem', flexShrink: 0
  },
  pill: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500
  },
  leaveBtn: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    background: 'none', border: 'none', color: COLORS.textFaint,
    fontSize: '0.78rem', cursor: 'pointer', padding: '0'
  },
  confirmBox: {
    background: 'linear-gradient(180deg, #1A0000 0%, #150000 100%)', border: `1px solid ${COLORS.redBorder}`,
    borderRadius: '10px', padding: '0.9rem'
  },
  confirmLeaveBtn: {
    background: COLORS.red, color: '#fff', border: 'none',
    borderRadius: '7px', padding: '0.55rem 1.1rem',
    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
  },
  cancelLeaveBtn: {
    background: 'none', border: `1px solid ${COLORS.border}`,
    borderRadius: '7px', padding: '0.55rem 1.1rem',
    color: COLORS.textDim, fontSize: '0.82rem', cursor: 'pointer'
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', textAlign: 'center', padding: '2.2rem 1rem',
    background: COLORS.surfaceRaised, border: `1px dashed ${COLORS.border}`, borderRadius: '16px'
  }
}
