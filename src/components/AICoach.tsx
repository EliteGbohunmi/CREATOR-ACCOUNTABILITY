import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  streak: number
  name: string
  todayDone: boolean
  tasksCount: number
}

export default function AICoach({ streak, name, todayDone, tasksCount }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<{ role: string; content: string }[]>([])
const messagesEndRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [history, loading])
  const systemPrompt = 'You are an accountability coach for a content creator named ' + name + '. Their current streak is ' + streak + ' days. They ' + (todayDone ? 'have' : 'have NOT') + ' posted today. They have ' + tasksCount + ' tasks planned. Be motivating, direct, and personal. Keep responses under 3 sentences.'

  const askCoach = async (userMessage: string) => {
    if (!userMessage.trim()) return
    setLoading(true)

    const newHistory = [...history, { role: 'user', content: userMessage }]
    setHistory(newHistory)
    setInput('')

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + import.meta.env.VITE_GROQ_API_KEY
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 150,
          messages: [
            { role: 'system', content: systemPrompt },
            ...newHistory.map((h) => ({
              role: h.role,
              content: h.content
            }))
          ]
        })
      })

      const data = await response.json()

      if (data.error) {
        setHistory([...newHistory, { role: 'assistant', content: 'API Error: ' + data.error.message }])
        setLoading(false)
        return
      }

      const reply = data.choices[0].message.content
      setHistory([...newHistory, { role: 'assistant', content: reply }])

    } catch (err: any) {
      setHistory([...newHistory, { role: 'assistant', content: 'Network Error: ' + err.message }])
    }

    setLoading(false)
  }

  const openCoach = () => {
    setOpen(true)
    if (history.length === 0) {
      askCoach('Give me a personalized greeting and motivational nudge based on my streak and whether I posted today.')
    }
  }

  return (
    <>
      <motion.button style={styles.fab} onClick={openCoach} whileTap={{ scale: 0.95 }}>
        🤖
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            style={styles.drawer}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div style={styles.drawerHeader}>
              <div>
                <div style={{ fontWeight: '700', fontFamily: 'Space Grotesk' }}>AI Coach</div>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>Powered by Groq</div>
              </div>
              <button style={styles.closeBtn} onClick={() => setOpen(false)}>X</button>
            </div>

<div style={styles.messages}>
  {history.map((h, i) => (
    <div key={i} style={{
      ...styles.bubble,
      alignSelf: h.role === 'user' ? 'flex-end' : 'flex-start',
      background: h.role === 'user' ? '#F5A623' : '#2A2A2A',
      color: h.role === 'user' ? '#0F0F0F' : '#F0EDE8'
    }}>
      {h.content}
    </div>
  ))}
  {loading && (
    <div style={{ ...styles.bubble, background: '#2A2A2A', alignSelf: 'flex-start', color: '#888' }}>
      Thinking...
    </div>
  )}
  <div ref={messagesEndRef} />
</div>

            <div style={styles.inputRow}>
              <input
                style={styles.input}
                placeholder="Ask your coach anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askCoach(input)}
              />
              <button style={styles.sendBtn} onClick={() => askCoach(input)} disabled={loading}>
                →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {open && <div style={styles.overlay} onClick={() => setOpen(false)} />}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  fab: { position: 'fixed', bottom: '7rem', right: '1.5rem', width: '56px', height: '56px', borderRadius: '50%', background: '#F5A623', border: 'none', fontSize: '1.5rem', boxShadow: '0 4px 20px rgba(245,166,35,0.4)', zIndex: 100, cursor: 'pointer' },
  drawer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1C1C1C', borderTop: '1px solid #2A2A2A', borderRadius: '20px 20px 0 0', padding: '1.25rem', zIndex: 200, maxHeight: '70vh', display: 'flex', flexDirection: 'column', gap: '1rem' },
  drawerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', color: '#888', fontSize: '1.1rem', cursor: 'pointer' },
  messages: { display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, maxHeight: '40vh' },
  bubble: { padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '85%' },
  inputRow: { display: 'flex', gap: '0.5rem' },
  input: { flex: 1, background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '0.75rem 1rem', color: '#F0EDE8', fontSize: '0.95rem', outline: 'none' },
  sendBtn: { background: '#F5A623', color: '#0F0F0F', border: 'none', borderRadius: '8px', padding: '0.75rem 1rem', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }
}
