import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { X, Heart, Loader } from 'lucide-react'

const REASONS = [
  { id: 'busy', label: 'I was too busy', emoji: '⏰' },
  { id: 'burnout', label: 'I felt burned out', emoji: '🔥' },
  { id: 'forgot', label: 'I simply forgot', emoji: '😅' },
  { id: 'no_idea', label: "I didn't know what to create", emoji: '💭' },
  { id: 'technical', label: 'Technical issues', emoji: '💻' },
  { id: 'personal', label: 'Personal/family reasons', emoji: '❤️' },
  { id: 'unmotivated', label: 'I felt unmotivated', emoji: '😔' },
  { id: 'perfectionism', label: 'Nothing felt good enough', emoji: '🎯' },
]

interface Props {
  streakLost: number
  onClose: () => void
}

export default function MissedDayReflection({ streakLost, onClose }: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState<'reason' | 'note' | 'ai'>('reason')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const selectReason = (r: string) => {
    setReason(r)
    setStep('note')
  }

  const getAIResponse = async () => {
    setLoading(true)
    setStep('ai')

    const selectedReason = REASONS.find(r => r.id === reason)
    const prompt = `A content creator just lost their ${streakLost}-day streak. Their reason: "${selectedReason?.label}". ${note ? `They added: "${note}"` : ''} Give them a short, honest, empathetic response (3-4 sentences). Acknowledge their specific situation, normalize what happened, and give ONE concrete action they can take tomorrow to restart. Be warm but direct — no toxic positivity.`

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      const response = data.choices?.[0]?.message?.content || "It's okay to miss a day. What matters is you're here now. Start fresh tomorrow with one small post."
      setAiResponse(response)

      // Save reflection
      await supabase.from('reflections').insert({
        user_id: user!.id,
        date: new Date().toISOString().split('T')[0],
        reason,
        note,
        ai_response: response,
        streak_at_loss: streakLost
      })
    } catch {
      setAiResponse("It's okay to miss a day. Every creator goes through this. What matters is you show up tomorrow — even with something small.")
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      <>
        <div style={styles.overlay} onClick={onClose} />
        <motion.div
          style={styles.modal}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.1rem' }}>
                {step === 'reason' ? 'What happened?' : step === 'note' ? 'Want to add anything?' : 'Your Coach Says'}
              </div>
              {streakLost > 0 && step === 'reason' && (
                <div style={{ color: '#555', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                  Your {streakLost}-day streak reset. That's okay.
                </div>
              )}
            </div>
            <button style={styles.closeBtn} onClick={onClose}>
              <X size={18} color="#555" />
            </button>
          </div>

          {/* Step 1 — Pick reason */}
          {step === 'reason' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {REASONS.map(r => (
                <button
                  key={r.id}
                  style={styles.reasonBtn}
                  onClick={() => selectReason(r.id)}
                >
                  <span style={{ fontSize: '1.1rem' }}>{r.emoji}</span>
                  <span style={{ fontSize: '0.88rem' }}>{r.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — Add note */}
          {step === 'note' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: '#0A0A0A', borderRadius: '10px', padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{REASONS.find(r => r.id === reason)?.emoji}</span>
                <span style={{ color: '#888', fontSize: '0.88rem' }}>{REASONS.find(r => r.id === reason)?.label}</span>
              </div>
              <textarea
                style={styles.textarea}
                placeholder="Anything else you want to share? (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={styles.primaryBtn} onClick={getAIResponse}>
                  Get Advice
                </button>
                <button style={styles.ghostBtn} onClick={() => setStep('reason')}>
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — AI Response */}
          {step === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                  <Loader size={18} color="#F5A623" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: '#555', fontSize: '0.88rem' }}>Your coach is thinking...</span>
                </div>
              ) : (
                <>
                  <div style={styles.aiCard}>
                    <Heart size={16} color="#F5A623" style={{ marginBottom: '0.5rem', flexShrink: 0 }} />
                    <p style={{ color: '#F0EDE8', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                      {aiResponse}
                    </p>
                  </div>
                  <button style={styles.primaryBtn} onClick={onClose}>
                    Start Fresh Tomorrow
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </>
    </AnimatePresence>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300
  },
  modal: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: '#111111', borderTop: '1px solid #1E1E1E',
    borderRadius: '20px 20px 0 0', padding: '1.5rem',
    zIndex: 301, maxHeight: '85vh', overflowY: 'auto'
  },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' },
  reasonBtn: {
    display: 'flex', alignItems: 'center', gap: '0.85rem',
    background: '#0A0A0A', border: '1px solid #1E1E1E',
    borderRadius: '10px', padding: '0.85rem 1rem',
    color: '#F0EDE8', cursor: 'pointer', textAlign: 'left' as const
  },
  textarea: {
    background: '#0A0A0A', border: '1px solid #1E1E1E',
    borderRadius: '10px', padding: '0.85rem 1rem',
    color: '#F0EDE8', fontSize: '0.92rem', outline: 'none',
    width: '100%', boxSizing: 'border-box' as const,
    fontFamily: 'Inter', resize: 'vertical' as const
  },
  primaryBtn: {
    flex: 1, background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '10px', padding: '0.85rem', fontWeight: '700',
    cursor: 'pointer', fontSize: '0.9rem'
  },
  ghostBtn: {
    background: 'none', border: '1px solid #1E1E1E',
    borderRadius: '10px', padding: '0.85rem 1.25rem',
    color: '#666', cursor: 'pointer', fontSize: '0.9rem'
  },
  aiCard: {
    background: '#1A1400', border: '1px solid #F5A62330',
    borderRadius: '12px', padding: '1.1rem',
    display: 'flex', flexDirection: 'column', gap: '0.5rem'
  }
}
