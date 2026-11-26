import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Sparkles, Lock, Globe, Loader, Wand2, RefreshCw, Shield,
  Calendar, Tag, Check, AlertCircle, Eye, Hash,
} from 'lucide-react'
import {
  CATEGORIES, TEMPLATES, createChallenge, generateCode, validateCode,
  type Challenge,
} from '../../lib/challenges'

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
  const [customCode, setCustomCode] = useState('')
  const [codeMode, setCodeMode] = useState<'auto' | 'manual'>('auto')
  const [showPreview, setShowPreview] = useState(false)

  const previewCode = useMemo(() => {
    if (codeMode === 'manual' && customCode.trim()) return customCode.trim().toUpperCase()
    if (visibility === 'private') return generateCode()
    return null
  }, [codeMode, customCode, visibility])

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    setName(t.name)
    setDays(String(t.days))
    setCategory(t.category)
  }

  const regenCode = () => setCustomCode(generateCode())

  const submit = async () => {
    setError('')
    const n = name.trim()
    const d = parseInt(days)
    if (!n) { setError('Give your challenge a name'); return }
    if (n.length > 60) { setError('Name is too long (max 60)'); return }
    if (!d || d < 1 || d > 365) { setError('Days must be between 1 and 365'); return }
    if (visibility === 'private' && codeMode === 'manual') {
      if (!customCode.trim()) { setError('Enter a code or switch to auto-generate'); return }
      if (!validateCode(customCode)) { setError('Code must be 4–8 letters or numbers'); return }
    }
    setCreating(true)
    const { data, error: err } = await createChallenge({
      userId,
      name: n,
      days: d,
      visibility,
      proofRequired,
      category,
      customCode: visibility === 'private' && codeMode === 'manual' ? customCode : null,
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
              <p style={styles.subtitle}>Design it once. Show up daily.</p>
            </div>
            <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} color="#8A8A8A" />
            </button>
          </div>

          <div style={styles.body}>
            {/* 1. Templates */}
            <div>
              <p style={styles.label}><Sparkles size={11} color="#F5A623" /> Quick start</p>
              <div style={styles.templateGrid}>
                {TEMPLATES.map((t) => (
                  <button key={t.label} style={styles.templateChip} onClick={() => applyTemplate(t)}>
                    <span>{t.emoji}</span>
                    <span style={styles.templateText}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Name */}
            <div>
              <div style={styles.labelRow}>
                <p style={styles.label}><Tag size={11} color="#F5A623" /> Name</p>
                <span style={styles.counter}>{name.length}/60</span>
              </div>
              <input
                style={styles.input}
                placeholder="e.g. 30 Days of Reels"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 60))}
                maxLength={60}
              />
            </div>

            {/* 3. Days + quick presets */}
            <div>
              <p style={styles.label}><Calendar size={11} color="#F5A623" /> Duration</p>
              <div style={styles.presetRow}>
                {[7, 14, 21, 30, 60, 100].map((d) => (
                  <button
                    key={d}
                    style={{ ...styles.presetChip, ...(days === String(d) ? styles.presetActive : {}) }}
                    onClick={() => setDays(String(d))}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <input
                style={{ ...styles.input, maxWidth: '160px', marginTop: '0.5rem' }}
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>

            {/* 4. Category */}
            <div>
              <p style={styles.label}><Hash size={11} color="#F5A623" /> Category</p>
              <div style={styles.categoryRow}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    style={{ ...styles.categoryChip, ...(category === c ? styles.categoryChipActive : {}) }}
                    onClick={() => setCategory(c)}
                  >
                    {category === c && <Check size={11} />}
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Visibility */}
            <div>
              <p style={styles.label}><Globe size={11} color="#F5A623" /> Who can join?</p>
              <div style={styles.visibilityRow}>
                <button
                  style={{ ...styles.visBtn, ...(visibility === 'public' ? styles.visBtnActive : {}) }}
                  onClick={() => setVisibility('public')}
                >
                  <Globe size={16} color={visibility === 'public' ? '#0A0A0A' : '#8A8A8A'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={styles.visTitle}>Public</div>
                    <div style={styles.visSub}>Anyone can join</div>
                  </div>
                </button>
                <button
                  style={{ ...styles.visBtn, ...(visibility === 'private' ? styles.visBtnActive : {}) }}
                  onClick={() => setVisibility('private')}
                >
                  <Lock size={16} color={visibility === 'private' ? '#0A0A0A' : '#8A8A8A'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={styles.visTitle}>Private</div>
                    <div style={styles.visSub}>Code required</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 6. Access code (private only) */}
            {visibility === 'private' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
                <div style={styles.codeSection}>
                  <p style={styles.label}><Wand2 size={11} color="#F5A623" /> Access code</p>
                  <div style={styles.codeModeRow}>
                    <button
                      style={{ ...styles.codeModeBtn, ...(codeMode === 'auto' ? styles.codeModeActive : {}) }}
                      onClick={() => setCodeMode('auto')}
                    >
                      Auto-generate
                    </button>
                    <button
                      style={{ ...styles.codeModeBtn, ...(codeMode === 'manual' ? styles.codeModeActive : {}) }}
                      onClick={() => setCodeMode('manual')}
                    >
                      I'll choose
                    </button>
                  </div>

                  {codeMode === 'auto' ? (
                    <div style={styles.autoCodeBox}>
                      <div>
                        <div style={styles.codeLabel}>Generated code</div>
                        <div style={styles.codeValue}>{previewCode}</div>
                      </div>
                      <div style={styles.codeHint}>A fresh code is generated when you hit Create</div>
                    </div>
                  ) : (
                    <>
                      <div style={styles.manualRow}>
                        <input
                          style={styles.codeInput}
                          placeholder="e.g. REELS30"
                          value={customCode}
                          onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                          maxLength={8}
                        />
                        <button style={styles.regenBtn} onClick={regenCode} title="Random code">
                          <RefreshCw size={14} color="#F5A623" />
                        </button>
                      </div>
                      <p style={styles.codeHelp}>4–8 letters or numbers. Must be unique.</p>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* 7. Proof */}
            <button
              style={{ ...styles.toggleRow, borderColor: proofRequired ? 'rgba(245,166,35,0.35)' : '#1E1E1E' }}
              onClick={() => setProofRequired(!proofRequired)}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '7px',
                  border: `1.5px solid ${proofRequired ? '#F5A623' : '#5C5C5C'}`,
                  background: proofRequired ? '#F5A623' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {proofRequired && <Check size={13} color="#0A0A0A" strokeWidth={3} />}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={12} color="#4CAF50" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F0EDE8' }}>Require proof</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#5C5C5C', marginTop: '0.1rem' }}>
                  Participants upload proof each check-in
                </div>
              </div>
            </button>

            {/* 8. Live preview */}
            <button style={styles.previewToggle} onClick={() => setShowPreview(!showPreview)}>
              <Eye size={12} color="#8A8A8A" />
              {showPreview ? 'Hide preview' : 'Show preview'}
            </button>

            {showPreview && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={styles.previewCard}>
                <div style={styles.previewGlow} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  <span style={styles.previewCategory}>{category}</span>
                  {visibility === 'private' && <span style={styles.previewPrivate}><Lock size={8} /> Private</span>}
                  {proofRequired && <span style={styles.previewProof}><Shield size={8} /> Proof</span>}
                </div>
                <div style={styles.previewName}>{name || 'Your challenge name'}</div>
                <div style={styles.previewMeta}>
                  <span>{days || 0} days</span>
                  <span>·</span>
                  <span>{visibility === 'private' ? 'Code required' : 'Open to all'}</span>
                </div>
              </motion.div>
            )}

            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={14} color="#E53E3E" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div style={styles.footer}>
            <button style={styles.createBtn} onClick={submit} disabled={creating}>
              {creating ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {creating ? 'Creating…' : 'Create challenge'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '1rem' },
  sheet: { width: '100%', maxWidth: '540px', maxHeight: '92vh', background: 'linear-gradient(180deg, #161616 0%, #0A0A0A 100%)', border: '1px solid #262626', borderRadius: '26px 26px 18px 18px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.03)' },
  handle: { width: '40px', height: '4px', borderRadius: '2px', background: '#2E2E2E', margin: '0.65rem auto 0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem 1.25rem 0.75rem' },
  eyebrow: { color: '#F5A623', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.25rem', fontWeight: 700 },
  title: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.35rem', color: '#F5F1EA', letterSpacing: '-0.02em', lineHeight: 1.1 },
  subtitle: { color: '#6B6B6B', fontSize: '0.78rem', marginTop: '0.3rem' },
  closeBtn: { width: '34px', height: '34px', borderRadius: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid #262626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  body: { padding: '0.5rem 1.25rem 1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#8A8A8A', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.5rem', fontWeight: 700 },
  counter: { color: '#5C5C5C', fontSize: '0.68rem', fontWeight: 600 },
  templateGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' },
  templateChip: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.18)', color: '#F5A623', fontSize: '0.72rem', fontWeight: 600, padding: '0.55rem 0.6rem', borderRadius: '11px', cursor: 'pointer', textAlign: 'left' },
  templateText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  input: { width: '100%', background: '#0A0A0A', border: '1px solid #262626', borderRadius: '11px', padding: '0.75rem 0.9rem', color: '#F5F1EA', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
  presetRow: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' },
  presetChip: { background: 'transparent', border: '1px solid #262626', color: '#8A8A8A', fontSize: '0.74rem', fontWeight: 600, padding: '0.4rem 0.7rem', borderRadius: '8px', cursor: 'pointer' },
  presetActive: { background: 'rgba(245,166,35,0.14)', border: '1px solid rgba(245,166,35,0.4)', color: '#F5A623' },
  categoryRow: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  categoryChip: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: '1px solid #262626', color: '#8A8A8A', fontSize: '0.75rem', fontWeight: 600, padding: '0.42rem 0.8rem', borderRadius: '20px', cursor: 'pointer', textTransform: 'capitalize' },
  categoryChipActive: { background: 'linear-gradient(135deg, #F5A623, #E1921D)', border: '1px solid #F5A623', color: '#0A0A0A' },
  visibilityRow: { display: 'flex', gap: '0.5rem' },
  visBtn: { flex: 1, display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#0A0A0A', border: '1px solid #262626', borderRadius: '13px', padding: '0.7rem 0.8rem', cursor: 'pointer', textAlign: 'left' },
  visBtnActive: { background: 'linear-gradient(135deg, #F5A623, #D9821A)', border: '1px solid #F5A623' },
  visTitle: { fontSize: '0.82rem', fontWeight: 700, color: 'inherit' },
  visSub: { fontSize: '0.68rem', color: 'inherit', opacity: 0.75 },
  codeSection: { background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.18)', borderRadius: '14px', padding: '0.85rem', marginTop: '0.1rem' },
  codeModeRow: { display: 'flex', gap: '0.35rem', marginBottom: '0.65rem' },
  codeModeBtn: { flex: 1, background: 'transparent', border: '1px solid #262626', color: '#8A8A8A', fontSize: '0.72rem', fontWeight: 600, padding: '0.45rem', borderRadius: '8px', cursor: 'pointer' },
  codeModeActive: { background: 'rgba(245,166,35,0.14)', border: '1px solid rgba(245,166,35,0.4)', color: '#F5A623' },
  autoCodeBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: '#0A0A0A', border: '1px dashed rgba(245,166,35,0.35)', borderRadius: '10px', padding: '0.65rem 0.85rem' },
  codeLabel: { color: '#6B6B6B', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 },
  codeValue: { color: '#F5A623', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '0.22em', marginTop: '0.15rem' },
  codeHint: { color: '#5C5C5C', fontSize: '0.66rem', textAlign: 'right', maxWidth: '120px', lineHeight: 1.3 },
  manualRow: { display: 'flex', gap: '0.4rem' },
  codeInput: { flex: 1, background: '#0A0A0A', border: '1px solid #262626', borderRadius: '10px', padding: '0.65rem 0.85rem', color: '#F5F1EA', fontSize: '0.92rem', outline: 'none', letterSpacing: '0.22em', fontFamily: 'Space Grotesk', fontWeight: 700 },
  regenBtn: { width: '44px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  codeHelp: { color: '#5C5C5C', fontSize: '0.68rem', marginTop: '0.45rem' },
  toggleRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0A0A0A', border: '1px solid #262626', borderRadius: '13px', padding: '0.75rem 0.9rem', cursor: 'pointer', width: '100%' },
  previewToggle: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'transparent', border: 'none', color: '#6B6B6B', fontSize: '0.72rem', cursor: 'pointer', padding: 0 },
  previewCard: { position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #161616, #0B0B0B)', border: '1px solid #262626', borderRadius: '16px', padding: '0.9rem' },
  previewGlow: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(245,166,35,0.15), transparent 60%)', pointerEvents: 'none' },
  previewCategory: { background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', color: '#F5A623', fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '20px', textTransform: 'capitalize' },
  previewPrivate: { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A', color: '#A0A0A0', fontSize: '0.6rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px' },
  previewProof: { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', color: '#4CAF50', fontSize: '0.6rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px' },
  previewName: { position: 'relative', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.05rem', color: '#F5F1EA', letterSpacing: '-0.015em' },
  previewMeta: { position: 'relative', display: 'flex', gap: '0.4rem', color: '#7A7A7A', fontSize: '0.72rem', marginTop: '0.3rem' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', color: '#E53E3E', fontSize: '0.8rem', padding: '0.7rem 0.9rem', borderRadius: '11px' },
  footer: { padding: '0.75rem 1.25rem 1.25rem', borderTop: '1px solid #1A1A1A', background: '#0A0A0A' },
  createBtn: { width: '100%', background: 'linear-gradient(135deg, #F5A623, #E1921D)', color: '#0A0A0A', border: 'none', borderRadius: '13px', padding: '0.95rem', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 10px 28px -10px rgba(245,166,35,0.6)' },
}
