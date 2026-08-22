import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, X, Download } from 'lucide-react'

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

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?'
}

const CARD_W = 300
const CARD_H = 408
const SYS_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"

export default function ShareCard({ name, streak, bestStreak }: Props) {
  const [open, setOpen] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const cardRef = useRef<SVGSVGElement>(null)

  const { fraction, label } = useMemo(() => getMilestoneProgress(streak), [streak])
  const initials = useMemo(() => getInitials(name), [name])

  const RADIUS = 86
  const CIRC = 2 * Math.PI * RADIUS
  const dashOffset = CIRC * (1 - fraction)

  // Renders the card by serializing the live SVG, loading it as a native
  // Image, and drawing it to a canvas — the browser's own SVG renderer does
  // the text/gradient work, so no html2canvas DOM-parsing artifacts.
  const capture = async () => {
    if (!cardRef.current) return
    setCapturing(true)
    try {
      const clone = cardRef.current.cloneNode(true) as SVGSVGElement
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clone.setAttribute('width', String(CARD_W))
      clone.setAttribute('height', String(CARD_H))

      const svgString = new XMLSerializer().serializeToString(clone)
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('svg load failed'))
        img.src = url
      })

      const scale = 3
      const canvas = document.createElement('canvas')
      canvas.width = CARD_W * scale
      canvas.height = CARD_H * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no canvas context')
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, CARD_W, CARD_H)
      URL.revokeObjectURL(url)

      const link = document.createElement('a')
      link.download = `streak-${streak}-days.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      alert('Could not save image. Try again.')
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

              {/* ===== Capture target — pure SVG, this is exactly what gets exported ===== */}
              <svg
                ref={cardRef}
                viewBox={`0 0 ${CARD_W} ${CARD_H}`}
                width={CARD_W}
                height={CARD_H}
                style={{ borderRadius: 20, display: 'block' }}
              >
                <defs>
                  <linearGradient id="emberRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFCB73" />
                    <stop offset="45%" stopColor="#F5A623" />
                    <stop offset="100%" stopColor="#E8562B" />
                  </linearGradient>
                  <linearGradient id="numberGrad" x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stopColor="#FFD9A0" />
                    <stop offset="55%" stopColor="#F5A623" />
                    <stop offset="100%" stopColor="#E8562B" />
                  </linearGradient>
                  <linearGradient id="avatarGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F5A623" />
                    <stop offset="100%" stopColor="#E8562B" />
                  </linearGradient>
                  <radialGradient id="glowGrad" cx="50%" cy="0%" r="75%">
                    <stop offset="0%" stopColor="#F5A623" stopOpacity="0.30" />
                    <stop offset="35%" stopColor="#E8562B" stopOpacity="0.10" />
                    <stop offset="65%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <clipPath id="cardClip">
                    <rect width={CARD_W} height={CARD_H} rx="20" />
                  </clipPath>
                </defs>

                <g clipPath="url(#cardClip)">
                  <rect width={CARD_W} height={CARD_H} fill="#0A0908" />
                  <rect width={CARD_W} height={CARD_H} fill="url(#glowGrad)" />

                  {/* eyebrow */}
                  <text x="24" y="42" fontSize="13" fontFamily={SYS_FONT}>🔥</text>
                  <text x="44" y="42" fontSize="12" fontWeight="700" letterSpacing="1.6" fill="#B8895A" fontFamily={SYS_FONT}>
                    CREATOR ACCOUNTABILITY
                  </text>

                  {/* progress ring */}
                  <g transform={`translate(150 160)`}>
                    <circle r={RADIUS} fill="none" stroke="#1E1B16" strokeWidth="9" />
                    <circle
                      r={RADIUS}
                      fill="none"
                      stroke="url(#emberRing)"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={CIRC}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90)"
                    />
                    <text textAnchor="middle" y="16" fontSize="58" fontWeight="800" fill="url(#numberGrad)" fontFamily={SYS_FONT}>
                      {streak}
                    </text>
                    <text textAnchor="middle" y="44" fontSize="11" fontWeight="600" letterSpacing="1.4" fill="#8A8175" fontFamily={SYS_FONT}>
                      DAY STREAK
                    </text>
                  </g>

                  {/* milestone caption */}
                  <text x={CARD_W / 2} y="288" textAnchor="middle" fontSize="13" fontWeight="600" fill="#C9A26A" fontFamily={SYS_FONT}>
                    {label}
                  </text>

                  <line x1="24" y1="310" x2={CARD_W - 24} y2="310" stroke="#241F19" strokeWidth="1" />

                  {/* footer */}
                  <circle cx="38" cy="337" r="14" fill="url(#avatarGrad)" />
                  <text x="38" y="341" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0A0908" fontFamily={SYS_FONT}>
                    {initials}
                  </text>
                  <text x="62" y="342" fontSize="14" fontWeight="600" fill="#F0EDE8" fontFamily={SYS_FONT}>
                    {name}
                  </text>
                  <text x={CARD_W - 24} y="342" textAnchor="end" fontSize="12" fontWeight="600" fill="#9C9184" fontFamily={SYS_FONT}>
                    🔥 Best {bestStreak}
                  </text>

                  {/* watermark */}
                  <text x={CARD_W / 2} y="388" textAnchor="middle" fontSize="9" letterSpacing="1" fill="#4A4136" fontFamily={SYS_FONT}>
                    creatoraccountability.app
                  </text>

                  <rect width={CARD_W} height={CARD_H} fill="none" stroke="#26211A" strokeWidth="1" rx="20" />
                </g>
              </svg>
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
