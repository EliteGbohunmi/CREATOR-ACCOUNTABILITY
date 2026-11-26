import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { sendNudge } from '../lib/backend'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import {
  Users, Search, Check, X, Flame, AlertCircle, UserPlus, Clock,
  UserMinus, Loader, Eye, Send, ChevronRight, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

const NUDGE_MESSAGES = [
  "Hey {partner}! 👋 You haven't posted today yet. Don't break your streak — go create something! 🔥",
  "Your partner is checking on you, {partner}! Time to post and keep that streak alive.",
  "{partner}, you're falling behind! Post something now – your streak depends on it.",
  "Accountability check! Don't let your partner down – post today, {partner}!",
  "{partner}, your streak is at risk! One post today keeps the flame alive.",
  "Hey {partner}, your partner noticed you haven't posted yet. Let's go!",
  "Your partner says: '{partner}, get that post up! Your streak needs you.'",
  "{partner}, this is your nudge from your partner. One post today keeps the chain going.",
  "Don't break the chain, {partner}! Your partner believes in you – post now!",
  "{partner}, your partner is waiting for your post. You've got this!",
  "Time to create, {partner}. Your partner just nudged you to share your work.",
  "{partner}, your partner is holding you accountable. Post something!",
  "Nudge from your partner: '{partner}, what are you waiting for? Post today!'",
  "{partner}, your partner checked in and saw you missed today. Let's fix that!",
  "Hey {partner}, your partner is on fire – don't let the streak die. Post now!",
  "{partner}, this is your reminder to post. You'll thank yourself later.",
  "Your partner says: '{partner}, don't procrastinate – post today!'",
  "{partner}, your partner is watching your streak. Keep it going with one post!",
  "Nudge! Your partner wants to see your post, {partner}. The community is waiting.",
  "{partner}, your partner just sent a nudge – it's your turn to create something amazing!"
]

function getRandomNudgeMessage(partnerName: string): string {
  const raw = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)]
  return raw.replace(/{partner}/g, partnerName)
}

const COLORS = {
  bg: '#0A0A0A',
  surface: '#111111',
  surfaceRaised: 'linear-gradient(180deg, #141414 0%, #0D0D0D 100%)',
  border: '#1E1E1E',
  borderSoft: 'rgba(255,255,255,0.06)',
  gold: '#F5A623',
  goldSoft: 'rgba(245,166,35,0.12)',
  goldBorder: 'rgba(245,166,35,0.28)',
  text: '#F0EDE8',
  textDim: '#8A8A8A',
  textFaint: '#5C5C5C',
  green: '#4CAF50',
  greenSoft: 'rgba(76,175,80,0.12)',
  greenBorder: 'rgba(76,175,80,0.28)',
  red: '#E53E3E',
  redSoft: 'rgba(229,62,62,0.12)',
  redBorder: 'rgba(229,62,62,0.28)',
}

const AVATAR_GRADIENTS = [
  ['#F5A623', '#D9821A'],
  ['#6FA8F5', '#3D7DD9'],
  ['#F56F91', '#D93D63'],
  ['#6FCB73', '#3DA843'],
  ['#B98CF5', '#8A4DD9'],
]

function getInitials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase() || '?'
}
function getAvatarGradient(name?: string) {
  const key = name || '?'
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash)
  const [a, b] = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

function relativeTime(dateStr?: string | null) {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day === 1) return 'Yesterday'
  if (day < 7) return `${day}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function renderAvatar(avatarUrl: string | null, name: string, size: number = 44) {
  const common: React.CSSProperties = {
    width: `${size}px`, height: `${size}px`,
    borderRadius: `${Math.round(size * 0.32)}px`,
    flexShrink: 0, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: getAvatarGradient(name),
    color: '#0A0A0A', fontWeight: 700,
    fontSize: `${Math.round(size * 0.36)}px`,
    fontFamily: 'Space Grotesk', letterSpacing: '-0.01em',
    boxShadow: '0 4px 14px -4px rgba(0,0,0,0.5)'
  }
  if (avatarUrl) {
    return (
      <div style={{ ...common, background: 'transparent' }}>
        <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  return <div style={common}>{getInitials(name)}</div>
}

// Streak ring around avatar (arc = current / 30 capped at 100%)
function StreakRing({ streak, checkedIn, size, children }: { streak: number; checkedIn: boolean; size: number; children: React.ReactNode }) {
  const pct = Math.min(1, streak / 30)
  const r = (size + 8) / 2
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size + 8, height: size + 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size + 8} height={size + 8} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={(size + 8) / 2} cy={(size + 8) / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={2} fill="none" />
        <circle
          cx={(size + 8) / 2} cy={(size + 8) / 2} r={r}
          stroke={checkedIn ? COLORS.green : COLORS.gold}
          strokeWidth={2.5}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {children}
    </div>
  )
}

// Nudge cooldown helpers (localStorage)
const NUDGE_COOLDOWN_MS = 30 * 60 * 1000
function getLastNudge(partnerId: string): number | null {
  const raw = localStorage.getItem(`nudge_${partnerId}`)
  return raw ? Number(raw) : null
}
function setLastNudge(partnerId: string) {
  localStorage.setItem(`nudge_${partnerId}`, String(Date.now()))
}
function cooldownRemaining(partnerId: string): number {
  const last = getLastNudge(partnerId)
  if (!last) return 0
  return Math.max(0, NUDGE_COOLDOWN_MS - (Date.now() - last))
}

export default function Partners() {
  const { user } = useAuth()
  const [partners, setPartners] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [sent, setSent] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [nudgingIds, setNudgingIds] = useState<Set<string>>(new Set())
  const [cooldownTick, setCooldownTick] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [discoverTab, setDiscoverTab] = useState<'search' | 'suggested'>('suggested')
  const [sentExpanded, setSentExpanded] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (user) {
      fetchAll().catch(err => {
        setError(err.message || 'Network error')
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchSuggestions()
  }, [user, partners, sent])

  // Cooldown ticker
  useEffect(() => {
    const id = setInterval(() => setCooldownTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const fetchAll = async () => {
    setError(null)
    const { data: partnersData, error: pErr } = await supabase
      .from('accountability_partners')
      .select(`
        *,
        user1:profiles!accountability_partners_user1_id_fkey(id, name, avatar_url),
        user2:profiles!accountability_partners_user2_id_fkey(id, name, avatar_url)
      `)
      .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)

    if (pErr) throw pErr

    const partnerList = []
    for (const p of partnersData || []) {
      const isUser1 = p.user1_id === user!.id
      const partnerId = isUser1 ? p.user2_id : p.user1_id
      const partnerProfile = isUser1 ? p.user2 : p.user1
      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak, best_streak, last_checked_in')
        .eq('user_id', partnerId)
        .single()
      partnerList.push({ ...p, partnerId, partnerName: partnerProfile?.name, partnerAvatar: partnerProfile?.avatar_url, streak })
    }
    setPartners(partnerList)

    const { data: incoming } = await supabase
      .from('partner_requests')
      .select('*, profiles!partner_requests_sender_id_fkey(id, name)')
      .eq('receiver_id', user!.id)
      .eq('status', 'pending')
    setRequests(incoming || [])

    const { data: outgoing } = await supabase
      .from('partner_requests')
      .select('*, profiles!partner_requests_receiver_id_fkey(id, name)')
      .eq('sender_id', user!.id)
      .eq('status', 'pending')
    setSent(outgoing || [])

    setLoading(false)
  }

  const fetchSuggestions = async () => {
    if (!user) return
    setLoadingSuggestions(true)
    try {
      const excludedIds = new Set<string>()
      excludedIds.add(user.id)
      partners.forEach(p => excludedIds.add(p.partnerId))
      sent.forEach(s => excludedIds.add(s.receiver_id))
      requests.forEach(r => excludedIds.add(r.sender_id))
      const excludedArray = Array.from(excludedIds)

      let query = supabase
        .from('profiles')
        .select('id, name, email, created_at, avatar_url')
        .order('created_at', { ascending: false })
        .limit(20)
      if (excludedArray.length > 0) {
        query = query.not('id', 'in', `(${excludedArray.join(',')})`)
      }
      const { data, error } = await query
      if (error) throw error
      setSuggestions((data || []).slice(0, 6))
    } catch (err) {
      console.error('Failed to load suggestions:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const fetchUserProfile = async (userId: string) => {
    setLoadingProfile(true)
    try {
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, email, created_at, bio, avatar_url')
        .eq('id', userId)
        .single()
      if (pErr) throw pErr

      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak, best_streak, last_checked_in')
        .eq('user_id', userId)
        .single()

      const { count: partnerCount } = await supabase
        .from('accountability_partners')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      setProfileData({
        ...profile,
        streak: streak || { current_streak: 0, best_streak: 0, last_checked_in: null },
        partnerCount: partnerCount || 0
      })
    } catch (err) {
      toast.error('Failed to load profile')
    } finally {
      setLoadingProfile(false)
    }
  }

  const togglePartner = (userId: string) => {
    if (selectedPartnerId === userId) {
      setSelectedPartnerId(null)
      setProfileData(null)
    } else {
      setSelectedPartnerId(userId)
      fetchUserProfile(userId)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .ilike('name', `%${searchQuery}%`)
        .neq('id', user!.id)
        .limit(10)
      const partnerIds = partners.map(p => p.partnerId)
      setSearchResults((data || []).filter(u => !partnerIds.includes(u.id)))
    } catch (err) {
      toast.error('Search failed')
    }
    setSearching(false)
  }

  const sendRequest = async (receiverId: string) => {
    setSending(receiverId)
    try {
      const res = await fetch('https://streak-backend-ar7h.onrender.com/api/partners/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user!.id, receiver_id: receiverId })
      })
      if (!res.ok) throw new Error(await res.text())
      await fetchAll()
      await fetchSuggestions()
      setSearchResults([])
      setSearchQuery('')
      toast.success('Request sent')
    } catch (err) {
      toast.error('Request failed: ' + (err as Error).message)
    }
    setSending(null)
  }

  const acceptRequest = async (requestId: string, senderId: string) => {
    try {
      await supabase.from('partner_requests').update({ status: 'accepted' }).eq('id', requestId)
      await supabase.from('accountability_partners').insert({ user1_id: senderId, user2_id: user!.id })
      await fetchAll()
      await fetchSuggestions()
      toast.success('Partner added')
    } catch (err) {
      toast.error('Accept failed: ' + (err as Error).message)
    }
  }

  const declineRequest = async (requestId: string) => {
    try {
      await supabase.from('partner_requests').update({ status: 'declined' }).eq('id', requestId)
      await fetchAll()
      await fetchSuggestions()
    } catch (err) {
      toast.error('Decline failed: ' + (err as Error).message)
    }
  }

  const removePartner = async (partnerId: string) => {
    if (!confirm('Remove this partner?')) return
    try {
      await supabase
        .from('accountability_partners')
        .delete()
        .or(`user1_id.eq.${partnerId},user2_id.eq.${user!.id}`)
        .or(`user1_id.eq.${user!.id},user2_id.eq.${partnerId}`)
      if (selectedPartnerId === partnerId) { setSelectedPartnerId(null); setProfileData(null) }
      await fetchAll()
      await fetchSuggestions()
      toast.success('Partner removed')
    } catch (err) {
      toast.error('Remove failed: ' + (err as Error).message)
    }
  }

  const handleNudge = async (partnerId: string, partnerName: string) => {
    if (nudgingIds.has(partnerId)) return
    if (cooldownRemaining(partnerId) > 0) {
      toast('You just nudged them. Give it a few minutes.', { icon: '⏱️' })
      return
    }
    setNudgingIds(prev => new Set(prev).add(partnerId))
    try {
      await sendNudge(user!.id, partnerId)
      const message = getRandomNudgeMessage(partnerName)
      try { await navigator.clipboard.writeText(message) } catch {}
      setLastNudge(partnerId)
      setCooldownTick(t => t + 1)
      toast.success('Nudge sent to ' + partnerName)
    } catch (err: any) {
      toast.error('Nudge failed: ' + (err.message || 'Unknown error'))
    } finally {
      setNudgingIds(prev => {
        const next = new Set(prev)
        next.delete(partnerId)
        return next
      })
    }
  }

  const partnerCheckedIn = (streak: any) => streak?.last_checked_in === today
  const activeToday = partners.filter(p => partnerCheckedIn(p.streak)).length
  const maxPartners = 5
  const canAddMore = partners.length < maxPartners

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              style={{ height: '92px', borderRadius: '18px', background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
            />
          ))}
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div style={styles.errorWrap}>
          <div style={styles.errorIconRing}><AlertCircle size={26} color={COLORS.red} /></div>
          <h2 style={styles.errorTitle}>Something went wrong</h2>
          <p style={styles.errorMessage}>{error}</p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={styles.retryBtn}
            onClick={() => { setError(null); setLoading(true); fetchAll().catch(e => setError(e.message)) }}>
            Try Again
          </motion.button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ paddingBottom: '120px' }}
      >
        {/* HERO HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          style={{ marginBottom: '1.75rem' }}
        >
          <div style={styles.eyebrow}>
            <span style={styles.eyebrowDot} />
            The Circle
          </div>
          <h1 style={styles.title}>
            Your accountability<br />circle.
          </h1>
          <p style={styles.subtitle}>
            The people who keep you honest. Show up for them.
          </p>

          {/* Stats strip */}
          <div style={styles.statsStrip}>
            <div style={styles.statCell}>
              <span style={styles.statValue}>{partners.length}<span style={styles.statSlash}>/{maxPartners}</span></span>
              <span style={styles.statLabel}>In circle</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statCell}>
              <span style={{ ...styles.statValue, color: COLORS.green }}>{activeToday}</span>
              <span style={styles.statLabel}>Active today</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statCell}>
              <span style={{ ...styles.statValue, color: requests.length > 0 ? COLORS.gold : COLORS.textDim }}>
                {requests.length}
              </span>
              <span style={styles.statLabel}>Pending</span>
            </div>
          </div>
        </motion.div>

        {/* PRIORITY STRIP — pending requests first */}
        <AnimatePresence>
          {requests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden', marginBottom: '2rem' }}
            >
              <div style={styles.priorityCard}>
                <div style={styles.priorityHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={styles.priorityDot}
                    />
                    <span style={styles.priorityLabel}>Needs your attention</span>
                  </div>
                  <span style={styles.countBadge}>{requests.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {requests.map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      style={styles.requestRow}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0, flex: 1 }}>
                        <div style={{ ...styles.avatarSmall, background: getAvatarGradient(r.profiles?.name) }}>
                          {getInitials(r.profiles?.name)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={styles.compactName}>{r.profiles?.name}</div>
                          <div style={styles.compactSub}>wants to be your partner</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          style={styles.acceptBtn}
                          onClick={() => acceptRequest(r.id, r.sender_id)}
                          aria-label="Accept"
                        >
                          <Check size={15} color={COLORS.bg} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          style={styles.declineBtn}
                          onClick={() => declineRequest(r.id)}
                          aria-label="Decline"
                        >
                          <X size={15} color={COLORS.red} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* YOUR CIRCLE — horizontal avatar carousel */}
        {partners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{ marginBottom: '2.5rem' }}
          >
            <div style={styles.sectionLabel}>
              <div style={{ ...styles.iconChipSmall, background: COLORS.goldSoft }}>
                <Users size={12} color={COLORS.gold} />
              </div>
              Your circle
            </div>
            <div style={styles.carousel}>
              {partners.map((p, i) => {
                const checkedIn = partnerCheckedIn(p.streak)
                const isSelected = selectedPartnerId === p.partnerId
                const streak = p.streak?.current_streak || 0
                return (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => togglePartner(p.partnerId)}
                    style={{
                      ...styles.avatarTile,
                      borderColor: isSelected ? COLORS.goldBorder : 'transparent',
                      background: isSelected ? COLORS.goldSoft : 'transparent',
                    }}
                  >
                    <StreakRing streak={streak} checkedIn={checkedIn} size={56}>
                      {renderAvatar(p.partnerAvatar, p.partnerName, 56)}
                    </StreakRing>
                    <span style={styles.tileName}>{p.partnerName?.split(' ')[0]}</span>
                    <span style={{ ...styles.tileStatus, color: checkedIn ? COLORS.green : COLORS.textFaint }}>
                      {checkedIn ? 'Active' : relativeTime(p.streak?.last_checked_in)}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* INLINE PARTNER PANEL */}
            <AnimatePresence mode="wait">
              {selectedPartnerId && (
                <motion.div
                  key={selectedPartnerId}
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: 'hidden', marginTop: '1rem' }}
                >
                  {(() => {
                    const partner = partners.find(p => p.partnerId === selectedPartnerId)
                    if (!partner) return null
                    const checkedIn = partnerCheckedIn(partner.streak)
                    const streak = partner.streak?.current_streak || 0
                    const best = partner.streak?.best_streak || 0
                    const isNudging = nudgingIds.has(partner.partnerId)
                    const cooldown = cooldownRemaining(partner.partnerId)
                    const cooldownMin = Math.ceil(cooldown / 60000)
                    return (
                      <div style={styles.detailPanel}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.1rem' }}>
                          {renderAvatar(partner.partnerAvatar, partner.partnerName, 52)}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={styles.partnerName}>{partner.partnerName}</div>
                            <div style={{ ...styles.compactSub, marginTop: '0.2rem' }}>
                              {checkedIn ? 'Posted today' : `Last seen ${relativeTime(partner.streak?.last_checked_in)}`}
                            </div>
                          </div>
                          <button
                            onClick={() => togglePartner(partner.partnerId)}
                            style={styles.iconGhostBtn}
                            aria-label="Close"
                          >
                            <X size={15} color={COLORS.textDim} />
                          </button>
                        </div>

                        <div style={styles.detailStats}>
                          <div style={styles.detailStat}>
                            <span style={styles.detailStatValue}>{streak}</span>
                            <span style={styles.detailStatLabel}>Current</span>
                          </div>
                          <div style={styles.detailStat}>
                            <span style={{ ...styles.detailStatValue, color: COLORS.textDim }}>{best}</span>
                            <span style={styles.detailStatLabel}>Best</span>
                          </div>
                          <div style={styles.detailStat}>
                            <span style={{ ...styles.detailStatValue, color: checkedIn ? COLORS.green : COLORS.textDim }}>
                              {checkedIn ? '✓' : '—'}
                            </span>
                            <span style={styles.detailStatLabel}>Today</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                          {!checkedIn ? (
                            <motion.button
                              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                              style={{
                                ...styles.sendNudgeBtn,
                                opacity: isNudging || cooldown > 0 ? 0.6 : 1,
                              }}
                              disabled={isNudging || cooldown > 0}
                              onClick={() => handleNudge(partner.partnerId, partner.partnerName)}
                            >
                              <Send size={14} color={COLORS.bg} />
                              {isNudging ? 'Sending…' : cooldown > 0 ? `Nudged ${cooldownMin}m ago` : 'Send nudge'}
                            </motion.button>
                          ) : (
                            <div style={styles.doneRow}>
                              <Sparkles size={14} color={COLORS.green} />
                              <span>No nudge needed — they showed up</span>
                            </div>
                          )}
                          <button
                            style={styles.removeBtn}
                            onClick={() => removePartner(partner.partnerId)}
                            aria-label="Remove partner"
                          >
                            <UserMinus size={15} color={COLORS.textFaint} />
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* DISCOVER — search + suggested merged */}
        {canAddMore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={{ marginBottom: '2.5rem' }}
          >
            <div style={styles.sectionLabel}>
              <div style={{ ...styles.iconChipSmall, background: 'rgba(255,255,255,0.05)' }}>
                <UserPlus size={12} color={COLORS.textDim} />
              </div>
              Grow your circle
            </div>

            <div style={styles.card}>
              {/* Segmented toggle */}
              <div style={styles.segment}>
                <button
                  onClick={() => setDiscoverTab('search')}
                  style={{
                    ...styles.segmentBtn,
                    ...(discoverTab === 'search' ? styles.segmentBtnActive : {})
                  }}
                >
                  <Search size={13} />
                  Search
                </button>
                <button
                  onClick={() => setDiscoverTab('suggested')}
                  style={{
                    ...styles.segmentBtn,
                    ...(discoverTab === 'suggested' ? styles.segmentBtnActive : {})
                  }}
                >
                  <Sparkles size={13} />
                  Suggested
                </button>
              </div>

              <AnimatePresence mode="wait">
                {discoverTab === 'search' ? (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        style={{ ...styles.input, flex: 1 }}
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchUsers()}
                      />
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        style={styles.searchBtn}
                        onClick={searchUsers}
                        disabled={searching}
                      >
                        <Search size={16} color={COLORS.bg} />
                      </motion.button>
                    </div>
                    {searchResults.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.85rem' }}>
                        {searchResults.map(u => {
                          const alreadySent = sent.some(s => s.receiver_id === u.id)
                          return (
                            <div key={u.id} style={styles.resultRow}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0, flex: 1 }}>
                                {renderAvatar(u.avatar_url, u.name, 40)}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={styles.compactName}>{u.name}</div>
                                  <div style={styles.compactSub}>{u.email}</div>
                                </div>
                              </div>
                              {alreadySent ? (
                                <div style={styles.pendingChip}>
                                  <Clock size={11} color={COLORS.textFaint} />
                                  Pending
                                </div>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                  style={styles.requestBtn}
                                  onClick={() => sendRequest(u.id)}
                                  disabled={sending === u.id}
                                >
                                  {sending === u.id ? '...' : 'Request'}
                                </motion.button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="suggested"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {loadingSuggestions ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
                        <Loader size={20} color={COLORS.textFaint} className="animate-spin" />
                      </div>
                    ) : suggestions.length === 0 ? (
                      <p style={{ color: COLORS.textFaint, fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                        No suggestions right now.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {suggestions.map(s => {
                          const alreadySent = sent.some(req => req.receiver_id === s.id)
                          return (
                            <div key={s.id} style={styles.resultRow}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0, flex: 1 }}>
                                {renderAvatar(s.avatar_url, s.name, 40)}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={styles.compactName}>{s.name}</div>
                                  {s.email && <div style={styles.compactSub}>{s.email}</div>}
                                </div>
                              </div>
                              {alreadySent ? (
                                <div style={styles.pendingChip}>
                                  <Clock size={11} color={COLORS.textFaint} />
                                  Pending
                                </div>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                  style={styles.requestBtn}
                                  onClick={() => sendRequest(s.id)}
                                  disabled={sending === s.id}
                                >
                                  {sending === s.id ? '...' : 'Request'}
                                </motion.button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* SENT REQUESTS — collapsed summary */}
        {sent.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ marginBottom: '2rem' }}
          >
            <button
              onClick={() => setSentExpanded(s => !s)}
              style={styles.collapsedRow}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock size={13} color={COLORS.textFaint} />
                <span style={{ color: COLORS.textDim, fontSize: '0.82rem' }}>
                  {sent.length} sent request{sent.length > 1 ? 's' : ''} waiting
                </span>
              </div>
              <motion.div animate={{ rotate: sentExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight size={15} color={COLORS.textFaint} />
              </motion.div>
            </button>
            <AnimatePresence>
              {sentExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {sent.map(r => (
                      <div key={r.id} style={styles.compactCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
                          <div style={{ ...styles.avatarSmall, background: getAvatarGradient(r.profiles?.name) }}>
                            {getInitials(r.profiles?.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={styles.compactName}>{r.profiles?.name}</div>
                            <div style={styles.compactSub}>Request pending</div>
                          </div>
                        </div>
                        <div style={styles.pendingChip}>
                          <Clock size={11} color={COLORS.textFaint} />
                          Waiting
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* MAX PARTNERS */}
        {!canAddMore && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ ...styles.card, borderColor: COLORS.goldBorder, background: 'linear-gradient(180deg, #1A1400 0%, #131313 100%)', marginBottom: '2rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Check size={16} color={COLORS.gold} />
              <p style={{ color: COLORS.gold, fontSize: '0.85rem', margin: 0 }}>
                Your circle is full ({maxPartners}/{maxPartners}). Remove one to add another.
              </p>
            </div>
          </motion.div>
        )}

        {/* EMPTY */}
        {partners.length === 0 && requests.length === 0 && sent.length === 0 && suggestions.length === 0 && !loadingSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.empty}
          >
            <div style={styles.emptyIconRing}>
              <Users size={24} color={COLORS.textFaint} />
            </div>
            <p style={styles.emptyTitle}>Your circle is empty</p>
            <p style={styles.emptySub}>
              Accountability partners are the difference between "I'll do it tomorrow" and "I did it today."
              Find someone to grow with.
            </p>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  )
}

const styles: Record<string, any> = {
  eyebrow: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    color: COLORS.textFaint, fontSize: '0.7rem', textTransform: 'uppercase',
    letterSpacing: '0.18em', marginBottom: '0.6rem', fontWeight: 600
  },
  eyebrowDot: {
    width: '5px', height: '5px', borderRadius: '50%',
    background: COLORS.gold, boxShadow: '0 0 8px rgba(245,166,35,0.8)', display: 'inline-block'
  },
  title: {
    fontSize: '2.2rem', fontFamily: 'Space Grotesk', fontWeight: 700,
    letterSpacing: '-0.035em', color: COLORS.text, lineHeight: 1.02, margin: 0
  },
  subtitle: {
    color: COLORS.textDim, fontSize: '0.92rem',
    letterSpacing: '-0.005em', margin: '0.5rem 0 0', lineHeight: 1.5, maxWidth: '340px'
  },
  statsStrip: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    marginTop: '1.25rem', padding: '0.85rem 1rem',
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid ${COLORS.border}`, borderRadius: '14px'
  },
  statCell: { display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center' },
  statValue: {
    color: COLORS.text, fontFamily: 'Space Grotesk',
    fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1
  },
  statSlash: { color: COLORS.textFaint, fontWeight: 500, fontSize: '0.9rem' },
  statLabel: {
    color: COLORS.textFaint, fontSize: '0.65rem',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginTop: '0.35rem', fontWeight: 600
  },
  statDivider: { width: '1px', height: '26px', background: COLORS.border },
  priorityCard: {
    background: 'linear-gradient(180deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.02) 100%)',
    border: `1px solid ${COLORS.goldBorder}`,
    borderRadius: '18px', padding: '1rem 1.15rem'
  },
  priorityHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: '0.5rem'
  },
  priorityDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: COLORS.gold, display: 'inline-block',
    boxShadow: '0 0 8px rgba(245,166,35,0.8)'
  },
  priorityLabel: {
    color: COLORS.gold, fontSize: '0.72rem',
    textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700
  },
  requestRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: '0.75rem',
    background: 'rgba(0,0,0,0.25)', borderRadius: '12px',
    padding: '0.7rem 0.85rem'
  },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '0.55rem',
    color: COLORS.textDim, fontSize: '0.7rem', textTransform: 'uppercase',
    letterSpacing: '0.14em', marginBottom: '0.95rem', fontWeight: 600
  },
  iconChipSmall: {
    width: '20px', height: '20px', borderRadius: '6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  countBadge: {
    background: COLORS.gold, color: COLORS.bg,
    fontSize: '0.68rem', fontWeight: 700, borderRadius: '10px',
    padding: '1px 8px', letterSpacing: 0
  },
  carousel: {
    display: 'flex', gap: '0.5rem', overflowX: 'auto',
    paddingBottom: '0.5rem', margin: '0 -0.25rem', paddingLeft: '0.25rem', paddingRight: '0.25rem',
    scrollbarWidth: 'none'
  },
  avatarTile: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.4rem', padding: '0.85rem 0.5rem',
    background: 'transparent', border: '1px solid transparent',
    borderRadius: '16px', cursor: 'pointer',
    minWidth: '86px', flexShrink: 0,
    transition: 'background 0.2s, border-color 0.2s'
  },
  tileName: {
    color: COLORS.text, fontSize: '0.78rem',
    fontWeight: 600, letterSpacing: '-0.01em',
    maxWidth: '80px', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  tileStatus: {
    fontSize: '0.66rem', fontWeight: 500,
    maxWidth: '80px', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  detailPanel: {
    background: COLORS.surfaceRaised,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '18px', padding: '1.15rem 1.25rem',
    boxShadow: '0 10px 30px -15px rgba(0,0,0,0.8)'
  },
  detailStats: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.5rem'
  },
  detailStat: {
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px', padding: '0.7rem 0.5rem',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.2rem'
  },
  detailStatValue: {
    color: COLORS.gold, fontFamily: 'Space Grotesk',
    fontSize: '1.15rem', fontWeight: 700, lineHeight: 1
  },
  detailStatLabel: {
    color: COLORS.textFaint, fontSize: '0.62rem',
    textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600
  },
  partnerName: {
    fontWeight: 700, fontSize: '1rem', color: COLORS.text,
    letterSpacing: '-0.015em', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    fontFamily: 'Space Grotesk'
  },
  compactName: {
    fontWeight: 600, fontSize: '0.88rem', color: COLORS.text,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  compactSub: {
    color: COLORS.textFaint, fontSize: '0.74rem',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    marginTop: '0.1rem'
  },
  compactCard: {
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`,
    borderRadius: '13px', padding: '0.8rem 1rem',
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: '0.75rem'
  },
  avatarSmall: {
    width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#0A0A0A', fontWeight: 700, fontSize: '0.82rem',
    fontFamily: 'Space Grotesk', letterSpacing: '-0.01em'
  },
  sendNudgeBtn: {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    background: COLORS.gold, color: COLORS.bg, border: 'none',
    borderRadius: '12px', padding: '0.7rem 0.9rem',
    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
    boxShadow: '0 4px 14px -4px rgba(245,166,35,0.5)',
    fontFamily: 'Space Grotesk', letterSpacing: '-0.005em'
  },
  doneRow: {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
    background: 'rgba(76,175,80,0.06)', border: `1px solid ${COLORS.greenBorder}`,
    borderRadius: '12px', padding: '0.7rem 0.9rem',
    color: COLORS.green, fontSize: '0.78rem', fontWeight: 500
  },
  removeBtn: {
    background: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`,
    borderRadius: '12px', width: '42px', height: '42px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  iconGhostBtn: {
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.border}`,
    borderRadius: '10px', width: '34px', height: '34px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  input: {
    background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '11px',
    padding: '0.75rem 1rem', color: COLORS.text, fontSize: '0.92rem', outline: 'none'
  },
  searchBtn: {
    background: COLORS.gold, border: 'none', borderRadius: '11px',
    padding: '0.75rem 1rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    boxShadow: '0 4px 14px -4px rgba(245,166,35,0.5)'
  },
  card: {
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`,
    borderRadius: '18px', padding: '1.1rem 1.2rem',
    boxShadow: '0 6px 20px -14px rgba(0,0,0,0.7)'
  },
  segment: {
    display: 'flex', gap: '0.35rem', marginBottom: '0.9rem',
    background: 'rgba(0,0,0,0.3)', padding: '0.25rem',
    borderRadius: '11px', width: 'fit-content'
  },
  segmentBtn: {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    background: 'transparent', border: 'none',
    color: COLORS.textDim, fontSize: '0.78rem',
    fontWeight: 600, padding: '0.5rem 0.85rem',
    borderRadius: '9px', cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s'
  },
  segmentBtnActive: {
    background: COLORS.goldSoft, color: COLORS.gold
  },
  resultRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '12px',
    padding: '0.7rem 0.85rem', gap: '0.7rem'
  },
  pendingChip: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    color: COLORS.textFaint, fontSize: '0.72rem', flexShrink: 0
  },
  requestBtn: {
    background: COLORS.goldSoft, color: COLORS.gold,
    border: `1px solid ${COLORS.goldBorder}`, borderRadius: '9px',
    padding: '0.42rem 0.85rem', fontWeight: 600,
    fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0
  },
  acceptBtn: {
    background: COLORS.gold, border: 'none', borderRadius: '9px',
    width: '34px', height: '34px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px -4px rgba(245,166,35,0.5)'
  },
  declineBtn: {
    background: 'rgba(229,62,62,0.06)', border: `1px solid ${COLORS.redBorder}`,
    borderRadius: '9px', width: '34px', height: '34px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  collapsedRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'transparent', border: `1px solid ${COLORS.border}`,
    borderRadius: '12px', padding: '0.75rem 1rem',
    cursor: 'pointer', width: '100%'
  },
  empty: {
    background: COLORS.surfaceRaised, border: `1px dashed ${COLORS.border}`, borderRadius: '20px',
    padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center'
  },
  emptyIconRing: {
    width: '54px', height: '54px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem'
  },
  emptyTitle: {
    margin: 0, color: COLORS.text, fontFamily: 'Space Grotesk',
    fontSize: '1.05rem', fontWeight: 600
  },
  emptySub: {
    margin: '0.5rem 0 0', color: COLORS.textDim,
    fontSize: '0.85rem', maxWidth: '320px', lineHeight: 1.55
  },
  errorWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '3.5rem 1.5rem', textAlign: 'center'
  },
  errorIconRing: {
    width: '56px', height: '56px', borderRadius: '50%',
    background: COLORS.redSoft, border: `1px solid ${COLORS.redBorder}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem'
  },
  errorTitle: {
    color: COLORS.text, fontFamily: 'Space Grotesk', fontWeight: 700,
    fontSize: '1.3rem', margin: 0, letterSpacing: '-0.01em'
  },
  errorMessage: {
    color: COLORS.textDim, marginTop: '0.5rem', fontSize: '0.9rem', maxWidth: '320px'
  },
  retryBtn: {
    marginTop: '1.5rem', background: COLORS.gold, color: COLORS.bg, border: 'none',
    padding: '0.7rem 1.6rem', borderRadius: '11px', fontWeight: 600, cursor: 'pointer',
    fontSize: '0.88rem', boxShadow: '0 6px 18px -6px rgba(245,166,35,0.55)'
  }
}
