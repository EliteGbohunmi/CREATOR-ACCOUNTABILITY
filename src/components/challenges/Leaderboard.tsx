import { motion } from 'framer-motion'
import { Trophy, Crown } from 'lucide-react'

type Participant = {
  user_id: string
  progress: number
  last_checked_in: string | null
  profiles?: { name: string | null }
}

type Props = {
  participants: Participant[]
  currentUserId: string
  totalDays: number
}

export default function Leaderboard({ participants, currentUserId, totalDays }: Props) {
  const ranked = [...participants].sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress
    const aT = a.last_checked_in ? new Date(a.last_checked_in).getTime() : 0
    const bT = b.last_checked_in ? new Date(b.last_checked_in).getTime() : 0
    return bT - aT
  })
  const myRank = ranked.findIndex(p => p.user_id === currentUserId)
  const podium = ranked.slice(0, 3)
  const rest = ranked.slice(3, 10)
  const medal = (i: number) => ['#F5A623', '#C0C0C0', '#CD7F32'][i] || '#5C5C5C'

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Trophy size={13} color="#F5A623" />
          <span style={styles.headerText}>Leaderboard</span>
        </div>
        <span style={styles.rankText}>You are #{myRank >= 0 ? myRank + 1 : '?'} of {ranked.length}</span>
      </div>

      {podium.length > 0 && (
        <div style={styles.podium}>
          {podium.map((p, i) => {
            const isMe = p.user_id === currentUserId
            return (
              <motion.div
                key={p.user_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ ...styles.podiumItem, ...(isMe ? styles.podiumItemMe : {}) }}
              >
                <div style={{ ...styles.medal, background: `${medal(i)}22`, borderColor: `${medal(i)}55` }}>
                  {i === 0 ? <Crown size={13} color={medal(i)} /> : <span style={{ color: medal(i), fontSize: '0.7rem', fontWeight: 700 }}>{i + 1}</span>}
                </div>
                <div style={styles.name}>{p.profiles?.name || 'Creator'}{isMe ? ' (you)' : ''}</div>
                <div style={styles.progress}>{p.progress}/{totalDays}</div>
              </motion.div>
            )
          })}
        </div>
      )}

      {rest.length > 0 && (
        <div style={styles.restList}>
          {rest.map((p, i) => {
            const isMe = p.user_id === currentUserId
            return (
              <div key={p.user_id} style={{ ...styles.restRow, ...(isMe ? styles.restRowMe : {}) }}>
                <span style={styles.rankNum}>{i + 4}</span>
                <span style={styles.restName}>{p.profiles?.name || 'Creator'}{isMe ? ' (you)' : ''}</span>
                <span style={styles.restProgress}>{p.progress}/{totalDays}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { background: 'rgba(255,255,255,0.02)', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '0.85rem', marginTop: '0.85rem' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' },
  headerText: { color: '#8A8A8A', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 },
  rankText: { color: '#5C5C5C', fontSize: '0.72rem' },
  podium: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' },
  podiumItem: { background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '10px', padding: '0.55rem 0.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', textAlign: 'center' },
  podiumItemMe: { border: '1px solid rgba(245,166,35,0.3)', background: 'rgba(245,166,35,0.04)' },
  medal: { width: '22px', height: '22px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid' },
  name: { fontSize: '0.72rem', fontWeight: 600, color: '#F0EDE8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' },
  progress: { fontSize: '0.65rem', color: '#5C5C5C' },
  restList: { marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  restRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.45rem', borderRadius: '8px', fontSize: '0.75rem' },
  restRowMe: { background: 'rgba(245,166,35,0.06)' },
  rankNum: { color: '#5C5C5C', fontWeight: 700, fontSize: '0.7rem', width: '16px', flexShrink: 0 },
  restName: { color: '#8A8A8A', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  restProgress: { color: '#5C5C5C', fontSize: '0.7rem' },
}
