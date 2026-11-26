import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { sendNudge } from '../lib/backend'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import {
  Users, Search, Check, X, Flame, AlertCircle, UserPlus, Clock,
  UserMinus, Loader, Send, Sparkles
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

function StreakRing({ streak, checkedIn, size, children }: { streak: number; checkedIn: boolean; size: number; children: React.ReactNode }) {
  const pct = Math.min(1, streak / 30)
  const r = (size + 10) / 2
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size + 10, height: size + 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size + 10} height={size + 10} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={(size + 10) / 2} cy={(size + 10) / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={2.5} fill="none" />
        <circle
          cx={(size + 10) / 2} cy={(size + 10) / 2} r={r}
          stroke={checkedIn ? COLORS.green : COLORS.gold}
          strokeWidth={3}
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
  const [searchFocused, setSearchFocused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [nudgingIds, setNudgingIds] = useState<Set<string>>(new Set())
  const [cooldownTick, setCooldownTick] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [discoverTab, setDiscoverTab] = useState<'search' | 'suggested'>('suggested')

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

  const searchUsers = async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
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

  // live search as user types
  useEffect(() => {
    if (!searchFocused) return
    const t = setTimeout(() => { searchUsers() }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, searchFocused])

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
      if (selectedPartnerId === partnerId) setSelectedPartnerId(null)
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
        {/* TITLE + SEARCH BAR */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
            <h1 style={styles.title}>Partners</h1>
            <div style={styles.countPill}>
              <Users size={13} color={COLORS.gold} />
              <span>{partners.length}/{maxPartners}</span>
            </div>
          </div>

          {/* SEARCH — first interaction */}
          <div style={styles.searchWrap}>
            <Search size={16} color={COLORS.textFaint} style={{ flexShrink: 0 }} />
            <input
              style={styles.searchInput}
              placeholder="Search creators to add..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                style={styles.clearBtn}
              >
                <X size={14} color={COLORS.textFaint} />
              </button>
            )}
          </div>

          {/* Search results appear right under the search bar */}
          <AnimatePresence>
            {searchFocused && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={styles.searchResults}
              >
                {searching ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                    <Loader size={18} color={COLORS.textFaint} className="animate-spin" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p style={{ color: COLORS.textFaint, fontSize: '0.82rem', textAlign: 'center', padding: '1rem 0' }}>
                    No creators found for "{searchQuery}"
                  </p>
                ) : (
                  searchResults.map(u => {
                    const alreadySent = sent.some(s => s.receiver_id === u.id)
                    return (
                      <div key={u.id} style={styles.searchResultRow}>
                        {renderAvatar(u.avatar_url, u.name, 40)}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={styles.compactName}>{u.name}</div>
                          <div style={styles.compactSub}>{u.email}</div>
                        </div>
                        {alreadySent ? (
                          <div style={styles.pendingChip}>
                            <Clock size={11} color={COLORS.textFaint} />
                            Pending
                          </div>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            style={styles.requestBtn}
                            onClick={() => sendRequest(u.id)}
                            disabled={sending === u.id}
                          >
                            {sending === u.id ? '...' : 'Request'}
                          </motion.button>
                        )}
                      </div>
                    )
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* STATS — responsive grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={styles.statsGrid}
        >
          <div style={styles.statCell}>
            <span style={styles.statValue}>{partners.length}<span style={styles.statSlash}>/{maxPartners}</span></span>
            <span style={styles.statLabel}>In circle</span>
          </div>
          <div style={styles.statCell}>
            <span style={{ ...styles.statValue, color: COLORS.green }}>{activeToday}</span>
            <span style={styles.statLabel}>Active today</span>
          </div>
          <div style={styles.statCell}>
            <span style={{ ...styles.statValue, color: requests.length > 0 ? COLORS.gold : COLORS.textDim }}>
              {requests.length}
            </span>
            <span style={styles.statLabel}>Pending</span>
          </div>
        </motion.div>

        {/* PRIORITY — pending requests */}
        <AnimatePresence>
          {requests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden', marginBottom: '1.5rem' }}
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
                          whileTap={{ scale: 0.95 }}
                          style={styles.acceptBtn}
                          onClick={() => acceptRequest(r.id, r.sender_id)}
                          aria-label="Accept"
                        >
                          <Check size={16} color={COLORS.bg} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          style={styles.declineBtn}
                          onClick={() => declineRequest(r.id)}
                          aria-label="Decline"
                        >
                          <X size={16} color={COLORS.red} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SENT REQUESTS — inline compact chips, moved up */}
        {sent.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: '1.75rem' }}
          >
            <div style={styles.sectionLabel}>
              <Clock size={12} color={COLORS.textDim} />
              Sent · {sent.length} waiting
            </div>
            <div style={styles.sentChips}>
              {sent.map(r => (
                <div key={r.id} style={styles.sentChip}>
                  <div style={{ ...styles.sentAvatar, background: getAvatarGradient(r.profiles?.name) }}>
                    {getInitials(r.profiles?.name)}
                  </div>
                  <span style={styles.sentName}>{r.profiles?.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* YOUR CIRCLE — carousel */}
        {partners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            style={{ marginBottom: '2rem' }}
          >
            <div style={styles.sectionLabel}>
              <Users size={12} color={COLORS.gold} />
              Your circle
            </div>

            {/* Carousel with bigger avatars */}
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
                    transition={{ delay: 0.3 + i * 0.06 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedPartnerId(isSelected ? null : p.partnerId)}
                    style={{
                      ...styles.avatarTile,
                      borderColor: isSelected ? COLORS.goldBorder : 'transparent',
                      background: isSelected ? COLORS.goldSoft : 'transparent',
                    }}
                  >
                    <StreakRing streak={streak} checkedIn={checkedIn} size={72}>
                      {renderAvatar(p.partnerAvatar, p.partnerName, 72)}
                    </StreakRing>
                    <span style={styles.tileName}>{p.partnerName?.split(' ')[0]}</span>
                    <span style={{ ...styles.tileStatus, color: checkedIn ? COLORS.green : COLORS.textFaint }}>
                      {checkedIn ? 'Active' : relativeTime(p.streak?.last_checked_in)}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* INLINE PANEL */}
            <AnimatePresence mode="wait">
              {selectedPartnerId && (() => {
                const partner = partners.find(p => p.partnerId === selectedPartnerId)
                if (!partner) return null
                const checkedIn = partnerCheckedIn(partner.streak)
                const streak = partner.streak?.current_streak || 0
                const best = partner.streak?.best_streak || 0
                const isNudging = nudgingIds.has(partner.partnerId)
                const cooldown = cooldownRemaining(partner.partnerId)
                const cooldownMin = Math.ceil(cooldown / 60000)
                return (
                  <motion.div
                    key={selectedPartnerId}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden', marginTop: '1rem' }}
                  >
                    <div style={styles.detailPanel}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1rem' }}>
                        {renderAvatar(partner.partnerAvatar, partner.partnerName, 56)}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={styles.partnerName}>{partner.partnerName}</div>
                          <div style={{ ...styles.compactSub, marginTop: '0.2rem' }}>
                            {checkedIn ? 'Posted today' : `Last seen ${relativeTime(partner.streak?.last_checked_in)}`}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedPartnerId(null)}
                          style={styles.iconGhostBtn}
                          aria-label="Close"
                        >
                          <X size={16} color={COLORS.textDim} />
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
                            whileTap={{ scale: 0.98 }}
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
                          <UserMinus size={16} color={COLORS.textFaint} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })()}
            </AnimatePresence>
          </motion.div>
        )}

        {/* SUGGESTED — always shown when can add */}
        {canAddMore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{ marginBottom: '2rem' }}
          >
            <div style={styles.sectionLabel}>
              <Sparkles size={12} color={COLORS.textDim} />
              Suggested creators
            </div>
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
                        {renderAvatar(s.avatar_url, s.name, 42)}
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
                          whileTap={{ scale: 0.97 }}
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

        {/* MAX */}
        {!canAddMore && (
          <div style={{ ...styles.card, borderColor: COLORS.goldBorder, background: 'linear-gradient(180deg, #1A1400 0%, #131313 100%)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Check size={16} color={COLORS.gold} />
              <p style={{ color: COLORS.gold, fontSize: '0.85rem', margin: 0 }}>
                Your circle is full ({maxPartners}/{maxPartners}). Remove one to add another.
              </p>
            </div>
          </div>
        )}

        {/* EMPTY */}
        {partners.length === 0 && requests.length === 0 && sent.length === 0 && suggestions.length === 0 && !loadingSuggestions && (
          <div style={styles.empty}>
            <div style={styles.emptyIconRing}>
              <Users size={24} color={COLORS.textFaint} />
            </div>
            <p style={styles.emptyTitle}>Your circle is empty</p>
            <p style={styles.emptySub}>
              Accountability partners are the difference between "I'll do it tomorrow" and "I did it today."
            </p>
          </div>
        )}
      </motion.div>
    </Layout>
  )
}

const styles: Record<string, any> = {
  title: {
    fontSize: 'clamp(1.6rem, 5vw, 2rem)',
    fontFamily: 'Space Grotesk', fontWeight: 700,
    letterSpacing: '-0.03em', color: COLORS.text, lineHeight: 1.05, margin: 0
  },
  countPill: {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    background: COLORS.goldSoft, border: `1px solid ${COLORS.goldBorder}`,
    color: COLORS.gold, borderRadius: '20px', padding: '0.35rem 0.7rem',
    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
  },

  // SEARCH
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '14px', padding: '0.85rem 1rem',
    transition: 'border-color 0.2s'
  },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none',
    color: COLORS.text, fontSize: '0.95rem', outline: 'none',
    minWidth: 0, fontFamily: 'inherit'
  },
  clearBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: '0.2rem', display: 'flex', flexShrink: 0
  },
  searchResults: {
    marginTop: '0.5rem',
    background: COLORS.surfaceRaised,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '14px', padding: '0.5rem',
    maxHeight: '320px', overflowY: 'auto'
  },
  searchResultRow: {
    display: 'flex', alignItems: 'center', gap: '0.7rem',
    padding: '0.65rem 0.6rem', borderRadius: '10px',
    transition: 'background 0.15s'
  },

  // STATS
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '0.5rem',
    marginBottom: '1.5rem'
  },
  statCell: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '14px',
    padding: 'clamp(0.7rem, 2.5vw, 1rem) 0.5rem',
    minWidth: 0
  },
  statValue: {
    color: COLORS.text, fontFamily: 'Space Grotesk',
    fontSize: 'clamp(1.1rem, 4vw, 1.35rem)',
    fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1
  },
  statSlash: { color: COLORS.textFaint, fontWeight: 500, fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)' },
  statLabel: {
    color: COLORS.textFaint, fontSize: 'clamp(0.58rem, 2vw, 0.68rem)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginTop: '0.35rem', fontWeight: 600, textAlign: 'center'
  },

  // PRIORITY
  priorityCard: {
    background: 'linear-gradient(180deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.02) 100%)',
    border: `1px solid ${COLORS.goldBorder}`,
    borderRadius: '18px', padding: '1rem 1.15rem'
  },
  priorityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' },
  priorityDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: COLORS.gold, display: 'inline-block',
    boxShadow: '0 0 8px rgba(245,166,35,0.8)'
  },
  priorityLabel: {
    color: COLORS.gold, fontSize: '0.7rem',
    textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700
  },
  requestRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: '0.75rem',
    background: 'rgba(0,0,0,0.25)', borderRadius: '12px',
    padding: '0.7rem 0.85rem'
  },

  // SECTION LABEL
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    color: COLORS.textDim, fontSize: '0.7rem', textTransform: 'uppercase',
    letterSpacing: '0.13em', marginBottom: '0.85rem', fontWeight: 600
  },

  // SENT CHIPS
  sentChips: { display: 'flex', flexWrap: 'wrap', gap: '0.45rem' },
  sentChip: {
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '20px',
    padding: '0.35rem 0.7rem 0.35rem 0.35rem'
  },
  sentAvatar: {
    width: '22px', height: '22px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#0A0A0A', fontWeight: 700, fontSize: '0.6rem',
    fontFamily: 'Space Grotesk', flexShrink: 0
  },
  sentName: {
    color: COLORS.textDim, fontSize: '0.76rem',
    fontWeight: 500, maxWidth: '120px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },

  // CAROUSEL
  carousel: {
    display: 'flex', gap: '0.35rem', overflowX: 'auto',
    paddingBottom: '0.5rem', margin: '0 -0.25rem',
    paddingLeft: '0.25rem', paddingRight: '0.25rem',
    scrollbarWidth: 'none'
  },
  avatarTile: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.45rem', padding: '0.85rem 0.4rem',
    background: 'transparent', border: '1px solid transparent',
    borderRadius: '18px', cursor: 'pointer',
    minWidth: '102px', flexShrink: 0,
    transition: 'background 0.2s, border-color 0.2s'
  },
  tileName: {
    color: COLORS.text, fontSize: '0.82rem',
    fontWeight: 600, letterSpacing: '-0.01em',
    maxWidth: '94px', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  tileStatus: {
    fontSize: '0.68rem', fontWeight: 500,
    maxWidth: '94px', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },

  // DETAIL PANEL
  detailPanel: {
    background: COLORS.surfaceRaised,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '18px', padding: '1.15rem 1.25rem',
    boxShadow: '0 10px 30px -15px rgba(0,0,0,0.8)'
  },
  detailStats: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem' },
  detailStat: {
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px', padding: '0.7rem 0.5rem',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.25rem', minWidth: 0
  },
  detailStatValue: {
    color: COLORS.gold, fontFamily: 'Space Grotesk',
    fontSize: '1.2rem', fontWeight: 700, lineHeight: 1
  },
  detailStatLabel: {
    color: COLORS.textFaint, fontSize: '0.6rem',
    textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600
  },

  // COMMON
  partnerName: {
    fontWeight: 700, fontSize: '1.05rem', color: COLORS.text,
    letterSpacing: '-0.015em', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    fontFamily: 'Space Grotesk'
  },
  compactName: {
    fontWeight: 600, fontSize: '0.9rem', color: COLORS.text,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  compactSub: {
    color: COLORS.textFaint, fontSize: '0.76rem',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    marginTop: '0.1rem'
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
    borderRadius: '12px', padding: '0.75rem 0.9rem',
    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
    boxShadow: '0 4px 14px -4px rgba(245,166,35,0.5)',
    fontFamily: 'Space Grotesk', letterSpacing: '-0.005em',
    minWidth: 0
  },
  doneRow: {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
    background: 'rgba(76,175,80,0.06)', border: `1px solid ${COLORS.greenBorder}`,
    borderRadius: '12px', padding: '0.75rem 0.9rem',
    color: COLORS.green, fontSize: '0.78rem', fontWeight: 500, minWidth: 0
  },
  removeBtn: {
    background: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`,
    borderRadius: '12px', width: '44px', height: '44px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  iconGhostBtn: {
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.border}`,
    borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  card: {
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`,
    borderRadius: '18px', padding: '1.1rem 1.2rem',
    boxShadow: '0 6px 20px -14px rgba(0,0,0,0.7)'
  },
  resultRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: '14px',
    padding: '0.75rem 0.9rem', gap: '0.7rem'
  },
  pendingChip: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    color: COLORS.textFaint, fontSize: '0.72rem', flexShrink: 0
  },
  requestBtn: {
    background: COLORS.goldSoft, color: COLORS.gold,
    border: `1px solid ${COLORS.goldBorder}`, borderRadius: '9px',
    padding: '0.45rem 0.85rem', fontWeight: 600,
    fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0
  },
  acceptBtn: {
    background: COLORS.gold, border: 'none', borderRadius: '9px',
    width: '38px', height: '38px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px -4px rgba(245,166,35,0.5)'
  },
  declineBtn: {
    background: 'rgba(229,62,62,0.06)', border: `1px solid ${COLORS.redBorder}`,
    borderRadius: '9px', width: '38px', height: '38px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  countBadge: {
    background: COLORS.gold, color: COLORS.bg,
    fontSize: '0.68rem', fontWeight: 700, borderRadius: '10px',
    padding: '1px 8px', letterSpacing: 0
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
