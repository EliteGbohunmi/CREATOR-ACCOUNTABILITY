import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { Share2, X, Download, Flame } from 'lucide-react'

interface Props {
  name: string
  streak: number
  bestStreak: number
}

export default function ShareCard({ name, streak, bestStreak }: Props) {
  const [open, setOpen] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const capture = async () => {
    if (!cardRef.current) return
    setCapturing(true)
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 })
      const link = document.createElement('a')
      link.download = 'my-streak.png'
      link.href = canvas.toDataURL()
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem' }}>Streak Card</h2>
                <button style={styles.closeBtn} onClick={() => setOpen(false)}>
                  <X size={18} color="#666" />
                </button>
              </div>

              <div ref={cardRef} style={styles.card}>
                <div style={styles.cardInner}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <Flame size={18} color="#F5A623" />
                    <span style={{ color: '#F5A623', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.08em' }}>CREATOR ACCOUNTABILITY</span>
                  </div>
                  <div style={{ fontSize: '5rem', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#F5A623', lineHeight: 1 }}>
                    {streak}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.4rem' }}>
                    Day Streak
                  </div>
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #2A2A2A', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#F0EDE8', fontWeight: '600', fontSize: '0.95rem' }}>{name}</span>
                    <span style={{ color: '#555', fontSize: '0.8rem' }}>Best: {bestStreak} days</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button style={styles.downloadBtn} onClick={capture} disabled={capturing}>
                  <Download size={16} color="#0A0A0A" />
                  {capturing ? 'Saving...' : 'Download'}
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
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 'auto', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '1.5rem', zIndex: 201, width: 'calc(100% - 2rem)', maxWidth: '400px', height: 'fit-content' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' },
  card: { borderRadius: '12px', overflow: 'hidden', background: '#0A0A0A', border: '1px solid #2A2A2A' },
  cardInner: {
    padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1400 100%)'
  },
  downloadBtn: {
    flex: 1, background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '8px', padding: '0.75rem', fontWeight: '700',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem'
  },
  cancelBtn: {
    background: 'none', border: '1px solid #1E1E1E', borderRadius: '8px',
    padding: '0.75rem 1.25rem', color: '#666', cursor: 'pointer', fontSize: '0.9rem'
  }
}
