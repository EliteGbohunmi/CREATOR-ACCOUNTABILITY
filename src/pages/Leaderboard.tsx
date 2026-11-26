import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toPng } from 'html-to-image'
import {
  ArrowLeft, Trophy, Crown, Medal, Loader, Share2, RefreshCw,
} from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../lib/AuthContext'
import { getScoreLabel } from '../lib/creatorScore'

const API = 'https://streak-backend-ar7h.onrender.com'

const COLORS = {
  bg: '#0A0A0A',
  surface: '#111111',
  border: '#1E1E1E',
  gold: '#F5A623',
  goldSoft: 'rgba(245,166,35,0.12)',
  goldBorder: 'rgba(245,166,35,0.28)',
  text: '#F0EDE8',
  textDim: '#8A8A8A',
  textFaint: '#5C5C5C',
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
  const rest = entries.slice(3)
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
        style: { borderRadius: '0' },
      })

      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob()
          const file = new File([blob], 'leaderboard.png', { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: "I'm #1 on the Leaderboard!",
              text: 'Top of the creator leaderboard this week 🏆',
            })
            setSharing(false)
            return
          }
        } catch { /* fall through to download */ }
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

        <div style={styles.segment}>
          <button
            onClick={() => setWin('weekly')}
            style={{ ...styles.segmentBtn, ...(win === 'weekly' ? styles.segmentActive : {}) }}
          >
            Weekly
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

        <AnimatePresence>
          {isTopOne && !loading && entries.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onClick={handleShare}
              disabled={sharing}
              style={styles.shareBtn}
            >
              {sharing ? (
                <><Loader size={16} className="animate-spin" /> Preparing image…</>
              ) : (
                <><Share2 size={16} /> Share my #1 spot</>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {loading ? (
          <SkeletonList />
        ) : entries.length === 0 ? (
          <div style={styles.empty}>
            <Trophy size={32} color={COLORS.textFaint} />
            <p style={{ color: COLORS.textDim, marginTop: '0.6rem', textAlign: 'center' }}>
              {win === 'weekly'
                ? 'No scores this week yet. Check in to start climbing.'
                : 'No scores yet. Be the first!'}
            </p>
          </div>
        ) : (
          <>
            <StatsStrip
              total={entries.length}
              youRank={you?.rank ?? null}
              topScore={entries[0]?.score ?? 0}
            />

            <div ref={shareRef} style={styles.shareCapture}>
              <div style={styles.captureHeader}>
                <div style={styles.captureBrand}>CREATOR ACCOUNTABILITY</div>
                <div style={styles.captureTitle}>
                  {win === 'weekly' ? 'Weekly Leaderboard' : 'All-time Leaderboard'}
                </div>
                {win === 'weekly' && weekLabel && (
                  <div style={styles.captureSub}>{weekLabel}</div>
                )}
              </div>

              {top3.length > 0 && (
                <div style={styles.podium}>
                  {top3[1] && <PodiumItem entry={top3[1]} place={2} isYou={you?.id === top3[1].id} />}
                  {top3[0] && <PodiumItem entry={top3[0]} place={1} isYou={you?.id === top3[0].id} />}
                  {top3[2] && <PodiumItem entry={top3[2]} place={3} isYou={you?.id === top3[2].id} />}
                </div>
              )}

              {rest.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
                  {rest.map(e => (
                    <div
                      key={e.id}
                      style={{ ...styles.row, ...(you?.id === e.id ? styles.rowYou : {}) }}
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
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.captureFooter}>
                creator-accountability.vercel.app
              </div>
            </div>

            {you && you.rank > Math.max(20, entries.length) && (
              <div style={styles.youCard}>
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
              </div>
            )}
          </>
        )}
      </motion.div>
    </Layout>
  )
}

function StatsStrip({ total, youRank, topScore }: { total: number; youRank: number | null; topScore: number }) {
  return (
    <div style={styles.statsStrip}>
      <Stat label="Creators" value={total.toString()} />
      <div style={styles.statDivider} />
      <Stat label="Top score" value={topScore.toLocaleString()} />
      <div style={styles.statDivider} />
      <Stat label="Your rank" value={youRank ? `#${youRank}` : '—'} highlight={youRank === 1} />
    </div>
  )
}
function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.05rem', color: highlight ? COLORS.gold : COLORS.text, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: COLORS.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.25rem', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
      <div style={styles.skelPodium}>
        {[64, 88, 52].map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
            <div style={styles.skelAvatar} />
            <div style={{ ...styles.skelBar, height: `${h}px` }} />
          </div>
        ))}
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={styles.skelRow}>
          <div style={{ width: 32, height: 14, borderRadius: 4, background: '#1A1A1A' }} />
          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#1A1A1A' }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '55%', height: 12, borderRadius: 4, background: '#1A1A1A', marginBottom: 6 }} />
            <div style={{ width: '35%', height: 10, borderRadius: 4, background: '#151515' }} />
          </div>
          <div style={{ width: 40, height: 14, borderRadius: 4, background: '#1A1A1A' }} />
        </div>
      ))}
    </div>
  )
}

function PodiumItem({ entry, place, isYou }: { entry: Entry; place: 1 | 2 | 3; isYou: boolean }) {
  const heights: Record<number, number> = { 1: 100, 2: 76, 3: 60 }
  const colors: Record<number, string> = { 1: '#F5A623', 2: '#B0B0B0', 3: '#CD7F32' }
  const icons: Record<number, any> = { 1: Crown, 2: Medal, 3: Medal }
  const labels: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }
  const Icon = icons[place]
  const color = colors[place]
  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}
    >
      <div style={{ position: 'relative', marginBottom: '0.4rem' }}>
        {renderAvatar(entry.avatar_url, entry.name, place === 1 ? 56 : 44)}
        <div style={{
          position: 'absolute', bottom: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
          background: color, color: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.7rem', fontWeight: 800, fontFamily: 'Space Grotesk', border: '2px solid #0A0A0A'
        }}>{place}</div>
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
        border: `1px solid ${color}44`, borderBottom: 'none', borderRadius: '10px 10px 0 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.6rem', gap: '0.25rem'
      }}>
        <Icon size={place === 1 ? 22 : 18} color={color} strokeWidth={2} />
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {labels[place]}
        </span>
      </div>
    </div>
  )
}

const styles: Record<string, any> = {
  backBtn: { width: '36px', height: '36px', borderRadius: '10px', background: '#111', border: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 },
  iconBtn: { width: '36px', height: '36px', borderRadius: '10px', background: '#111', border: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  eyebrow: { color: '#555', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.15rem', fontWeight: 600 },
  title: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.6rem', color: COLORS.text, lineHeight: 1.05, margin: 0, letterSpacing: '-0.025em' },
  iconChip: { width: '42px', height: '42px', borderRadius: '12px', background: COLORS.goldSoft, border: `1px solid ${COLORS.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  shareBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', marginTop: '0.5rem', marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '14px', background: `linear-gradient(135deg, ${COLORS.gold} 0%, #D9821A 100%)`, border: 'none', color: '#0A0A0A', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 6px 20px -6px rgba(245,166,35,0.5)' },
  statsStrip: { display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #1E1E1E', borderRadius: '14px', padding: '0.75rem 0.5rem', marginBottom: '1rem' },
  statDivider: { width: '1px', height: '28px', background: '#1E1E1E' },
  segment: { display: 'flex', gap: '0.35rem', marginBottom: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '11px', width: 'fit-content' },
  segmentBtn: { background: 'transparent', border: 'none', color: COLORS.textDim, fontSize: '0.78rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '9px', cursor: 'pointer', fontFamily: 'inherit' },
  segmentActive: { background: COLORS.goldSoft, color: COLORS.gold },
  weekLabel: { color: COLORS.textFaint, fontSize: '0.72rem', margin: '0 0 1rem 0.35rem' },
  shareCapture: { background: COLORS.bg, borderRadius: '16px', padding: '1rem', border: '1px solid #1A1A1A' },
  captureHeader: { textAlign: 'center', paddingBottom: '0.5rem' },
  captureBrand: { fontSize: '0.62rem', fontWeight: 700, color: COLORS.textFaint, letterSpacing: '0.2em', marginBottom: '0.35rem' },
  captureTitle: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem', color: COLORS.text, letterSpacing: '-0.02em' },
  captureSub: { fontSize: '0.7rem', color: COLORS.textFaint, marginTop: '0.15rem' },
  captureFooter: { textAlign: 'center', fontSize: '0.62rem', color: COLORS.textFaint, paddingTop: '1rem', letterSpacing: '0.05em' },
  podium: { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem 0 0', marginBottom: '0.5rem' },
  row: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#111', border: '1px solid #1E1E1E', borderRadius: '14px', padding: '0.7rem 0.9rem' },
  rowYou: { borderColor: COLORS.goldBorder, background: 'rgba(245,166,35,0.05)' },
  rowRank: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.82rem', color: COLORS.textFaint, width: '32px', flexShrink: 0 },
  rowName: { color: COLORS.text, fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  rowSub: { color: COLORS.textFaint, fontSize: '0.7rem', marginTop: '0.1rem' },
  rowScore: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.92rem', color: COLORS.text, flexShrink: 0 },
  youChip: { fontSize: '0.6rem', fontWeight: 700, background: COLORS.goldSoft, color: COLORS.gold, borderRadius: '10px', padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  youCard: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'linear-gradient(180deg, #1A1400 0%, #131313 100%)', border: `1px solid ${COLORS.goldBorder}`, borderRadius: '14px', padding: '0.75rem 0.9rem', marginTop: '1rem', position: 'sticky', bottom: '90px', boxShadow: '0 -6px 20px -10px rgba(245,166,35,0.3)' },
  empty: { background: '#111', border: '1px dashed #1E1E1E', borderRadius: '18px', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  skelPodium: { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem 0 0.5rem' },
  skelAvatar: { width: '48px', height: '48px', borderRadius: '16px', background: '#1A1A1A', marginBottom: '0.5rem' },
  skelBar: { width: '100%', borderRadius: '10px 10px 0 0', background: '#151515' },
  skelRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0E0E0E', border: '1px solid #181818', borderRadius: '14px', padding: '0.7rem 0.9rem' },
}
