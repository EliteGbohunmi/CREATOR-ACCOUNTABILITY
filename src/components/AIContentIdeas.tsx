import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Plus, Loader } from 'lucide-react'

const PLATFORMS = ['Instagram', 'X (Twitter)', 'TikTok', 'YouTube', 'LinkedIn', 'Threads', 'Blog']

interface Props {
  pillars: any[]
  onIdeaAdded: () => void
  selectedDate: string
}

export default function AIContentIdeas({ pillars, onIdeaAdded, selectedDate }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState('')
  const [pillarId, setPillarId] = useState('')
  const [niche, setNiche] = useState('')
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)

  const generateIdeas = async () => {
    setLoading(true)
    setIdeas([])

    const selectedPillar = pillars.find(p => p.id === pillarId)

    const prompt = `Generate exactly 5 content ideas for a creator${platform ? ` posting on ${platform}` : ''}${selectedPillar ? ` focused on "${selectedPillar.name}"` : ''}${niche ? ` in the ${niche} niche` : ''}.

For each idea return a JSON array with this exact structure:
[
  {
    "title": "short post title",
    "format": "Reel/Thread/Video/Carousel/Article etc",
    "hook": "one sentence opening hook",
    "platform": "${platform || 'Any'}"
  }
]

Return ONLY the JSON array, no other text.`

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content || '[]'
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setIdeas(parsed)
    } catch {
      setIdeas([
        { title: 'How I grew my audience in 30 days', format: 'Reel', hook: 'I went from 0 to 10k and here is exactly what I did.', platform },
        { title: '5 mistakes new creators make', format: 'Carousel', hook: 'I made all of these so you don\'t have to.', platform },
        { title: 'My honest content creation routine', format: 'Video', hook: 'Nobody talks about how exhausting this actually is.', platform },
        { title: 'The one thing that changed my content', format: 'Thread', hook: 'This single shift doubled my engagement overnight.', platform },
        { title: 'What I wish I knew before starting', format: 'Article', hook: 'Three years in and I finally understand what matters.', platform },
      ])
    }
    setLoading(false)
  }

  const addIdea = async (idea: any, index: number) => {
    setAddingId(index)
    const today = selectedDate || new Date().toISOString().split('T')[0]
    await supabase.from('tasks').insert({
      user_id: user!.id,
      title: idea.title,
      platform: idea.platform !== 'Any' ? idea.platform : platform,
      format: idea.format,
      date: today,
      completed: false,
      pillar_id: pillarId || null
    })
    onIdeaAdded()
    setAddingId(null)
  }

  return (
    <>
      <button style={styles.triggerBtn} onClick={() => setOpen(true)}>
        <Sparkles size={15} color="#F5A623" />
        AI Ideas
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div style={styles.overlay} onClick={() => setOpen(false)} />
            <motion.div
              style={styles.drawer}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} color="#F5A623" />
                    AI Content Ideas
                  </div>
                  <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '0.2rem' }}>Generate ideas tailored to your niche</div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setOpen(false)}>
                  <X size={18} color="#555" />
                </button>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <input
                  style={styles.input}
                  placeholder="Your niche (e.g. fitness, tech, cooking)"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <select style={styles.input} value={platform} onChange={e => setPlatform(e.target.value)}>
                    <option value="">Any platform</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {pillars.length > 0 && (
                    <select style={styles.input} value={pillarId} onChange={e => setPillarId(e.target.value)}>
                      <option value="">Any pillar</option>
                      {pillars.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                </div>
                <button style={styles.generateBtn} onClick={generateIdeas} disabled={loading}>
                  {loading ? (
                    <><Loader size={16} color="#0A0A0A" style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                  ) : (
                    <><Sparkles size={16} color="#0A0A0A" /> Generate Ideas</>
                  )}
                </button>
              </div>

              {/* Ideas */}
              {ideas.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Tap to add to planner
                  </p>
                  {ideas.map((idea, i) => (
                    <motion.div
                      key={i}
                      style={styles.ideaCard}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.3rem' }}>{idea.title}</div>
                        <div style={{ color: '#555', fontSize: '0.8rem', marginBottom: '0.4rem', lineHeight: 1.4 }}>"{idea.hook}"</div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {idea.format && <span style={styles.tag}>{idea.format}</span>}
                          {idea.platform && idea.platform !== 'Any' && <span style={styles.platformTag}>{idea.platform}</span>}
                        </div>
                      </div>
                      <button
                        style={styles.addBtn}
                        onClick={() => addIdea(idea, i)}
                        disabled={addingId === i}
                      >
                        {addingId === i ? '...' : <Plus size={16} color="#0A0A0A" />}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  triggerBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#1A1400', color: '#F5A623',
    border: '1px solid #F5A62330', borderRadius: '10px',
    padding: '0.65rem 1rem', fontWeight: '600',
    cursor: 'pointer', fontSize: '0.85rem'
  },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300 },
  drawer: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: '#111111', borderTop: '1px solid #1E1E1E',
    borderRadius: '20px 20px 0 0', padding: '1.5rem',
    zIndex: 301, maxHeight: '85vh', overflowY: 'auto'
  },
  input: {
    background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px',
    padding: '0.75rem 1rem', color: '#F0EDE8', fontSize: '0.92rem',
    outline: 'none', flex: 1, width: '100%', boxSizing: 'border-box' as const, fontFamily: 'Inter'
  },
  generateBtn: {
    background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '10px', padding: '0.85rem', fontWeight: '700',
    cursor: 'pointer', fontSize: '0.9rem', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
  },
  ideaCard: {
    background: '#0A0A0A', border: '1px solid #1E1E1E',
    borderRadius: '12px', padding: '1rem',
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
  },
  addBtn: {
    background: '#F5A623', border: 'none', borderRadius: '8px',
    padding: '0.5rem', cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  tag: {
    background: '#1A1A2A', color: '#888', padding: '0.15rem 0.55rem',
    borderRadius: '20px', fontSize: '0.68rem', fontWeight: '500'
  },
  platformTag: {
    background: '#1A1400', color: '#F5A623', padding: '0.15rem 0.55rem',
    borderRadius: '20px', fontSize: '0.68rem', fontWeight: '500'
  }
}
