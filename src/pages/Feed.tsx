import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { CheckCircle2, Users, Trophy, Flame, UserPlus, Zap } from 'lucide-react'

interface FeedItem {
  id: string
  type: 'checkin' | 'challenge_join' | 'challenge_complete' | 'streak_milestone'
  user_name: string
  message: string
  time: string
  color: string
  reactions: number
  reacted: boolean
}

const TABS = ['All', 'Partners', 'Challenges', 'Milestones']

export default function Feed() {
  const { user } = useAuth()
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('All')
  const [summary, setSummary] = useState({ postedToday: 0, activeChallenges: 0 })
  const [_partnerId, setPartnerId] = useState<string | null>(null)

  useEffect(() => { fetchFeed() }, [])

  const fetchFeed = async () => {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]

    // Get partner
    const { data: p1 } = await supabase
      .from('accountability_partners')
      .select('user2_id').eq('user1_id', user!.id).single()
    const { data: p2 } = await supabase
      .from('accountability_partners')
      .select('user1_id').eq('user2_id', user!.id).single()
    const pid = p1?.user2_id || p2?.user1_id || null
    setPartnerId(pid)

    // Get challenges user is in
    const { data: myChallenge } = await supabase
      .from('user_challenges')
      .select('challenge_id')
      .eq('user_id', user!.id)
    const myChallengeIds = (myChallenge || []).map((c: any) => c.challenge_id)

    const feedItems: FeedItem[] = []

    // Partner check-ins
    if (pid) {
      const { data: partnerCheckin } = await supabase
        .from('checkin_proofs')
        .select('*, profiles(name)')
        .eq('user_id', pid)
        .eq('status', 'confirmed')
        .gte('date', weekAgoStr)
        .order('date', { ascending: false })

      for (const c of (partnerCheckin || [])) {
        feedItems.push({
          id: 'partner_' + c.id,
          type: 'checkin',
          user_name: c.profiles?.name || 'Your partner',
          message: 'posted and kept their streak going.',
          time: c.date,
          color: '#F5A623',
          reactions: 0,
          reacted: false
        })
      }
    }

    // Challenge activity from challenges user is in
    if (myChallengeIds.length > 0) {
      const { data: joins } = await supabase
        .from('user_challenges')
        .select('*, profiles(name), challenges(name)')
        .in('challenge_id', myChallengeIds)
        .neq('user_id', user!.id)
        .gte('joined_at', weekAgoStr)
        .order('joined_at', { ascending: false })
        .limit(15)

      for (const j of (joins || [])) {
        feedItems.push({
          id: 'join_' + j.id,
          type: 'challenge_join',
          user_name: j.profiles?.name || 'A creator',
          message: `joined "${j.challenges?.name}"`,
          time: j.joined_at?.split('T')[0] || today,
          color: '#2196F3',
          reactions: 0,
          reacted: false
        })
      }

      const { data: completions } = await supabase
        .from('user_challenges')
        .select('*, profiles(name), challenges(name)')
        .in('challenge_id', myChallengeIds)
        .neq('user_id', user!.id)
        .not('completed_at', 'is', null)
        .gte('completed_at', weekAgoStr)
        .order('completed_at', { ascending: false })
        .limit(10)

      for (const c of (completions || [])) {
        feedItems.push({
          id: 'complete_' + c.id,
          type: 'challenge_complete',
          user_name: c.profiles?.name || 'A creator',
          message: `completed "${c.challenges?.name}" 🎉`,
          time: c.completed_at?.split('T')[0] || today,
          color: '#4CAF50',
          reactions: 0,
          reacted: false
        })
      }
    }

    // User's own milestones from achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user!.id)
      .gte('earned_at', weekAgoStr)
      .order('earned_at', { ascending: false })

    const milestoneLabels: Record<string, string> = {
      streak_7: 'hit a 7-day streak 🔥',
      streak_30: 'hit a 30-day streak ⚡',
      streak_60: 'hit a 60-day streak 💎',
      streak_100: 'hit a 100-day streak 👑',
      streak_365: 'hit a 365-day streak 🏆',
      tasks_10: 'completed 10 tasks ✅',
      tasks_50: 'completed 50 tasks 📈',
      tasks_100: 'completed 100 tasks 💯',
      challenge_complete: 'completed a challenge 🎖️',
    }

    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user!.id).single()

    for (const a of (achievements || [])) {
      if (milestoneLabels[a.type]) {
        feedItems.push({
          id: 'milestone_' + a.id,
          type: 'streak_milestone',
          user_name: profile?.name || 'You',
          message: milestoneLabels[a.type],
          time: a.earned_at?.split('T')[0] || today,
          color: '#9C27B0',
          reactions: 0,
          reacted: false
        })
      }
    }

    // Summary stats
    const { count: postedToday } = await supabase
      .from('checkin_proofs')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)
      .eq('status', 'confirmed')

    setSummary({
      postedToday: postedToday || 0,
      activeChallenges: myChallengeIds.length
    })

    const sorted = feedItems
      .sort((a, b) => b.time.localeCompare(a.time))
      .filter((item, index, self) => self.findIndex(i => i.id === item.id) === index)

    setItems(sorted)
    setLoading(false)
  }

  const filtered = items.filter(item => {
    if (tab === 'All') return true
    if (tab === 'Partners') return item.type === 'checkin'
    if (tab === 'Challenges') return item.type === 'challenge_join' || item.type === 'challenge_complete'
    if (tab === 'Milestones') return item.type === 'streak_milestone'
    return true
  })

  const groupedByTime = () => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const groups: { label: string; items: FeedItem[] }[] = [
      { label: 'Today', items: filtered.filter(i => i.time === today) },
      { label: 'Yesterday', items: filtered.filter(i => i.time === yesterdayStr) },
      { label: 'This Week', items: filtered.filter(i => i.time < yesterdayStr) }
    ]
    return groups.filter(g => g.items.length > 0)
  }

  const getIcon = (type: string, color: string) => {
    const size = 15
    switch (type) {
      case 'checkin': return <CheckCircle2 size={size} color={color} />
      case 'challenge_join': return <UserPlus size={size} color={color} />
      case 'challenge_complete': return <Trophy size={size} color={color} />
      case 'streak_milestone': return <Zap size={size} color={color} />
      default: return <Flame size={size} color={color} />
    }
  }

  const getInitial = (name: string) => name.charAt(0).toUpperCase()

  const INITIAL_COLORS = ['#F5A623', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0', '#FF5722']
  const getInitialColor = (name: string) => INITIAL_COLORS[name.charCodeAt(0) % INITIAL_COLORS.length]

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: '72px', borderRadius: '12px', background: '#111', border: '1px solid #1E1E1E' }} />
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Community</p>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Activity Feed</h1>
      </div>

      {/* Daily summary card */}
      <div style={styles.summaryCard}>
        <div style={styles.summaryItem}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.5rem', color: '#F5A623' }}>{summary.postedToday}</div>
          <div style={{ color: '#555', fontSize: '0.75rem' }}>posted today</div>
        </div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryItem}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.5rem', color: '#F5A623' }}>{summary.activeChallenges}</div>
          <div style={{ color: '#555', fontSize: '0.75rem' }}>active challenges</div>
        </div>
        <div style={styles.summaryDivider} />
        <div style={styles.summaryItem}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.5rem', color: '#F5A623' }}>{items.length}</div>
          <div style={{ color: '#555', fontSize: '0.75rem' }}>activities</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t}
            style={{
              ...styles.tab,
              background: tab === t ? '#F5A623' : 'transparent',
              color: tab === t ? '#0A0A0A' : '#555',
              border: tab === t ? 'none' : '1px solid #1E1E1E'
            }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Feed grouped by time */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <Users size={32} color="#2A2A2A" style={{ marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, color: '#555', textAlign: 'center', fontSize: '0.88rem' }}>
            {tab === 'Partners' ? 'No partner activity yet. Add an accountability partner to see their check-ins here.' :
             tab === 'Challenges' ? 'Join challenges to see activity from other participants.' :
             tab === 'Milestones' ? 'Keep posting — your milestones will appear here when you hit them.' :
             'No activity yet. Start posting and joining challenges.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {groupedByTime().map(group => (
            <div key={group.label}>
              <div style={styles.groupLabel}>{group.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {group.items.map(item => (
                  <div key={item.id} style={styles.item}>
                    {/* Avatar with initial */}
                    <div style={{
                      ...styles.avatar,
                      background: getInitialColor(item.user_name) + '20',
                      border: `1px solid ${getInitialColor(item.user_name)}30`
                    }}>
                      <span style={{ color: getInitialColor(item.user_name), fontWeight: '700', fontSize: '0.85rem' }}>
                        {getInitial(item.user_name)}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>
                        <span style={{ fontWeight: '600', color: '#F0EDE8' }}>{item.user_name} </span>
                        <span style={{ color: '#888' }}>{item.message}</span>
                      </div>
                    </div>

                    {/* Type icon */}
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: item.color + '15', border: `1px solid ${item.color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {getIcon(item.type, item.color)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  summaryCard: {
    background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px',
    padding: '1rem', display: 'flex', alignItems: 'center',
    justifyContent: 'space-around', marginBottom: '1.25rem'
  },
  summaryItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
  summaryDivider: { width: '1px', height: '32px', background: '#1E1E1E' },
  tabs: { display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  tab: {
    borderRadius: '20px', padding: '0.35rem 0.85rem',
    fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer'
  },
  groupLabel: {
    color: '#444', fontSize: '0.72rem', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: '0.6rem', fontWeight: '600'
  },
  item: {
    background: '#111111', border: '1px solid #1E1E1E', borderRadius: '12px',
    padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem'
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  empty: {
    background: '#111111', border: '1px dashed #1E1E1E', borderRadius: '14px',
    padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center'
  }
}
