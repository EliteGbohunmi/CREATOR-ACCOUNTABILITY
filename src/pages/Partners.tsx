import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { sendNudge } from '../lib/backend'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { Users, Search, Check, X, Flame, AlertCircle, UserPlus, Clock, UserMinus } from 'lucide-react'
import toast from 'react-hot-toast'   // <-- added

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

  const fetchAll = async () => {
    setError(null)

    const { data: partnersData, error: pErr } = await supabase
      .from('accountability_partners')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)

    if (pErr) throw pErr

    const partnerList = []
    for (const p of partnersData || []) {
      const isUser1 = p.user1_id === user!.id
      const partnerId = isUser1 ? p.user2_id : p.user1_id

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', partnerId)
        .single()

      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak, best_streak, last_checked_in')
        .eq('user_id', partnerId)
        .single()

      partnerList.push({
        ...p,
        partnerId,
        partnerName: profile?.name || 'Unknown',
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
      toast.success('Partner added')
    } catch (err) {
      toast.error('Accept failed: ' + (err as Error).message)
    }
  }

  const declineRequest = async (requestId: string) => {
    try {
      await supabase.from('partner_requests').update({ status: 'declined' }).eq('id', requestId)
      await fetchAll()
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
          {[1,2,3].map(i => (
            <div key={i} style={{ height: '100px', borderRadius: '14px', background: '#111', border: '1px solid #1E1E1E' }} />
          ))}
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
          <AlertCircle size={48} color="#E53E3E" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: '#E53E3E' }}>Oops</h2>
          <p style={{ color: '#888' }}>{error}</p>
          <button onClick={() => { setError(null); setLoading(true); fetchAll().catch(e => setError(e.message)) }} style={{ marginTop: '1.5rem', background: '#F5A623', color: '#000', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Try Again</button>
        </div>
      </Layout>
    )
  }

  const maxPartners = 5
  const canAddMore = partners.length < maxPartners

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Accountability</p>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Partners</h1>
        <p style={{ color: '#555', marginTop: '0.3rem', fontSize: '0.9rem' }}>Stay accountable with other creators. Max {maxPartners} partners.</p>
      </div>

      {partners.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={styles.sectionLabel}>
            <Users size={13} color="#F5A623" />
            Your Partners ({partners.length}/{maxPartners})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {partners.map(p => {
              const checkedIn = partnerCheckedIn(p.streak)
              return (
                <div key={p.id} style={{ ...styles.card, borderColor: checkedIn ? '#4CAF5040' : '#E53E3E40' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem' }}>{p.partnerName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <Flame size={14} color="#F5A623" />
                        <span style={{ color: '#F5A623', fontWeight: '600' }}>{p.streak?.current_streak || 0}</span>
                        <span style={{ color: '#555', fontSize: '0.8rem' }}>day streak</span>
                        <span style={{ color: '#555', fontSize: '0.7rem', marginLeft: '0.5rem' }}>
                          {checkedIn ? '✅ Posted today' : '❌ Missed today'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {!checkedIn && (
                        <button
                          style={{ background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '6px', padding: '0.3rem 0.8rem', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer' }}
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
                        </button>
                      )}
                      <button
                        style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}
                        onClick={() => removePartner(p.partnerId)}
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {canAddMore && (
        <div style={styles.card}>
          <div style={styles.sectionLabel}>
            <UserPlus size={13} color="#555" />
            Find a New Partner
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              style={{ ...styles.input, flex: 1 }}
              placeholder="Search by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchUsers()}
            />
            <button style={styles.searchBtn} onClick={searchUsers} disabled={searching}>
              <Search size={16} color="#0A0A0A" />
            </button>
          </div>
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}
              >
                {searchResults.map(u => {
                  const alreadySent = sent.some(s => s.receiver_id === u.id)
                  return (
                    <div key={u.id} style={styles.resultRow}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{u.name}</div>
                        <div style={{ color: '#555', fontSize: '0.78rem' }}>{u.email}</div>
                      </div>
                      {alreadySent ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#555', fontSize: '0.8rem' }}>
                          <Clock size={13} color="#555" />
                          Pending
                        </div>
                      ) : (
                        <button
                          style={styles.requestBtn}
                          onClick={() => sendRequest(u.id)}
                          disabled={sending === u.id}
                        >
                          {sending === u.id ? '...' : 'Request'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {!canAddMore && (
        <div style={{ ...styles.card, borderColor: '#F5A62340' }}>
          <p style={{ color: '#F5A623', fontSize: '0.9rem', margin: 0 }}>
            ✅ You have reached the maximum of {maxPartners} partners. Remove one to add another.
          </p>
        </div>
      )}

      {requests.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={styles.sectionLabel}>
            <Clock size={13} color="#555" />
            Incoming Requests
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {requests.map(r => (
              <div key={r.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                      {r.profiles?.name}
                    </div>
                    <div style={{ color: '#555', fontSize: '0.78rem' }}>wants to be your accountability partner</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={styles.acceptBtn} onClick={() => acceptRequest(r.id, r.sender_id)}>
                      <Check size={15} color="#0A0A0A" />
                    </button>
                    <button style={styles.declineBtn} onClick={() => declineRequest(r.id)}>
                      <X size={15} color="#E53E3E" />
                    </button>
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
            <Clock size={13} color="#555" />
            Sent Requests
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sent.map(r => (
              <div key={r.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                      {r.profiles?.name}
                    </div>
                    <div style={{ color: '#555', fontSize: '0.78rem' }}>Request pending</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#555', fontSize: '0.8rem' }}>
                    <Clock size={13} color="#555" />
                    Waiting
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {partners.length === 0 && requests.length === 0 && sent.length === 0 && searchResults.length === 0 && (
        <div style={styles.empty}>
          <Users size={32} color="#2A2A2A" style={{ marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, color: '#555', textAlign: 'center' }}>
            No partners yet. Search for a creator above and send a request.
          </p>
        </div>
      )}
    </Layout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    color: '#555', fontSize: '0.75rem', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: '0.75rem'
  },
  card: {
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1rem'
  },
  statBox: {
    background: '#0A0A0A', borderRadius: '10px', padding: '0.85rem'
  },
  missedAlert: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#1A0000', border: '1px solid #E53E3E20',
    borderRadius: '8px', padding: '0.75rem',
    color: '#E53E3E', fontSize: '0.82rem', marginBottom: '0.85rem'
  },
  removeBtn: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    background: 'none', border: 'none', color: '#444',
    fontSize: '0.78rem', cursor: 'pointer', padding: 0
  },
  input: {
    background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px',
    padding: '0.75rem 1rem', color: '#F0EDE8', fontSize: '0.95rem',
    outline: 'none'
  },
  searchBtn: {
    background: '#F5A623', border: 'none', borderRadius: '8px',
    padding: '0.75rem 1rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center'
  },
  resultRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#0A0A0A', borderRadius: '10px', padding: '0.85rem 1rem'
  },
  requestBtn: {
    background: '#1A1400', color: '#F5A623',
    border: '1px solid #F5A62330', borderRadius: '8px',
    padding: '0.4rem 0.85rem', fontWeight: '600',
    fontSize: '0.82rem', cursor: 'pointer'
  },
  acceptBtn: {
    background: '#F5A623', border: 'none', borderRadius: '8px',
    padding: '0.5rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center'
  },
  declineBtn: {
    background: 'none', border: '1px solid #E53E3E30',
    borderRadius: '8px', padding: '0.5rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center'
  },
  empty: {
    background: '#111111', border: '1px dashed #1E1E1E', borderRadius: '14px',
    padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center'
  }
}
