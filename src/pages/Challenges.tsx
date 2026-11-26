import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Plus, X, KeyRound, Lock, Users, Clock, Loader } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../lib/AuthContext'
import {
  listChallenges, listPrivateChallenges, listMyChallenges, listAllParticipants,
  joinChallenge, joinByCode, leaveChallenge, deleteChallenge, checkIn,
  type Challenge, type UserChallenge,
} from '../lib/challenges'
import CreateChallengeModal from '../components/challenges/CreateChallengeModal'
import ChallengeCard from '../components/challenges/ChallengeCard'

const MAX_LEAVES = 5

export default function Challenges() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [myChallenges, setMyChallenges] = useState<UserChallenge[]>([])
  const [publicChallenges, setPublicChallenges] = useState<Challenge[]>([])
  const [privateChallenges, setPrivateChallenges] = useState<Challenge[]>([])
  const [allParticipants, setAllParticipants] = useState<UserChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [lockedCode, setLockedCode] = useState<Record<string, string>>({})
  const [lockedError, setLockedError] = useState<Record<string, string>>({})
  const [checkingInId, setCheckingInId] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const fetchAll = async () => {
    if (!user) return
    const [mine, pub, priv, parts] = await Promise.all([
      listMyChallenges(user.id),
      listChallenges(),
      listPrivateChallenges(),
      listAllParticipants(),
    ])
    setMyChallenges(mine.filter(uc => !uc.challenges?.end_date || new Date(uc.challenges.end_date) >= new Date()))
    setPublicChallenges(pub.filter(c => new Date(c.end_date) >= new Date()))
    setPrivateChallenges(priv.filter(c => new Date(c.end_date) >= new Date()))
    setAllParticipants(parts)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [user])

  const myIds = new Set(myChallenges.map(uc => uc.challenge_id))
  const discoverPublic = publicChallenges.filter(c => !myIds.has(c.id))
  const discoverPrivate = privateChallenges.filter(c => !myIds.has(c.id))

  const handleCreate = async (_c: Challenge) => { setShowCreate(false); await fetchAll() }

  const handleJoin = async (challengeId: string) => {
    if (!user) return
    setJoiningId(challengeId)
    const res = await joinChallenge(user.id, challengeId)
    setJoiningId(null)
    if (!res.ok) { alert(res.error || 'Could not join'); return }
    await fetchAll()
  }

  const handleJoinWithCode = async (challengeId: string) => {
    if (!user) return
    const code = (lockedCode[challengeId] || '').trim().toUpperCase()
    if (!code) { setLockedError(e => ({ ...e, [challengeId]: 'Enter the code first' })); return }
    setLockedError(e => ({ ...e, [challengeId]: '' }))
    setJoiningId(challengeId)
    const { challenge, error } = await joinByCode(user.id, code)
    setJoiningId(null)
    if (error || !challenge) {
      setLockedError(e => ({ ...e, [challengeId]: error || 'Wrong code' }))
      return
    }
    if (challenge.id !== challengeId) {
      setLockedError(e => ({ ...e, [challengeId]: 'That code belongs to a different challenge' }))
      return
    }
    await fetchAll()
  }

  const handleGlobalCodeJoin = async () => {
    if (!user || !codeInput.trim()) return
    setCodeError('')
    const { challenge, error } = await joinByCode(user.id, codeInput.trim())
    if (error || !challenge) { setCodeError(error || 'Invalid code'); return }
    setCodeInput(''); setShowCodeInput(false)
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
    await fetchAll()
  }

  const handleDelete = async (challengeId: string) => {
    const { ok, error } = await deleteChallenge(challengeId)
    if (!ok) throw new Error(error || 'Could not delete')
    await fetchAll()
    navigate('/challenges', { replace: true })
  }

  const copyCode = (code: string) => { navigator.clipboard.writeText(code).catch(() => {}) }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '220px', borderRadius: '22px', background: 'linear-gradient(180deg, #141414, #0D0D0D)', border: '1px solid #1E1E1E' }} />
          ))}
        </div>
      </Layout>
    )
  }

  const leavesUsed = 0
  const leavesLeft = Math.max(0, MAX_LEAVES - leavesUsed)

  return (
    <Layout>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.eyebrow}><span style={styles.eyebrowDot} />Commit publicly</div>
          <h1 style={styles.title}>Challenges</h1>
          <p style={styles.subtitle}>Build momentum with people who show up.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={styles.ghostBtn} onClick={() => setShowCodeInput(!showCodeInput)}>
            <KeyRound size={15} color="#8A8A8A" /> Join with code
          </button>
          <motion.button whileTap={{ scale: 0.97 }} style={styles.addBtn} onClick={() => setShowCreate(true)}>
            <Plus size={16} color="#0A0A0A" /> Create
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showCodeInput && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={styles.codeBox}>
              <div style={{ flex: 1 }}>
                <p style={styles.codeLabel}>Enter code</p>
                <input style={styles.codeInput} placeholder="e.g. REELS30" value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} maxLength={6} />
                {codeError && <p style={styles.codeError}>{codeError}</p>}
              </div>
              <button style={styles.codeJoinBtn} onClick={handleGlobalCodeJoin}>Join</button>
              <button style={styles.codeCloseBtn} onClick={() => { setShowCodeInput(false); setCodeError(''); setCodeInput('') }}><X size={16} color="#5C5C5C" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {myChallenges.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={styles.sectionLabel}>Your active challenges</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {myChallenges.map(uc => {
              const ch = uc.challenges
              if (!ch) return null
              const participants = allParticipants.filter(p => p.challenge_id === ch.id)
              const myCheckins = participants.filter(p => p.user_id === user?.id).map(p => p.last_checked_in).filter(Boolean) as string[]
              return (
                <ChallengeCard
                  key={uc.id}
                  uc={uc}
                  userId={user!.id}
                  today={today}
                  participants={participants}
                  myCheckins={myCheckins}
                  leavesLeft={leavesLeft}
                  checkingIn={checkingInId === uc.id}
                  onCheckIn={() => handleCheckIn(uc)}
                  onDelete={() => handleDelete(ch.id)}
                  onLeave={() => handleLeave(uc)}
                  onCopyCode={copyCode}
                />
              )
            })}
          </div>
        </div>
      )}

      <div style={styles.sectionLabel}>Discover</div>
      {discoverPublic.length === 0 && discoverPrivate.length === 0 ? (
        <div style={styles.empty}>
          <Trophy size={26} color="#2A2A2A" />
          <p style={{ color: '#5C5C5C', fontSize: '0.88rem', marginTop: '0.6rem' }}>No challenges right now. Create the first one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {discoverPublic.map(c => (
            <motion.div key={c.id} whileHover={{ y: -2 }} style={styles.discoverCard}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#F0EDE8' }}>{c.name}</span>
                  <span style={styles.categoryPill}>{c.category}</span>
                  {c.proof_required && <span style={styles.proofPill}>Proof</span>}
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.meta}><Clock size={11} color="#5C5C5C" />{c.days} days</span>
                  <span style={styles.meta}><Users size={11} color="#5C5C5C" />{allParticipants.filter(p => p.challenge_id === c.id).length} joined</span>
                  {c.profiles?.name && <span style={styles.meta}>by {c.profiles.name}</span>}
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={styles.joinBtn} onClick={() => handleJoin(c.id)} disabled={joiningId === c.id}>
                {joiningId === c.id ? '...' : 'Join'}
              </motion.button>
            </motion.div>
          ))}

          {discoverPrivate.map(c => (
            <motion.div key={c.id} whileHover={{ y: -2 }} style={{ ...styles.discoverCard, flexDirection: 'column', alignItems: 'stretch', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%' }}>
                <Lock size={13} color="#8A8A8A" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#F0EDE8' }}>{c.name}</span>
                    <span style={styles.categoryPill}>{c.category}</span>
                    <span style={styles.privatePill}>Private</span>
                  </div>
                  <div style={styles.metaRow}>
                    <span style={styles.meta}><Clock size={11} color="#5C5C5C" />{c.days} days</span>
                    <span style={styles.meta}><Users size={11} color="#5C5C5C" />{allParticipants.filter(p => p.challenge_id === c.id).length} joined</span>
                    {c.profiles?.name && <span style={styles.meta}>by {c.profiles.name}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  style={styles.lockedInput}
                  placeholder="Enter access code"
                  value={lockedCode[c.id] || ''}
                  onChange={e => setLockedCode(prev => ({ ...prev, [c.id]: e.target.value.toUpperCase() }))}
                  maxLength={6}
                />
                <button style={styles.lockedJoinBtn} onClick={() => handleJoinWithCode(c.id)} disabled={joiningId === c.id}>
                  {joiningId === c.id ? <Loader size={14} className="animate-spin" color="#0A0A0A" /> : 'Join'}
                </button>
              </div>
              {lockedError[c.id] && <p style={styles.lockedError}>{lockedError[c.id]}</p>}
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
  title: { fontSize: '1.75rem', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#F5F1EA', lineHeight: 1.1 },
  subtitle: { color: '#8A8A8A', marginTop: '0.3rem', fontSize: '0.88rem' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '11px', padding: '0.65rem 1rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 6px 18px -6px rgba(245,166,35,0.55)' },
  ghostBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#111', color: '#8A8A8A', border: '1px solid #1E1E1E', borderRadius: '11px', padding: '0.65rem 1rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem' },
  codeBox: { display: 'flex', alignItems: 'flex-end', gap: '0.5rem', background: 'linear-gradient(180deg, #141414, #0D0D0D)', border: '1px solid #232323', borderRadius: '14px', padding: '0.9rem' },
  codeLabel: { color: '#5C5C5C', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem', fontWeight: 600 },
  codeInput: { width: '100%', background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '0.7rem 0.9rem', color: '#F0EDE8', fontSize: '0.95rem', outline: 'none', letterSpacing: '0.2em', fontFamily: 'Space Grotesk', fontWeight: 600 },
  codeError: { color: '#E53E3E', fontSize: '0.75rem', marginTop: '0.35rem' },
  codeJoinBtn: { background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '10px', padding: '0.7rem 1.1rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' },
  codeCloseBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.6rem' },
  sectionLabel: { color: '#8A8A8A', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.75rem' },
  discoverCard: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'linear-gradient(180deg, #141414, #0D0D0D)', border: '1px solid #232323', borderRadius: '16px', padding: '0.85rem 1rem' },
  categoryPill: { background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', color: '#F5A623', fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px', textTransform: 'capitalize' },
  privatePill: { background: 'rgba(255,255,255,0.04)', border: '1px solid #1E1E1E', color: '#8A8A8A', fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' },
  proofPill: { background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.25)', color: '#4CAF50', fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px' },
  metaRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', rowGap: '0.25rem' },
  meta: { color: '#8A8A8A', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' },
  joinBtn: { background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '9px', padding: '0.55rem 1rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 },
  lockedInput: { flex: 1, background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '9px', padding: '0.55rem 0.8rem', color: '#F0EDE8', fontSize: '0.8rem', outline: 'none', letterSpacing: '0.15em', fontFamily: 'Space Grotesk', fontWeight: 600 },
  lockedJoinBtn: { background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '9px', padding: '0.55rem 1rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', minWidth: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lockedError: { color: '#E53E3E', fontSize: '0.72rem', margin: 0 },
  empty: { background: 'linear-gradient(180deg, #141414, #0D0D0D)', border: '1px dashed #2A2A2A', borderRadius: '18px', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
}
