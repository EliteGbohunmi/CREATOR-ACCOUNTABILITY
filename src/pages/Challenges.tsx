import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import { Trophy, Users, CheckCircle2, Clock, Award, Flame, Plus, X, AlertCircle, LogOut } from 'lucide-react'

const MAX_LEAVES = 5

export default function Challenges() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState < any[] > ([])
  const [joined, setJoined] = useState < any[] > ([])
  const [counts, setCounts] = useState < Record < string, number>>({})
  const [participants, setParticipants] = useState < Record < string, any[]>>({})
  const [joining, setJoining] = useState < string | null > (null)
  const [checkingIn, setCheckingIn] = useState < string | null > (null)
  const [leaving, setLeaving] = useState < string | null > (null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedChallenge, setExpandedChallenge] = useState < string | null > (null)
  const [newName, setNewName] = useState('')
  const [newDays, setNewDays] = useState('')
  const [creating, setCreating] = useState(false)
  const [leavesUsed, setLeavesUsed] = useState(0)
  const [confirmLeave, setConfirmLeave] = useState < string | null > (null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
  const [{ data: c }, { data: j }, { data: countData }, { data: prof }] = await Promise.all([
    supabase.from('challenges').select('*, profiles(name)').order('created_at', { ascending: false }),
    supabase.from('user_challenges').select('*, challenges(*)').eq('user_id', user!.id).is('left_at', null),
    supabase.from('user_challenges').select('challenge_id, user_id, last_checked_in, progress, profiles(name)').is('left_at', null),
    supabase.from('profiles').select('leaves_used').eq('id', user!.id).single()
    ])
  setChallenges(c || [])
  setJoined(j || [])
  setLeavesUsed(prof?.leaves_used || 0)

  const countMap: Record < string, number > = {}
  const participantMap: Record < string, any[] > = {}
  for (const row of (countData || [])) {
  countMap[row.challenge_id] = (countMap[row.challenge_id] || 0) + 1
  if (!participantMap[row.challenge_id]) participantMap[row.challenge_id] = []
  participantMap[row.challenge_id].push(row)
  }
  setCounts(countMap)
  setParticipants(participantMap)
  setLoading(false)
  }

  const createChallenge = async () => {
  if (!newName.trim() || !newDays) return
  setCreating(true)
  await supabase.from('challenges').insert({
    name: newName.trim(),
    days: parseInt(newDays),
    created_by: user!.id
    })
  setNewName('')
  setNewDays('')
  setShowForm(false)
  await fetchAll()
  setCreating(false)
  }

  const joinChallenge = async (challengeId: string) => {
  setJoining(challengeId)
  await supabase.from('user_challenges').insert({
    user_id: user!.id, challenge_id: challengeId, progress: 0
    })
  await fetchAll()
  setJoining(null)
  }

  const leaveChallenge = async (uc: any) => {
  if (leavesUsed >= MAX_LEAVES) return
  setLeaving(uc.id)
  await supabase.from('user_challenges').update({
    left_at: new Date().toISOString()
    }).eq('id', uc.id)
  await supabase.from('profiles').update({
    leaves_used: leavesUsed + 1
    }).eq('id', user!.id)
  setConfirmLeave(null)
  await fetchAll()
  setLeaving(null)
  }

  const checkInChallenge = async (uc: any) => {
  if (uc.last_checked_in === today) return
  setCheckingIn(uc.id)
  const newProgress = uc.progress + 1
  const completed = newProgress >= uc.challenges.days
  await supabase.from('user_challenges').update({
    progress: newProgress,
    last_checked_in: today,
    ...(completed ? { completed_at: new Date().toISOString() } : {})
    }).eq('id', uc.id)
  await fetchAll()
  setCheckingIn(null)
  }

  const isJoined = (id: string) => joined.some(j => j.challenge_id === id)
  const daysLeft = (uc: any) => Math.max(uc.challenges.days - uc.progress, 0)
  const leavesLeft = MAX_LEAVES - leavesUsed

  if (loading) {
  return ( < Layout > < div style = {{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }} >
    {[1,2,3].map(i => ( < div key = {i} style = {{ height: '120px', borderRadius: '14px', background: '#111', border: '1px solid #1E1E1E' }} />
    ))}
    </div >
    </Layout >
  )
  }

  return ( < Layout > < div style = {{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }} > < div > < p style = {{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }} > Compete</p > < h1 style = {{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }} > Challenges</h1 > < p style = {{ color: '#555', marginTop: '0.3rem', fontSize: '0.9rem' }} > Commit publicly. Build unstoppable momentum.</p >
    </div > < button style = {showForm ? styles.cancelBtn : styles.addBtn} onClick = {() => setShowForm(!showForm)} >
    {showForm ? < X size = {16} color = "#888" /> : < Plus size = {16} color = "#0A0A0A" />}
    {showForm ? 'Cancel' : 'Create'}
    </button >
    </div >

    {/* Leaves indicator */} < div style = {styles.leavesBar} > < div style = {{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} > < LogOut size = {14} color = {leavesLeft > 0 ? '#888' : '#E53E3E'} /> < span style = {{ color: leavesLeft > 0 ? '#888' : '#E53E3E', fontSize: '0.82rem' }} >
    {leavesLeft > 0 ? `${leavesLeft} of ${MAX_LEAVES} leaves remaining` : 'No leaves left — upgrade to Pro to leave more challenges'}
    </span >
    </div > < div style = {{ display: 'flex', gap: '0.3rem' }} >
    {Array.from({ length: MAX_LEAVES }).map((_, i) => ( < div key = {i} style = {{
      width: '8px', height: '8px', borderRadius: '50%',
      background: i < leavesLeft ? '#F5A623' : '#2A2A2A'
      }} />
    ))}
    </div >
    </div > < AnimatePresence >
    {showForm && ( < motion.div
      style = {styles.form}
      initial = {{ opacity: 0, y: -10 }}
      animate = {{ opacity: 1, y: 0 }}
      exit = {{ opacity: 0, y: -10 }} > < p style = {{ color: '#555', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }} > New Challenge</p > < input
      style = {styles.input}
      placeholder = "Challenge name (e.g. 30 Days of Reels)"
      value = {newName}
      onChange = {e => setNewName(e.target.value)}
      /> < div style = {{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} > < input
      style = {{ ...styles.input, maxWidth: '140px' }}
      placeholder = "Days (e.g. 30)"
      type = "number"
      min = "1"
      max = "365"
      value = {newDays}
      onChange = {e => setNewDays(e.target.value)}
      /> < span style = {{ color: '#555', fontSize: '0.85rem' }} > days long</span >
      </div > < button style = {styles.saveBtn} onClick = {createChallenge} disabled = {creating} >
      {creating ? 'Creating...' : 'Create Challenge'}
      </button >
      </motion.div >
    )}
    </AnimatePresence >

    {/* Active challenges */}
    {joined.length > 0 && ( < div style = {{ marginBottom: '2.5rem' }} > < div style = {styles.sectionLabel} > < Flame size = {13} color = "#F5A623" />
      Active
      </div > < div style = {{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} >
      {joined.map((uc: any) => {
        const isComplete = uc.progress >= uc.challenges.days
        const checkedInToday = uc.last_checked_in === today
        const pct = Math.min((uc.progress / uc.challenges.days) * 100, 100)
        const allParticipants = participants[uc.challenge_id] || []
        const missedToday = allParticipants.filter(p => p.last_checked_in !== today)
        const checkedInList = allParticipants.filter(p => p.last_checked_in === today)
        const isExpanded = expandedChallenge === uc.id
        const isConfirmingLeave = confirmLeave === uc.id

        return ( < div key = {uc.id} style = {{ ...styles.card, borderColor: isComplete ? '#F5A62340' : '#1E1E1E' }} > < div style = {{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }} > < div > < div style = {{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }} >
          {isComplete && < Award size = {16} color = "#F5A623" />} < span style = {{ fontWeight: '600', fontSize: '0.95rem' }} > {uc.challenges?.name}</span >
          </div > < div style = {{ display: 'flex', alignItems: 'center', gap: '1rem' }} > < span style = {{ color: '#555', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} > < Clock size = {12} color = "#555" />
          {isComplete ? 'Completed!' : `${daysLeft(uc)} days left`}
          </span > < span
          style = {{ color: '#555', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
          onClick = {() => setExpandedChallenge(isExpanded ? null : uc.id)} > < Users size = {12} color = "#555" />
          {counts[uc.challenge_id] || 0} joined
          </span >
          </div >
          </div > < div style = {{ textAlign: 'right' }} > < div style = {{ color: '#F5A623', fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.1rem' }} >
          {uc.progress}/{uc.challenges?.days}
          </div > < div style = {{ color: '#555', fontSize: '0.72rem' }} > days</div >
          </div >
          </div > < div style = {styles.progressTrack} > < motion.div
          style = {{ ...styles.progressFill, background: isComplete ? '#4CAF50' : '#F5A623' }}
          initial = {{ width: 0 }}
          animate = {{ width: `${pct}%` }}
          transition = {{ duration: 0.6 }}
          />
          </div > < AnimatePresence >
          {isExpanded && ( < motion.div
            initial = {{ opacity: 0, height: 0 }}
            animate = {{ opacity: 1, height: 'auto' }}
            exit = {{ opacity: 0, height: 0 }}
            style = {{ overflow: 'hidden', marginBottom: '0.85rem' }} >
            {checkedInList.length > 0 && ( < div style = {{ marginBottom: '0.75rem' }} > < p style = {{ color: '#4CAF50', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }} >
              Checked in today
              </p > < div style = {{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }} >
              {checkedInList.map((p: any, i: number) => ( < span key = {i} style = {{ ...styles.pill, background: '#0D2010', color: '#4CAF50', border: '1px solid #4CAF5030' }} > < CheckCircle2 size = {11} color = "#4CAF50" />
                {p.profiles?.name || 'Creator'}
                </span >
              ))}
              </div >
              </div >
            )}
            {missedToday.length > 0 && ( < div > < p style = {{ color: '#E53E3E', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }} >
              Missed today
              </p > < div style = {{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }} >
              {missedToday.map((p: any, i: number) => ( < span key = {i} style = {{ ...styles.pill, background: '#1A0000', color: '#E53E3E', border: '1px solid #E53E3E30' }} > < AlertCircle size = {11} color = "#E53E3E" />
                {p.profiles?.name || 'Creator'}
                </span >
              ))}
              </div >
              </div >
            )}
            </motion.div >
          )}
          </AnimatePresence >

          {!isComplete && ( < button
            style = {{
            ...styles.checkInBtn,
            background: checkedInToday ? '#1A1A1A' : '#F5A623',
            color: checkedInToday ? '#555' : '#0A0A0A',
            border: checkedInToday ? '1px solid #2A2A2A' : 'none',
            cursor: checkedInToday ? 'default' : 'pointer'
            }}
            onClick = {() => !checkedInToday && checkInChallenge(uc)}
            disabled = {checkingIn === uc.id || checkedInToday} > < CheckCircle2 size = {15} color = {checkedInToday ? '#555' : '#0A0A0A'} />
            {checkingIn === uc.id ? 'Saving...' : checkedInToday ? 'Checked in today' : 'Check In Today'}
            </button >
          )}

          {isComplete && ( < div style = {styles.badge} > < Award size = {16} color = "#F5A623" />
            Challenge complete! You earned this badge.
            </div >
          )}

          {/* Leave section */}
          {!isComplete && ( < div style = {{ marginTop: '0.75rem' }} >
            {!isConfirmingLeave ? ( < button
              style = {styles.leaveBtn}
              onClick = {() => setConfirmLeave(uc.id)}
              disabled = {leavesLeft <= 0} > < LogOut size = {13} color = {leavesLeft > 0 ? '#555' : '#333'} />
              {leavesLeft > 0 ? `Leave challenge (${leavesLeft} left)` : 'No leaves remaining'}
              </button >
            ) : ( < div style = {styles.confirmBox} > < p style = {{ color: '#E53E3E', fontSize: '0.85rem', margin: 0, marginBottom: '0.75rem' }} >
              Leave this challenge? This uses 1 of your {leavesLeft} remaining leaves.
              </p > < div style = {{ display: 'flex', gap: '0.5rem' }} > < button
              style = {styles.confirmLeaveBtn}
              onClick = {() => leaveChallenge(uc)}
              disabled = {leaving === uc.id} >
              {leaving === uc.id ? 'Leaving...' : 'Yes, leave'}
              </button > < button style = {styles.cancelLeaveBtn} onClick = {() => setConfirmLeave(null)} >
              Cancel
              </button >
              </div >
              </div >
            )}
            </div >
          )}
          </div >
        )
        })}
      </div >
      </div >
    )}

    {/* All challenges */} < div style = {styles.sectionLabel} > < Trophy size = {13} color = "#555" />
    All Challenges
    </div > < div style = {{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} >
    {challenges.map(c => ( < div key = {c.id} style = {styles.card} > < div style = {{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} > < div > < div style = {{ fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.95rem' }} > {c.name}</div > < div style = {{ display: 'flex', alignItems: 'center', gap: '1rem' }} > < span style = {{ color: '#555', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} > < Clock size = {12} color = "#555" />
      {c.days} days
      </span > < span style = {{ color: '#555', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} > < Users size = {12} color = "#555" />
      {counts[c.id] || 0} joined
      </span >
      {c.profiles?.name && ( < span style = {{ color: '#444', fontSize: '0.78rem' }} > by {c.profiles.name}</span >
      )}
      </div >
      </div >
      {isJoined(c.id) ? ( < div style = {{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4CAF50', fontSize: '0.85rem' }} > < CheckCircle2 size = {15} color = "#4CAF50" />
        Joined
        </div >
      ) : ( < button
        style = {styles.joinBtn}
        onClick = {() => joinChallenge(c.id)}
        disabled = {joining === c.id} >
        {joining === c.id ? '...' : 'Join'}
        </button >
      )}
      </div >
      </div >
    ))}
    </div >
    </Layout >
  )
  }

  const styles: Record < string, React.CSSProperties > = {
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
  leavesBar: {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#111111', border: '1px solid #1E1E1E', borderRadius: '10px',
  padding: '0.75rem 1rem', marginBottom: '1.25rem'
  },
  form: {
  background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px',
  padding: '1.25rem', marginBottom: '1.5rem', display: 'flex',
  flexDirection: 'column', gap: '0.75rem'
  },
  input: {
  background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px',
  padding: '0.75rem 1rem', color: '#F0EDE8', fontSize: '0.95rem',
  outline: 'none', flex: 1
  },
  saveBtn: {
  background: '#F5A623', color: '#0A0A0A', border: 'none',
  borderRadius: '8px', padding: '0.75rem', fontWeight: '600',
  cursor: 'pointer', fontSize: '0.9rem'
  },
  sectionLabel: {
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  color: '#555', fontSize: '0.75rem', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: '0.75rem'
  },
  card: {
  background: '#111111', border: '1px solid #1E1E1E',
  borderRadius: '14px', padding: '1.25rem'
  },
  progressTrack: {
  height: '5px', background: '#1E1E1E',
  borderRadius: '999px', overflow: 'hidden', marginBottom: '0.85rem'
  },
  progressFill: { height: '100%', borderRadius: '999px' },
  checkInBtn: {
  width: '100%', borderRadius: '8px', padding: '0.7rem',
  fontWeight: '600', fontSize: '0.85rem',
  display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: '0.5rem'
  },
  badge: {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  background: '#1A1400', border: '1px solid #F5A62330',
  borderRadius: '8px', padding: '0.75rem',
  color: '#F5A623', fontSize: '0.85rem', fontWeight: '500'
  },
  joinBtn: {
  background: '#1A1400', color: '#F5A623',
  border: '1px solid #F5A62330', borderRadius: '8px',
  padding: '0.5rem 1.1rem', fontWeight: '600',
  fontSize: '0.85rem', cursor: 'pointer'
  },
  pill: {
  display: 'flex', alignItems: 'center', gap: '0.3rem',
  padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '500'
  },
  leaveBtn: {
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  background: 'none', border: 'none', color: '#444',
  fontSize: '0.78rem', cursor: 'pointer', padding: '0'
  },
  confirmBox: {
  background: '#1A0000', border: '1px solid #E53E3E30',
  borderRadius: '8px', padding: '0.85rem'
  },
  confirmLeaveBtn: {
  background: '#E53E3E', color: '#fff', border: 'none',
  borderRadius: '6px', padding: '0.5rem 1rem',
  fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer'
  },
  cancelLeaveBtn: {
  background: 'none', border: '1px solid #2A2A2A',
  borderRadius: '6px', padding: '0.5rem 1rem',
  color: '#666', fontSize: '0.82rem', cursor: 'pointer'
  }
  }