import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { sendNudge } from '../lib/backend'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { Users, Search, Check, X, Flame, AlertCircle, UserPlus, Clock, UserMinus, Loader } from 'lucide-react'
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
];

function getRandomNudgeMessage(partnerName: string): string {
  const raw = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
  return raw.replace(/{partner}/g, partnerName);
}

// Brand tokens — same palette as the rest of the app, tuned for depth
const COLORS = {
  bg: '#0A0A0A',
  surface: '#111111',
  surfaceRaised: 'linear-gradient(180deg, #141414 0%, #0D0D0D 100%)',
  border: '#1E1E1E',
  borderSoft: 'rgba(255,255,255,0.06)',
  gold: '#F5A623',
  goldSoft: 'rgba(245,166,35,0.12)',
  goldBorder: 'rgba(245,166,35,0.28)',
  goldGlow: '0 0 22px rgba(245,166,35,0.22)',
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

// Presentational only — deterministic avatar tint per name, doesn't touch app state
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
  const [error, setError] = useState<string | null>(null)

  // --- Suggested partners state ---
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

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

  // Fetch suggestions when partners or sent requests change
  useEffect(() => {
    if (user) {
      fetchSuggestions()
    }
  }, [user, partners, sent])

  const fetchAll = async () => {
    setError(null)
    // Fixed: use explicit aliases for the two profile joins to avoid duplicate table references
    const { data: partnersData, error: pErr } = await supabase
      .from('accountability_partners')
      .select(`
        *,
        user1:profiles!accountability_partners_user1_id_fkey(id, name),
        user2:profiles!accountability_partners_user2_id_fkey(id, name)
      `)
      .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)

    if (pErr) throw pErr

    const partnerList = []
    for (const p of partnersData || []) {
      const isUser1 = p.user1_id === user!.id
      const partnerId = isUser1 ? p.user2_id : p.user1_id
      const partnerName = isUser1 ? p.user2?.name : p.user1?.name

      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak, best_streak, last_checked_in')
        .eq('user_id', partnerId)
        .single()

      partnerList.push({
        ...p,
        partnerId,
        partnerName,
        streak
      })
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

  // --- Fetch suggested partners (recently active) --- FIXED VERSION ---
  const fetchSuggestions = async () => {
    if (!user) return;
    setLoadingSuggestions(true);
    try {
      // Build exclusion set: current user + partners + pending sent/received
      const excludedIds = new Set<string>();
      excludedIds.add(user.id);
      partners.forEach(p => excludedIds.add(p.partnerId));
      sent.forEach(s => excludedIds.add(s.receiver_id));
      requests.forEach(r => excludedIds.add(r.sender_id));

      const excludedArray = Array.from(excludedIds);

      // Query all profiles except excluded, fetch their latest streak check-in
      let query = supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          streaks ( last_checked_in )
        `);

      if (excludedArray.length > 0) {
        query = query.not('id', 'in', `(${excludedArray.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Flatten streaks and sort by last_checked_in descending (most recent first)
      const sorted = (data || [])
        .map(u => ({
          ...u,
          last_checked_in: u.streaks?.[0]?.last_checked_in || null
        }))
        .sort((a, b) => {
          if (!a.last_checked_in && !b.last_checked_in) return 0;
          if (!a.last_checked_in) return 1;  // nulls last
          if (!b.last_checked_in) return -1;
          return new Date(b.last_checked_in).getTime() - new Date(a.last_checked_in).getTime();
        })
        .slice(0, 20); // limit to 20 suggestions

      setSuggestions(sorted);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      // Optionally set an error state to show a fallback message
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('name', `%${searchQuery}%`)
        .neq('id', user!.id)
        .limit(10)
      const partnerIds = partners.map(p => p.partnerId)
      setSearchResults((data || []).filter(u => !partnerIds.includes(u.id)))
    } catch (err) {
      toast.error('Search failed: ' + (err as Error).message)
    }
    setSearching(false)
  }

  const sendRequest = async (receiverId: string) => {
    setSending(receiverId)
    try {
      await supabase.from('partner_requests').insert({
        sender_id: user!.id,
        receiver_id: receiverId,
        status: 'pending'
      })
      await fetchAll()
      // Refresh suggestions to remove this user
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
      await supabase.from('accountability_partners').insert({
        user1_id: senderId,
        user2_id: user!.id
      })
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
        .or(`user1_id.eq.${partnerId},user2_id.eq.${partnerId}`)
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
      await fetchAll()
      await fetchSuggestions()
      toast.success('Partner removed')
    } catch (err) {
      toast.error('Remove failed: ' + (err as Error).message)
    }
  }

  const partnerCheckedIn = (streak: any) => streak?.last_checked_in === today

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              style={{ height: '100px', borderRadius: '20px', background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}` }}
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
          <div style={styles.errorIconRing}>
            <AlertCircle size={26} color={COLORS.red} />
          </div>
          <h2 style={styles.errorTitle}>Something went wrong</h2>
          <p style={styles.errorMessage}>{error}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={styles.retryBtn}
            onClick={() => { setError(null); setLoading(true); fetchAll().catch(e => setError(e.message)) }}
          >
            Try Again
          </motion.button>
        </div>
      </Layout>
    )
  }

  const maxPartners = 5
  const canAddMore = partners.length < maxPartners

  return (
    <Layout>
      <div style={{ marginBottom: '2.2rem' }}>
        <div style={styles.eyebrow}>
          <span style={styles.eyebrowDot} />
          Accountability
        </div>
        <h1 style={styles.title}>Partners</h1>
        <p style={styles.subtitle}>Stay accountable with other creators. Max {maxPartners} partners.</p>
      </div>

      {partners.length > 0 && (
        <div style={{ marginBottom: '2.2rem' }}>
          <div style={styles.sectionLabel}>
            <div style={{ ...styles.iconChipSmall, background: COLORS.goldSoft }}>
              <Users size={12} color={COLORS.gold} />
            </div>
            Your Partners ({partners.length}/{maxPartners})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {partners.map(p => {
              const checkedIn = partnerCheckedIn(p.streak)
              return (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    ...styles.card,
                    borderColor: checkedIn ? COLORS.greenBorder : COLORS.redBorder,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                      <div style={{ ...styles.avatar, background: getAvatarGradient(p.partnerName) }}>
                        {getInitials(p.partnerName)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={styles.partnerName}>{p.partnerName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                          <span style={styles.streakChip}>
                            <Flame size={12} color={COLORS.gold} />
                            {p.streak?.current_streak || 0} day{(p.streak?.current_streak || 0) === 1 ? '' : 's'}
                          </span>
                          <span style={{
                            ...styles.statusChip,
                            color: checkedIn ? COLORS.green : COLORS.red,
                            background: checkedIn ? COLORS.greenSoft : COLORS.redSoft,
                            border: `1px solid ${checkedIn ? COLORS.greenBorder : COLORS.redBorder}`,
                          }}>
                            {checkedIn ? 'Posted today' : 'Missed today'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      {!checkedIn && (
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          style={styles.nudgeBtn}
                          onClick={async () => {
                            try {
                              await sendNudge(user!.id, p.partnerId)
                              const message = getRandomNudgeMessage(p.partnerName)
                              await navigator.clipboard.writeText(message)
                              toast.success('✅ Nudge sent to ' + p.partnerName)
                            } catch (err: any) {
                              toast.error('❌ Failed: ' + (err.message || 'Unknown error'))
                            }
                          }}
                        >
                          Copy Nudge
                        </motion.button>
                      )}
                      <button
                        style={styles.iconGhostBtn}
                        onClick={() => removePartner(p.partnerId)}
                        aria-label="Remove partner"
                      >
                        <UserMinus size={16} color={COLORS.textFaint} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {canAddMore && (
        <div style={{ ...styles.card, marginBottom: '2.2rem' }}>
          <div style={styles.sectionLabel}>
            <div style={{ ...styles.iconChipSmall, background: 'rgba(255,255,255,0.05)' }}>
              <UserPlus size={12} color={COLORS.textDim} />
            </div>
            Find a New Partner
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <input
              style={{ ...styles.input, flex: 1 }}
              placeholder="Search by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchUsers()}
            />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={styles.searchBtn}
              onClick={searchUsers}
              disabled={searching}
            >
              <Search size={16} color={COLORS.bg} />
            </motion.button>
          </div>
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.9rem' }}
              >
                {searchResults.map(u => {
                  const alreadySent = sent.some(s => s.receiver_id === u.id)
                  return (
                    <div key={u.id} style={styles.resultRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div style={{ ...styles.avatarSmall, background: getAvatarGradient(u.name) }}>
                          {getInitials(u.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: COLORS.text }}>{u.name}</div>
                          <div style={{ color: COLORS.textFaint, fontSize: '0.78rem' }}>{u.email}</div>
                        </div>
                      </div>
                      {alreadySent ? (
                        <div style={styles.pendingChip}>
                          <Clock size={12} color={COLORS.textFaint} />
                          Pending
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- Suggested Partners --- */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: '2.2rem' }}>
          <div style={styles.sectionLabel}>
            <div style={{ ...styles.iconChipSmall, background: 'rgba(255,255,255,0.05)' }}>
              <Users size={12} color={COLORS.textDim} />
            </div>
            Suggested Partners (recently active)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {suggestions.map(s => {
              const alreadySent = sent.some(req => req.receiver_id === s.id)
              return (
                <div key={s.id} style={styles.resultRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ ...styles.avatarSmall, background: getAvatarGradient(s.name) }}>
                      {getInitials(s.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: COLORS.text }}>{s.name}</div>
                      {s.email && <div style={{ color: COLORS.textFaint, fontSize: '0.78rem' }}>{s.email}</div>}
                    </div>
                  </div>
                  {alreadySent ? (
                    <div style={styles.pendingChip}>
                      <Clock size={12} color={COLORS.textFaint} />
                      Pending
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
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
        </div>
      )}

      {loadingSuggestions && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
          <Loader size={20} color={COLORS.textFaint} className="animate-spin" />
        </div>
      )}

      {!canAddMore && (
        <div style={{ ...styles.card, borderColor: COLORS.goldBorder, background: 'linear-gradient(180deg, #1A1400 0%, #131313 100%)', marginBottom: '2.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Check size={16} color={COLORS.gold} />
            <p style={{ color: COLORS.gold, fontSize: '0.88rem', margin: 0 }}>
              You've reached the maximum of {maxPartners} partners. Remove one to add another.
            </p>
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div style={{ marginBottom: '2.2rem' }}>
          <div style={styles.sectionLabel}>
            <div style={{ ...styles.iconChipSmall, background: 'rgba(255,255,255,0.05)' }}>
              <Clock size={12} color={COLORS.textDim} />
            </div>
            Incoming Requests
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {requests.map(r => (
              <div key={r.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ ...styles.avatarSmall, background: getAvatarGradient(r.profiles?.name) }}>
                      {getInitials(r.profiles?.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: COLORS.text, marginBottom: '0.15rem' }}>
                        {r.profiles?.name}
                      </div>
                      <div style={{ color: COLORS.textFaint, fontSize: '0.78rem' }}>wants to be your accountability partner</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      style={styles.acceptBtn}
                      onClick={() => acceptRequest(r.id, r.sender_id)}
                      aria-label="Accept request"
                    >
                      <Check size={15} color={COLORS.bg} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      style={styles.declineBtn}
                      onClick={() => declineRequest(r.id)}
                      aria-label="Decline request"
                    >
                      <X size={15} color={COLORS.red} />
                    </motion.button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div>
          <div style={styles.sectionLabel}>
            <div style={{ ...styles.iconChipSmall, background: 'rgba(255,255,255,0.05)' }}>
              <Clock size={12} color={COLORS.textDim} />
            </div>
            Sent Requests
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {sent.map(r => (
              <div key={r.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ ...styles.avatarSmall, background: getAvatarGradient(r.profiles?.name) }}>
                      {getInitials(r.profiles?.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: COLORS.text, marginBottom: '0.15rem' }}>
                        {r.profiles?.name}
                      </div>
                      <div style={{ color: COLORS.textFaint, fontSize: '0.78rem' }}>Request pending</div>
                    </div>
                  </div>
                  <div style={styles.pendingChip}>
                    <Clock size={12} color={COLORS.textFaint} />
                    Waiting
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {partners.length === 0 && requests.length === 0 && sent.length === 0 && searchResults.length === 0 && suggestions.length === 0 && !loadingSuggestions && (
        <div style={styles.empty}>
          <div style={styles.emptyIconRing}>
            <Users size={24} color={COLORS.textFaint} />
          </div>
          <p style={{ margin: 0, marginTop: '0.9rem', color: COLORS.textDim, textAlign: 'center', fontSize: '0.9rem', maxWidth: '260px' }}>
            No partners yet. Search for a creator above or check suggested partners.
          </p>
        </div>
      )}
    </Layout>
  )
}

const styles: Record<string, any> = {
  eyebrow: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    color: COLORS.textFaint, fontSize: '0.78rem', textTransform: 'uppercase',
    letterSpacing: '0.1em', marginBottom: '0.4rem', fontWeight: 600
  },
  eyebrowDot: {
    width: '5px', height: '5px', borderRadius: '50%',
    background: COLORS.gold, boxShadow: '0 0 6px rgba(245,166,35,0.7)', display: 'inline-block'
  },
  title: {
    fontSize: '1.9rem', fontFamily: 'Space Grotesk', fontWeight: 700,
    letterSpacing: '-0.02em', color: COLORS.text, lineHeight: 1.1
  },
  subtitle: {
    color: COLORS.textDim, marginTop: '0.4rem', fontSize: '0.9rem', letterSpacing: '-0.005em'
  },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '0.55rem',
    color: COLORS.textDim, fontSize: '0.76rem', textTransform: 'uppercase',
    letterSpacing: '0.09em', marginBottom: '0.85rem', fontWeight: 600
  },
  iconChipSmall: {
    width: '20px', height: '20px', borderRadius: '6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  card: {
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`,
    borderRadius: '18px', padding: '1.15rem 1.3rem',
    boxShadow: '0 6px 20px -14px rgba(0,0,0,0.7)'
  },
  avatar: {
    width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#0A0A0A', fontWeight: 700, fontSize: '0.95rem',
    fontFamily: 'Space Grotesk', letterSpacing: '-0.01em',
    boxShadow: '0 4px 14px -4px rgba(0,0,0,0.5)'
  },
  avatarSmall: {
    width: '36px', height: '36px', borderRadius: '11px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#0A0A0A', fontWeight: 700, fontSize: '0.8rem',
    fontFamily: 'Space Grotesk', letterSpacing: '-0.01em'
  },
  partnerName: {
    fontWeight: 600, fontSize: '1rem', color: COLORS.text, letterSpacing: '-0.01em',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  streakChip: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    color: COLORS.gold, fontWeight: 600, fontSize: '0.78rem',
    background: COLORS.goldSoft, border: `1px solid ${COLORS.goldBorder}`,
    borderRadius: '20px', padding: '0.18rem 0.55rem'
  },
  statusChip: {
    fontSize: '0.72rem', fontWeight: 600, borderRadius: '20px',
    padding: '0.18rem 0.55rem'
  },
  nudgeBtn: {
    background: COLORS.gold, color: COLORS.bg, border: 'none',
    borderRadius: '9px', padding: '0.5rem 0.9rem', fontWeight: 600,
    fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: '0 4px 14px -4px rgba(245,166,35,0.5)'
  },
  iconGhostBtn: {
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.border}`,
    borderRadius: '9px', width: '34px', height: '34px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  input: {
    background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '11px',
    padding: '0.8rem 1rem', color: COLORS.text, fontSize: '0.95rem',
    outline: 'none'
  },
  searchBtn: {
    background: COLORS.gold, border: 'none', borderRadius: '11px',
    padding: '0.8rem 1.05rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    boxShadow: '0 4px 14px -4px rgba(245,166,35,0.5)'
  },
  resultRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '13px',
    padding: '0.75rem 0.9rem', gap: '0.75rem'
  },
  pendingChip: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    color: COLORS.textFaint, fontSize: '0.78rem', flexShrink: 0
  },
  requestBtn: {
    background: COLORS.goldSoft, color: COLORS.gold,
    border: `1px solid ${COLORS.goldBorder}`, borderRadius: '9px',
    padding: '0.42rem 0.9rem', fontWeight: 600,
    fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0
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
  empty: {
    background: COLORS.surfaceRaised, border: `1px dashed ${COLORS.border}`, borderRadius: '20px',
    padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center'
  },
  emptyIconRing: {
    width: '54px', height: '54px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
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
