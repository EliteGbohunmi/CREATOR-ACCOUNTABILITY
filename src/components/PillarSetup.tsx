import { useState, useEffect } from 'react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, X, Check } from 'lucide-react'

const PRESET_COLORS = ['#F5A623', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0', '#FF5722', '#00BCD4', '#8BC34A']

const PRESET_PILLARS = [
  'Education', 'Entertainment', 'Behind the Scenes', 'Motivation',
  'Product/Service', 'Personal Story', 'Tips & Tricks', 'Opinion'
]

interface Props {
  onDone: () => void
}

export default function PillarSetup({ onDone }: Props) {
  const { user } = useAuth()
  const [pillars, setPillars] = useState<any[]>([])
  const [name, setName] = useState('')
  const [color, setColor] = useState('#F5A623')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchPillars() }, [])

  const fetchPillars = async () => {
    const { data } = await supabase.from('pillars').select('*').eq('user_id', user!.id)
    setPillars(data || [])
  }

  const addPillar = async (pillarName?: string) => {
    const n = pillarName || name.trim()
    if (!n) return
    setSaving(true)
    await supabase.from('pillars').insert({ user_id: user!.id, name: n, color })
    setName('')
    await fetchPillars()
    setSaving(false)
  }

  const deletePillar = async (id: string) => {
    await supabase.from('pillars').delete().eq('id', id)
    fetchPillars()
  }

  return (
    <div style={styles.wrap}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.4rem' }}>
          Your Content Pillars
        </h2>
        <p style={{ color: '#555', fontSize: '0.85rem' }}>
          Define 3-5 core topics you create content about. These guide what you post and kill decision fatigue.
        </p>
      </div>

      {/* Preset suggestions */}
      {pillars.length < 5 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Quick add
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {PRESET_PILLARS.filter(p => !pillars.find(pl => pl.name === p)).map(p => (
              <button key={p} style={styles.presetChip} onClick={() => addPillar(p)}>
                + {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current pillars */}
      {pillars.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Your pillars ({pillars.length}/5)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pillars.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0A0A0A', borderRadius: '10px', padding: '0.75rem 1rem', border: `1px solid ${p.color}30` }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.9rem' }}>{p.name}</span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }} onClick={() => deletePillar(p.id)}>
                  <X size={14} color="#555" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom pillar */}
      {pillars.length < 5 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Custom pillar
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              style={styles.input}
              placeholder="e.g. Day in my life"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPillar()}
            />
            <button style={styles.addBtn} onClick={() => addPillar()} disabled={saving}>
              <Plus size={16} color="#0A0A0A" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <div
                key={c}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%', background: c,
                  cursor: 'pointer', border: color === c ? '2px solid #fff' : '2px solid transparent'
                }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
      )}

      <button
        style={{ ...styles.doneBtn, opacity: pillars.length === 0 ? 0.5 : 1 }}
        onClick={onDone}
        disabled={pillars.length === 0}
      >
        <Check size={16} color="#0A0A0A" />
        {pillars.length === 0 ? 'Add at least one pillar' : `Done — ${pillars.length} pillar${pillars.length > 1 ? 's' : ''} set`}
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem'
  },
  presetChip: {
    background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '20px',
    padding: '0.35rem 0.85rem', color: '#888', fontSize: '0.78rem', cursor: 'pointer'
  },
  input: {
    flex: 1, background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px',
    padding: '0.75rem 1rem', color: '#F0EDE8', fontSize: '0.92rem', outline: 'none'
  },
  addBtn: {
    background: '#F5A623', border: 'none', borderRadius: '8px',
    padding: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center'
  },
  doneBtn: {
    width: '100%', background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '10px', padding: '0.85rem', fontWeight: '700',
    cursor: 'pointer', fontSize: '0.9rem', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
  }
}
