import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import PillarSetup from '../components/PillarSetup'
import AIContentIdeas from '../components/AIContentIdeas'
import GoodEnoughChecklist from '../components/GoodEnoughChecklist'
import { Plus, X, CheckCircle2, Circle, Trash2, Repeat, ChevronLeft, ChevronRight } from 'lucide-react'

const PLATFORMS = ['Instagram', 'X (Twitter)', 'TikTok', 'YouTube', 'LinkedIn', 'Threads']
const FORMATS = ['Reel', 'Carousel', 'Photo', 'Thread', 'Video', 'Short', 'Story', 'Article', 'Newsletter', 'Podcast', 'Tutorial', 'Opinion']

const TEMPLATES = [
  { title: 'Instagram Reel', platform: 'Instagram', format: 'Reel' },
  { title: 'X Thread', platform: 'X (Twitter)', format: 'Thread' },
  { title: 'TikTok Video', platform: 'TikTok', format: 'Video' },
  { title: 'YouTube Short', platform: 'YouTube', format: 'Short' },
  { title: 'LinkedIn Post', platform: 'LinkedIn', format: 'Article' },
  { title: 'Carousel Post', platform: 'Instagram', format: 'Carousel' },
  { title: 'Blog Article', platform: '', format: 'Article' },
  { title: 'Newsletter', platform: '', format: 'Newsletter' },
]

function getWeekDays(offset: number, startDay: string) {
  const days = []
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  const diff = startDay === 'monday'
    ? (day === 0 ? -6 : 1 - day)
    : -day
  monday.setDate(now.getDate() + diff + offset * 7)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

export default function Planner() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [pillars, setPillars] = useState<any[]>([])
  const [showPillarSetup, setShowPillarSetup] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [checklistTask, setChecklistTask] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('')
  const [format, setFormat] = useState('')
  const [date, setDate] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [pillarId, setPillarId] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekDays, setWeekDays] = useState<Date[]>([])
  const [weekStart, setWeekStart] = useState('monday')

  useEffect(() => {
    supabase.from('profiles').select('week_start, default_platform').eq('id', user!.id).single()
      .then(({ data }) => {
        if (data) {
          setWeekStart(data.week_start || 'monday')
          if (data.default_platform) setPlatform(data.default_platform)
        }
      })
    fetchPillars()
  }, [])

  useEffect(() => { setWeekDays(getWeekDays(weekOffset, weekStart)) }, [weekOffset, weekStart])
  useEffect(() => { if (weekDays.length) fetchTasks() }, [weekDays])

  const fetchPillars = async () => {
    const { data } = await supabase.from('pillars').select('*').eq('user_id', user!.id)
    setPillars(data || [])
  }

  const fetchTasks = async () => {
    if (weekDays.length === 0) return
    const from = weekDays[0].toISOString().split('T')[0]
    const to = weekDays[6].toISOString().split('T')[0]
    const { data } = await supabase
      .from('tasks').select('*, pillars(name, color)')
      .eq('user_id', user!.id).gte('date', from).lte('date', to)
      .order('date', { ascending: true })
    setTasks(data || [])
  }

  const addTask = async () => {
    if (!title.trim() || !date) return
    setSaving(true)
    await supabase.from('tasks').insert({
      user_id: user!.id, title, platform, date,
      completed: false, recurring, format,
      pillar_id: pillarId || null
    })
    if (recurring) {
      for (let w = 1; w <= 7; w++) {
        const d = new Date(date)
        d.setDate(d.getDate() + w * 7)
        await supabase.from('tasks').insert({
          user_id: user!.id, title, platform, format,
          date: d.toISOString().split('T')[0],
          completed: false, recurring: true,
          pillar_id: pillarId || null
        })
      }
    }
    setTitle('')
    setPlatform('')
    setFormat('')
    setDate('')
    setRecurring(false)
    setPillarId('')
    setShowForm(false)
    await fetchTasks()
    setSaving(false)
  }

  const handleToggle = async (task: any) => {
    if (!task.completed) {
      setChecklistTask(task)
    } else {
      await supabase.from('tasks').update({ completed: false }).eq('id', task.id)
      fetchTasks()
    }
  }

  const completeTask = async (task: any) => {
    await supabase.from('tasks').update({ completed: true, checklist_done: true }).eq('id', task.id)
    setChecklistTask(null)
    fetchTasks()
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  const applyTemplate = (t: any) => {
    setTitle(t.title)
    setPlatform(t.platform)
    setFormat(t.format)
    setShowTemplates(false)
    setShowForm(true)
  }

  const completedThisWeek = tasks.filter(t => t.completed).length
  const totalThisWeek = tasks.length
  const weekProgress = totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0
  const today = new Date().toISOString().split('T')[0]

  const weekLabel = () => {
    if (weekDays.length === 0) return ''
    const from = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const to = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${from} — ${to}`
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Plan</p>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Content Planner</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={styles.ghostBtn} onClick={() => setShowTemplates(!showTemplates)}>
            Templates
          </button>
          <button style={showForm ? styles.cancelBtn : styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={16} color="#888" /> : <Plus size={16} color="#0A0A0A" />}
            {showForm ? 'Cancel' : 'Add'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <AIContentIdeas pillars={pillars} onIdeaAdded={fetchTasks} selectedDate={selectedDate} />
        <button style={styles.ghostBtn} onClick={() => setShowPillarSetup(!showPillarSetup)}>
          Pillars
        </button>
      </div>

      {/* Pillar setup */}
      <AnimatePresence>
        {showPillarSetup && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <PillarSetup onDone={() => { setShowPillarSetup(false); fetchPillars() }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Week progress */}
      <div style={styles.progressCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ color: '#888', fontSize: '0.8rem' }}>Week completion</span>
          <span style={{ color: '#F5A623', fontWeight: '700', fontFamily: 'Space Grotesk' }}>{weekProgress}%</span>
        </div>
        <div style={styles.progressTrack}>
          <motion.div style={styles.progressFill} initial={{ width: 0 }} animate={{ width: `${weekProgress}%` }} transition={{ duration: 0.6 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={{ color: '#555', fontSize: '0.75rem' }}>{completedThisWeek} done</span>
          <span style={{ color: '#555', fontSize: '0.75rem' }}>{totalThisWeek} planned</span>
        </div>
      </div>

      {/* Pillars legend */}
      {pillars.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
          {pillars.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#111111', border: `1px solid ${p.color}30`, borderRadius: '20px', padding: '0.25rem 0.75rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
              <span style={{ color: '#888', fontSize: '0.75rem' }}>{p.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Templates */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div style={styles.templatesWrap} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <p style={{ color: '#555', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Pick a template</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {TEMPLATES.map(t => (
                <button key={t.title} style={styles.templateChip} onClick={() => applyTemplate(t)}>{t.title}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div style={styles.form} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <input style={styles.input} placeholder="What are you posting?" value={title} onChange={e => setTitle(e.target.value)} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select style={styles.input} value={platform} onChange={e => setPlatform(e.target.value)}>
                <option value="">Platform</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select style={styles.input} value={format} onChange={e => setFormat(e.target.value)}>
                <option value="">Format</option>
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            {pillars.length > 0 && (
              <select style={styles.input} value={pillarId} onChange={e => setPillarId(e.target.value)}>
                <option value="">No pillar</option>
                {pillars.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => setRecurring(!recurring)}>
              <div style={{ ...styles.checkbox, background: recurring ? '#F5A623' : 'transparent', borderColor: recurring ? '#F5A623' : '#333' }}>
                {recurring && <Repeat size={12} color="#0A0A0A" />}
              </div>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>Repeat weekly for 8 weeks</span>
            </div>
            <button style={styles.saveBtn} onClick={addTask} disabled={saving}>
              {saving ? 'Saving...' : 'Save Task'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Week nav */}
      <div style={styles.weekNav}>
        <button style={styles.navArrow} onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={18} color="#888" /></button>
        <span style={{ color: '#888', fontSize: '0.85rem' }}>{weekLabel()}</span>
        <button style={styles.navArrow} onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={18} color="#888" /></button>
      </div>

      {/* Weekly grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {weekDays.map(day => {
          const dateStr = day.toISOString().split('T')[0]
          const dayTasks = tasks.filter(t => t.date === dateStr)
          const isToday = dateStr === today
          return (
            <div key={dateStr} style={{ ...styles.dayBlock, borderColor: isToday ? '#F5A62340' : '#1E1E1E' }}>
              <div style={styles.dayHeader}>
                <span style={{ color: isToday ? '#F5A623' : '#555', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span style={{ color: isToday ? '#F5A623' : '#333', fontSize: '0.78rem' }}>
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <button style={styles.addDayBtn} onClick={() => { setDate(dateStr); setSelectedDate(dateStr); setShowForm(true) }}>
                  <Plus size={13} color="#555" />
                </button>
              </div>
              {dayTasks.length === 0 ? (
                <p style={{ color: '#333', fontSize: '0.8rem', margin: '0.4rem 0 0' }}>No tasks</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {dayTasks.map(task => (
                    <div key={task.id} style={{ ...styles.taskRow, opacity: task.completed ? 0.45 : 1 }}>
                      {task.pillars && (
                        <div style={{ width: '3px', height: '100%', background: task.pillars.color, borderRadius: '999px', alignSelf: 'stretch', flexShrink: 0 }} />
                      )}
                      <span style={{ cursor: 'pointer', display: 'flex' }} onClick={() => handleToggle(task)}>
                        {task.completed ? <CheckCircle2 size={16} color="#4CAF50" /> : <Circle size={16} color="#444" />}
                      </span>
                      <span style={{ flex: 1, fontSize: '0.88rem', textDecoration: task.completed ? 'line-through' : 'none' }}>
                        {task.title}
                      </span>
                      {task.format && <span style={styles.formatTag}>{task.format}</span>}
                      {task.recurring && <Repeat size={12} color="#555" />}
                      {task.platform && <span style={styles.tag}>{task.platform}</span>}
                      <span style={{ cursor: 'pointer', display: 'flex' }} onClick={() => deleteTask(task.id)}>
                        <Trash2 size={13} color="#333" />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Good Enough Checklist */}
      {checklistTask && (
        <GoodEnoughChecklist
          taskTitle={checklistTask.title}
          onConfirm={() => completeTask(checklistTask)}
          onCancel={() => setChecklistTask(null)}
        />
      )}
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  addBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '10px', padding: '0.65rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
  },
  cancelBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#111111', color: '#888', border: '1px solid #1E1E1E',
    borderRadius: '10px', padding: '0.65rem 1rem', fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem'
  },
  ghostBtn: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    background: 'none', color: '#666', border: '1px solid #1E1E1E',
    borderRadius: '10px', padding: '0.65rem 1rem', fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem'
  },
  progressCard: {
    background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px',
    padding: '1.1rem', marginBottom: '1.25rem'
  },
  progressTrack: { height: '6px', background: '#1E1E1E', borderRadius: '999px', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#F5A623', borderRadius: '999px' },
  templatesWrap: {
    background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px',
    padding: '1.1rem', marginBottom: '1rem'
  },
  templateChip: {
    background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '20px',
    padding: '0.4rem 0.85rem', color: '#888', fontSize: '0.8rem', cursor: 'pointer'
  },
  form: {
    background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px',
    padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'
  },
  input: {
    background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px',
    padding: '0.75rem 1rem', color: '#F0EDE8', fontSize: '0.95rem',
    outline: 'none', flex: 1, width: '100%', boxSizing: 'border-box' as const
  },
  checkbox: {
    width: '20px', height: '20px', borderRadius: '6px', border: '1px solid #333',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  saveBtn: {
    background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '8px', padding: '0.75rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem'
  },
  weekNav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1rem', padding: '0 0.25rem'
  },
  navArrow: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' },
  dayBlock: { background: '#111111', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '0.85rem 1rem' },
  dayHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  addDayBtn: { marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '0.2rem' },
  taskRow: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    background: '#0A0A0A', borderRadius: '8px', padding: '0.6rem 0.75rem'
  },
  tag: {
    background: '#1A1400', color: '#F5A623', padding: '0.15rem 0.55rem',
    borderRadius: '20px', fontSize: '0.68rem', fontWeight: '500'
  },
  formatTag: {
    background: '#1A1A2A', color: '#888', padding: '0.15rem 0.55rem',
    borderRadius: '20px', fontSize: '0.68rem', fontWeight: '500'
  }
}
