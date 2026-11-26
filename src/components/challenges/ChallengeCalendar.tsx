type Props = {
  checkinDates: string[]
}

export default function ChallengeCalendar({ checkinDates }: Props) {
  const today = new Date()
  const days: { label: string; date: string; done: boolean; isToday: boolean }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    days.push({
      label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
      date: iso,
      done: checkinDates.includes(iso),
      isToday: i === 0,
    })
  }

  return (
    <div style={styles.wrap}>
      <p style={styles.label}>Last 7 days</p>
      <div style={styles.grid}>
        {days.map(d => (
          <div key={d.date} style={styles.cell}>
            <div style={styles.cellLabel}>{d.label}</div>
            <div style={{
              ...styles.dot,
              background: d.done ? '#F5A623' : '#1A1A1A',
              border: d.isToday ? '1.5px solid #F5A623' : '1.5px solid transparent',
              boxShadow: d.done ? '0 0 8px rgba(245,166,35,0.5)' : 'none',
            }} />
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { marginTop: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '0.7rem 0.85rem' },
  label: { color: '#5C5C5C', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem', fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem' },
  cell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },
  cellLabel: { fontSize: '0.62rem', color: '#5C5C5C', fontWeight: 600 },
  dot: { width: '18px', height: '18px', borderRadius: '6px' },
}
