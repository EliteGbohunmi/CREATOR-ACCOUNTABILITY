import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import ShareCard from '../components/ShareCard'
import Heatmap from '../components/Heatmap'
import { checkAndAwardAchievements } from '../lib/achievements'
import { Flame, CheckCircle2, Circle, Calendar, TrendingUp, User } from 'lucide-react'
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

  useEffect(() => { if (user) fetchAll() }, [user])

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
    // Reset streak if last check-in was before yesterday
if (str?.last_checked_in) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  if (str.last_checked_in < yesterdayStr) {
    await supabase.from('streaks').update({ current_streak: 0 }).eq('user_id', user!.id)
    setStreak((prev: any) => ({ ...prev, current_streak: 0 }))
  }
}
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
      .from('user_challenges').select('*, challenges(*)')
      .eq('user_id', user!.id).is('left_at', null)

    if (userChallenges) {
      for (const uc of userChallenges) {
        if (uc.progress < uc.challenges.days) {
          await supabase.from('user_challenges')
            .update({ progress: uc.progress + 1 }).eq('id', uc.id)
        }
      }
    }

    setStreak((prev: any) => ({ ...prev, current_streak: newStreak, best_streak: bestStreak, last_checked_in: today }))
    setTodayDone(true)
    setCelebrated(true)
    setTimeout(() => setCelebrated(false), 3000)
    await checkAndAwardAchievements(user!.id)
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ ...styles.skel, width: '52px', height: '52px', borderRadius: '50%' }} />
            <div>
              <div style={{ ...styles.skel, width: '80px', height: '12px', marginBottom: '0.4rem' }} />
              <div style={{ ...styles.skel, width: '140px', height: '22px' }} />
            </div>
          </div>
          <div style={{ ...styles.skel, height: '160px', borderRadius: '20px', marginBottom: '1rem' }} />
          <div style={{ ...styles.skel, height: '52px', borderRadius: '12px', marginBottom: '1rem' }} />
          <div style={{ ...styles.skel, height: '120px', borderRadius: '14px' }} />
        </div>
      </Layout>
    )
  }

  const firstName = profile?.name?.split(' ')[0] || 'Creator'

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>

        {/* Header with avatar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <p style={{ color: '#555', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
              {greeting()}
            </p>
            <h1 style={{ fontSize: '1.9rem', fontFamily: 'Space Grotesk', fontWeight: '700', color: '#F0EDE8', lineHeight: 1.1 }}>
              {firstName} 👋
            </h1>
            <p style={{ color: todayDone ? '#4CAF50' : '#666', marginTop: '0.35rem', fontSize: '0.85rem' }}>
              {todayDone ? 'You\'ve posted today. Streak alive.' : 'Haven\'t posted yet. Don\'t break the streak.'}
            </p>
          </div>
          <div style={styles.avatarWrap}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <User size={22} color="#555" />
            }
          </div>
        </div>

        {/* Streak hero card */}
        <motion.div
          style={{
            ...styles.streakCard,
            background: todayDone
              ? 'linear-gradient(135deg, #1A1400 0%, #0F0F0F 100%)'
              : 'linear-gradient(135deg, #111111 0%, #0A0A0A 100%)',
            borderColor: celebrated ? '#F5A62360' : todayDone ? '#F5A62325' : '#1E1E1E'
          }}
          animate={celebrated ? { scale: [1, 1.015, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={styles.flameWrap}>
                <Flame size={26} color="#F5A623" />
              </div>
              <div>
                <div style={{ fontSize: '3.5rem', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#F5A623', lineHeight: 1 }}>
                  {streak?.current_streak ?? 0}
                </div>
                <div style={{ color: '#666', fontSize: '0.82rem', marginTop: '0.2rem' }}>day streak</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
                <TrendingUp size={13} color="#555" />
                <span style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Best</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Space Grotesk', color: '#F0EDE8' }}>
                {streak?.best_streak ?? 0}
              </div>
              <div style={{ color: '#555', fontSize: '0.72rem' }}>days</div>
            </div>
          </div>

          {/* Streak progress dots */}
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.3rem' }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: '3px', borderRadius: '999px',
                  background: i < (streak?.current_streak % 7 || (streak?.current_streak >= 7 ? 7 : 0)) ? '#F5A623' : '#2A2A2A'
                }}
              />
            ))}
          </div>
          <div style={{ color: '#444', fontSize: '0.72rem', marginTop: '0.4rem' }}>
            {7 - ((streak?.current_streak || 0) % 7) === 7 && streak?.current_streak > 0
              ? 'Week complete!'
              : `${7 - ((streak?.current_streak || 0) % 7)} days to next week milestone`}
          </div>
        <AICoach name={profile?.name || "Creator"} streak={streak?.current_streak || 0} todayDone={todayDone} tasksCount={tasksToday.length} />
      </motion.div>

        {/* Check-in button */}
        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
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
              {celebrated ? '🔥 Streak extended! Keep going.' : 'Checked in for today'}
            </div>
          )}
        </div>

        {/* Quick actions row */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <ShareCard
            name={profile?.name || 'Creator'}
            streak={streak?.current_streak || 0}
            bestStreak={streak?.best_streak || 0}
          />
          <a href="/planner" style={styles.quickAction}>
            <Calendar size={15} color="#888" />
            Plan Content
          </a>
        </div>

        {/* Today's tasks */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={15} color="#555" />
              <span style={{ color: '#555', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's Plan</span>
            </div>
            {tasksToday.length > 0 && (
              <span style={{ color: '#555', fontSize: '0.75rem' }}>
                {tasksToday.filter(t => t.completed).length}/{tasksToday.length} done
              </span>
            )}
          </div>
          {tasksToday.length === 0 ? (
            <div style={styles.emptyBox}>
              No tasks planned for today.{' '}
              <a href="/planner" style={{ color: '#F5A623', textDecoration: 'none' }}>Add some →</a>
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
        ? <CheckCircle2 size={17} color="#4CAF50" />
        : <Circle size={17} color="#333" />
      }
      <span style={{ flex: 1, textDecoration: task.completed ? 'line-through' : 'none', fontSize: '0.92rem' }}>
        {task.title}
      </span>
      {task.platform && <span style={styles.platform}>{task.platform}</span>}
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
  avatarWrap: {
    width: '52px', height: '52px', borderRadius: '50%',
    background: '#1A1A1A', border: '2px solid #2A2A2A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0
  },
  streakCard: {
    border: '1px solid #1E1E1E', borderRadius: '20px',
    padding: '1.5rem'
  },
  flameWrap: {
    background: '#1A1400', borderRadius: '14px', padding: '0.85rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  checkInBtn: {
    width: '100%', background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '14px', padding: '1rem', fontSize: '1rem', fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.6rem', cursor: 'pointer'
  },
  checkedIn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.6rem', padding: '1rem', background: '#111111',
    border: '1px solid #1E1E1E', borderRadius: '14px', color: '#4CAF50',
    fontWeight: '500', fontSize: '0.92rem'
  },
  quickAction: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#111111', color: '#888', border: '1px solid #1E1E1E',
    borderRadius: '8px', padding: '0.65rem 1rem', fontWeight: '500',
    cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'none'
  },
  emptyBox: {
    background: '#111111', border: '1px dashed #1E1E1E', borderRadius: '12px',
    padding: '1.25rem', color: '#555', textAlign: 'center', fontSize: '0.88rem'
  },
  taskItem: {
    background: '#111111', border: '1px solid #1E1E1E', borderRadius: '10px',
    padding: '0.85rem 1rem', display: 'flex', alignItems: 'center',
    gap: '0.75rem', cursor: 'pointer'
  },
  platform: {
    background: '#1A1400', color: '#F5A623', padding: '0.2rem 0.6rem',
    borderRadius: '20px', fontSize: '0.7rem', fontWeight: '500'
  }
}
