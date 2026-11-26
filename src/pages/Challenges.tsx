import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Plus, X, KeyRound, Lock, Users, Clock, Loader, Sparkles,
  ArrowRight, Shield, Hash, Zap, CalendarDays, Share2,
} from 'lucide-react'
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
    if (error || !challenge) { setLockedError(e => ({ ...e, [challengeId]: error || 'Wrong code' })); return }
    if (challenge.id !== challengeId) { setLockedError(e => ({ ...e, [challengeId]: 'That code belongs to a different challenge' })); return }
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
            <div key={i} style={{ height: '220px', borderRadius: '24px', background: 'linear-gradient(180deg, #161616, #0A0A0A)', border: '1px solid #1E1E1E' }} />
          ))}
        </div>
      </Layout>
    )
  }

  const leavesUsed = 0
  const leavesLeft = Math.max(0, MAX_LEAVES - leavesUsed)
  const activeCount = myChallenges.length
  const discoverCount = discoverPublic.length + discoverPrivate.length

  return (
    <Layout>
      {/* Hero band */}
      <div style={styles.heroBand}>
        <div style={styles.heroGlow} />
        <div style={styles.heroContent}>
          <div style={styles.eyebrow}>
            <Zap size={11} color="#F5A623" />
            Accountability arena
          </div>
          <h1 style={styles.title}>Show up. Get seen.</h1>
          <p style={styles.subtitle}>Public commitments. Real streaks. People who notice when you don't.</p>

          <div style={styles.statRow}>
            <div style={styles.statCell}>
              <div style={styles.statValue}>{activeCount}</div>
              <div style={styles.statLabel}>Active</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statCell}>
              <div style={styles.statValue}>{discoverCount}</div>
              <div style={styles.statLabel}>Discoverable</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statCell}>
              <div style={styles.statValue}>{leavesLeft}</div>
              <div style={styles.statLabel}>Leaves left</div>
            </div>
          </div>

          <div style={styles.actionRow}>
            <motion.button whileTap={{ scale: 0.97 }} style={styles.primaryBtn} onClick={() => setShowCreate(true)}>
              <Plus size={16} color="#0A0A0A" /> Create challenge
            </motion.button>
            <button style={styles.secondaryBtn} onClick={() => setShowCodeInput(!showCodeInput)}>
              <KeyRound size={15} color="#F5A623" /> Join with code
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCodeInput && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={styles.codeBox}>
              <div style={{ flex: 1 }}>
                <p style={styles.codeLabel}>Enter code</p>
                <input
                  style={styles.codeInput}
                  placeholder="e.g. REELS30"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  maxLength={8}
                />
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
          <div style={styles.sectionRow}>
            <div style={styles.sectionLabel}>Your active challenges</div>
            <span style={styles.sectionCount}>{myChallenges.length}</span>
          </div>
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
                  onRefresh={fetchAll}
                />
              )
            })}
          </div>
        </div>
      )}

      <div style={styles.sectionRow}>
        <div style={styles.sectionLabel}>Discover</div>
        <span style={styles.sectionCount}>{discoverCount}</span>
      </div>

      {discoverCount === 0 ? (
        <div style={styles.empty}>
          <Trophy size={28} color="#2A2A2A" />
          <p style={{ color: '#6B6B6B', fontSize: '0.9rem', marginTop: '0.6rem', textAlign: 'center' }}>No challenges right now. Create the first one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {discoverPublic.map(c => (
            <motion.div key={c.id} whileHover={{ y: -2 }} style={styles.discoverCard}>
              <div style={styles.discoverGlow} />
              <div style={styles.discoverTop}>
                <div style={styles.discoverIconWrap}>
                  <Sparkles size={16} color="#F5A623" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.discoverTitleRow}>
                    <span style={styles.discoverName}>{c.name}</span>
                    <span style={styles.categoryPill}>{c.category}</span>
                    {c.proof_required && <span style={styles.proofPill}><Shield size={8} /> Proof</span>}
                  </div>
                  <div style={styles.discoverMetaRow}>
                    <span style={styles.meta}><CalendarDays size={11} color="#5C5C5C" />{c.days} days</span>
                    <span style={styles.meta}><Users size={11} color="#5C5C5C" />{allParticipants.filter(p => p.challenge_id === c.id).length} joined</span>
                    {c.profiles?.name && <span style={styles.meta}>by {c.profiles.name}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button
                  style={styles.shareIconBtn}
                  onClick={() => {
                    const url = `${window.location.origin}/challenges/${c.id}`
                    if (navigator.share) {
                      navigator.share({ title: c.name, text: `Join this challenge: ${c.name}`, url }).catch(() => {})
                    } else {
                      navigator.clipboard.writeText(url).then(() => alert('Invite link copied!')).catch(() => {})
                    }
                  }}
                  title="Share invite"
                >
                  <Share2 size={14} color="#F5A623" />
                </button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={styles.joinBtn} onClick={() => handleJoin(c.id)} disabled={joiningId === c.id}>
                  {joiningId === c.id ? <Loader size={14} className="animate-spin" color="#0A0A0A" /> : <><span>Join</span><ArrowRight size={14} color="#0A0A0A" /></>}
                </motion.button>
              </div>
            </motion.div>
          ))}

          {discoverPrivate.map(c => (
            <motion.div key={c.id} whileHover={{ y: -2 }} style={{ ...styles.discoverCard, flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={styles.discoverGlow} />
              <div style={styles.discoverTop}>
                <div style={{ ...styles.discoverIconWrap, background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A' }}>
                  <Lock size={15} color="#A0A0A0" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.discoverTitleRow}>
                    <span style={styles.discoverName}>{c.name}</span>
                    <span style={styles.categoryPill}>{c.category}</span>
                    <span style={styles.privatePill}><Lock size={8} /> Private</span>
                  </div>
                  <div style={styles.discoverMetaRow}>
                    <span style={styles.meta}><CalendarDays size={11} color="#5C5C5C" />{c.days} days</span>
                    <span style={styles.meta}><Users size={11} color="#5C5C5C" />{allParticipants.filter(p => p.challenge_id === c.id).length} joined</span>
                    {c.profiles?.name && <span style={styles.meta}>by {c.profiles.name}</span>}
                  </div>
                </div>
              </div>
              <div style={styles.lockedRow}>
                <div style={styles.lockedInputWrap}>
                  <KeyRound size={13} color="#6B6B6B" />
                  <input
                    style={styles.lockedInput}
                    placeholder="Enter access code"
                    value={lockedCode[c.id] || ''}
                    onChange={e => setLockedCode(prev => ({ ...prev, [c.id]: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) }))}
                    maxLength={8}
                  />
                </div>
                <button style={styles.lockedJoinBtn} onClick={() => handleJoinWithCode(c.id)} disabled={joiningId === c.id}>
                  {joiningId === c.id ? <Loader size={14} className="animate-spin" color="#0A0A0A" /> : 'Unlock'}
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
  heroBand: { position: 'relative', overflow: 'hidden', borderRadius: '26px', background: 'linear-gradient(160deg, #1A1408 0%, #121212 55%, #0A0A0A 100%)', border: '1px solid #2A2318', padding: '1.5rem 1.25rem', marginBottom: '1.75rem', boxShadow: '0 40px 80px -40px rgba(0,0,0,0.9)' },
  heroGlow: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(245,166,35,0.22), transparent 55%), radial-gradient(circle at bottom left, rgba(111,168,245,0.1), transparent 50%)', pointerEvents: 'none' },
  heroContent: { position: 'relative' },
  eyebrow: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#F5A623', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem', fontWeight: 700 },
  title: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.9rem', color: '#F5F1EA', lineHeight: 1.05, letterSpacing: '-0.03em', margin: 0 },
  subtitle: { color: '#8A8A8A', marginTop: '0.45rem', fontSize: '0.85rem', maxWidth: '340px', lineHeight: 1.4 },
  statRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.15rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '0.7rem 0.5rem' },
  statCell: { flex: 1, textAlign: 'center' },
  statValue: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.2rem', color: '#F5F1EA', lineHeight: 1 },
  statLabel: { fontSize: '0.62rem', color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: '0.25rem', fontWeight: 600 },
  statDivider: { width: '1px', height: '26px', background: 'rgba(255,255,255,0.08)' },
  actionRow: { display: 'flex', gap: '0.5rem', marginTop: '1.1rem', flexWrap: 'wrap' },
  primaryBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'linear-gradient(135deg, #F5A623, #E1921D)', color: '#0A0A0A', border: 'none', borderRadius: '12px', padding: '0.8rem 1.15rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.86rem', boxShadow: '0 12px 28px -12px rgba(245,166,35,0.7)' },
  secondaryBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(255,255,255,0.04)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '12px', padding: '0.8rem 1.15rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.86rem' },
  codeBox: { display: 'flex', alignItems: 'flex-end', gap: '0.5rem', background: 'linear-gradient(180deg, #161616, #0A0A0A)', border: '1px solid #262626', borderRadius: '16px', padding: '0.9rem' },
  codeLabel: { color: '#6B6B6B', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.35rem', fontWeight: 700 },
  codeInput: { width: '100%', background: '#0A0A0A', border: '1px solid #262626', borderRadius: '10px', padding: '0.7rem 0.9rem', color: '#F5F1EA', fontSize: '0.95rem', outline: 'none', letterSpacing: '0.22em', fontFamily: 'Space Grotesk', fontWeight: 700 },
  codeError: { color: '#E53E3E', fontSize: '0.75rem', marginTop: '0.35rem' },
  codeJoinBtn: { background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '10px', padding: '0.7rem 1.1rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' },
  codeCloseBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.6rem' },
  sectionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' },
  sectionLabel: { color: '#A0A0A0', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 },
  sectionCount: { background: 'rgba(255,255,255,0.05)', border: '1px solid #262626', color: '#7A7A7A', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '20px' },
  discoverCard: { position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'linear-gradient(180deg, #161616, #0A0A0A)', border: '1px solid #262626', borderRadius: '18px', padding: '0.95rem 1rem' },
  discoverGlow: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(245,166,35,0.08), transparent 50%)', pointerEvents: 'none' },
  discoverTop: { position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 },
  discoverIconWrap: { width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  discoverTitleRow: { display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.3rem' },
  discoverName: { fontWeight: 700, fontSize: '0.95rem', color: '#F5F1EA', letterSpacing: '-0.01em' },
  discoverMetaRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', rowGap: '0.25rem' },
  categoryPill: { background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.22)', color: '#F5A623', fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '20px', textTransform: 'capitalize' },
  privatePill: { display: 'inline-flex', alignItems: 'center', gap: '0.22rem', background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A', color: '#A0A0A0', fontSize: '0.62rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px' },
  proofPill: { display: 'inline-flex', alignItems: 'center', gap: '0.22rem', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.28)', color: '#4CAF50', fontSize: '0.62rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px' },
  meta: { color: '#7A7A7A', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' },
  shareIconBtn: { background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.28)', width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  joinBtn: { position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'linear-gradient(135deg, #F5A623, #E1921D)', color: '#0A0A0A', border: 'none', borderRadius: '10px', padding: '0.6rem 0.9rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, boxShadow: '0 8px 20px -10px rgba(245,166,35,0.7)' },
  lockedRow: { position: 'relative', display: 'flex', gap: '0.5rem', marginTop: '0.75rem' },
  lockedInputWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#0A0A0A', border: '1px solid #262626', borderRadius: '10px', padding: '0 0.75rem' },
  lockedInput: { flex: 1, background: 'transparent', border: 'none', padding: '0.6rem 0', color: '#F5F1EA', fontSize: '0.82rem', outline: 'none', letterSpacing: '0.18em', fontFamily: 'Space Grotesk', fontWeight: 700 },
  lockedJoinBtn: { background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lockedError: { position: 'relative', color: '#E53E3E', fontSize: '0.72rem', margin: '0.5rem 0 0' },
  empty: { background: 'linear-gradient(180deg, #161616, #0A0A0A)', border: '1px dashed #2A2A2A', borderRadius: '18px', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
}
