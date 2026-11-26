import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Plus, Trash2, Loader, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getUserTasks, getTodayCompletions, completeTask, uncompleteTask,
  createTask, deleteTask, type Task, type TaskCompletion
} from '../lib/tasks'

const COLORS = {
  border: '#1E1E1E',
  gold: '#F5A623',
  goldSoft: 'rgba(245,166,35,0.12)',
  goldBorder: 'rgba(245,166,35,0.28)',
  text: '#F0EDE8',
  textDim: '#8A8A8A',
  textFaint: '#5C5C5C',
  green: '#4CAF50',
  greenSoft: 'rgba(76,175,80,0.12)',
  greenBorder: 'rgba(76,175,80,0.28)',
}

type Props = {
  userId: string
  date: string
  onChange?: (completedCount: number, totalPoints: number) => void
}

export default function TaskChecklist({ userId, date, onChange }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPoints, setNewPoints] = useState(5)
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    const [t, c] = await Promise.all([
      getUserTasks(userId),
      getTodayCompletions(userId, date),
    ])
    setTasks(t)
    setCompletions(c)
    setLoading(false)
  }

  useEffect(() => { load() }, [userId, date])

  useEffect(() => {
    if (onChange) {
      const pts = completions.reduce((sum, c) => sum + (c.points || 0), 0)
      onChange(completions.length, pts)
    }
  }, [completions])

  const isDone = (taskId: string) => completions.some(c => c.task_id === taskId)

  const toggle = async (task: Task) => {
    if (busyIds.has(task.id)) return
    setBusyIds(prev => new Set(prev).add(task.id))
    try {
      if (isDone(task.id)) {
        await uncompleteTask(task.id, userId, date)
        setCompletions(prev => prev.filter(c => c.task_id !== task.id))
      } else {
        const c = await completeTask(userId, task, date)
        if (c) setCompletions(prev => [...prev, c])
      }
    } finally {
      setBusyIds(prev => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
    }
  }

  const addTask = async () => {
    if (!newName.trim() || creating) return
    setCreating(true)
    const t = await createTask(userId, newName.trim(), Math.max(1, newPoints))
    if (t) {
      setTasks(prev => [...prev, t])
      setNewName('')
      setNewPoints(5)
      setShowAdd(false)
    } else {
      toast.error('Could not add task')
    }
    setCreating(false)
  }

  const removeTask = async (taskId: string) => {
    if (!confirm('Remove this task? You can re-add it later.')) return
    const ok = await deleteTask(taskId)
    if (ok) {
      setTasks(prev => prev.filter(t => t.id !== taskId))
      setCompletions(prev => prev.filter(c => c.task_id !== taskId))
    }
  }

  const totalPoints = completions.reduce((sum, c) => sum + (c.points || 0), 0)
  const doneCount = completions.length

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
        <Loader size={20} color={COLORS.textFaint} className="animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Target size={14} color={COLORS.gold} />
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: COLORS.textDim }}>
            Today's tasks
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: doneCount > 0 ? COLORS.green : COLORS.textFaint, fontWeight: 600 }}>
          {doneCount}/{tasks.length} · +{totalPoints} pts
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {tasks.map(t => {
          const done = isDone(t.id)
          const busy = busyIds.has(t.id)
          return (
            <motion.button
              key={t.id}
              layout
              onClick={() => toggle(t)}
              disabled={busy}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: done ? COLORS.greenSoft : 'rgba(255,255,255,0.03)',
                border: `1px solid ${done ? COLORS.greenBorder : COLORS.border}`,
                borderRadius: '12px', padding: '0.8rem 0.9rem',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                opacity: busy ? 0.6 : 1,
              }}
            >
              <div style={{
                width: '22px', height: '22px', borderRadius: '7px',
                border: `1.5px solid ${done ? COLORS.green : COLORS.textFaint}`,
                background: done ? COLORS.green : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {done && <Check size={13} color="#0A0A0A" strokeWidth={3} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.88rem', fontWeight: 500,
                  color: done ? COLORS.green : COLORS.text,
                  textDecoration: done ? 'line-through' : 'none',
                  textDecorationColor: done ? `${COLORS.green}88` : undefined,
                }}>
                  {t.name}
                </div>
              </div>
              <span style={{
                fontSize: '0.74rem', fontWeight: 700,
                color: done ? COLORS.green : COLORS.gold,
                flexShrink: 0,
              }}>+{t.points}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeTask(t.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem', display: 'flex', flexShrink: 0 }}
                aria-label="Delete task"
              >
                <Trash2 size={13} color={COLORS.textFaint} />
              </button>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {showAdd ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginTop: '0.5rem' }}
          >
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Task name"
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${COLORS.border}`, borderRadius: '10px',
                  padding: '0.6rem 0.8rem', color: COLORS.text,
                  fontSize: '0.85rem', outline: 'none',
                }}
              />
              <input
                type="number"
                min={1}
                max={50}
                value={newPoints}
                onChange={e => setNewPoints(Number(e.target.value))}
                style={{
                  width: '58px', background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${COLORS.border}`, borderRadius: '10px',
                  padding: '0.6rem 0.5rem', color: COLORS.text,
                  fontSize: '0.85rem', outline: 'none', textAlign: 'center',
                }}
              />
              <button
                onClick={addTask}
                disabled={creating}
                style={{
                  background: COLORS.gold, color: '#0A0A0A',
                  border: 'none', borderRadius: '10px',
                  padding: '0.6rem 0.8rem', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.8rem',
                }}
              >
                {creating ? '...' : 'Add'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAdd(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              width: '100%', marginTop: '0.5rem',
              background: 'transparent', border: `1px dashed ${COLORS.border}`,
              borderRadius: '10px', padding: '0.6rem',
              color: COLORS.textDim, fontSize: '0.8rem', fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus size={13} /> Add a task
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
