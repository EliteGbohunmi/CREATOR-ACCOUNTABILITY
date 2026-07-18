import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { Flame, Trophy, Medal } from 'lucide-react'

export default function Leaderboard() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLeaderboard() }, [])

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('streaks')
      .select('*, profiles(name)')
      .order('current_streak', { ascending: false })
      .limit(20)
    setEntries(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: '64px', borderRadius: '12px', background: '#111', border: '1px solid #1E1E1E' }} />
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Rankings</p>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Leaderboard</h1>
        <p style={{ color: '#555', marginTop: '0.3rem', fontSize: '0.9rem' }}>Top 20 creators by current streak</p>
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div style={styles.podium}>
          {/* 2nd */}
          <div style={styles.podiumItem}>
            <div style={{ ...styles.podiumAvatar, borderColor: '#888' }}>
              <Medal size={18} color="#888" />
            </div>
            <div style={{ color: '#888', fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.3rem' }}>
              {entries[1]?.current_streak}
            </div>
            <div style={{ color: '#555', fontSize: '0.75rem' }}>{entries[1]?.profiles?.name?.split(' ')[0]}</div>
            <div style={{ ...styles.podiumBase, height: '48px', background: '#1A1A1A' }}>2</div>
          </div>

          {/* 1st */}
          <div style={{ ...styles.podiumItem, marginBottom: '1rem' }}>
            <Trophy size={20} color="#F5A623" style={{ marginBottom: '0.25rem' }} />
            <div style={{ ...styles.podiumAvatar, borderColor: '#F5A623' }}>
              <Flame size={20} color="#F5A623" />
            </div>
            <div style={{ color: '#F5A623', fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.6rem' }}>
              {entries[0]?.current_streak}
            </div>
            <div style={{ color: '#888', fontSize: '0.75rem' }}>{entries[0]?.profiles?.name?.split(' ')[0]}</div>
            <div style={{ ...styles.podiumBase, height: '64px', background: '#1A1400' }}>1</div>
          </div>

          {/* 3rd */}
          <div style={styles.podiumItem}>
            <div style={{ ...styles.podiumAvatar, borderColor: '#8B6914' }}>
              <Medal size={18} color="#8B6914" />
            </div>
            <div style={{ color: '#8B6914', fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.3rem' }}>
              {entries[2]?.current_streak}
            </div>
            <div style={{ color: '#555', fontSize: '0.75rem' }}>{entries[2]?.profiles?.name?.split(' ')[0]}</div>
            <div style={{ ...styles.podiumBase, height: '36px', background: '#1A1500' }}>3</div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {entries.map((entry, index) => {
          const isMe = entry.user_id === user?.id
          const rank = index + 1
          return (
            <div
              key={entry.user_id}
              style={{
                ...styles.row,
                background: isMe ? '#1A1400' : '#111111',
                border: isMe ? '1px solid #F5A62340' : '1px solid #1E1E1E'
              }}
            >
              <div style={styles.rank}>
                {rank === 1 ? <Trophy size={15} color="#F5A623" /> :
                 rank === 2 ? <Medal size={15} color="#888" /> :
                 rank === 3 ? <Medal size={15} color="#8B6914" /> :
                 <span style={{ color: '#444', fontSize: '0.8rem', fontWeight: '600' }}>{rank}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', fontSize: '0.9rem', color: isMe ? '#F5A623' : '#F0EDE8' }}>
                  {entry.profiles?.name || 'Creator'}
                  {isMe && <span style={{ color: '#F5A623', fontSize: '0.72rem', marginLeft: '0.5rem' }}>you</span>}
                </div>
                <div style={{ color: '#555', fontSize: '0.75rem' }}>Best: {entry.best_streak} days</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Flame size={14} color="#F5A623" />
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1rem', color: '#F5A623' }}>
                  {entry.current_streak}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {entries.length === 0 && (
        <div style={styles.empty}>
          <Trophy size={32} color="#2A2A2A" style={{ marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, color: '#555' }}>No one on the leaderboard yet. Be the first.</p>
        </div>
      )}
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  podium: {
    display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
    gap: '1rem', marginBottom: '2rem', padding: '1rem 0'
  },
  podiumItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'
  },
  podiumAvatar: {
    width: '48px', height: '48px', borderRadius: '50%',
    border: '2px solid', background: '#0A0A0A',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  podiumBase: {
    width: '72px', borderRadius: '6px 6px 0 0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#444', fontSize: '0.8rem', fontWeight: '700', marginTop: '0.5rem'
  },
  row: {
    borderRadius: '12px', padding: '0.85rem 1rem',
    display: 'flex', alignItems: 'center', gap: '1rem'
  },
  rank: {
    width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  empty: {
    background: '#111111', border: '1px dashed #1E1E1E', borderRadius: '14px',
    padding: '2.5rem', color: '#555', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
  }
}
