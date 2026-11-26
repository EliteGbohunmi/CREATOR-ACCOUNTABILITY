import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, CheckCircle2, Clock, Award, Plus, X, Calendar, Lock, Trash2, KeyRound, Copy } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../lib/AuthContext'
import {
  listChallenges, listMyChallenges, listAllParticipants,
  joinChallenge, joinByCode, leaveChallenge, deleteChallenge, checkIn,
  daysLeft, percent, type Challenge, type UserChallenge,
} from '../lib/challenges'
import CreateChallengeModal from '../components/challenges/CreateChallengeModal'
import Leaderboard from '../components/challenges/Leaderboard'
import ChallengeCalendar from '../components/challenges/ChallengeCalendar'
import ChallengeChat from '../components/challenges/ChallengeChat'

const MAX_LEAVES = 5

export default function Challenges() {
  const { user } = useAuth()
  const [myChallenges, setMyChallenges] = useState<UserChallenge[]>([])
  const [discover, setDiscover] = useState<Challenge[]>([])
  const [allParticipants, setAllParticipants] = useState<UserChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [checkingInId, setCheckingInId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmLeave, setConfirmLeave] = useState<string | null>(null)
  const [leavesUsed, setLeavesUsed] = useState(0)

  const today = new Date().toISOString().split('T')[0]

  const fetchAll = async () => {
    if (!user) return
    const [mine, all, parts] = await Promise.all([
      listMyChallenges(user.id),
      listChallenges(),
      listAllParticipants(),
    ])
    setMyChallenges(mine.filter((uc: any) => !uc.challenges?.end_date || new Date(uc.challenges.end_date) >= new Date()))
    setDiscover(all.filter(c => new Date(c.end_date) >= new Date()))
    setAllParticipants(parts)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [user])

  const myChallengeIds = new Set(myChallenges.map(uc => uc.challenge_id))
  const discoverFiltered = discover.filter(c => !myChallengeIds.has(c.id))

  const handleCreate = async (_created: Challenge) => {
    setShowCreate(false)
    await fetchAll()
  }

  const handleJoin = async (challengeId: string) => {
    if (!user) return
    setJoiningId(challengeId)
    await joinChallenge(user.id, challengeId)
    setJoiningId(null)
    await fetchAll()
  }

  const handleJoinCode = async () => {
    if (!user || !codeInput.trim()) return
    setCodeError('')
    const ch = await joinByCode(user.id, codeInput.trim())
    if (!ch) {
      setCodeError('Invalid code or challenge not found')
      return
    }
    setCodeInput('')
    setShowCodeInput(false)
    await fetchAll()
  }

  const handleCheckIn = async (uc: UserChallenge) => {
    if (uc.last_checked_in === today) return
    setCheckingInId(uc.id)
    await checkIn(uc.id, uc.challenges?.days || 0)
    setCheckingInId(null)
    await fetchAll()
  }

  const handleLeave = async (uc: UserChallenge) => {
    if (!user) return
    await leaveChallenge(uc.id, user.id)
    setConfirmLeave(null)
    setLeavesUsed(l => l + 1)
    await fetchAll()
  }

  const handleDelete = async (challengeId: string) => {
    await deleteChallenge(challengeId)
    setConfirmDelete(null)
    await fetchAll()
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '160px', borderRadius: '16px', background: '#111', border: '1px solid #1A1A1A' }} />
          ))}
        </div>
      </Layout>
    )
  }

  const leavesLeft = MAX_LEAVES - leavesUsed

  return (
    <Layout>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.eyebrow}>
            <span style={styles.eyebrowDot} />
            Commit publicly
          </div>
          <h1 style={styles.title}>Challenges</h1>
          <p style={styles.subtitle}>Build momentum with people who show up.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={styles.ghostBtn} onClick={() => setShowCodeInput(!showCodeInput)}>
            <KeyRound size={15} color="#8A8A8A" />
            Join with code
          </button>
          <motion.button whileTap={{ scale: 0.97 }} style={styles.addBtn} onClick={() => setShowCreate(true)}>
            <Plus size={16} color="#0A0A0A" />
            Create
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showCodeInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '1.25rem' }}
          >
            <div style={styles.codeBox}>
              <div style={{ flex: 1 }}>
                <p style={styles.codeLabel}>Enter code</p>
                <input
                  style={styles.codeInput}
                  placeholder="e.g. REELS30"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                {codeError && <p style={styles.codeError}>{codeError}</p>}
              </div>
              <button style={styles.codeJoinBtn} onClick={handleJoinCode}>Join</button>
              <button style={styles.codeCloseBtn} onClick={() => { setShowCodeInput(false); setCodeError(''); setCodeInput('') }}>
                <X size={16} color="#5C5C5C" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {myChallenges.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={styles.sectionLabel}>Your active challenges</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myChallenges.map(uc => {
              const ch = uc.challenges
              if (!ch) return null
              const isCreator = ch.created_by === user?.id
              const pct = percent(uc)
              const done = uc.progress >= ch.days
              const checkedToday = uc.last_checked_in === today
              const participants = allParticipants.filter(p => p.challenge_id === ch.id)
              const myCheckins = participants
                .filter(p => p.user_id === user?.id)
                .map(p => p.last_checked_in)
                .filter(Boolean) as string[]

              return (
                <motion.div key={uc.id} layout style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={styles.challengeName}>{ch.name}</span>
                        <span style={styles.categoryBadge}>{ch.category}</span>
                        {ch.visibility === 'private' && (
                          <span style={styles.privateBadge}><Lock size={10} color="#8A8A8A" /> Private</span>
                        )}
                        {ch.proof_required && <span style={styles.proofBadge}>Proof required</span>}
                      </div>
                      <div style={styles.metaRow}>
                        <span style={styles.metaItem}><Clock size={11} color="#5C5C5C" />{done ? 'Completed' : `${daysLeft(uc)} days left`}</span>
                        <span style={styles.metaItem}><Users size={11} color="#5C5C5C" />{participants.length} joined</span>
                      </div>
                    </div>
                    <div style={styles.progressBlock}>
                      <div style={styles.progressNum}>{uc.progress}<span style={{ color: '#5C5C5C', fontWeight: 500 }}>/{ch.days}</span></div>
                      <div style={styles.progressPct}>{pct}%</div>
                    </div>
                  </div>

                  <div style={styles.progressTrack}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                      style={{ ...styles.progressFill, background: done ? '#4CAF50' : '#F5A623' }}
                    />
                  </div>

                  {ch.visibility === 'private' && ch.access_code && isCreator && (
                    <div style={styles.codeShareRow}>
                      <div>
                        <p style={styles.codeShareLabel}>Share code</p>
                        <p style={styles.codeShareValue}>{ch.access_code}</p>
                      </div>
                      <button style={styles.copyBtn} onClick={() => copyCode(ch.access_code!)}>
                        <Copy size={13} color="#F5A623" />
                        Copy
                      </button>
                    </div>
                  )}

                  <Leaderboard participants={participants as any} currentUserId={user!.id} totalDays={ch.days} />
                  <ChallengeCalendar checkinDates={myCheckins} />
                  <ChallengeChat challengeId={ch.id} userId={user!.id} />

                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!done && (
                      <button
                        style={{ ...styles.checkInBtn, ...(checkedToday ? styles.checkInDone : {}) }}
                        onClick={() => !checkedToday && handleCheckIn(uc)}
                        disabled={checkedToday || checkingInId === uc.id}
                      >
                        <CheckCircle2 size={15} color={checkedToday ? '#5C5C5C' : '#0A0A0A'} />
                        {checkingInId === uc.id ? 'Saving...' : checkedToday ? 'Checked in today' : 'Check In Today'}
                      </button>
                    )}
                    {done && (
                      <div style={styles.doneBadge}>
                        <Award size={14} color="#F5A623" />
                        Challenge complete
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem' }}>
                    {isCreator ? (
                      confirmDelete === ch.id ? (
                        <div style={styles.confirmRow}>
                          <span style={styles.confirmText}>Delete this challenge for everyone?</span>
                          <button style={styles.confirmYes} onClick={() => handleDelete(ch.id)}>Delete</button>
                          <button style={styles.confirmNo} onClick={() => setConfirmDelete(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button style={styles.deleteLink} onClick={() => setConfirmDelete(ch.id)}>
                          <Trash2 size={12} color="#E53E3E" />
                          Delete challenge
                        </button>
                      )
                    ) : confirmLeave === uc.id ? (
                      <div style={styles.confirmRow}>
                        <span style={styles.confirmText}>Leave? Uses 1 of {leavesLeft} leaves.</span>
                        <button style={styles.confirmYes} onClick={() => handleLeave(uc)}>Leave</button>
                        <button style={styles.confirmNo} onClick={() => setConfirmLeave(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button style={styles.leaveLink} onClick={() => setConfirmLeave(uc.id)} disabled={leavesLeft <= 0}>
                        Leave challenge {leavesLeft > 0 ? `(${leavesLeft} left)` : '(no leaves)'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      <div style={styles.sectionLabel}>Discover</div>
      {discoverFiltered.length === 0 ? (
        <div style={styles.empty}>
          <Trophy size={26} color="#2A2A2A" />
          <p style={{ color: '#5C5C5C', fontSize: '0.88rem', marginTop: '0.6rem' }}>
            No public challenges right now. Create the first one.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {discoverFiltered.map(c => (
            <motion.div key={c.id} whileHover={{ y: -2 }} style={styles.discoverCard}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#F0EDE8' }}>{c.name}</span>
                  <span style={styles.categoryBadge}>{c.category}</span>
                  {c.proof_required && <span style={styles.proofBadge}>Proof</span>}
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaItem}><Clock size={11} color="#5C5C5C" />{c.days} days</span>
                  <span style={styles.metaItem}><Users size={11} color="#5C5C5C" />{allParticipants.filter(p => p.challenge_id === c.id).length} joined</span>
                  {c.profiles?.name && <span style={styles.metaItem}>by {c.profiles.name}</span>}
                  <span style={styles.metaItem}><Calendar size={11} color="#5C5C5C" />Ends {c.end_date.split('T')[0]}</span>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={styles.joinBtn} onClick={() => handleJoin(c.id)} disabled={joiningId === c.id}>
                {joiningId === c.id ? '...' : 'Join'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      {showCreate && user && (
        <CreateChallengeModal userId={user.id} onClose={() => setShowCreate(false)} onCreated={handleCreate} />
      )}
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' },
  eyebrow: { display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#5C5C5C', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem', fontWeight: 600 },
  eyebrowDot: { width: '5px', height: '5px', borderRadius: '50%', background: '#F5A623', boxShadow: '0 0 6px rgba(245,166,35,0.7)' },
  title: { fontSize: '1.75rem', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#F0EDE8', lineHeight: 1.1 },
  subtitle: { color: '#8A8A8A', marginTop: '0.3rem', fontSize: '0.88rem' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '11px', padding: '0.65rem 1rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 6px 18px -6px rgba(245,166,35,0.55)' },
  ghostBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#111', color: '#8A8A8A', border: '1px solid #1E1E1E', borderRadius: '11px', padding: '0.65rem 1rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem' },
  codeBox: { display: 'flex', alignItems: 'flex-end', gap: '0.5rem', background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: '14px', padding: '0.9rem' },
  codeLabel: { color: '#5C5C5C', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem', fontWeight: 600 },
  codeInput: { width: '100%', background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '0.7rem 0.9rem', color: '#F0EDE8', fontSize: '0.95rem', outline: 'none', letterSpacing: '0.2em', fontFamily: 'Space Grotesk', fontWeight: 600 },
  codeError: { color: '#E53E3E', fontSize: '0.75rem', marginTop: '0.35rem' },
  codeJoinBtn: { background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '10px', padding: '0.7rem 1.1rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' },
  codeCloseBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.6rem' },
  sectionLabel: { color: '#8A8A8A', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.75rem' },
  card: { background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: '16px', padding: '1.15rem', boxShadow: '0 4px 18px -12px rgba(0,0,0,0.7)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.6rem' },
  challengeName: { fontWeight: 600, fontSize: '0.95rem', color: '#F0EDE8' },
  categoryBadge: { background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', color: '#F5A623', fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px', textTransform: 'capitalize' },
  privateBadge: { background: 'rgba(255,255,255,0.04)', border: '1px solid #1E1E1E', color: '#8A8A8A', fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' },
  proofBadge: { background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.25)', color: '#4CAF50', fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px' },
  metaRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', rowGap: '0.25rem' },
  metaItem: { color: '#8A8A8A', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' },
  progressBlock: { textAlign: 'right', flexShrink: 0 },
  progressNum: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem', color: '#F5A623' },
  progressPct: { color: '#5C5C5C', fontSize: '0.7rem', marginTop: '0.1rem' },
  progressTrack: { height: '5px', background: '#1A1A1A', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.5rem' },
  progressFill: { height: '100%', borderRadius: '999px' },
  codeShareRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '10px', padding: '0.6rem 0.85rem', marginTop: '0.6rem' },
  codeShareLabel: { color: '#8A8A8A', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 },
  codeShareValue: { color: '#F5A623', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.15em', marginTop: '0.15rem' },
  copyBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.28)', color: '#F5A623', borderRadius: '8px', padding: '0.4rem 0.7rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },
  checkInBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '10px', padding: '0.75rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 6px 18px -6px rgba(245,166,35,0.55)' },
  checkInDone: { background: '#161616', color: '#5C5C5C', border: '1px solid #1E1E1E', boxShadow: 'none', cursor: 'default' },
  doneBadge: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.28)', borderRadius: '10px', padding: '0.75rem', color: '#F5A623', fontSize: '0.85rem', fontWeight: 600 },
  confirmRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', width: '100%' },
  confirmText: { color: '#E53E3E', fontSize: '0.75rem', flex: 1 },
  confirmYes: { background: '#E53E3E', color: '#fff', border: 'none', borderRadius: '7px', padding: '0.4rem 0.7rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },
  confirmNo: { background: 'none', border: '1px solid #1E1E1E', borderRadius: '7px', padding: '0.4rem 0.7rem', color: '#8A8A8A', fontSize: '0.75rem', cursor: 'pointer' },
  deleteLink: { display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', color: '#E53E3E', fontSize: '0.75rem', padding: 0 },
  leaveLink: { background: 'none', border: 'none', cursor: 'pointer', color: '#5C5C5C', fontSize: '0.75rem', padding: 0 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1rem', background: '#0F0F0F', border: '1px dashed #1A1A1A', borderRadius: '16px' },
  discoverCard: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: '14px', padding: '0.95rem 1.1rem' },
  joinBtn: { background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.28)', color: '#F5A623', borderRadius: '9px', padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', flexShrink: 0 },
}
