import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Lock, Users, CalendarDays, Shield, Loader,
  KeyRound, ArrowRight, Trophy, Crown,
} from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { joinChallenge, joinByCode, type Challenge } from '../lib/challenges'

export default function ChallengeInvite() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    (async () => {
      if (!id) { setNotFound(true); setLoading(false); return }
      const { data: ch, error: chErr } = await supabase
        .from('challenges')
        .select('*, profiles(name)')
        .eq('id', id)
        .maybeSingle()
      if (chErr || !ch) { setNotFound(true); setLoading(false); return }
      setChallenge(ch)

      const { count } = await supabase
        .from('user_challenges')
        .select('id', { count: 'exact', head: true })
        .eq('challenge_id', id)
        .is('left_at', null)
      setParticipantCount(count || 0)

      if (user) {
        const { data: mine } = await supabase
          .from('user_challenges')
          .select('id')
          .eq('challenge_id', id)
          .eq('user_id', user.id)
          .is('left_at', null)
          .maybeSingle()
        setAlreadyJoined(!!mine)
      }
      setLoading(false)
    })()
  }, [id, user])

  const handleJoin = async () => {
    if (!user || !challenge) return
    setError('')
    setJoining(true)
    if (challenge.visibility === 'private') {
      const c = code.trim().toUpperCase()
      if (!c) { setError('Enter the access code'); setJoining(false); return }
      const res = await joinByCode(user.id, c)
      if (res.error || !res.challenge) {
        setError(res.error || 'Wrong code')
        setJoining(false)
        return
      }
      if (res.challenge.id !== challenge.id) {
        setError('That code belongs to a different challenge')
        setJoining(false)
        return
      }
    } else {
      const res = await joinChallenge(user.id, challenge.id)
      if (!res.ok) { setError(res.error || 'Could not join'); setJoining(false); return }
    }
    setJoining(false)
    navigate('/challenges', { replace: true })
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader size={24} color="#5C5C5C" className="animate-spin" />
        </div>
      </Layout>
    )
  }

  if (notFound || !challenge) {
    return (
      <Layout>
        <div style={styles.empty}>
          <Trophy size={30} color="#2A2A2A" />
          <p style={{ color: '#8A8A8A', marginTop: '0.75rem' }}>This challenge doesn't exist or was deleted.</p>
          <button style={styles.backHome} onClick={() => navigate('/challenges')}>Back to Challenges</button>
        </div>
      </Layout>
    )
  }

  const isCreator = user && challenge.created_by === user.id

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '120px' }}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <ArrowLeft size={18} color="#F0EDE8" />
        </button>

        <div style={styles.hero}>
          <div style={styles.heroGlow} />
          <div style={{ position: 'relative' }}>
            <div style={styles.badgeRow}>
              <span style={styles.categoryPill}>{challenge.category}</span>
              {challenge.visibility === 'private' && <span style={styles.privatePill}><Lock size={9} /> Private</span>}
              {challenge.proof_required && <span style={styles.proofPill}><Shield size={9} /> Proof required</span>}
              {isCreator && <span style={styles.ownerPill}><Crown size={9} /> You created this</span>}
            </div>
            <h1 style={styles.title}>{challenge.name}</h1>
            <div style={styles.metaRow}>
              <span style={styles.meta}><CalendarDays size={12} color="#6B6B6B" />{challenge.days} days</span>
              <span style={styles.meta}><Users size={12} color="#6B6B6B" />{participantCount} joined</span>
              {challenge.profiles?.name && <span style={styles.meta}>by {challenge.profiles.name}</span>}
            </div>
          </div>
        </div>

        {alreadyJoined ? (
          <div style={styles.alreadyBox}>
            <p style={{ color: '#4CAF50', fontSize: '0.88rem', fontWeight: 600 }}>You're already in this challenge.</p>
            <button style={styles.primaryBtn} onClick={() => navigate('/challenges')}>Open my challenges</button>
          </div>
        ) : !user ? (
          <div style={styles.alreadyBox}>
            <p style={{ color: '#8A8A8A', fontSize: '0.88rem' }}>Sign in to join this challenge.</p>
            <button style={styles.primaryBtn} onClick={() => navigate('/login')}>Sign in</button>
          </div>
        ) : (
          <>
            {challenge.visibility === 'private' && (
              <div style={styles.codeSection}>
                <label style={styles.label}><KeyRound size={12} color="#F5A623" /> Access code</label>
                <input
                  style={styles.codeInput}
                  placeholder="Enter the code the creator shared"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  maxLength={8}
                />
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}

            <button style={styles.joinBtn} onClick={handleJoin} disabled={joining}>
              {joining ? <Loader size={16} className="animate-spin" color="#0A0A0A" /> : <><span>Join challenge</span><ArrowRight size={16} color="#0A0A0A" /></>}
            </button>
          </>
        )}
      </motion.div>
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backBtn: { width: '36px', height: '36px', borderRadius: '10px', background: '#111', border: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '1rem' },
  hero: { position: 'relative', overflow: 'hidden', borderRadius: '24px', background: 'linear-gradient(160deg, #1A1408 0%, #121212 55%, #0A0A0A 100%)', border: '1px solid #2A2318', padding: '1.5rem 1.25rem', marginBottom: '1.25rem', boxShadow: '0 40px 80px -40px rgba(0,0,0,0.9)' },
  heroGlow: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(245,166,35,0.22), transparent 55%)', pointerEvents: 'none' },
  badgeRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' },
  categoryPill: { background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', color: '#F5A623', fontSize: '0.62rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '20px', textTransform: 'capitalize' },
  privatePill: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A', color: '#A0A0A0', fontSize: '0.62rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '20px' },
  proofPill: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', color: '#4CAF50', fontSize: '0.62rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '20px' },
  ownerPill: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'linear-gradient(135deg, #F5A623, #D9821A)', color: '#0A0A0A', fontSize: '0.6rem', fontWeight: 800, padding: '0.22rem 0.6rem', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  title: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.6rem', color: '#F5F1EA', lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 },
  metaRow: { display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap', marginTop: '0.6rem' },
  meta: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#8A8A8A', fontSize: '0.75rem' },
  alreadyBox: { background: 'linear-gradient(180deg, #161616, #0A0A0A)', border: '1px solid #262626', borderRadius: '18px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  codeSection: { background: 'linear-gradient(180deg, #161616, #0A0A0A)', border: '1px solid #262626', borderRadius: '16px', padding: '1rem', marginBottom: '0.75rem' },
  label: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#8A8A8A', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: '0.5rem' },
  codeInput: { width: '100%', background: '#0A0A0A', border: '1px solid #262626', borderRadius: '10px', padding: '0.75rem 0.9rem', color: '#F5F1EA', fontSize: '1rem', outline: 'none', letterSpacing: '0.22em', fontFamily: 'Space Grotesk', fontWeight: 700, boxSizing: 'border-box' },
  error: { background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', color: '#E53E3E', fontSize: '0.8rem', padding: '0.7rem 0.9rem', borderRadius: '10px', marginBottom: '0.75rem' },
  joinBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #F5A623, #E1921D)', color: '#0A0A0A', border: 'none', borderRadius: '13px', padding: '0.95rem', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 12px 28px -12px rgba(245,166,35,0.7)' },
  primaryBtn: { background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '11px', padding: '0.75rem 1.1rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' },
  backHome: { marginTop: '1rem', background: 'transparent', border: '1px solid #262626', color: '#8A8A8A', borderRadius: '10px', padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.82rem' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 1.5rem', textAlign: 'center' },
}
