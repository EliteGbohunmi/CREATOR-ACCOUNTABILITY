import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, CheckCircle2, Calendar, Flame, Target } from 'lucide-react'

export default function Analytics() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [streak, setStreak] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const from = thirtyDaysAgo.toISOString().split('T')[0]

    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user!.id).gte('date', from),
      supabase.from('streaks').select('*').eq('user_id', user!.id).single()
    ])
    setTasks(t || [])
    setStreak(s)
    setLoading(false)
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const byDay = dayLabels.map((label, i) => {
    const dayTasks = tasks.filter(t => new Date(t.date + 'T00:00:00').getDay() === i)
    const done = dayTasks.filter(t => t.completed).length
    return { label, done, total: dayTasks.length }
  })

  const byPlatform = tasks.reduce((acc: any, t) => {
    if (!t.platform) return acc
    if (!acc[t.platform]) acc[t.platform] = { total: 0, done: 0 }
    acc[t.platform].total++
    if (t.completed) acc[t.platform].done++
    return acc
  }, {})

  const platformData = Object.entries(byPlatform).map(([name, val]: any) => ({
    name, rate: val.total > 0 ? Math.round((val.done / val.total) * 100) : 0
  })).sort((a, b) => b.rate - a.rate)

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const last7 = tasks.filter(t => {
    const d = new Date(t.date + 'T00:00:00')
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    return d >= cutoff
  })
  const last7Rate = last7.length > 0 ? Math.round((last7.filter(t => t.completed).length / last7.length) * 100) : 0

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: '80px', borderRadius: '14px', background: '#111', border: '1px solid #1E1E1E' }} />
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Insights</p>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Analytics</h1>
        <p style={{ color: '#555', marginTop: '0.3rem', fontSize: '0.9rem' }}>Last 30 days of activity</p>
      </div>

      {/* Stat cards */}
      <div style={styles.statGrid}>
        <StatCard icon={<Flame size={16} color="#F5A623" />} label="Current Streak" value={`${streak?.current_streak ?? 0}`} unit="days" />
        <StatCard icon={<TrendingUp size={16} color="#F5A623" />} label="Best Streak" value={`${streak?.best_streak ?? 0}`} unit="days" />
        <StatCard icon={<Target size={16} color="#F5A623" />} label="30d Rate" value={`${completionRate}%`} unit="" />
        <StatCard icon={<CheckCircle2 size={16} color="#F5A623" />} label="7d Rate" value={`${last7Rate}%`} unit="" />
      </div>

      {/* Posts by day of week */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <Calendar size={15} color="#555" />
          <span>Posts by Day of Week</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byDay} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: '8px', fontSize: '0.8rem' }}
              labelStyle={{ color: '#F0EDE8' }}
              itemStyle={{ color: '#F5A623' }}
            />
            <Bar dataKey="done" radius={[4, 4, 0, 0]} name="Posts done">
              {byDay.map((entry, index) => (
                <Cell key={index} fill={entry.done > 0 ? '#F5A623' : '#1E1E1E'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Platform breakdown */}
      {platformData.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <TrendingUp size={15} color="#555" />
            <span>Platform Completion Rate</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {platformData.map(p => (
              <div key={p.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>{p.name}</span>
                  <span style={{ color: '#F5A623', fontSize: '0.85rem', fontWeight: '600' }}>{p.rate}%</span>
                </div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: `${p.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <CheckCircle2 size={15} color="#555" />
          <span>30 Day Summary</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ color: '#555', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tasks planned</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.4rem' }}>{totalTasks}</div>
          </div>
          <div>
            <div style={{ color: '#555', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tasks completed</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.4rem', color: '#4CAF50' }}>{completedTasks}</div>
          </div>
          <div>
            <div style={{ color: '#555', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tasks missed</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.4rem', color: '#E53E3E' }}>{totalTasks - completedTasks}</div>
          </div>
          <div>
            <div style={{ color: '#555', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Completion rate</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.4rem', color: '#F5A623' }}>{completionRate}%</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function StatCard({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div style={{
      background: '#111111', border: '1px solid #1E1E1E',
      borderRadius: '12px', padding: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
        {icon}
        <span style={{ color: '#555', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.5rem', lineHeight: 1 }}>{value}</div>
      {unit && <div style={{ color: '#444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{unit}</div>}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' },
  card: {
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem'
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    color: '#555', fontSize: '0.8rem', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: '1.1rem'
  },
  progressTrack: {
    height: '5px', background: '#1E1E1E',
    borderRadius: '999px', overflow: 'hidden'
  },
  progressFill: {
    height: '100%', background: '#F5A623', borderRadius: '999px',
    transition: 'width 0.6s ease'
  }
}
