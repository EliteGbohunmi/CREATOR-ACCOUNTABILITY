import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { Users, Search, Check, X, Flame, AlertCircle, UserPlus, Clock } from 'lucide-react'

export default function Partners() {
  const { user } = useAuth()
  const [partner, setPartner] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [sent, setSent] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: p1 }, { data: p2 }, { data: incoming }, { data: outgoing }] = await Promise.all([
      supabase.from('accountability_partners')
        .select('*, profiles!accountability_partners_user2_id_fkey(id, name)')
        .eq('user1_id', user!.id).single(),
      supabase.from('accountability_partners')
        .select('*, profiles!accountability_partners_user1_id_fkey(id, name)')
        .eq('user2_id', user!.id).single(),
      supabase.from('partner_requests')
        .select('*, profiles!partner_requests_sender_id_fkey(id, name)')
        .eq('receiver_id', user!.id).eq('status', 'pending'),
      supabase.from('partner_requests')
        .select('*, profiles!partner_requests_receiver_id_fkey(id, name)')
        .eq('sender_id', user!.id).eq('status', 'pending')
    ])

    const activePartner = p1 || p2
    if (activePartner) {
      const partnerId = activePartner.user1_id === user!.id
        ? activePartner.user2_id
        : activePartner.user1_id
      const partnerName = activePartner.user1_id === user!.id
        ? activePartner.profiles?.name
        : activePartner.profiles?.name

      const { data: partnerStreak } = await supabase
        .from('streaks')
        .select('current_streak, best_streak, last_checked_in')
        .eq('user_id', partnerId)
        .single()

      setPartner({
        ...activePartner,
        partnerId,
        partnerName,
        streak: partnerStreak
      })
    }

    setRequests(incoming || [])
    setSent(outgoing || [])
    setLoading(false)
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .ilike('name', `%${searchQuery}%`)
      .neq('id', user!.id)
      .limit(10)
    setSearchResults(data || [])
    setSearching(false)
  }

  const sendRequest = async (receiverId: string) => {
    setSending(receiverId)
    await supabase.from('partner_requests').insert({
      sender_id: user!.id,
      receiver_id: receiverId,
      status: 'pending'
    })
    await fetchAll()
    setSearchResults([])
    setSearchQuery('')
    setSending(null)
  }

  const acceptRequest = async (requestId: string, senderId: string) => {
    await supabase.from('partner_requests').update({ status: 'accepted' }).eq('id', requestId)
    await supabase.from('accountability_partners').insert({
      user1_id: senderId,
      user2_id: user!.id
    })
    await fetchAll()
  }

  const declineRequest = async (requestId: string) => {
    await supabase.from('partner_requests').update({ status: 'declined' }).eq('id', requestId)
    await fetchAll()
  }

  const removePartner = async () => {
    if (!partner) return
    await supabase.from('accountability_partners').delete().eq('id', partner.id)
    setPartner(null)
    await fetchAll()
  }

  const partnerCheckedIn = partner?.streak?.last_checked_in === today
  const iCheckedIn = true // will be passed from dashboard context ideally

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {[1,2].map(i => (
            <div key={i} style={{ height: '120px', borderRadius: '14px', background: '#111', border: '1px solid #1E1E1E' }} />
          ))}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Accountability</p>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>Partners</h1>
        <p style={{ color: '#555', marginTop: '0.3rem', fontSize: '0.9rem' }}>Stay accountable with another creator.</p>
      </div>

      {/* Active partner */}
      {partner ? (
        <div style={{ marginBottom: '2rem' }}>
          <div style={styles.sectionLabel}>
            <Users size={13} color="#F5A623" />
            Your Partner
          </div>
          <div style={{ ...styles.card, borderColor: partnerCheckedIn ? '#4CAF5040' : '#E53E3E40' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  {partner.partnerName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={14} color="#F5A623" />
                  <span style={{ color: '#F5A623', fontWeight: '600', fontFamily: 'Space Grotesk' }}>
                    {partner.streak?.current_streak || 0}
                  </span>
                  <span style={{ color: '#555', fontSize: '0.82rem' }}>day streak</span>
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: partnerCheckedIn ? '#0D2010' : '#1A0000',
                border: `1px solid ${partnerCheckedIn ? '#4CAF5030' : '#E53E3E30'}`,
                borderRadius: '20px', padding: '0.35rem 0.85rem'
              }}>
                {partnerCheckedIn
                  ? <><Check size={13} color="#4CAF50" /><span style={{ color: '#4CAF50', fontSize: '0.78rem' }}>Posted today</span></>
                  : <><AlertCircle size={13} color="#E53E3E" /><span style={{ color: '#E53E3E', fontSize: '0.78rem' }}>Missed today</span></>
                }
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={styles.statBox}>
                <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '0.2rem' }}>Current streak</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.3rem', color: '#F5A623' }}>
                  {partner.streak?.current_streak || 0}
                </div>
              </div>
              <div style={styles.statBox}>
                <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: '0.2rem' }}>Best streak</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.3rem' }}>
                  {partner.streak?.best_streak || 0}
                </div>
              </div>
            </div>

            {!partnerCheckedIn && (
              <div style={styles.missedAlert}>
                <AlertCircle size={15} color="#E53E3E" />
                <span>{partner.partnerName} hasn't checked in today. Send them a nudge!</span>
              </div>
            )}

            <button style={styles.removeBtn} onClick={removePartner}>
              <X size={13} color="#555" />
              Remove Partner
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Search */}
          <div style={styles.card}>
            <div style={styles.sectionLabel}>
              <UserPlus size={13} color="#555" />
              Find a Partner
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
        </>
      )}

      {/* Incoming requests */}
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

      {/* Sent requests */}
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

      {/* Empty state */}
      {!partner && requests.length === 0 && sent.length === 0 && searchResults.length === 0 && (
        <div style={styles.empty}>
          <Users size={32} color="#2A2A2A" style={{ marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, color: '#555', textAlign: 'center' }}>
            No partner yet. Search for a creator above and send a request.
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
    borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem'
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
