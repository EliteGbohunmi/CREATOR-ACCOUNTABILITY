import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getColor(count: number) {
  if (count === 0) return '#1A1A1A'
  if (count === 1) return '#3D2800'
  if (count === 2) return '#7A4F00'
  if (count >= 3) return '#F5A623'
  return '#1A1A1A'
}

export default function Heatmap() {
  const { user } = useAuth()
  const [completedDays, setCompletedDays] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    // Auto scroll to end (most recent) on load
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [loading])

  const fetchData = async () => {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const from = oneYearAgo.toISOString().split('T')[0]

    const { data } = await supabase
      .from('tasks')
      .select('date, completed')
      .eq('user_id', user!.id)
      .gte('date', from)

    const map: Record<string, number> = {}
    for (const task of (data || [])) {
      if (task.completed) {
        map[task.date] = (map[task.date] || 0) + 1
      }
    }
    setCompletedDays(map)
    setLoading(false)
  }

  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 364)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const weeks: Date[][] = []
  const cursor = new Date(startDate)
  while (cursor <= today) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  const monthLabels: { label: string; col: number }[] = []
  weeks.forEach((week, i) => {
    const firstOfWeek = week[0]
    if (firstOfWeek.getDate() <= 7) {
      monthLabels.push({ label: MONTHS[firstOfWeek.getMonth()], col: i })
    }
  })

  const totalPosts = Object.values(completedDays).reduce((a, b) => a + b, 0)
  const activeDays = Object.keys(completedDays).length

  if (loading) {
    return (
      <div style={styles.wrap}>
        <div style={{ height: '120px', background: '#1A1A1A', borderRadius: '8px' }} />
      </div>
    )
  }

  const cellSize = 11
  const cellGap = 2

  return (
    <div style={styles.wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={styles.sectionLabel}>Activity</span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ color: '#555', fontSize: '0.72rem' }}>{totalPosts} posts</span>
          <span style={{ color: '#555', fontSize: '0.72rem' }}>{activeDays} active days</span>
        </div>
      </div>

      <div ref={scrollRef} style={{ overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>

          {/* Month labels */}
          <div style={{ display: 'flex', marginLeft: `${cellSize + 6}px`, marginBottom: '4px' }}>
            {weeks.map((_, i) => {
              const label = monthLabels.find(m => m.col === i)
              return (
                <div
                  key={i}
                  style={{
                    width: `${cellSize + cellGap}px`,
                    fontSize: '9px',
                    color: '#444',
                    flexShrink: 0
                  }}
                >
                  {label ? label.label : ''}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '0' }}>
            {/* Day labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px`, marginRight: '4px' }}>
              {DAYS.map((d, i) => (
                <div
                  key={i}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    fontSize: '9px',
                    color: '#444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'flex', gap: `${cellGap}px` }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px` }}>
                  {week.map((day, di) => {
                    const dateStr = day.toISOString().split('T')[0]
                    const count = completedDays[dateStr] || 0
                    const isFuture = day > today
                    const isToday = dateStr === today.toISOString().split('T')[0]

                    return (
                      <div
                        key={di}
                        title={isFuture ? '' : `${count} post${count !== 1 ? 's' : ''} on ${dateStr}`}
                        style={{
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                          borderRadius: '2px',
                          background: isFuture ? 'transparent' : getColor(count),
                          border: isToday ? '1px solid #F5A623' : '1px solid transparent',
                          flexShrink: 0
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', marginLeft: `${cellSize + 6}px` }}>
            <span style={{ color: '#444', fontSize: '9px', marginRight: '2px' }}>Less</span>
            {[0, 1, 2, 3].map(n => (
              <div
                key={n}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  borderRadius: '2px',
                  background: getColor(n),
                  flexShrink: 0
                }}
              />
            ))}
            <span style={{ color: '#444', fontSize: '9px', marginLeft: '2px' }}>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    background: '#111111',
    border: '1px solid #1E1E1E',
    borderRadius: '14px',
    padding: '1.25rem',
    marginTop: '1.5rem',
    overflow: 'hidden'
  },
  sectionLabel: {
    color: '#555',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  }
}
