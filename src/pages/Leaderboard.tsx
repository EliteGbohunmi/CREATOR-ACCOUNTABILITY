import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toPng } from 'html-to-image'
import {
  ArrowLeft, Trophy, Crown, Medal, Loader, Share2, RefreshCw,
  TrendingUp, Flame, Zap, Download, Target
} from 'lucide-react'
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
  blue: '#6FA8F5',
  purple: '#B98CF5',
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
      <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
    </div>
  )
  return <div style={common}>{getInitials(name)}</div>
}

type Entry = {
  id: string; name: string; email: string; avatar_url: string | null;
  score: number; lifetime_score: number; rank: number;
  current_streak: number; best_streak: number; gap_to_next: number | null;
}

export default function Leaderboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [entries, setEntries] = useState<Entry[]>([])
  const [you, setYou] = useState<Entry | null>(null)
  const [win, setWin] = useState<'weekly' | 'all-time'>('weekly')
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [sharing, setSharing] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  const load = async (w: 'weekly' | 'all-time', isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const q = new URLSearchParams({ window: w })
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
      setRefreshing(false)
    }
  }

  useEffect(() => { load(win) }, [win, user?.email])

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3, 10)
  const isTopOne = you?.rank === 1 || (you?.id && entries[0]?.id === you.id)

  const weekLabel = weekStart
    ? `Week of ${new Date(weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : ''

  const handleShare = async () => {
    if (!shareRef.current) return
    setSharing(true)
    try {
      const dataUrl = await toPng(shareRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: COLORS.bg,
      })

      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob()
          const file = new File([blob], 'leaderboard.png', { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: "I'm #1 on the Creator Accountability leaderboard!",
              text: 'Top of the creator leaderboard this week 🏆',
            })
            setSharing(false)
            return
          }
        } catch { /* fall through */ }
      }

      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `leaderboard-${win}-${Date.now()}.png`
      a.click()
    } catch (e) {
      console.error('Share failed:', e)
      alert('Could not create share image. Try again.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ paddingBottom: '140px', maxWidth: '720px', margin: '0 auto' }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => navigate(-1)} style={styles.backBtn} aria-label="Back">
              <ArrowLeft size={18} color={COLORS.text} />
            </button>
            <div>
              <p style={styles.eyebrow}>The Arena</p>
              <h1 style={styles.title}>Leaderboard</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => load(win, true)}
              disabled={refreshing}
              style={styles.iconBtn}
              aria-label="Refresh"
            >
              <RefreshCw
                size={16}
                color={refreshing ? COLORS.textFaint : COLORS.text}
                className={refreshing ? 'animate-spin' : ''}
              />
            </button>
            <div style={styles.iconChip}>
              <Trophy size={18} color={COLORS.gold} />
            </div>
          </div>
        </div>

        {/* SEGMENT */}
        <div style={styles.segment}>
          <button
            onClick={() => setWin('weekly')}
            style={{ ...styles.segmentBtn, ...(win === 'weekly' ? styles.segmentActive : {}) }}
          >
            This week
          </button>
          <button
            onClick={() => setWin('all-time')}
            style={{ ...styles.segmentBtn, ...(win === 'all-time' ? styles.segmentActive : {}) }}
          >
            All-time
          </button>
        </div>
        {win === 'weekly' && weekLabel && (
          <p style={styles.weekLabel}>{weekLabel}</p>
        )}

        {loading ? (
          <SkeletonList />
        ) : entries.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIconRing}>
              <Trophy size={28} color={COLORS.textFaint} />
            </div>
            <p style={styles.emptyTitle}>No one's on the board yet</p>
            <p style={styles.emptySub}>
              {win === 'weekly'
                ? 'Be the first to score this week. Check in today to claim the top spot.'
                : 'Check in, earn points, and start climbing.'}
            </p>
          </div>
        ) : (
          <>
            {/* STATS */}
            <StatsStrip total={entries.length} youRank={you?.rank ?? null} topScore={entries[0]?.score ?? 0} />

            {/* SHARE CTA — visible when #1 */}
            <AnimatePresence>
              {isTopOne && (
                <motion.button
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onClick={handleShare}
                  disabled={sharing}
                  style={styles.shareBtn}
                >
                  {sharing ? (
                    <><Loader size={16} className="animate-spin" /> Preparing your card…</>
                  ) : (
                    <><Share2 size={16} /> Share my #1 spot</>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {/* ============ SHARE CARD ============ */}
            <div ref={shareRef} style={styles.shareCapture}>
              {/* Top gradient band */}
              <div style={styles.captureTopBand}>
                <div style={styles.captureBrandRow}>
                  <Trophy size={11} color={COLORS.gold} />
                  <div style={styles.captureBrand}>CREATOR ACCOUNTABILITY</div>
                </div>
                <div style={styles.captureTitle}>
                  {win === 'weekly' ? 'WEEKLY LEADERBOARD' : 'ALL-TIME LEADERBOARD'}
                </div>
                {win === 'weekly' && weekLabel && (
                  <div style={styles.captureSub}>{weekLabel.toUpperCase()}</div>
                )}
                <div style={styles.captureTopStats}>
                  <span style={styles.captureTopStat}>{entries.length} creators</span>
                  <span style={styles.captureTopDot}>·</span>
                  <span style={styles.captureTopStat}>Top {entries[0]?.score.toLocaleString()} pts</span>
                </div>
              </div>

              {/* Diagonal gold accent */}
              <div style={styles.accentStripe} />

              {/* Podium */}
              {top3.length > 0 && (
                <div style={styles.podium}>
                  {top3[1] && <PodiumItem entry={top3[1]} place={2} isYou={you?.id === top3[1].id} />}
                  {top3[0] && <PodiumItem entry={top3[0]} place={1} isYou={you?.id === top3[0].id} />}
                  {top3[2] && <PodiumItem entry={top3[2]} place={3} isYou={you?.id === top3[2].id} />}
                </div>
              )}

              {/* List 4–10 */}
              {rest.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '1rem' }}>
                  {rest.map((e, i) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.02 }}
                      style={{ ...styles.row, ...(you?.id === e.id ? styles.rowYou : {}) }}
                    >
                      <span style={styles.rowRank}>#{e.rank}</span>
                      {renderAvatar(e.avatar_url, e.name, 36)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.rowName}>
                          {e.name}
                          {you?.id === e.id && <span style={styles.youChip}>You</span>}
                        </div>
                        <div style={styles.rowSub}>
                          <span style={styles.rowStreak}>
                            <Flame size={9} color={COLORS.gold} /> {e.current_streak}
                          </span>
                          <span style={styles.rowDot}>·</span>
                          <span>{getScoreLabel(e.score).label}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                        <span style={styles.rowScore}>{e.score.toLocaleString()}</span>
                        {e.gap_to_next !== null && (
                          <span style={styles.rowGap}>−{e.gap_to_next}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div style={styles.captureFooter}>
                <div style={styles.captureFooterLine} />
                <span style={styles.captureFooterText}>creator-accountability.vercel.app</span>
              </div>
            </div>

            {/* YOUR CARD — if outside top 20 */}
            {you && you.rank > Math.max(20, entries.length) && (
              <div style={styles.youCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <span style={{ ...styles.rowRank, color: COLORS.gold }}>#{you.rank}</span>
                  {renderAvatar(you.avatar_url, you.name, 38)}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={styles.rowName}>
                      {you.name}<span style={styles.youChip}>You</span>
                    </div>
                    <div style={styles.rowSub}>
                      <span style={styles.rowStreak}>
                        <Flame size={9} color={COLORS.gold} /> {you.current_streak}
                      </span>
                      <span style={styles.rowDot}>·</span>
                      <span>{getScoreLabel(you.score).label}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ ...styles.rowScore, color: COLORS.gold }}>{you.score.toLocaleString()}</span>
                  {you.gap_to_next !== null && (
                    <span style={styles.rowGap}>−{you.gap_to_next} to next</span>
                  )}
                </div>
              </div>
            )}

            {/* Secondary share button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleShare}
              disabled={sharing}
              style={styles.secondaryShare}
            >
              <Download size={14} />
              Save leaderboard image
            </motion.button>
          </>
        )}
      </motion.div>
    </Layout>
  )
}

function StatsStrip({ total, youRank, topScore }: { total: number; youRank: number | null; topScore: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={styles.statsStrip}
    >
      <Stat label="Creators" value={total.toString()} icon={TrendingUp} />
      <div style={styles.statDivider} />
      <Stat label="Top score" value={topScore.toLocaleString()} icon={Zap} />
      <div style={styles.statDivider} />
      <Stat label="Your rank" value={youRank ? `#${youRank}` : '—'} icon={Flame} highlight={youRank === 1} />
    </motion.div>
  )
}
function Stat({ label, value, icon: Icon, highlight }: { label: string; value: string; icon: any; highlight?: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', minWidth: 0 }}>
      <Icon size={12} color={highlight ? COLORS.gold : COLORS.textFaint} />
      <div style={{
        fontFamily: 'Space Grotesk', fontWeight: 700,
        fontSize: 'clamp(0.95rem, 3.5vw, 1.1rem)',
        color: highlight ? COLORS.gold : COLORS.text, lineHeight: 1
      }}>{value}</div>
      <div style={{
        fontSize: 'clamp(0.55rem, 1.8vw, 0.65rem)',
        color: COLORS.textFaint, textTransform: 'uppercase',
        letterSpacing: '0.08em', fontWeight: 600, textAlign: 'center'
      }}>{label}</div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
      <div style={styles.skelPodium}>
        {[64, 88, 52].map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
              style={styles.skelAvatar}
            />
            <div style={{ ...styles.skelBar, height: `${h}px` }} />
          </div>
        ))}
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.1 }}
          style={styles.skelRow}
        >
          <div style={{ width: 32, height: 14, borderRadius: 4, background: '#1A1A1A' }} />
          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#1A1A1A' }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '55%', height: 12, borderRadius: 4, background: '#1A1A1A', marginBottom: 6 }} />
            <div style={{ width: '35%', height: 10, borderRadius: 4, background: '#151515' }} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function PodiumItem({ entry, place, isYou }: { entry: Entry; place: 1 | 2 | 3; isYou: boolean }) {
  const heights: Record<number, number> = { 1: 108, 2: 82, 3: 66 }
  const colors: Record<number, string> = { 1: '#F5A623', 2: '#B8B8B8', 3: '#CD7F32' }
  const icons: Record<number, any> = { 1: Crown, 2: Medal, 3: Medal }
  const labels: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }
  const Icon = icons[place]
  const color = colors[place]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: place === 1 ? 0.1 : place === 2 ? 0.05 : 0.15, duration: 0.4 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}
    >
      <div style={{ position: 'relative', marginBottom: '0.4rem' }}>
        {place === 1 && (
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}
          >
            <Crown size={20} color={color} fill={color} />
          </motion.div>
        )}
        {renderAvatar(entry.avatar_url, entry.name, place === 1 ? 64 : 46)}
        <div style={{
          position: 'absolute', bottom: -6, right: -6,
          width: 24, height: 24, borderRadius: '50%',
          background: color, color: '#0A0A0A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 800, fontFamily: 'Space Grotesk',
          border: '2px solid #0A0A0A',
          boxShadow: `0 0 14px ${color}66`
        }}>{place}</div>
      </div>
      <span style={{
        fontSize: place === 1 ? '0.86rem' : '0.76rem',
        fontWeight: 700, color: COLORS.text,
        maxWidth: '94px', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontFamily: 'Space Grotesk', letterSpacing: '-0.01em'
      }}>
        {entry.name?.split(' ')[0]}{isYou ? ' (you)' : ''}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
        <Flame size={10} color={COLORS.gold} />
        <span style={{ fontSize: '0.66rem', color: COLORS.textDim, fontWeight: 600 }}>
          {entry.current_streak}
        </span>
      </div>
      <span style={{
        fontSize: place === 1 ? '0.86rem' : '0.74rem',
        color: color, fontWeight: 800,
        marginTop: '0.15rem', fontFamily: 'Space Grotesk'
      }}>
        {entry.score.toLocaleString()}
      </span>
      <div style={{
        width: '100%', height: `${heights[place]}px`, marginTop: '0.4rem',
        background: `linear-gradient(180deg, ${color}28 0%, ${color}06 100%)`,
        border: `1px solid ${color}55`, borderBottom: 'none',
        borderRadius: '12px 12px 0 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: '0.7rem', gap: '0.3rem',
        position: 'relative', overflow: 'hidden'
      }}>
        <Icon size={place === 1 ? 24 : 18} color={color} strokeWidth={2} />
        <span style={{
          fontSize: '0.6rem', fontWeight: 800, color,
          letterSpacing: '0.1em', textTransform: 'uppercase'
        }}>{labels[place]}</span>
      </div>
    </motion.div>
  )
}

const styles: Record<string, any> = {
  backBtn: {
    width: '38px', height: '38px', borderRadius: '11px',
    background: '#111', border: '1px solid #1E1E1E',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0, flexShrink: 0
  },
  iconBtn: {
    width: '38px', height: '38px', borderRadius: '11px',
    background: '#111', border: '1px solid #1E1E1E',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0
  },
  eyebrow: {
    color: '#555', fontSize: '0.68rem', textTransform: 'uppercase',
    letterSpacing: '0.18em', marginBottom: '0.15rem', fontWeight: 600
  },
  title: {
    fontFamily: 'Space Grotesk', fontWeight: 700,
    fontSize: 'clamp(1.4rem, 5vw, 1.7rem)',
    color: COLORS.text, lineHeight: 1.05, margin: 0, letterSpacing: '-0.03em'
  },
  iconChip: {
    width: '42px', height: '42px', borderRadius: '12px',
    background: COLORS.goldSoft, border: `1px solid ${COLORS.goldBorder}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0
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
    borderRadius: '9px', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'color 0.2s'
  },
  segmentActive: {
    background: COLORS.goldSoft, color: COLORS.gold
  },
  weekLabel: {
    color: COLORS.textFaint, fontSize: '0.72rem',
    margin: '0 0 1rem 0.35rem'
  },
  shareBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    width: '100%', marginTop: '0.75rem', marginBottom: '1rem',
    padding: '0.9rem 1rem', borderRadius: '14px',
    background: `linear-gradient(135deg, ${COLORS.gold} 0%, #D9821A 100%)`,
    border: 'none', color: '#0A0A0A',
    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 8px 24px -8px rgba(245,166,35,0.55)'
  },
  secondaryShare: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
    width: '100%', marginTop: '1rem',
    padding: '0.75rem 1rem', borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textDim, fontFamily: 'Space Grotesk',
    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
  },
  statsStrip: {
    display: 'flex', alignItems: 'center',
    background: COLORS.surfaceRaised,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '16px', padding: '0.85rem 0.4rem',
    marginBottom: '1rem'
  },
  statDivider: { width: '1px', height: '32px', background: '#1E1E1E' },

  // ===== SHARE CARD =====
  shareCapture: {
    background: 'linear-gradient(180deg, #121212 0%, #0A0A0A 60%, #050505 100%)',
    borderRadius: '22px', padding: '1.5rem 1.25rem 1.25rem',
    border: `1px solid rgba(245,166,35,0.15)`,
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 30px 80px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(245,166,35,0.08)'
  },
  captureTopBand: {
    background: 'linear-gradient(135deg, rgba(245,166,35,0.16) 0%, rgba(245,166,35,0.04) 100%)',
    border: `1px solid ${COLORS.goldBorder}`,
    borderRadius: '16px', padding: '1rem 1.15rem',
    textAlign: 'center', position: 'relative', overflow: 'hidden'
  },
  captureBrandRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.4rem', marginBottom: '0.6rem'
  },
  captureBrand: {
    fontSize: '0.6rem', fontWeight: 800, color: COLORS.gold,
    letterSpacing: '0.22em'
  },
  captureTitle: {
    fontFamily: 'Space Grotesk', fontWeight: 800,
    fontSize: '1.2rem', color: COLORS.text,
    letterSpacing: '-0.02em', lineHeight: 1.1
  },
  captureSub: {
    fontSize: '0.7rem', color: COLORS.gold, fontWeight: 700,
    marginTop: '0.4rem', letterSpacing: '0.08em'
  },
  captureTopStats: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.4rem', marginTop: '0.6rem'
  },
  captureTopStat: {
    fontSize: '0.7rem', color: COLORS.textDim, fontWeight: 600
  },
  captureTopDot: {
    color: COLORS.textFaint, fontSize: '0.7rem'
  },
  accentStripe: {
    position: 'absolute', top: 0, right: 0,
    width: '120px', height: '120px',
    background: 'linear-gradient(135deg, transparent 45%, rgba(245,166,35,0.12) 45%, rgba(245,166,35,0.12) 55%, transparent 55%)',
    pointerEvents: 'none'
  },
  podium: {
    display: 'flex', alignItems: 'flex-end',
    justifyContent: 'center', gap: '0.4rem',
    padding: '1.5rem 0 0', marginBottom: '0.5rem'
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '0.7rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', padding: '0.6rem 0.8rem'
  },
  rowYou: {
    borderColor: COLORS.goldBorder,
    background: 'rgba(245,166,35,0.07)'
  },
  rowRank: {
    fontFamily: 'Space Grotesk', fontWeight: 700,
    fontSize: '0.8rem', color: COLORS.textFaint,
    width: '30px', flexShrink: 0
  },
  rowName: {
    color: COLORS.text, fontSize: '0.86rem', fontWeight: 600,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    display: 'flex', alignItems: 'center', gap: '0.4rem'
  },
  rowSub: {
    color: COLORS.textFaint, fontSize: '0.68rem', marginTop: '0.15rem',
    display: 'flex', alignItems: 'center', gap: '0.3rem'
  },
  rowStreak: {
    display: 'inline-flex', alignItems: 'center', gap: '0.2rem'
  },
  rowDot: {
    color: COLORS.textFaint, opacity: 0.5
  },
  rowScore: {
    fontFamily: 'Space Grotesk', fontWeight: 700,
    fontSize: '0.9rem', color: COLORS.text
  },
  rowGap: {
    fontSize: '0.62rem', color: COLORS.textFaint, marginTop: '0.1rem',
    fontFamily: 'Space Grotesk', fontWeight: 600
  },
  youChip: {
    fontSize: '0.58rem', fontWeight: 700,
    background: COLORS.goldSoft, color: COLORS.gold,
    borderRadius: '10px', padding: '1px 6px',
    textTransform: 'uppercase', letterSpacing: '0.05em'
  },
  captureFooter: {
    marginTop: '1.25rem', paddingTop: '1rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
  },
  captureFooterLine: {
    width: '60%', height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.4), transparent)'
  },
  captureFooterText: {
    fontSize: '0.68rem', color: COLORS.gold,
    fontWeight: 700, letterSpacing: '0.08em',
    fontFamily: 'Space Grotesk'
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
    background: COLORS.surfaceRaised,
    border: `1px dashed ${COLORS.border}`,
    borderRadius: '20px', padding: '3rem 1.5rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center'
  },
  emptyIconRing: {
    width: '56px', height: '56px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${COLORS.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '0.9rem'
  },
  emptyTitle: {
    margin: 0, color: COLORS.text, fontFamily: 'Space Grotesk',
    fontSize: '1.05rem', fontWeight: 600
  },
  emptySub: {
    margin: '0.5rem 0 0', color: COLORS.textDim,
    fontSize: '0.85rem', maxWidth: '320px', lineHeight: 1.55
  },
  skelPodium: {
    display: 'flex', alignItems: 'flex-end',
    justifyContent: 'center', gap: '0.5rem',
    padding: '1.5rem 0 0.5rem'
  },
  skelAvatar: {
    width: '48px', height: '48px', borderRadius: '16px',
    background: '#1A1A1A', marginBottom: '0.5rem'
  },
  skelBar: {
    width: '100%', borderRadius: '10px 10px 0 0', background: '#151515'
  },
  skelRow: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    background: '#0E0E0E', border: '1px solid #181818',
    borderRadius: '14px', padding: '0.7rem 0.9rem'
  },
}
