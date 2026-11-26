import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, CheckCircle2, Clock, Award, Lock, Trash2, Copy,
  MessageSquare, TrendingUp, Shield, Crown, Share2,
} from 'lucide-react'
import { daysLeft, percent, type UserChallenge } from '../../lib/challenges'
import Leaderboard from './Leaderboard'
import ChallengeCalendar from './ChallengeCalendar'
import ChallengeChat from './ChallengeChat'

type Tab = 'progress' | 'people' | 'chat'

type Props = {
  uc: UserChallenge
  userId: string
  today: string
  participants: any[]
  myCheckins: string[]
  leavesLeft: number
  checkingIn: boolean
  onCheckIn: () => void
  onDelete: () => Promise<void>
  onLeave: () => Promise<void>
  onCopyCode: (code: string) => void
  onRefresh: () => Promise<void>
}

export default function ChallengeCard({
  uc, userId, today, participants, myCheckins,
  leavesLeft, checkingIn, onCheckIn, onDelete, onLeave, onCopyCode, onRefresh,
}: Props) {
  const ch = uc.challenges
  const [tab, setTab] = useState<Tab>('progress')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [err, setErr] = useState('')

  if (!ch) return null

  const isCreator = ch.created_by === userId
  const pct = percent(uc)
  const done = uc.progress >= ch.days
  const checkedToday = uc.last_checked_in === today
  const left = daysLeft(uc)

  const ring = useMemo(() => {
    const size = 96
    const stroke = 7
    const r = (size - stroke) / 2
    const c = 2 * Math.PI * r
    const offset = c - (pct / 100) * c
    return { size, stroke, r, c, offset }
  }, [pct])

  const ringColor = done ? '#4CAF50' : checkedToday ? '#F5A623' : '#6FA8F5'

  const doDelete = async () => {
    setErr('')
    setDeleting(true)
    try { await onDelete() } catch (e: any) { setErr(e?.message || 'Delete failed') }
    setDeleting(false)
  }
  const doLeave = async () => {
    setErr('')
    setLeaving(true)
    try { await onLeave() } catch (e: any) { setErr(e?.message || 'Leave failed') }
    setLeaving(false)
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={styles.hero}>
      <div style={{ ...styles.glow, background: isCreator ? 'radial-gradient(circle at top right, rgba(245,166,35,0.22), transparent 60%)' : 'radial-gradient(circle at top right, rgba(111,168,245,0.16), transparent 60%)' }} />
      <div style={styles.topRow}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={styles.badgeRow}>
            <span style={styles.categoryPill}>{ch.category}</span>
            {ch.visibility === 'private' && <span style={styles.privatePill}><Lock size={9} /> Private</span>}
            {ch.proof_required && <span style={styles.proofPill}><Shield size={9} /> Proof</span>}
            {isCreator && <span style={styles.ownerPill}><Crown size={9} /> You created this</span>}
          </div>
          <h3 style={styles.name}>{ch.name}</h3>
          <div style={styles.metaRow}>
            <span style={styles.meta}><Clock size={11} color="#6B6B6B" />{done ? 'Completed' : `${left} days left`}</span>
            <span style={styles.meta}><Users size={11} color="#6B6B6B" />{participants.length} joined</span>
          </div>
        </div>
        <div style={{ position: 'relative', width: ring.size, height: ring.size, flexShrink: 0 }}>
          <svg width={ring.size} height={ring.size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={ring.size / 2} cy={ring.size / 2} r={ring.r} stroke="#1A1A1A" strokeWidth={ring.stroke} fill="none" />
            <motion.circle
              cx={ring.size / 2} cy={ring.size / 2} r={ring.r}
              stroke={ringColor} strokeWidth={ring.stroke} strokeLinecap="round" fill="none"
              strokeDasharray={ring.c}
              initial={{ strokeDashoffset: ring.c }}
              animate={{ strokeDashoffset: ring.offset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div style={styles.ringLabel}>
            <div style={styles.ringPct}>{pct}%</div>
            <div style={styles.ringSub}>{uc.progress}/{ch.days}</div>
          </div>
        </div>
      </div>

      {ch.visibility === 'private' && ch.access_code && isCreator && (
        <div style={styles.codeStrip}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.codeLabel}>Your access code — share this</div>
            <div style={styles.codeValue}>{ch.access_code}</div>
          </div>
          <button style={styles.copyBtn} onClick={() => onCopyCode(ch.access_code!)}>
            <Copy size={12} color="#F5A623" /> Copy
          </button>
        </div>
      )}

      <div style={styles.tabs}>
        <TabBtn active={tab === 'progress'} onClick={() => setTab('progress')} icon={<TrendingUp size={13} />} label="Progress" />
        <TabBtn active={tab === 'people'} onClick={() => setTab('people')} icon={<Users size={13} />} label="People" />
        <TabBtn active={tab === 'chat'} onClick={() => setTab('chat')} icon={<MessageSquare size={13} />} label="Chat" />
      </div>

      <div style={styles.tabBody}>
        {tab === 'progress' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <ChallengeCalendar checkinDates={myCheckins} />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {!done && (
                <button
                  style={{ ...styles.checkBtn, ...(checkedToday ? styles.checkDone : {}) }}
                  onClick={() => !checkedToday && onCheckIn()}
                  disabled={checkedToday || checkingIn}
                >
                  <CheckCircle2 size={15} color={checkedToday ? '#6B6B6B' : '#0A0A0A'} />
                  {checkingIn ? 'Saving…' : checkedToday ? 'Checked in today' : 'Check in today'}
                </button>
              )}
              {done && <div style={styles.donePill}><Award size={14} color="#F5A623" /> Challenge complete</div>}
            </div>
          </div>
        )}
        {tab === 'people' && <Leaderboard participants={participants as any} currentUserId={userId} totalDays={ch.days} />}
        {tab === 'chat' && <ChallengeChat challengeId={ch.id} userId={userId} embedded />}
      </div>

      {err && <div style={styles.error}>{err}</div>}

      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
        <button
          style={styles.shareLink}
          onClick={() => {
            const url = `${window.location.origin}/challenges/${ch.id}`
            if (navigator.share) {
              navigator.share({ title: ch.name, text: `Join my challenge: ${ch.name}`, url }).catch(() => {})
            } else {
              navigator.clipboard.writeText(url).then(() => alert('Invite link copied!')).catch(() => {})
            }
          }}
        >
          <Share2 size={12} color="#F5A623" /> Share invite link
        </button>
      </div>
      <div style={styles.footer}>
        {isCreator ? (
          confirmDelete ? (
            <div style={styles.confirmRow}>
              <span style={styles.confirmText}>Delete for everyone?</span>
              <button style={styles.confirmYes} onClick={doDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</button>
              <button style={styles.confirmNo} onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          ) : (
            <button style={styles.deleteLink} onClick={() => setConfirmDelete(true)}>
              <Trash2 size={12} color="#E53E3E" /> Delete challenge
            </button>
          )
        ) : confirmLeave ? (
          <div style={styles.confirmRow}>
            <span style={styles.confirmText}>Leave? Uses 1 of {leavesLeft} leaves.</span>
            <button style={styles.confirmYes} onClick={doLeave} disabled={leaving}>{leaving ? 'Leaving…' : 'Leave'}</button>
            <button style={styles.confirmNo} onClick={() => setConfirmLeave(false)}>Cancel</button>
          </div>
        ) : (
          <button style={styles.leaveLink} onClick={() => setConfirmLeave(true)} disabled={leavesLeft <= 0}>
            Leave challenge {leavesLeft > 0 ? `(${leavesLeft} left)` : '(no leaves)'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{ ...styles.tabBtn, ...(active ? styles.tabActive : {}) }}>
      {icon}
      {label}
    </button>
  )
}

const styles: Record<string, React.CSSProperties> = {
  hero: { position: 'relative', overflow: 'hidden', borderRadius: '24px', background: 'linear-gradient(180deg, #181818 0%, #0A0A0A 100%)', border: '1px solid #262626', padding: '1.25rem', boxShadow: '0 30px 70px -36px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.03)' },
  glow: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  topRow: { position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '0.9rem', marginBottom: '1rem' },
  badgeRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.55rem' },
  categoryPill: { background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', color: '#F5A623', fontSize: '0.62rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '20px', textTransform: 'capitalize', letterSpacing: '0.03em' },
  privatePill: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A', color: '#A0A0A0', fontSize: '0.62rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '20px' },
  proofPill: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', color: '#4CAF50', fontSize: '0.62rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '20px' },
  ownerPill: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'linear-gradient(135deg, #F5A623, #D9821A)', border: 'none', color: '#0A0A0A', fontSize: '0.6rem', fontWeight: 800, padding: '0.22rem 0.6rem', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  name: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.2rem', color: '#F5F1EA', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 },
  metaRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.45rem' },
  meta: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#8A8A8A', fontSize: '0.72rem' },
  ringLabel: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem', color: '#F5F1EA', lineHeight: 1 },
  ringSub: { color: '#6B6B6B', fontSize: '0.62rem', marginTop: '0.15rem' },
  codeStrip: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(245,166,35,0.05)', border: '1px dashed rgba(245,166,35,0.3)', borderRadius: '14px', padding: '0.75rem 0.9rem', marginBottom: '1rem' },
  codeLabel: { color: '#8A8A8A', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700 },
  codeValueRow: { display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' },
  codeValue: { color: '#F5A623', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.2em' },
  iconBtnSmall: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  copyBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', borderRadius: '8px', padding: '0.4rem 0.7rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' },
  editCodeInput: { flex: 1, background: '#0A0A0A', border: '1px solid #262626', borderRadius: '8px', padding: '0.4rem 0.65rem', color: '#F5F1EA', fontSize: '0.82rem', outline: 'none', letterSpacing: '0.15em', fontFamily: 'Space Grotesk', fontWeight: 700, minWidth: 0 },
  saveCodeBtn: { background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '8px', padding: '0.4rem 0.7rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' },
  cancelCodeBtn: { background: 'transparent', color: '#8A8A8A', border: '1px solid #262626', borderRadius: '8px', padding: '0.4rem 0.7rem', fontSize: '0.72rem', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '0.3rem', background: 'rgba(0,0,0,0.45)', borderRadius: '12px', padding: '0.25rem', marginBottom: '0.9rem' },
  tabBtn: { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: 'transparent', border: 'none', color: '#7A7A7A', fontSize: '0.76rem', fontWeight: 600, padding: '0.5rem 0', borderRadius: '9px', cursor: 'pointer' },
  tabActive: { background: 'rgba(245,166,35,0.14)', color: '#F5A623' },
  tabBody: { position: 'relative', minHeight: '140px' },
  checkBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'linear-gradient(135deg, #F5A623, #E1921D)', color: '#0A0A0A', border: 'none', borderRadius: '11px', padding: '0.72rem 1.15rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 10px 24px -12px rgba(245,166,35,0.7)' },
  checkDone: { background: 'rgba(255,255,255,0.05)', color: '#7A7A7A', cursor: 'default', boxShadow: 'none' },
  donePill: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', borderRadius: '11px', padding: '0.6rem 0.95rem', fontWeight: 600, fontSize: '0.82rem' },
  error: { background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', color: '#E53E3E', fontSize: '0.78rem', padding: '0.6rem 0.8rem', borderRadius: '10px', marginTop: '0.75rem' },
  footer: { marginTop: '0.9rem', paddingTop: '0.8rem', borderTop: '1px solid #1A1A1A', display: 'flex', justifyContent: 'flex-start' },
  shareLink: { background: 'none', border: 'none', color: '#F5A623', fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0', marginRight: '0.75rem' },
  deleteLink: { background: 'none', border: 'none', color: '#E53E3E', fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0' },
  leaveLink: { background: 'none', border: 'none', color: '#8A8A8A', fontSize: '0.72rem', cursor: 'pointer', padding: '0.3rem 0' },
  confirmRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', width: '100%' },
  confirmText: { color: '#8A8A8A', fontSize: '0.75rem', flex: 1, minWidth: '160px' },
  confirmYes: { background: '#E53E3E', color: 'white', border: 'none', borderRadius: '8px', padding: '0.35rem 0.7rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' },
  confirmNo: { background: 'transparent', color: '#8A8A8A', border: '1px solid #262626', borderRadius: '8px', padding: '0.35rem 0.7rem', fontSize: '0.72rem', cursor: 'pointer' },
}
