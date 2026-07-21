import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, X } from 'lucide-react'

const CHECKLIST = [
  { id: 'hook', label: 'Does it have a strong opening hook?' },
  { id: 'value', label: 'Is the value clear to the viewer?' },
  { id: 'cta', label: 'Does it have a call to action?' },
  { id: 'good_enough', label: 'Is it good enough to post right now?' },
  { id: 'ship', label: 'Will waiting make it significantly better?' },
]

interface Props {
  taskTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export default function GoodEnoughChecklist({ taskTitle, onConfirm, onCancel }: Props) {
  const [checked, setChecked] = useState<string[]>([])

  const toggle = (id: string) => {
    setChecked(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const allChecked = checked.length >= 4

  return (
    <>
      <div style={styles.overlay} onClick={onCancel} />
      <motion.div
        style={styles.modal}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1rem' }}>Good Enough?</div>
            <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '0.2rem' }}>{taskTitle}</div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onCancel}>
            <X size={18} color="#555" />
          </button>
        </div>

        <p style={{ color: '#555', fontSize: '0.82rem', marginBottom: '1rem' }}>
          Check at least 4 before marking done. Ship it — don't overthink.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {CHECKLIST.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: checked.includes(item.id) ? '#0D2010' : '#0A0A0A',
                border: `1px solid ${checked.includes(item.id) ? '#4CAF5030' : '#1E1E1E'}`,
                borderRadius: '10px', padding: '0.85rem 1rem', cursor: 'pointer'
              }}
              onClick={() => toggle(item.id)}
            >
              {checked.includes(item.id)
                ? <CheckCircle2 size={18} color="#4CAF50" />
                : <Circle size={18} color="#333" />
              }
              <span style={{ fontSize: '0.88rem', color: checked.includes(item.id) ? '#F0EDE8' : '#888' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            style={{
              ...styles.confirmBtn,
              opacity: allChecked ? 1 : 0.5,
              cursor: allChecked ? 'pointer' : 'default'
            }}
            onClick={allChecked ? onConfirm : undefined}
          >
            {allChecked ? 'Mark Complete & Ship It' : `${checked.length}/4 checked`}
          </button>
          <button style={styles.skipBtn} onClick={onConfirm}>
            Skip
          </button>
        </div>
      </motion.div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300 },
  modal: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: '#111111', borderTop: '1px solid #1E1E1E',
    borderRadius: '20px 20px 0 0', padding: '1.5rem',
    zIndex: 301, maxHeight: '85vh', overflowY: 'auto'
  },
  confirmBtn: {
    flex: 1, background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '10px', padding: '0.85rem', fontWeight: '700',
    fontSize: '0.9rem'
  },
  skipBtn: {
    background: 'none', border: '1px solid #1E1E1E', borderRadius: '10px',
    padding: '0.85rem 1.25rem', color: '#666', cursor: 'pointer', fontSize: '0.9rem'
  }
}
