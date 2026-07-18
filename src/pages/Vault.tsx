import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { Plus, X, Lightbulb, Trash2, ChevronDown, ChevronUp, Tag } from 'lucide-react'

const PLATFORMS = ['Instagram', 'X (Twitter)', 'TikTok', 'YouTube', 'LinkedIn', 'Threads', 'Blog', 'Podcast']
const STATUSES = ['idea', 'scripting', 'recording', 'editing', 'ready', 'published']

const STATUS_COLORS: Record<string, string> = {
  idea: '#444',
  scripting: '#7A4F00',
  recording: '#1A4A7A',
  editing: '#4A1A7A',
  ready: '#1A4A1A',
  published: '#4CAF50'
}

export default function Vault() {
  const { user } = useAuth()
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [hook, setHook] = useState('')
  const [platform, setPlatform] = useState('')
  const [status, setStatus] = useState('idea')
  const [notes, setNotes] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => { fetchIdeas() }, [])

  const fetchIdeas = async () => {
    const { data } = await supabase
      .from('vault')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    setIdeas(data || [])
    setLoading(false)
  }

  const addIdea = async () => {
    if (!title.trim()) return
    setSaving(true)
    await supabase.from('vault').insert({
      user_id: user!.id,
      title: title.trim(),
      hook: hook.trim(),
      platform,
      status,
      notes: notes.trim(),
      tags
    })
    setTitle('')
    setHook('')
    setPlatform('')
    setStatus('idea')
    setNotes('')
    setTags([])
    setTagInput('')
    setShowForm(false)
    await fetchIdeas()
    setSaving(false)
  }

  const deleteIdea = async (id: string) => {
    await supabase.from('vault').delete().eq('id', id)
    fetchIdeas()
  }

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('vault').update({ status: newStatus }).eq('id', id)
    fetchIdeas()
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t))

  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.status === filter)

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: '80px', borderRadius: '14px', background: '#111', border: '1px solid #1E1E1E' }} />
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Ideas</p>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Content Vault</h1>
          <p style={{ color: '#555', marginTop: '0.3rem', fontSize: '0.9rem' }}>{ideas.length} ideas stored</p>
        </div>
        <button style={showForm ? styles.cancelBtn : styles.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={16} color="#888" /> : <Plus size={16} color="#0A0A0A" />}
          {showForm ? 'Cancel' : 'Add Idea'}
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            style={styles.form}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <input
              style={styles.input}
              placeholder="Idea title (e.g. How I grew to 10k followers)"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              style={{ ...styles.input, minHeight: '70px', resize: 'vertical' }}
              placeholder="Hook — what's the opening line?"
              value={hook}
              onChange={e => setHook(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select style={styles.input} value={platform} onChange={e => setPlatform(e.target.value)}>
                <option value="">Platform</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select style={styles.input} value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <textarea
              style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
              placeholder="Notes, references, or outline..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            {/* Tags */}
            <div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="Add tag (press Enter)"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                />
                <button style={styles.tagBtn} onClick={addTag}>
                  <Tag size={14} color="#888" />
                </button>
              </div>
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {tags.map(t => (
                    <span key={t} style={styles.tag} onClick={() => removeTag(t)}>
                      {t} <X size={10} color="#888" />
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button style={styles.saveBtn} onClick={addIdea} disabled={saving}>
              {saving ? 'Saving...' : 'Save Idea'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter tabs */}
      <div style={styles.filterRow}>
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            style={{
              ...styles.filterBtn,
              background: filter === s ? '#F5A623' : 'transparent',
              color: filter === s ? '#0A0A0A' : '#555',
              border: filter === s ? 'none' : '1px solid #1E1E1E'
            }}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Ideas list */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <Lightbulb size={32} color="#2A2A2A" style={{ marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, color: '#555' }}>
            {filter === 'all' ? 'No ideas yet. Add your first one above.' : `No ideas with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(idea => (
            <div key={idea.id} style={styles.card}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === idea.id ? null : idea.id)}
              >
                <div style={{ flex: 1, marginRight: '0.75rem' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.35rem' }}>{idea.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{
                      background: STATUS_COLORS[idea.status] + '33',
                      color: STATUS_COLORS[idea.status] === '#444' ? '#888' : STATUS_COLORS[idea.status],
                      padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '500'
                    }}>
                      {idea.status}
                    </span>
                    {idea.platform && (
                      <span style={{ color: '#555', fontSize: '0.78rem' }}>{idea.platform}</span>
                    )}
                    {idea.tags?.length > 0 && (
                      <span style={{ color: '#444', fontSize: '0.75rem' }}>#{idea.tags[0]}{idea.tags.length > 1 ? ` +${idea.tags.length - 1}` : ''}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ cursor: 'pointer', display: 'flex' }} onClick={e => { e.stopPropagation(); deleteIdea(idea.id) }}>
                    <Trash2 size={15} color="#333" />
                  </span>
                  {expanded === idea.id ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />}
                </div>
              </div>

              <AnimatePresence>
                {expanded === idea.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ borderTop: '1px solid #1E1E1E', marginTop: '0.85rem', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {idea.hook && (
                        <div>
                          <div style={styles.fieldLabel}>Hook</div>
                          <div style={{ color: '#888', fontSize: '0.88rem' }}>{idea.hook}</div>
                        </div>
                      )}
                      {idea.notes && (
                        <div>
                          <div style={styles.fieldLabel}>Notes</div>
                          <div style={{ color: '#888', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>{idea.notes}</div>
                        </div>
                      )}
                      {idea.tags?.length > 0 && (
                        <div>
                          <div style={styles.fieldLabel}>Tags</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {idea.tags.map((t: string) => (
                              <span key={t} style={styles.tag}>{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Status updater */}
                      <div>
                        <div style={styles.fieldLabel}>Update Status</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {STATUSES.map(s => (
                            <button
                              key={s}
                              style={{
                                ...styles.statusBtn,
                                background: idea.status === s ? '#F5A623' : '#1A1A1A',
                                color: idea.status === s ? '#0A0A0A' : '#666',
                                border: idea.status === s ? 'none' : '1px solid #2A2A2A'
                              }}
                              onClick={() => updateStatus(idea.id, s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  addBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '10px', padding: '0.65rem 1rem', fontWeight: '600',
    cursor: 'pointer', fontSize: '0.85rem'
  },
  cancelBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#111111', color: '#888', border: '1px solid #1E1E1E',
    borderRadius: '10px', padding: '0.65rem 1rem', fontWeight: '500',
    cursor: 'pointer', fontSize: '0.85rem'
  },
  form: {
    background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px',
    padding: '1.25rem', marginBottom: '1.5rem', display: 'flex',
    flexDirection: 'column', gap: '0.75rem'
  },
  input: {
    background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px',
    padding: '0.75rem 1rem', color: '#F0EDE8', fontSize: '0.95rem',
    outline: 'none', flex: 1, width: '100%', boxSizing: 'border-box' as const,
    fontFamily: 'Inter'
  },
  saveBtn: {
    background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '8px', padding: '0.75rem', fontWeight: '600',
    cursor: 'pointer', fontSize: '0.9rem'
  },
  tagBtn: {
    background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px',
    padding: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center'
  },
  tag: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    background: '#1A1A1A', border: '1px solid #2A2A2A',
    borderRadius: '20px', padding: '0.2rem 0.65rem',
    color: '#888', fontSize: '0.75rem', cursor: 'pointer'
  },
  filterRow: {
    display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem'
  },
  filterBtn: {
    borderRadius: '20px', padding: '0.3rem 0.8rem',
    fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer',
    textTransform: 'capitalize'
  },
  empty: {
    background: '#111111', border: '1px dashed #1E1E1E', borderRadius: '14px',
    padding: '2.5rem', color: '#555', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
  },
  card: {
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '14px', padding: '1rem'
  },
  fieldLabel: {
    color: '#555', fontSize: '0.72rem', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: '0.3rem'
  },
  statusBtn: {
    borderRadius: '20px', padding: '0.25rem 0.75rem',
    fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer',
    textTransform: 'capitalize'
  }
}
