import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import ShareCard from '../components/ShareCard'
import Heatmap from '../components/Heatmap'
import { Flame, CheckCircle2, Circle, BarChart2, TrendingUp, Calendar } from 'lucide-react'
import AICoach from '../components/AICoach'

export default function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [streak, setStreak] = useState<any>(null)
  const [todayDone, setTodayDone] = useState(false)
  const [tasksToday, setTasksToday] = useState<any[]>([])
  const [checkingIn, setCheckingIn] = useState(false)
  const [celebrated, setCelebrated] = useState(false)
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user) return
    fetchAll()
  }, [user])

  const fetchAll = async () => {
    const [{ data: prof }, { data: str }, { data: tasks }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user!.id).single(),
      supabase.from('streaks').select('*').eq('user_id', user!.id).single(),
      supabase.from('tasks').select('*').eq('user_id', user!.id).eq('date', today)
    ])
    setProfile(prof)
    setStreak(str)
    setTasksToday(tasks || [])
    if (str?.last_checked_in === today) setTodayDone(true)
    setLoading(false)
  }

  const handleCheckIn = async () => {
    setCheckingIn(true)
    const newStreak = (streak?.current_streak || 0) + 1
    const bestStreak = Math.max(newStreak, streak?.best_streak || 0)

    await supabase.from('streaks').update({
      current_streak: newStreak,
      best_streak: bestStreak,
      last_checked_in: today
    }).eq('user_id', user!.id)

    const { data: userChallenges } = await supabase
      .from('user_challenges')
      .select('*, challenges(*)')
      .eq('user_id', user!.id)

    if (userChallenges) {
      for (const uc of userChallenges) {
        if (uc.progress < uc.challenges.days) {
          await supabase
            .from('user_challenges')
            .update({ progress: uc.progress + 1 })
            .eq('id', uc.id)
        }
      }
    }

    setStreak((prev: any) => ({ ...prev, current_streak: newStreak, best_streak: bestStreak, last_checked_in: today }))
    setTodayDone(true)
    setCelebrated(true)
    setTimeout(() => setCelebrated(false), 3000)
    setCheckingIn(false)
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <Layout>
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ ...styles.skel, width: '80px', height: '12px', marginBottom: '0.5rem' }} />
            <div style={{ ...styles.skel, width: '160px', height: '28px', marginBottom: '0.4rem' }} />
            <div style={{ ...styles.skel, width: '260px', height: '14px' }} />
          </div>
          <div style={{ ...styles.skel, height: '110px', borderRadius: '16px', marginBottom: '1rem' }} />
          <div style={{ ...styles.skel, height: '52px', borderRadius: '12px', marginBottom: '1rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ ...styles.skel, height: '80px', borderRadius: '12px' }} />
            <div style={{ ...styles.skel, height: '80px', borderRadius: '12px' }} />
            <div style={{ ...styles.skel, height: '80px', borderRadius: '12px' }} />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
            {greeting()}
          </p>
          <h1 style={{ fontSize: '2rem', fontFamily: 'Space Grotesk', fontWeight: '700', color: '#F0EDE8' }}>
            {profile?.name?.split(' ')[0] || 'Creator'}
          </h1>
          <p style={{ color: todayDone ? '#4CAF50' : '#666', marginTop: '0.3rem', fontSize: '0.9rem' }}>
            {todayDone ? "You've checked in today. Keep the streak alive." : "You haven't posted yet today. Don't break the streak."}
          </p>
        </div>

        {/* Streak card */}
        <motion.div
          style={{
            ...styles.streakCard,
            border: celebrated ? '1px solid #F5A62360' : '1px solid #1E1E1E'
          }}
          animate={celebrated ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={styles.flameWrap}>
              <Flame size={28} color="#F5A623" />
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#F5A623', lineHeight: 1 }}>
                {streak?.current_streak ?? 0}
              </div>
              <div style={{ color: '#555', fontSize: '0.85rem', marginTop: '0.2rem' }}>day streak</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Best</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Space Grotesk', color: '#F0EDE8' }}>
              {streak?.best_streak ?? 0}
            </div>
          </div>
        </motion.div>

        {/* Check-in button */}
        {!todayDone ? (
          <motion.button
            style={styles.checkInBtn}
            onClick={handleCheckIn}
            disabled={checkingIn}
            whileTap={{ scale: 0.98 }}
          >
            <CheckCircle2 size={20} color="#0A0A0A" />
            {checkingIn ? 'Saving...' : 'I Posted Today'}
          </motion.button>
        ) : (
          <div style={styles.checkedIn}>
            <CheckCircle2 size={18} color="#4CAF50" />
            {celebrated ? 'Streak extended! Keep going.' : 'Checked in for today'}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <ShareCard
            name={profile?.name || 'Creator'}
            streak={streak?.current_streak || 0}
            bestStreak={streak?.best_streak || 0}
          />
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          <StatCard label="Current Streak" value={`${streak?.current_streak ?? 0}`} unit="days" icon={<Flame size={16} color="#F5A623" />} />
          <StatCard label="Best Streak" value={`${streak?.best_streak ?? 0}`} unit="days" icon={<TrendingUp size={16} color="#F5A623" />} />
          <StatCard label="Today" value={todayDone ? 'Done' : 'Pending'} unit="" icon={<BarChart2 size={16} color="#F5A623" />} />
        </div>

        {/* Today's tasks */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={16} color="#555" />
            <span style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's Plan</span>
          </div>
          {tasksToday.length === 0 ? (
            <div style={styles.emptyBox}>
              No tasks planned for today. <a href="/planner" style={{ color: '#F5A623' }}>Add some →</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tasksToday.map(task => (
                <TaskItem key={task.id} task={task} onToggle={fetchAll} />
              ))}
            </div>
          )}
        </div>

        {/* Heatmap */}
        <Heatmap />

      </motion.div>
      <AICoach
  streak={streak?.current_streak || 0}
  name={profile?.name || 'Creator'}
  todayDone={todayDone}
  tasksCount={tasksToday.length}
/>
    </Layout>
  )
}

function TaskItem({ task, onToggle }: any) {
  const toggle = async () => {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id)
    onToggle()
  }
  return (
    <div style={{ ...styles.taskItem, opacity: task.completed ? 0.5 : 1 }} onClick={toggle}>
      {task.completed
        ? <CheckCircle2 size={18} color="#4CAF50" />
        : <Circle size={18} color="#444" />
      }
      <span style={{ flex: 1, textDecoration: task.completed ? 'line-through' : 'none', fontSize: '0.95rem' }}>
        {task.title}
      </span>
      {task.platform && <span style={styles.platform}>{task.platform}</span>}
    </div>
  )
}

function StatCard({ label, value, unit, icon }: { label: string; value: string; unit: string; icon: React.ReactNode }) {
  return (
    <div style={styles.statCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
        {icon}
        <span style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.6rem', color: '#F0EDE8', lineHeight: 1 }}>
        {value}
      </div>
      {unit && <div style={{ color: '#444', fontSize: '0.78rem', marginTop: '0.25rem' }}>{unit}</div>}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  skel: {
    background: 'linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px'
  },
  streakCard: {
    background: '#111111', borderRadius: '16px', padding: '1.75rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1rem'
  },
  flameWrap: {
    background: '#1A1400', borderRadius: '12px', padding: '0.75rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  checkInBtn: {
    width: '100%', background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '12px', padding: '1rem', fontSize: '1rem', fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.6rem', cursor: 'pointer', marginBottom: '0.5rem'
  },
  checkedIn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.6rem', padding: '1rem', background: '#111111',
    border: '1px solid #1E1E1E', borderRadius: '12px', color: '#4CAF50',
    fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.95rem'
  },
  emptyBox: {
    background: '#111111', border: '1px dashed #1E1E1E', borderRadius: '12px',
    padding: '1.5rem', color: '#555', textAlign: 'center', fontSize: '0.9rem'
  },
  taskItem: {
    background: '#111111', border: '1px solid #1E1E1E', borderRadius: '10px',
    padding: '0.9rem 1rem', display: 'flex', alignItems: 'center',
    gap: '0.75rem', cursor: 'pointer'
  },
  platform: {
    background: '#1A1400', color: '#F5A623', padding: '0.2rem 0.65rem',
    borderRadius: '20px', fontSize: '0.72rem', fontWeight: '500'
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem', marginTop: '1.5rem'
  },
  statCard: {
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '12px', padding: '1.1rem'
  }
}
