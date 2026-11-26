import { useEffect, useState } from 'react'
import { MessageSquare, Send, ChevronDown } from 'lucide-react'
import { listMessages, postMessage } from '../../lib/challenges'

type Props = {
  challengeId: string
  userId: string
}

export default function ChallengeChat({ challengeId, userId }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const load = async () => {
    const m = await listMessages(challengeId)
    setMessages(m)
  }

  useEffect(() => { if (open) load() }, [open, challengeId])

  const send = async () => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    await postMessage(challengeId, userId, body)
    setDraft('')
    await load()
    setSending(false)
  }

  return (
    <div style={{ marginTop: '0.85rem' }}>
      <button style={styles.toggle} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MessageSquare size={13} color="#8A8A8A" />
          <span style={styles.toggleText}>Chat</span>
          {messages.length > 0 && <span style={styles.count}>{messages.length}</span>}
        </div>
        <ChevronDown size={14} color="#5C5C5C" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={styles.panel}>
          <div style={styles.messages}>
            {messages.length === 0 ? (
              <p style={styles.empty}>No messages yet. Be the first.</p>
            ) : (
              messages.map((m: any) => (
                <div key={m.id} style={styles.message}>
                  <span style={styles.messageAuthor}>{m.profiles?.name || 'Creator'}</span>
                  <span style={styles.messageBody}>{m.body}</span>
                </div>
              ))
            )}
          </div>
          <div style={styles.composer}>
            <input
              style={styles.input}
              placeholder="Say something..."
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button style={styles.sendBtn} onClick={send} disabled={sending || !draft.trim()}>
              <Send size={14} color="#0A0A0A" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  toggle: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid #1A1A1A', borderRadius: '10px', padding: '0.55rem 0.75rem', cursor: 'pointer' },
  toggleText: { color: '#8A8A8A', fontSize: '0.75rem', fontWeight: 500 },
  count: { background: '#F5A623', color: '#0A0A0A', fontSize: '0.62rem', fontWeight: 700, padding: '0.05rem 0.4rem', borderRadius: '8px' },
  panel: { background: '#0A0A0A', border: '1px solid #1A1A1A', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '0.6rem', marginTop: '-1px' },
  messages: { maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' },
  empty: { color: '#5C5C5C', fontSize: '0.75rem', textAlign: 'center', padding: '0.75rem 0' },
  message: { background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '0.45rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  messageAuthor: { color: '#F5A623', fontSize: '0.68rem', fontWeight: 600 },
  messageBody: { color: '#C8C8C8', fontSize: '0.78rem', lineHeight: 1.4 },
  composer: { display: 'flex', gap: '0.35rem' },
  input: { flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid #1E1E1E', borderRadius: '8px', padding: '0.5rem 0.7rem', color: '#F0EDE8', fontSize: '0.8rem', outline: 'none' },
  sendBtn: { background: '#F5A623', border: 'none', borderRadius: '8px', padding: '0 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
}
