import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trophy, Crown, Medal, Loader, TrendingUp } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../lib/AuthContext'
import { getScoreLabel } from '../lib/creatorScore'

const API = 'https://streak-backend-ar7h.onrender.com'

const COLORS = {
  bg: '#0A0A0A',
  surface: '#111111',
  surfaceRaised: 'linear-gradient(180deg, #141414 0%, #0D0D0D 100%)',
  border: '#1E1E1E',
  gold: '#F5A623',
  goldSoft: 'rgba(245,166,35,0.12)',
  goldBorder: 'rgba(245,166,35,0.28)',
  text: '#F0EDE8',
  textDim: '#8A8A8A',
  textFaint: '#5C5C5C',
  green: '#4CAF50',
  purple: '#9C27B0',
}

const AVATAR_GRADIENTS = [
  ['#F5A623', '#D9821A'],
  ['#6FA8F5', '#3D7DD9'],
  ['#F56F91', '#D93D63'],
  ['#6FCB73', '#3DA843'],
  ['#B98CF5', '#8A4DD9'],
]

function getInitials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase() || '?'
}
function getAvatarGradient(name?: string) {
  const key = name || '?'
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash)
  const [a, b] = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}
function renderAvatar(url: string | null, name: string, size: number) {
  const common: React.CSSProperties = {
    width: `${size}px`, height: `${size}px`,
    borderRadius: `${Math.round(size * 0.32)}px`,
    flexShrink: 0, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: getAvatarGradient(name),
    color: '#0A0A0A', fontWeight: 700,
    fontSize: `${Math.round(size * 0.36)}px`,
    fontFamily: 'Space Grotesk', letterSpacing: '-0.01em',
    boxShadow: '0 4px 14px -4px rgba(0,0,0,0.5)'
  }
  if (url) return (
    <div style={{ ...common, background: 'transparent' }}>
      <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )
  return <div style={common}>{getInitials(name)}</div>
}

type Entry = {
  id: string; name: string; email: string; avatar_url: string | null;
  score: number; lifetime_score: number; rank: number;
}

export default function Leaderboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [entries, setEntries] = useState<Entry[]>([])
  const [you, setYou] = useState<Entry | null>(null)
  const [window, setWindow] = useState<'weekly' | 'all-time'>('weekly')
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState<string | null>(null)

  const load = async (win: 'weekly' | 'all-time') => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ window: win })
      if (user?.email) q.set('email', user.email)
      const res = await fetch(`${API}/api/leaderboard?${q.toString()}`)
      const data = await res.json()
      setEntries(data.entries || [])
      setYou(data.you || null)
      setWeekStart(data.weekStart || null)
    } catch (e) {
      console.error('Leaderboard load failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(window) }, [window, user?.email])

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  const weekLabel = weekStart
    ? `Week of ${new Date(weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : ''

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ paddingBottom: '120px', maxWidth: '720px', margin: '0 auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => navigate(-1)} style={styles.backBtn} aria-label="Back">
              <ArrowLeft size={18} color={COLORS.text} />
            </button>
            <div>
              <p style={styles.eyebrow}>Compete</p>
              <h1 style={styles.title}>Leaderboard</h1>
            </div>
          </div>
          <div style={styles.iconChip}>
            <Trophy size={18} color={COLORS.gold} />
          </div>
        </div>

        {/* Window toggle */}
        <div style={styles.segment}>
          <button
            onClick={() => setWindow('weekly')}
            style={{ ...styles.segmentBtn, ...(window === 'weekly' ? styles.segmentActive : {}) }}
          >
            Weekly
          </button>
          <button
            onClick={() => setWindow('all-time')}
            style={{ ...styles.segmentBtn, ...(window === 'all-time' ? styles.segmentActive : {}) }}
          >
            All-time
          </button>
        </div>
        {window === 'weekly' && weekLabel && (
          <p style={styles.weekLabel}>{weekLabel}</p>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader size={24} color={COLORS.textFaint} className="animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div style={styles.empty}>
            <Trophy size={32} color={COLORS.textFaint} />
            <p style={{ color: COLORS.textDim, marginTop: '0.6rem', textAlign: 'center' }}>
              {window === 'weekly'
                ? 'No scores this week yet. Check in to start climbing.'
                : 'No scores yet. Be the first!'}
            </p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length > 0 && (
              <div style={styles.podium}>
                {/* 2nd */}
                {top3[1] && (
                  <PodiumItem entry={top3[1]} place={2} isYou={you?.id === top3[1].id} />
                )}
                {/* 1st */}
                {top3[0] && (
                  <PodiumItem entry={top3[0]} place={1} isYou={you?.id === top3[0].id} />
                )}
                {/* 3rd */}
                {top3[2] && (
                  <PodiumItem entry={top3[2]} place={3} isYou={you?.id === top3[2].id} />
                )}
              </div>
            )}

            {/* Rest of list */}
            {rest.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
                {rest.map(e => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      ...styles.row,
                      ...(you?.id === e.id ? styles.rowYou : {})
                    }}
                  >
                    <span style={styles.rowRank}>#{e.rank}</span>
                    {renderAvatar(e.avatar_url, e.name, 38)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.rowName}>
                        {e.name}{you?.id === e.id && <span style={styles.youChip}>You</span>}
                      </div>
                      <div style={styles.rowSub}>{getScoreLabel(e.score).label}</div>
                    </div>
                    <span style={styles.rowScore}>{e.score.toLocaleString()}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Your rank card — if outside top 20 */}
            {you && you.rank > 20 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.youCard}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <span style={{ ...styles.rowRank, color: COLORS.gold }}>#{you.rank}</span>
                  {renderAvatar(you.avatar_url, you.name, 38)}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={styles.rowName}>
                      {you.name}<span style={styles.youChip}>You</span>
                    </div>
                    <div style={styles.rowSub}>{getScoreLabel(you.score).label}</div>
                  </div>
                </div>
                <span style={{ ...styles.rowScore, color: COLORS.gold }}>{you.score.toLocaleString()}</span>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </Layout>
  )
}

function PodiumItem({ entry, place, isYou }: { entry: Entry; place: 1 | 2 | 3; isYou: boolean }) {
  const heights: Record<number, number> = { 1: 100, 2: 76, 3: 60 }
  const colors: Record<number, string> = { 1: '#F5A623', 2: '#B0B0B0', 3: '#CD7F32' }
  const icons: Record<number, any> = { 1: Crown, 2: Medal, 3: Medal }

  const Icon = icons[place]
  const color = colors[place]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: place === 1 ? 0 : place === 2 ? 0.1 : 0.2 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}
    >
      <div style={{ position: 'relative', marginBottom: '0.4rem' }}>
        {renderAvatar(entry.avatar_url, entry.name, place === 1 ? 56 : 44)}
        <div style={{
          position: 'absolute', bottom: -6, right: -6,
          width: 22, height: 22, borderRadius: '50%',
          background: color, color: '#0A0A0A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.7rem', fontWeight: 800, fontFamily: 'Space Grotesk',
          border: '2px solid #0A0A0A'
        }}>
          {place}
        </div>
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.text, maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.name?.split(' ')[0]}{isYou ? ' (you)' : ''}
      </span>
      <span style={{ fontSize: '0.72rem', color: color, fontWeight: 700, marginTop: '0.15rem' }}>
        {entry.score.toLocaleString()}
      </span>
      <div style={{
        width: '100%', height: `${heights[place]}px`, marginTop: '0.4rem',
        background: `linear-gradient(180deg, ${color}22 0%, ${color}06 100%)`,
        border: `1px solid ${color}44`,
        borderBottom: 'none',
        borderRadius: '10px 10px 0 0',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '0.6rem'
      }}>
        <Icon size={place === 1 ? 22 : 18} color={color} strokeWidth={2} />
      </div>
    </motion.div>
  )
}

const styles: Record<string, any> = {
  backBtn: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: '#111', border: '1px solid #1E1E1E',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0, flexShrink: 0
  },
  eyebrow: {
    color: '#555', fontSize: '0.7rem', textTransform: 'uppercase',
    letterSpacing: '0.15em', marginBottom: '0.15rem', fontWeight: 600
  },
  title: {
    fontFamily: 'Space Grotesk', fontWeight: 700,
    fontSize: '1.6rem', color: COLORS.text, lineHeight: 1.05, margin: 0, letterSpacing: '-0.025em'
  },
  iconChip: {
    width: '42px', height: '42px', borderRadius: '12px',
    background: COLORS.goldSoft, border: `1px solid ${COLORS.goldBorder}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  segment: {
    display: 'flex', gap: '0.35rem', marginBottom: '0.5rem',
    background: 'rgba(0,0,0,0.3)', padding: '0.25rem',
    borderRadius: '11px', width: 'fit-content'
  },
  segmentBtn: {
    background: 'transparent', border: 'none',
    color: COLORS.textDim, fontSize: '0.78rem',
    fontWeight: 600, padding: '0.5rem 1rem',
    borderRadius: '9px', cursor: 'pointer', fontFamily: 'inherit'
  },
  segmentActive: {
    background: COLORS.goldSoft, color: COLORS.gold
  },
  weekLabel: {
    color: COLORS.textFaint, fontSize: '0.72rem',
    margin: '0 0 1.5rem 0.35rem'
  },
  podium: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    gap: '0.5rem', padding: '1rem 0 0', marginBottom: '0.5rem'
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    background: '#111', border: '1px solid #1E1E1E',
    borderRadius: '14px', padding: '0.7rem 0.9rem'
  },
  rowYou: {
    borderColor: COLORS.goldBorder,
    background: 'rgba(245,166,35,0.05)'
  },
  rowRank: {
    fontFamily: 'Space Grotesk', fontWeight: 700,
    fontSize: '0.82rem', color: COLORS.textFaint,
    width: '32px', flexShrink: 0
  },
  rowName: {
    color: COLORS.text, fontSize: '0.88rem', fontWeight: 600,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    display: 'flex', alignItems: 'center', gap: '0.4rem'
  },
  rowSub: {
    color: COLORS.textFaint, fontSize: '0.7rem', marginTop: '0.1rem'
  },
  rowScore: {
    fontFamily: 'Space Grotesk', fontWeight: 700,
    fontSize: '0.92rem', color: COLORS.text, flexShrink: 0
  },
  youChip: {
    fontSize: '0.6rem', fontWeight: 700,
    background: COLORS.goldSoft, color: COLORS.gold,
    borderRadius: '10px', padding: '1px 6px',
    textTransform: 'uppercase', letterSpacing: '0.05em'
  },
  youCard: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    background: 'linear-gradient(180deg, #1A1400 0%, #131313 100%)',
    border: `1px solid ${COLORS.goldBorder}`,
    borderRadius: '14px', padding: '0.75rem 0.9rem',
    marginTop: '1rem', position: 'sticky', bottom: '90px',
    boxShadow: '0 -6px 20px -10px rgba(245,166,35,0.3)'
  },
  empty: {
    background: '#111', border: '1px dashed #1E1E1E',
    borderRadius: '18px', padding: '3rem 1.5rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
  }
}
