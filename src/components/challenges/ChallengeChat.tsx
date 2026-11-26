import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send } from 'lucide-react'
import { listMessages, postMessage } from '../../lib/challenges'

type Props = { challengeId: string; userId: string; embedded?: boolean }

export default function ChallengeChat({ challengeId, userId, embedded = false }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    const m = await listMessages(challengeId)
    setMessages(m)
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  useEffect(() => {
    if (embedded || open) load()
  }, [open, embedded, challengeId])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    const ok = await postMessage(challengeId, userId, body)
    setSending(false)
    if (ok) { setText(''); await load() }
  }

  const ChatBody = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div ref={listRef} style={styles.list}>
        {messages.length === 0 ? (
          <p style={styles.empty}>No messages yet. Say hi 👋</p>
        ) : (
          messages.map((m, i) => {
            const mine = m.user_id === userId
            return (
              <div key={m.id || i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                <div style={{ ...styles.bubble, ...(mine ? styles.bubbleMine : styles.bubbleOther) }}>
                  {!mine && <div style={styles.sender}>{m.profiles?.name || 'Member'}</div>}
                  <div style={styles.bodyText}>{m.body}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
      <div style={styles.composer}>
        <input
          style={styles.input}
          placeholder="Write a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
        />
        <button style={styles.send} onClick={send} disabled={sending || !text.trim()}>
          <Send size={16} color="#0A0A0A" />
        </button>
      </div>
    </div>
  )

  if (embedded) return <div style={{ height: '360px' }}>{ChatBody}</div>

  return (
    <>
      <button onClick={() => setOpen(true)} style={styles.chatBtn}>
        <MessageCircle size={14} color="#F5A623" />
        Challenge chat
        {messages.length > 0 && <span style={styles.count}>{messages.length}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.overlay} onClick={() => setOpen(false)}>
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              style={styles.sheet} onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.header}>
                <div>
                  <p style={styles.eyebrow}>Messages</p>
                  <h3 style={styles.title}>Challenge chat</h3>
                </div>
                <button style={styles.close} onClick={() => setOpen(false)}>
                  <X size={18} color="#8A8A8A" />
                </button>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>{ChatBody}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  chatBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.22)', color: '#F5A623', borderRadius: '10px', padding: '0.5rem 0.85rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  count: { background: '#F5A623', color: '#0A0A0A', borderRadius: '10px', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 600, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '1rem' },
  sheet: { width: '100%', maxWidth: '520px', height: '75vh', background: 'linear-gradient(180deg, #161616 0%, #0A0A0A 100%)', border: '1px solid #262626', borderRadius: '24px 24px 16px 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.9)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid #1A1A1A' },
  eyebrow: { color: '#F5A623', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15rem', fontWeight: 700 },
  title: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem', color: '#F5F1EA' },
  close: { width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid #262626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  list: { flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  empty: { color: '#5C5C5C', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' },
  bubble: { maxWidth: '80%', borderRadius: '14px', padding: '0.55rem 0.8rem', fontSize: '0.85rem' },
  bubbleMine: { background: 'rgba(245,166,35,0.14)', border: '1px solid rgba(245,166,35,0.25)', color: '#F5F1EA' },
  bubbleOther: { background: 'rgba(255,255,255,0.04)', border: '1px solid #262626', color: '#F5F1EA' },
  sender: { color: '#8A8A8A', fontSize: '0.68rem', fontWeight: 600, marginBottom: '0.15rem' },
  bodyText: { lineHeight: 1.35, wordBreak: 'break-word' },
  composer: { display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid #1A1A1A' },
  input: { flex: 1, background: '#0A0A0A', border: '1px solid #262626', borderRadius: '10px', padding: '0.7rem 0.9rem', color: '#F5F1EA', fontSize: '0.88rem', outline: 'none' },
  send: { width: '42px', height: '42px', borderRadius: '10px', background: '#F5A623', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
}
