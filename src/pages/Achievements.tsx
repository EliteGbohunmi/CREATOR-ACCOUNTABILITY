import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { ACHIEVEMENTS, checkAndAwardAchievements } from '../lib/achievements'
import { Award, Lock } from 'lucide-react'

export default function Achievements() {
  const { user } = useAuth()
  const [earned, setEarned] = useState<string[]>([])
  const [newlyEarned, setNewlyEarned] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAndCheck() }, [])

  const fetchAndCheck = async () => {
    const newOnes = await checkAndAwardAchievements(user!.id)
    setNewlyEarned(newOnes)

    const { data } = await supabase
      .from('achievements')
      .select('type')
      .eq('user_id', user!.id)

    setEarned((data || []).map((a: any) => a.type))
    setLoading(false)
  }

  const earnedCount = earned.length
  const totalCount = ACHIEVEMENTS.length

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '2rem' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: '120px', borderRadius: '14px', background: '#111', border: '1px solid #1E1E1E' }} />
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Badges</p>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Achievements</h1>
        <p style={{ color: '#555', marginTop: '0.3rem', fontSize: '0.9rem' }}>{earnedCount} of {totalCount} earned</p>
      </div>

      {/* Progress bar */}
      <div style={styles.progressCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <span style={{ color: '#888', fontSize: '0.8rem' }}>Overall progress</span>
          <span style={{ color: '#F5A623', fontWeight: '700', fontFamily: 'Space Grotesk' }}>
            {Math.round((earnedCount / totalCount) * 100)}%
          </span>
        </div>
        <div style={styles.progressTrack}>
          <motion.div
            style={styles.progressFill}
            initial={{ width: 0 }}
            animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Newly earned banner */}
      {newlyEarned.length > 0 && (
        <motion.div
          style={styles.newBanner}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Award size={16} color="#F5A623" />
          <span>You just earned {newlyEarned.length} new badge{newlyEarned.length > 1 ? 's' : ''}!</span>
        </motion.div>
      )}

      {/* Earned */}
      {earnedCount > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={styles.sectionLabel}>Earned</div>
          <div style={styles.grid}>
            {ACHIEVEMENTS.filter(a => earned.includes(a.type)).map(a => (
              <motion.div
                key={a.type}
                style={{
                  ...styles.badge,
                  border: newlyEarned.includes(a.type) ? '1px solid #F5A62360' : '1px solid #1E1E1E',
                  background: newlyEarned.includes(a.type) ? '#1A1400' : '#111111'
                }}
                initial={newlyEarned.includes(a.type) ? { scale: 0.9 } : {}}
                animate={newlyEarned.includes(a.type) ? { scale: 1 } : {}}
                transition={{ duration: 0.3 }}
              >
                <div style={styles.badgeIcon}>{a.icon}</div>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.2rem' }}>{a.label}</div>
                <div style={{ color: '#555', fontSize: '0.75rem', textAlign: 'center' }}>{a.desc}</div>
                {newlyEarned.includes(a.type) && (
                  <div style={styles.newTag}>New!</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      <div>
        <div style={styles.sectionLabel}>Locked</div>
        <div style={styles.grid}>
          {ACHIEVEMENTS.filter(a => !earned.includes(a.type)).map(a => (
            <div key={a.type} style={{ ...styles.badge, opacity: 0.4 }}>
              <div style={{ ...styles.badgeIcon, filter: 'grayscale(1)' }}>{a.icon}</div>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.2rem' }}>{a.label}</div>
              <div style={{ color: '#555', fontSize: '0.75rem', textAlign: 'center' }}>{a.desc}</div>
              <Lock size={12} color="#555" style={{ marginTop: '0.4rem' }} />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  progressCard: {
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '14px', padding: '1.1rem', marginBottom: '1.25rem'
  },
  progressTrack: {
    height: '6px', background: '#1E1E1E',
    borderRadius: '999px', overflow: 'hidden'
  },
  progressFill: {
    height: '100%', background: '#F5A623', borderRadius: '999px'
  },
  newBanner: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#1A1400', border: '1px solid #F5A62330',
    borderRadius: '10px', padding: '0.85rem 1rem',
    color: '#F5A623', fontSize: '0.88rem', fontWeight: '500',
    marginBottom: '1.25rem'
  },
  sectionLabel: {
    color: '#555', fontSize: '0.75rem', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: '0.75rem'
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem'
  },
  badge: {
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '14px', padding: '1.1rem',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.25rem', position: 'relative'
  },
  badgeIcon: {
    fontSize: '2rem', marginBottom: '0.4rem'
  },
  newTag: {
    position: 'absolute', top: '0.5rem', right: '0.5rem',
    background: '#F5A623', color: '#0A0A0A',
    fontSize: '0.65rem', fontWeight: '700',
    padding: '0.15rem 0.4rem', borderRadius: '20px'
  }
}
