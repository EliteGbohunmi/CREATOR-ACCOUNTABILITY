import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { getScoreLabel, getScoreHistory, SCORE_ACTIONS } from '../lib/creatorScore'
import { TrendingUp, Award, Download } from 'lucide-react'
import html2canvas from 'html2canvas'
import { useRef } from 'react'

export default function Score() {
  const { user } = useAuth()
  const [score, setScore] = useState(0)
  const [history, setHistory] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [{ data: prof }, hist] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user!.id).single(),
      getScoreHistory(user!.id)
    ])
    setProfile(prof)
    setScore(prof?.creator_score || 0)
    setHistory(hist)
    setLoading(false)
  }

  const downloadCard = async () => {
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 })
    const link = document.createElement('a')
    link.download = 'creator-score.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  const scoreInfo = getScoreLabel(score)
  const progress = scoreInfo.next ? Math.min((score / scoreInfo.next) * 100, 100) : 100

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {[1,2,3].map(i => <div key={i} style={{ height: '100px', borderRadius: '14px', background: '#111', border: '1px solid #1E1E1E' }} />)}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Credibility</p>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Creator Score</h1>
        <p style={{ color: '#555', marginTop: '0.3rem', fontSize: '0.9rem' }}>Your public proof of consistency</p>
      </div>

      {/* Score card — shareable */}
      <div ref={cardRef} style={{ ...styles.scoreCard, borderColor: scoreInfo.color + '40' }}>
        <div style={{ background: scoreInfo.color + '10', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: scoreInfo.color, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', fontWeight: '600' }}>
                {scoreInfo.label}
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '3.5rem', color: scoreInfo.color, lineHeight: 1 }}>
                {score}
              </div>
              <div style={{ color: '#555', fontSize: '0.78rem', marginTop: '0.3rem' }}>Creator Score</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Award size={32} color={scoreInfo.color} />
              <div style={{ color: '#555', fontSize: '0.72rem', marginTop: '0.5rem' }}>{profile?.name}</div>
            </div>
          </div>

          {scoreInfo.next && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#555', fontSize: '0.72rem' }}>Progress to {scoreInfo.nextLabel}</span>
                <span style={{ color: scoreInfo.color, fontSize: '0.72rem', fontWeight: '600' }}>{score}/{scoreInfo.next}</span>
              </div>
              <div style={{ height: '4px', background: '#2A2A2A', borderRadius: '999px', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: scoreInfo.color, borderRadius: '999px' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.25rem' }}>
          <span style={{ color: '#444', fontSize: '0.72rem' }}>creator-accountability.netlify.app</span>
          <span style={{ color: '#444', fontSize: '0.72rem' }}>Verified consistency score</span>
        </div>
      </div>

      {/* Download button */}
      <button style={styles.downloadBtn} onClick={downloadCard}>
        <Download size={15} color="#0A0A0A" />
        Download Score Card
      </button>

      {/* Score levels */}
      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <div style={styles.sectionLabel}>
          <TrendingUp size={13} color="#555" />
          Score Levels
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { label: 'Building', range: '0-200', color: '#888' },
            { label: 'Consistent', range: '200-400', color: '#4CAF50' },
            { label: 'Established', range: '400-700', color: '#2196F3' },
            { label: 'Elite Creator', range: '700-1000', color: '#F5A623' },
            { label: 'Legend', range: '1000+', color: '#9C27B0' },
          ].map(level => (
            <div key={level.label} style={{ ...styles.levelRow, borderColor: scoreInfo.label === level.label ? level.color + '40' : '#1E1E1E', background: scoreInfo.label === level.label ? level.color + '08' : '#111111' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: level.color, flexShrink: 0 }} />
              <span style={{ fontWeight: scoreInfo.label === level.label ? '600' : '400', color: scoreInfo.label === level.label ? '#F0EDE8' : '#666', fontSize: '0.9rem' }}>{level.label}</span>
              <span style={{ marginLeft: 'auto', color: '#444', fontSize: '0.78rem' }}>{level.range} pts</span>
              {scoreInfo.label === level.label && <span style={{ color: level.color, fontSize: '0.72rem', fontWeight: '600' }}>← You are here</span>}
            </div>
          ))}
        </div>
      </div>

      {/* How to earn */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={styles.sectionLabel}>
          <Award size={13} color="#555" />
          How to Earn Points
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {Object.entries(SCORE_ACTIONS).map(([key, val]) => (
            <div key={key} style={styles.actionRow}>
              <span style={{ color: '#888', fontSize: '0.85rem', flex: 1 }}>{val.label}</span>
              <span style={{ color: val.points > 0 ? '#4CAF50' : '#E53E3E', fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '0.9rem' }}>
                {val.points > 0 ? '+' : ''}{val.points}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Score history */}
      {history.length > 0 && (
        <div>
          <div style={styles.sectionLabel}>
            <TrendingUp size={13} color="#555" />
            Recent Activity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {history.map(h => (
              <div key={h.id} style={styles.historyRow}>
                <span style={{ color: '#888', fontSize: '0.85rem', flex: 1 }}>{h.action}</span>
                <span style={{ color: h.points > 0 ? '#4CAF50' : '#E53E3E', fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '0.88rem' }}>
                  {h.points > 0 ? '+' : ''}{h.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  scoreCard: {
    background: '#111111', border: '1px solid',
    borderRadius: '20px', padding: '1.5rem', marginBottom: '1rem'
  },
  downloadBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#F5A623', color: '#0A0A0A', border: 'none',
    borderRadius: '10px', padding: '0.75rem 1.25rem',
    fontWeight: '600', cursor: 'pointer', fontSize: '0.88rem'
  },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    color: '#555', fontSize: '0.75rem', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: '0.75rem'
  },
  levelRow: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    border: '1px solid', borderRadius: '10px', padding: '0.85rem 1rem'
  },
  actionRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '10px', padding: '0.75rem 1rem'
  },
  historyRow: {
    display: 'flex', alignItems: 'center',
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '10px', padding: '0.75rem 1rem'
  }
}
