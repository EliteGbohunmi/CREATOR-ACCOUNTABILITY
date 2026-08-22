import { useEffect, useRef, useMemo, useState } from 'react'
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

// Manual rounded-rect path — works on every browser, no native roundRect() needed.
function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const CARD_W = 300
const CARD_H = 408
const EXPORT_SCALE = 3
// Space Grotesk first — same brand font already used elsewhere in the app —
// falling back to system fonts only if it somehow isn't loaded yet.
const FONT = "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: string) {
  // Not all engines support this yet; degrades gracefully to normal spacing.
  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = px
}

export default function ShareCard({ name, streak, bestStreak }: Props) {
  const [open, setOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { fraction, label } = useMemo(() => getMilestoneProgress(streak), [streak])
  const initials = useMemo(() => getInitials(name), [name])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      if (document.fonts?.ready) await document.fonts.ready
      if (cancelled) return
      draw()
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, streak, bestStreak, name, fraction, label, initials])

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CARD_W * EXPORT_SCALE
    canvas.height = CARD_H * EXPORT_SCALE
    ctx.setTransform(EXPORT_SCALE, 0, 0, EXPORT_SCALE, 0, 0)
    ctx.clearRect(0, 0, CARD_W, CARD_H)

    // ---- card background + clip ----
    ctx.save()
    roundRectPath(ctx, 0, 0, CARD_W, CARD_H, 20)
    ctx.clip()

    ctx.fillStyle = '#0A0908'
    ctx.fillRect(0, 0, CARD_W, CARD_H)

    const glow = ctx.createRadialGradient(CARD_W / 2, 0, 0, CARD_W / 2, 0, CARD_W * 1.3)
    glow.addColorStop(0, 'rgba(245,166,35,0.30)')
    glow.addColorStop(0.35, 'rgba(232,86,43,0.10)')
    glow.addColorStop(0.65, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, CARD_W, CARD_H)

    // ---- eyebrow ----
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.font = `13px ${FONT}`
    ctx.fillText('🔥', 24, 42)
    ctx.font = `700 12px ${FONT}`
    ctx.fillStyle = '#B8895A'
    setLetterSpacing(ctx, '1.6px')
    ctx.fillText('CREATOR ACCOUNTABILITY', 44, 42)
    setLetterSpacing(ctx, 'normal')

    // ---- progress ring ----
    const cx = 150, cy = 160, r = 86
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = '#1E1B16'
    ctx.lineWidth = 9
    ctx.stroke()

    const ringGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
    ringGrad.addColorStop(0, '#FFCB73')
    ringGrad.addColorStop(0.45, '#F5A623')
    ringGrad.addColorStop(1, '#E8562B')
    const start = -Math.PI / 2
    const end = start + fraction * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, cy, r, start, end)
    ctx.strokeStyle = ringGrad
    ctx.lineWidth = 9
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.lineCap = 'butt'

    // ---- streak number ----
    ctx.textAlign = 'center'
    const numGrad = ctx.createLinearGradient(cx - 40, cy - 40, cx + 20, cy + 60)
    numGrad.addColorStop(0, '#FFD9A0')
    numGrad.addColorStop(0.55, '#F5A623')
    numGrad.addColorStop(1, '#E8562B')
    ctx.font = `800 58px ${FONT}`
    ctx.fillStyle = numGrad
    ctx.fillText(String(streak), cx, cy + 16)

    ctx.font = `600 11px ${FONT}`
    ctx.fillStyle = '#8A8175'
    setLetterSpacing(ctx, '1.4px')
    ctx.fillText('DAY STREAK', cx, cy + 44)
    setLetterSpacing(ctx, 'normal')

    // ---- milestone caption ----
    ctx.font = `600 13px ${FONT}`
    ctx.fillStyle = '#C9A26A'
    ctx.fillText(label, CARD_W / 2, 288)

    // ---- divider ----
    ctx.beginPath()
    ctx.moveTo(24, 310)
    ctx.lineTo(CARD_W - 24, 310)
    ctx.strokeStyle = '#241F19'
    ctx.lineWidth = 1
    ctx.stroke()

    // ---- footer: avatar + name ----
    const avatarGrad = ctx.createLinearGradient(24, 323, 52, 351)
    avatarGrad.addColorStop(0, '#F5A623')
    avatarGrad.addColorStop(1, '#E8562B')
    ctx.beginPath()
    ctx.arc(38, 337, 14, 0, Math.PI * 2)
    ctx.fillStyle = avatarGrad
    ctx.fill()

    ctx.font = `800 11px ${FONT}`
    ctx.fillStyle = '#0A0908'
    ctx.fillText(initials, 38, 341)

    ctx.textAlign = 'left'
    ctx.font = `600 14px ${FONT}`
    ctx.fillStyle = '#F0EDE8'
    ctx.fillText(name, 62, 342)

    ctx.textAlign = 'right'
    ctx.font = `600 12px ${FONT}`
    ctx.fillStyle = '#9C9184'
    ctx.fillText(`🔥 Best ${bestStreak}`, CARD_W - 24, 342)

    // ---- watermark ----
    ctx.textAlign = 'center'
    ctx.font = `9px ${FONT}`
    ctx.fillStyle = '#4A4136'
    setLetterSpacing(ctx, '1px')
    ctx.fillText('creatoraccountability.app', CARD_W / 2, 388)
    setLetterSpacing(ctx, 'normal')

    ctx.restore()

    // ---- border ----
    roundRectPath(ctx, 0.5, 0.5, CARD_W - 1, CARD_H - 1, 20)
    ctx.strokeStyle = '#26211A'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `streak-${streak}-days.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
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

              <canvas
                ref={canvasRef}
                style={{ width: CARD_W, height: CARD_H, borderRadius: 20, display: 'block' }}
              />

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.1rem' }}>
                <button style={styles.downloadBtn} onClick={handleDownload}>
                  <Download size={16} color="#0A0A0A" />
                  Download image
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
