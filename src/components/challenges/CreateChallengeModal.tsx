import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Lock, Globe, Loader } from 'lucide-react'
import { CATEGORIES, TEMPLATES, createChallenge, type Challenge } from '../../lib/challenges'

type Props = {
  userId: string
  onClose: () => void
  onCreated: (c: Challenge) => void
}

export default function CreateChallengeModal({ userId, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [days, setDays] = useState('30')
  const [category, setCategory] = useState<Challenge['category']>('content')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [proofRequired, setProofRequired] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    setName(t.name)
    setDays(String(t.days))
    setCategory(t.category)
  }

  const submit = async () => {
    setError('')
    const n = name.trim()
    const d = parseInt(days)
    if (!n) { setError('Give your challenge a name'); return }
    if (!d || d < 1 || d > 365) { setError('Days must be between 1 and 365'); return }
    setCreating(true)
    const { data, error: err } = await createChallenge({
      userId,
      name: n,
      days: d,
      visibility,
      proofRequired,
      category,
    })
    setCreating(false)
    if (err || !data) {
      setError(err || 'Could not create challenge. Try again.')
      return
    }
    onCreated(data)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.overlay}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 220 }}
          style={styles.sheet}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.handle} />

          <div style={styles.header}>
            <div>
              <p style={styles.eyebrow}>New challenge</p>
              <h2 style={styles.title}>Commit to something</h2>
            </div>
            <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} color="#8A8A8A" />
            </button>
          </div>

          <div style={styles.body}>
            <div>
              <p style={styles.label}>Quick start</p>
              <div style={styles.templateRow}>
                {TEMPLATES.map((t) => (
                  <button key={t.label} style={styles.templateChip} onClick={() => applyTemplate(t)}>
                    <Sparkles size={12} color="#F5A623" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={styles.label}>Name</p>
              <input
                style={styles.input}
                placeholder="e.g. 30 Days of Reels"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <p style={styles.label}>How many days?</p>
              <input
                style={{ ...styles.input, maxWidth: '140px' }}
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>

            <div>
              <p style={styles.label}>Category</p>
              <div style={styles.categoryRow}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    style={{
                      ...styles.categoryChip,
                      ...(category === c ? styles.categoryChipActive : {}),
                    }}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={styles.label}>Who can join?</p>
              <div style={styles.visibilityRow}>
                <button
                  style={{ ...styles.visBtn, ...(visibility === 'public' ? styles.visBtnActive : {}) }}
                  onClick={() => setVisibility('public')}
                >
                  <Globe size={15} color={visibility === 'public' ? '#0A0A0A' : '#8A8A8A'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={styles.visTitle}>Public</div>
                    <div style={styles.visSub}>Anyone can join</div>
                  </div>
                </button>
                <button
                  style={{ ...styles.visBtn, ...(visibility === 'private' ? styles.visBtnActive : {}) }}
                  onClick={() => setVisibility('private')}
                >
                  <Lock size={15} color={visibility === 'private' ? '#0A0A0A' : '#8A8A8A'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={styles.visTitle}>Private</div>
                    <div style={styles.visSub}>Code required</div>
                  </div>
                </button>
              </div>
            </div>

            <button
              style={{ ...styles.toggleRow, borderColor: proofRequired ? 'rgba(245,166,35,0.3)' : '#1E1E1E' }}
              onClick={() => setProofRequired(!proofRequired)}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: `1.5px solid ${proofRequired ? '#F5A623' : '#5C5C5C'}`,
                  background: proofRequired ? '#F5A623' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {proofRequired && (
                  <span style={{ color: '#0A0A0A', fontSize: '12px', fontWeight: 700 }}>✓</span>
                )}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#F0EDE8' }}>
                  Require proof
                </div>
                <div style={{ fontSize: '0.75rem', color: '#5C5C5C', marginTop: '0.1rem' }}>
                  Participants upload proof each check-in
                </div>
              </div>
            </button>

            {error && <div style={styles.error}>{error}</div>}
          </div>

          <div style={styles.footer}>
            <button style={styles.createBtn} onClick={submit} disabled={creating}>
              {creating ? <Loader size={16} className="animate-spin" /> : null}
              {creating ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 500,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '1rem',
  },
  sheet: {
    width: '100%',
    maxWidth: '520px',
    maxHeight: '92vh',
    background: 'linear-gradient(180deg, #141414 0%, #0D0D0D 100%)',
    border: '1px solid #232323',
    borderRadius: '24px 24px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
  },
  handle: { width: '38px', height: '4px', borderRadius: '2px', background: '#2A2A2A', margin: '0.6rem auto 0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem 1.25rem 0.75rem' },
  eyebrow: { color: '#5C5C5C', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem', fontWeight: 600 },
  title: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem', color: '#F0EDE8' },
  closeBtn: { width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  body: { padding: '0.5rem 1.25rem 1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: { color: '#8A8A8A', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', fontWeight: 600 },
  templateRow: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  templateChip: { display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#F5A623', fontSize: '0.72rem', fontWeight: 500, padding: '0.45rem 0.7rem', borderRadius: '20px', cursor: 'pointer' },
  input: { width: '100%', background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '0.75rem 0.9rem', color: '#F0EDE8', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
  categoryRow: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  categoryChip: { background: 'transparent', border: '1px solid #1E1E1E', color: '#8A8A8A', fontSize: '0.75rem', fontWeight: 500, padding: '0.4rem 0.8rem', borderRadius: '20px', cursor: 'pointer', textTransform: 'capitalize' },
  categoryChipActive: { background: '#F5A623', border: '1px solid #F5A623', color: '#0A0A0A', fontWeight: 600 },
  visibilityRow: { display: 'flex', gap: '0.5rem' },
  visBtn: { flex: 1, display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '0.7rem 0.8rem', cursor: 'pointer', textAlign: 'left' },
  visBtnActive: { background: '#F5A623', border: '1px solid #F5A623' },
  visTitle: { fontSize: '0.8rem', fontWeight: 600, color: 'inherit' },
  visSub: { fontSize: '0.68rem', color: 'inherit', opacity: 0.7 },
  toggleRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '0.75rem 0.9rem', cursor: 'pointer', width: '100%' },
  error: { background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', color: '#E53E3E', fontSize: '0.8rem', padding: '0.7rem 0.9rem', borderRadius: '10px' },
  footer: { padding: '0.75rem 1.25rem 1.25rem', borderTop: '1px solid #1A1A1A', background: '#0D0D0D' },
  createBtn: { width: '100%', background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '12px', padding: '0.95rem', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 8px 24px -8px rgba(245,166,35,0.6)' },
}
