import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { Download, X, Flame, Star } from 'lucide-react'

const MILESTONE_CONFIG: Record<string, { label: string; subtext: string; color: string; icon: string }> = {
  streak_7: { label: '7 Day Streak', subtext: 'One week of consistency', color: '#4CAF50', icon: '🔥' },
  streak_30: { label: '30 Day Streak', subtext: 'A month of showing up', color: '#2196F3', icon: '⚡' },
  streak_60: { label: '60 Day Streak', subtext: 'Two months of dedication', color: '#9C27B0', icon: '💎' },
  streak_100: { label: '100 Day Streak', subtext: 'A century of consistency', color: '#F5A623', icon: '👑' },
  streak_365: { label: '365 Day Streak', subtext: 'A full year of creating', color: '#F5A623', icon: '🏆' },
  first_checkin: { label: 'First Check-in', subtext: 'Every journey starts here', color: '#4CAF50', icon: '🎯' },
  tasks_10: { label: '10 Tasks Done', subtext: 'Getting started', color: '#4CAF50', icon: '✅' },
  tasks_50: { label: '50 Tasks Done', subtext: 'Building momentum', color: '#2196F3', icon: '📈' },
  tasks_100: { label: '100 Tasks Done', subtext: 'Century of content', color: '#F5A623', icon: '💯' },
  challenge_complete: { label: 'Challenge Complete', subtext: 'You finished what you started', color: '#F5A623', icon: '🎖️' },
}

interface Props {
  milestone: string
  name: string
  stat?: number
  onClose: () => void
}

export default function MilestoneCard({ milestone, name, stat, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [capturing, setCapturing] = useState(false)
  const config = MILESTONE_CONFIG[milestone] || { label: 'Milestone', subtext: 'Keep going', color: '#F5A623', icon: '🌟' }

  const download = async () => {
    if (!cardRef.current) return
    setCapturing(true)
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 })
      const link = document.createElement('a')
      link.download = `${milestone}-${name}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch {
      alert('Could not capture card.')
    }
    setCapturing(false)
  }

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <motion.div
        style={styles.modal}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={16} color="#F5A623" />
            <span style={{ fontWeight: '700', fontFamily: 'Space Grotesk' }}>Milestone Unlocked!</span>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <X size={18} color="#666" />
          </button>
        </div>

        {/* The shareable card */}
        <div ref={cardRef} style={styles.card}>
          <div style={{
            ...styles.cardInner,
            background: `linear-gradient(135deg, #0A0A0A 0%, ${config.color}15 100%)`
          }}>
            {/* Top accent */}
            <div style={{ width: '40px', height: '3px', background: config.color, borderRadius: '999px', marginBottom: '1.5rem' }} />

            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{config.icon}</div>

            <div style={{ color: config.color, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.4rem' }}>
              Achievement Unlocked
            </div>

            <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.8rem', color: '#F0EDE8', lineHeight: 1.1, marginBottom: '0.4rem', textAlign: 'center' }}>
              {config.label}
            </div>

            <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {config.subtext}
            </div>

            {stat !== undefined && (
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '3rem', color: config.color, lineHeight: 1, marginBottom: '0.25rem' }}>
                {stat}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: `1px solid ${config.color}20`, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#F0EDE8', fontWeight: '600', fontSize: '0.9rem' }}>{name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Flame size={13} color="#F5A623" />
                <span style={{ color: '#555', fontSize: '0.78rem' }}>Creator Accountability</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button style={styles.downloadBtn} onClick={download} disabled={capturing}>
            <Download size={16} color="#0A0A0A" />
            {capturing ? 'Saving...' : 'Download'}
          </button>
          <button style={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </motion.div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300 },
  modal: {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    background: '#111111', border: '1px solid #1E1E1E', borderRadius: '20px',
    padding: '1.5rem', zIndex: 301, width: '90%', maxWidth: '380px'
  },
  card: { borderRadius: '16px', overflow: 'hidden', border: '1px solid #2A2A2A' },
  cardInner: {
    padding: '2rem', display: 'flex', flexDirection: 'column',
    alignItems: 'center', minHeight: '280px', justifyContent: 'center'
  },
  downloadBtn: {
    flex: 1, background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '10px', padding: '0.85rem', fontWeight: '700',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem'
  },
  closeBtn: {
    background: 'none', border: '1px solid #1E1E1E', borderRadius: '10px',
    padding: '0.85rem 1.25rem', color: '#666', cursor: 'pointer', fontSize: '0.9rem'
  }
}
