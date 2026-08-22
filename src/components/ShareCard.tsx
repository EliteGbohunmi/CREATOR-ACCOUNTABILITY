import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { Share2, X, Download, Flame } from 'lucide-react'

interface Props {
  name: string
  streak: number
  bestStreak: number
}

// Milestone ladder — mirrors Duolingo-style streak societies.
// Encodes real progress info rather than decorating the card.
const MILESTONES = [7, 14, 30, 50, 100, 200, 365, 500, 1000]

function getMilestoneProgress(streak: number) {
  const next = MILESTONES.find((m) => m > streak)
  const prevIndex = next ? MILESTONES.indexOf(next) - 1 : MILESTONES.length - 1
  const prev = prevIndex >= 0 ? MILESTONES[prevIndex] : 0
  if (!next) return { fraction: 1, label: 'Legendary streak' }
  const fraction = (streak - prev) / (next - prev)
  return { fraction: Math.max(0.03, Math.min(1, fraction)), label: `${next - streak} days to ${next}` }
}

// html2canvas has a long-standing bug where CSS letter-spacing causes
// leftover glyph fragments (colored specks) in the captured image. Faking
// the spacing with real per-character spans avoids it entirely.
function Spaced({ children, gap }: { children: string; gap: string }) {
  const chars = children.split('')
  return (
    <>
      {chars.map((ch, i) => (
        <span
          key={i}
          style={{ display: 'inline-block', marginRight: i === chars.length - 1 ? 0 : gap }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </>
  )
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?'
}

export default function ShareCard({ name, streak, bestStreak }: Props) {
  const [open, setOpen] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const { fraction, label } = useMemo(() => getMilestoneProgress(streak), [streak])
  const initials = useMemo(() => getInitials(name), [name])

  const RADIUS = 86
  const CIRC = 2 * Math.PI * RADIUS
  const dashOffset = CIRC * (1 - fraction)

  const capture = async () => {
    if (!cardRef.current) return
    setCapturing(true)
    try {
      // Wait for the display font to actually be loaded — capturing before
      // it's ready is what causes the speckled letter-spacing artifacts.
      if (document.fonts?.ready) await document.fonts.ready

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0A0908',
        scale: 3,
        letterRendering: true, // fixes html2canvas letter-spacing ghosting
        onclone: (clonedDoc) => {
          // html2canvas doesn't reliably support background-clip:text —
          // it paints the gradient box and ignores the transparent fill.
          // Swap to a flat solid color on the clone only; the live UI keeps
          // its gradient.
          const num = clonedDoc.querySelector('[data-capture="streak-num"]') as HTMLElement | null
          if (num) {
            num.style.background = 'none'
            num.style.webkitBackgroundClip = 'unset'
            num.style.backgroundClip = 'unset'
            num.style.webkitTextFillColor = '#F5A623'
            num.style.color = '#F5A623'
          }
        }
      })
      const link = document.createElement('a')
      link.download = `streak-${streak}-days.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      alert('Could not capture card. Try again.')
    }
    setCapturing(false)
  }

  return (
    <>
      <button style={styles.triggerBtn} onClick={() => setOpen(true)}>
        <Share2 size={15} color="#888" />
        Share Streak
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div style={styles.overlay} onClick={() => setOpen(false)} />
            <motion.div
              style={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.05rem', color: '#F0EDE8', margin: 0 }}>Share your streak</h2>
                <button style={styles.closeBtn} onClick={() => setOpen(false)}>
                  <X size={18} color="#666" />
                </button>
              </div>

              {/* ===== Capture target ===== */}
              <div ref={cardRef} style={styles.card}>
                <div style={styles.glow} />
                <div style={styles.grain} />

                <div style={styles.cardContent}>
                  <div style={styles.eyebrowRow}>
                    <Flame size={13} color="#F5A623" strokeWidth={2.5} />
                    <span style={styles.eyebrow}><Spaced gap="0.14em">CREATOR ACCOUNTABILITY</Spaced></span>
                  </div>

                  <div style={styles.ringWrap}>
                    <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                      <defs>
                        <linearGradient id="emberRing" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFCB73" />
                          <stop offset="45%" stopColor="#F5A623" />
                          <stop offset="100%" stopColor="#E8562B" />
                        </linearGradient>
                      </defs>
                      <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#1E1B16" strokeWidth="9" />
                      <circle
                        cx="100"
                        cy="100"
                        r={RADIUS}
                        fill="none"
                        stroke="url(#emberRing)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={CIRC}
                        strokeDashoffset={dashOffset}
                      />
                    </svg>
                    <div style={styles.ringCenter}>
                      <div data-capture="streak-num" style={styles.streakNum}>{streak}</div>
                      <div style={styles.streakLabel}><Spaced gap="0.1em">DAY STREAK</Spaced></div>
                    </div>
                  </div>

                  <div style={styles.milestoneCaption}>{label}</div>

                  <div style={styles.footer}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <div style={styles.avatar}>{initials}</div>
                      <span style={styles.nameText}>{name}</span>
                    </div>
                    <div style={styles.bestChip}>
                      <Flame size={11} color="#E8562B" strokeWidth={2.5} />
                      <span>Best {bestStreak}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.watermark}><Spaced gap="0.08em">creatoraccountability.app</Spaced></div>
              </div>
              {/* ===== /Capture target ===== */}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.1rem' }}>
                <button style={styles.downloadBtn} onClick={capture} disabled={capturing}>
                  <Download size={16} color="#0A0A0A" />
                  {capturing ? 'Saving...' : 'Download image'}
                </button>
                <button style={styles.cancelBtn} onClick={() => setOpen(false)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

const CARD_W = 300

const styles: Record<string, React.CSSProperties> = {
  triggerBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#111111', color: '#888', border: '1px solid #1E1E1E',
    borderRadius: '8px', padding: '0.65rem 1rem', fontWeight: '500',
    cursor: 'pointer', fontSize: '0.85rem'
  },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200 },
  modal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 'auto',
    background: '#161412', border: '1px solid #2A2620', borderRadius: '18px',
    padding: '1.25rem', zIndex: 201, width: 'fit-content', height: 'fit-content'
  },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' },

  card: {
    position: 'relative', width: `${CARD_W}px`, borderRadius: '20px', overflow: 'hidden',
    background: '#0A0908', border: '1px solid #26211A'
  },
  glow: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(140% 90% at 50% -10%, rgba(245,166,35,0.30) 0%, rgba(232,86,43,0.10) 35%, transparent 65%)',
    pointerEvents: 'none'
  },
  grain: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(circle at 15% 85%, rgba(255,255,255,0.035) 0%, transparent 40%), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.03) 0%, transparent 35%)',
    pointerEvents: 'none'
  },
  cardContent: {
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '1.6rem 1.5rem 1.3rem'
  },
  eyebrowRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.15rem' },
  eyebrow: { color: '#B8895A', fontSize: '0.66rem', fontWeight: 700 },

  ringWrap: { position: 'relative', width: '200px', height: '200px' },
  ringCenter: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center'
  },
  streakNum: {
    fontSize: '3.6rem', fontWeight: 800, fontFamily: 'Space Grotesk',
    background: 'linear-gradient(160deg, #FFD9A0 0%, #F5A623 55%, #E8562B 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text', lineHeight: 1
  },
  streakLabel: {
    color: '#8A8175', fontSize: '0.72rem',
    marginTop: '0.25rem', fontWeight: 600
  },

  milestoneCaption: {
    marginTop: '0.9rem', color: '#C9A26A', fontSize: '0.78rem', fontWeight: 600
  },

  footer: {
    marginTop: '1.35rem', paddingTop: '1.1rem', borderTop: '1px solid #241F19',
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  avatar: {
    width: '28px', height: '28px', borderRadius: '999px',
    background: 'linear-gradient(135deg, #F5A623, #E8562B)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.68rem', fontWeight: 800, color: '#0A0908'
  },
  nameText: { color: '#F0EDE8', fontWeight: 600, fontSize: '0.88rem' },
  bestChip: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    color: '#9C9184', fontSize: '0.74rem', fontWeight: 600
  },

  watermark: {
    position: 'relative', textAlign: 'center', color: '#4A4136',
    fontSize: '0.6rem', padding: '0.6rem 0 0.85rem'
  },

  downloadBtn: {
    flex: 1, background: 'linear-gradient(135deg, #FFCB73, #F5A623 55%, #E8562B)',
    color: '#0A0908', border: 'none',
    borderRadius: '10px', padding: '0.75rem', fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '0.5rem', fontSize: '0.88rem'
  },
  cancelBtn: {
    background: 'none', border: '1px solid #26211A', borderRadius: '10px',
    padding: '0.75rem 1.25rem', color: '#8A8175', cursor: 'pointer', fontSize: '0.88rem'
  }
}
