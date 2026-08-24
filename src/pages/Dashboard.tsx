import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import ShareCard from '../components/ShareCard'
import Heatmap from '../components/Heatmap'
import AICoach from '../components/AICoach'
import MissedDayReflection from '../components/MissedDayReflection'
import MilestoneCard from '../components/MilestoneCard'
import OnboardingTour from '../components/OnboardingTour'
import { checkAndAwardAchievements } from '../lib/achievements'
import { checkAndAwardToken, useRestToken } from '../lib/restTokens'
import { awardScore, getScoreLabel } from '../lib/creatorScore'
import { notifyPartnerCheckin } from '../lib/backend'
import {
  Flame,
  CheckCircle2,
  Circle,
  Calendar,
  TrendingUp,
  User,
  Upload,
  X,
  Clock,
  Coffee,
  Zap,
  BookMarked,
  Star,
  Link2,
  Check,
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [streak, setStreak] = useState<any>(null)
  const [todayDone, setTodayDone] = useState(false)
  const [todayPending, setTodayPending] = useState(false)
  const [todayRest, setTodayRest] = useState(false)
  const [tasksToday, setTasksToday] = useState<any[]>([])
  const [celebrated, setCelebrated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'operator' | 'creator'>('operator')
  const [showProofForm, setShowProofForm] = useState(false)
  const [proofLink, setProofLink] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [partner, setPartner] = useState<any>(null)
  const [pendingConfirmations, setPendingConfirmations] = useState<any[]>([])
  const [submittingProof, setSubmittingProof] = useState(false)
  const [restTokens, setRestTokens] = useState(0)
  const [usingRestToken, setUsingRestToken] = useState(false)
  const [toast, setToast] = useState('')
  const [showReflection, setShowReflection] = useState(false)
  const [lostStreak, setLostStreak] = useState(0)
  const [currentMilestone, setCurrentMilestone] = useState<string | null>(null)
  const [creatorScore, setCreatorScore] = useState(0)
  const [weeklyTarget, setWeeklyTarget] = useState(7)
  const [weekPosts, setWeekPosts] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { if (user) fetchAll() }, [user])

  // Real‑time subscription for pending proofs (partner)
  useEffect(() => {
    if (!user || !partner?.id) return

    const channel = supabase
      .channel('pending-proofs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'checkin_proofs',
          filter: `user_id=eq.${partner.id}`,
        },
        () => fetchAll()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, partner?.id])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchAll = async () => {
    const [{ data: prof }, { data: str }, { data: tasks }, { data: proof }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user!.id).single(),
      supabase.from('streaks').select('*').eq('user_id', user!.id).single(),
      supabase.from('tasks').select('*').eq('user_id', user!.id).eq('date', today),
      supabase.from('checkin_proofs').select('*').eq('user_id', user!.id).eq('date', today).single()
    ])

    setProfile(prof)
    setStreak(str)
    setTasksToday(tasks || [])
    setRestTokens(prof?.rest_tokens || 0)
    setCreatorScore(prof?.creator_score || 0)
    setWeeklyTarget(prof?.weekly_target || 7)

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const { data: weekCheckins } = await supabase
      .from('checkin_proofs').select('id')
      .eq('user_id', user!.id).eq('status', 'confirmed')
      .gte('date', weekStartStr)
    setWeekPosts(weekCheckins?.length || 0)

    if (str?.last_checked_in === today) {
      if (str?.on_rest_day) setTodayRest(true)
      else setTodayDone(true)
    }
    if (proof?.status === 'pending') setTodayPending(true)

    if (str?.last_checked_in && !str?.on_rest_day) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      if (str.last_checked_in < yesterdayStr && str.current_streak > 0) {
        await supabase.from('streaks').update({ current_streak: 0 }).eq('user_id', user!.id)
        setLostStreak(str.current_streak)
        setStreak((prev: any) => ({ ...prev, current_streak: 0 }))
        setShowReflection(true)
      }
    }

    const hour = new Date().getHours()
    if (hour >= 20 && str?.last_checked_in !== today && (prof?.rest_tokens || 0) > 0) {
      showToast(`You have ${prof?.rest_tokens} rest token(s) available tonight.`)
    }

    const { data: p1 } = await supabase
      .from('accountability_partners')
      .select('*, profiles!accountability_partners_user2_id_fkey(id, name)')
      .eq('user1_id', user!.id).single()
    const { data: p2 } = await supabase
      .from('accountability_partners')
      .select('*, profiles!accountability_partners_user1_id_fkey(id, name)')
      .eq('user2_id', user!.id).single()

    const activePartner = p1 || p2
    if (activePartner) {
      const partnerId = activePartner.user1_id === user!.id ? activePartner.user2_id : activePartner.user1_id
      setPartner({ id: partnerId, name: activePartner.profiles?.name })
      const { data: pendingProofs } = await supabase
        .from('checkin_proofs').select('*, profiles(name)')
        .eq('user_id', partnerId).eq('status', 'pending')
      setPendingConfirmations(pendingProofs || [])
    }

    setLoading(false)

    if (!localStorage.getItem('onboarding_complete')) {
      setTimeout(() => setShowOnboarding(true), 500)
    }
  }

  const submitProof = async () => {
    const link = proofLink.trim()
    if (link) {
      try {
        const url = new URL(link)
        if (!['http:', 'https:'].includes(url.protocol)) {
          showToast('Please enter a valid link starting with http:// or https://')
          return
        }
      } catch (_) {
        showToast('Please enter a valid URL (e.g., https://instagram.com/p/...)')
        return
      }
    }

    if (!link && !proofFile) {
      showToast('Please provide a post link or screenshot.')
      return
    }

    setSubmittingProof(true)
    let proofUrl = ''
    if (proofFile) {
      const ext = proofFile.name.split('.').pop()
      const path = `${user!.id}/${today}.${ext}`
      const { error } = await supabase.storage.from('checkin-proofs').upload(path, proofFile, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('checkin-proofs').getPublicUrl(path)
        proofUrl = data.publicUrl
      }
    }
    await supabase.from('checkin_proofs').upsert({
      user_id: user!.id, date: today,
      proof_url: proofUrl, proof_link: link,
      status: partner ? 'pending' : 'confirmed'
    })
    if (!partner) await confirmStreak()
    else setTodayPending(true)
    setShowProofForm(false)
    setProofLink('')
    setProofFile(null)
    setSubmittingProof(false)
    await fetchAll()
  }

  const confirmStreak = async () => {
    const newStreak = (streak?.current_streak || 0) + 1
    const bestStreak = Math.max(newStreak, streak?.best_streak || 0)
    await supabase.from('streaks').update({
      current_streak: newStreak, best_streak: bestStreak,
      last_checked_in: today, on_rest_day: false
    }).eq('user_id', user!.id)

    const { data: userChallenges } = await supabase
      .from('user_challenges').select('*, challenges(*)')
      .eq('user_id', user!.id).is('left_at', null)
    if (userChallenges) {
      for (const uc of userChallenges) {
        if (uc.progress < uc.challenges.days) {
          await supabase.from('user_challenges').update({ progress: uc.progress + 1 }).eq('id', uc.id)
        }
      }
    }

    setStreak((prev: any) => ({ ...prev, current_streak: newStreak, best_streak: bestStreak }))
    setTodayDone(true)
    setTodayPending(false)
    setCelebrated(true)
    setTimeout(() => setCelebrated(false), 3000)

    const newAchievements = await checkAndAwardAchievements(user!.id)
    if (newAchievements.length > 0) setCurrentMilestone(newAchievements[0])
    await checkAndAwardToken(user!.id)
    await notifyPartnerCheckin(user!.id)

    if (partner) {
      await awardScore(user!.id, 'POST_CONFIRMED')
    } else {
      await awardScore(user!.id, 'SELF_CHECKIN')
    }
    if (newStreak === 7) await awardScore(user!.id, 'STREAK_7')
    if (newStreak === 30) await awardScore(user!.id, 'STREAK_30')
    if (newStreak === 60) await awardScore(user!.id, 'STREAK_60')
    if (newStreak === 100) await awardScore(user!.id, 'STREAK_100')
  }

  const handleUseRestToken = async () => {
    setUsingRestToken(true)
    const result = await useRestToken(user!.id)
    if (result.success) {
      setTodayRest(true)
      setRestTokens(prev => prev - 1)
      showToast('Rest day applied. Streak protected.')
    } else {
      showToast(result.message)
    }
    setUsingRestToken(false)
  }

  const confirmPartnerProof = async (proof: any) => {
    await awardScore(proof.user_id, 'POST_CONFIRMED')
    await awardScore(user!.id, 'PARTNER_BONUS')
    await supabase.from('checkin_proofs').update({
      status: 'confirmed', confirmed_by: user!.id,
      confirmed_at: new Date().toISOString()
    }).eq('id', proof.id)
    const { data: partnerStreak } = await supabase
      .from('streaks').select('*').eq('user_id', proof.user_id).single()
    if (partnerStreak) {
      const newStreak = (partnerStreak.current_streak || 0) + 1
      await supabase.from('streaks').update({
        current_streak: newStreak,
        best_streak: Math.max(newStreak, partnerStreak.best_streak || 0),
        last_checked_in: proof.date
      }).eq('user_id', proof.user_id)
    }
    await fetchAll()
  }

  const rejectPartnerProof = async (proof: any) => {
    await supabase.from('checkin_proofs').update({ status: 'rejected' }).eq('id', proof.id)
    await fetchAll()
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <Layout>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ ...styles.skel, width: '52px', height: '52px', borderRadius: '50%' }} />
            <div>
              <div style={{ ...styles.skel, width: '80px', height: '12px', marginBottom: '0.4rem' }} />
              <div style={{ ...styles.skel, width: '140px', height: '22px' }} />
            </div>
          </div>
          <div style={{ ...styles.skel, height: '160px', borderRadius: '20px', marginBottom: '1rem' }} />
          <div style={{ ...styles.skel, height: '52px', borderRadius: '12px', marginBottom: '1rem' }} />
        </div>
      </Layout>
    )
  }

  const firstName = profile?.name?.split(' ')[0] || 'Creator'
  const scoreInfo = getScoreLabel(creatorScore)

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                {greeting()}
              </p>
              <h1 style={{ fontSize: '1.7rem', fontFamily: 'Space Grotesk', fontWeight: '700', color: '#F0EDE8', lineHeight: 1.1, marginBottom: '0.3rem' }}>
                {firstName}
              </h1>
              <p style={{ color: todayDone ? '#4CAF50' : todayPending ? '#F5A623' : todayRest ? '#888' : '#555', fontSize: '0.82rem' }}>
                {todayDone ? 'Posted today ✓' : todayPending ? 'Awaiting confirmation' : todayRest ? 'Rest day active' : 'Not posted yet'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={styles.avatarWrap}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <User size={20} color="#555" />
                }
              </div>
              <a href="/score" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#1A1400', border: '1px solid #F5A62320', borderRadius: '20px', padding: '0.25rem 0.65rem', textDecoration: 'none' }}>
                <Star size={11} color="#F5A623" />
                <span style={{ color: '#F5A623', fontSize: '0.68rem', fontWeight: '600', fontFamily: 'Space Grotesk' }}>{creatorScore}</span>
                <span style={{ color: '#555', fontSize: '0.65rem' }}>{scoreInfo.label}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={styles.modeToggle}>
          <button
            style={{ ...styles.modeBtn, background: mode === 'operator' ? '#F5A623' : 'transparent', color: mode === 'operator' ? '#0A0A0A' : '#555' }}
            onClick={() => setMode('operator')}
          >
            <Zap size={14} color={mode === 'operator' ? '#0A0A0A' : '#555'} />
            Operator
          </button>
          <button
            style={{ ...styles.modeBtn, background: mode === 'creator' ? '#F5A623' : 'transparent', color: mode === 'creator' ? '#0A0A0A' : '#555' }}
            onClick={() => setMode('creator')}
          >
            <BookMarked size={14} color={mode === 'creator' ? '#0A0A0A' : '#555'} />
            Creator
          </button>
        </div>

        {mode === 'operator' ? (
          <>
            {/* Partner confirmations */}
            {pendingConfirmations.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                {pendingConfirmations.map(proof => (
                  <div key={proof.id} style={styles.confirmCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Clock size={15} color="#F5A623" />
                      <span style={{ color: '#F5A623', fontWeight: '600', fontSize: '0.88rem' }}>
                        {proof.profiles?.name} wants you to confirm their post
                      </span>
                    </div>
                    {proof.proof_link && (
                      <a href={proof.proof_link} target="_blank" rel="noreferrer" style={{ color: '#888', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
                        <Link2 size={14} />
                        {proof.proof_link}
                      </a>
                    )}
                    {proof.proof_url && (
                      <a href={proof.proof_url} target="_blank" rel="noreferrer">
                        <img src={proof.proof_url} style={{ width: '100%', borderRadius: '8px', marginBottom: '0.75rem', maxHeight: '160px', objectFit: 'cover' }} />
                      </a>
                    )}
                    {!proof.proof_link && !proof.proof_url && (
                      <p style={{ color: '#555', fontSize: '0.82rem', marginBottom: '0.75rem' }}>No proof provided — honor system.</p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={styles.confirmBtn} onClick={() => confirmPartnerProof(proof)}>
                        <CheckCircle2 size={15} color="#0A0A0A" /> Confirm Posted
                      </button>
                      <button style={styles.rejectBtn} onClick={() => rejectPartnerProof(proof)}>
                        <X size={15} color="#E53E3E" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Streak card */}
            <motion.div
              style={{
                ...styles.streakCard,
                background: todayDone ? 'linear-gradient(135deg, #1A1400 0%, #0F0F0F 100%)'
                  : todayRest ? 'linear-gradient(135deg, #0F0F1A 0%, #0A0A0A 100%)'
                  : 'linear-gradient(135deg, #111111 0%, #0A0A0A 100%)',
                borderColor: celebrated ? '#F5A62360' : todayDone ? '#F5A62325' : todayRest ? '#33337A40' : '#1E1E1E'
              }}
              animate={celebrated ? { scale: [1, 1.015, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ ...styles.flameWrap, background: todayRest ? '#0F0F1A' : '#1A1400' }}>
                    {todayRest ? <Coffee size={26} color="#888" /> : <Flame size={26} color="#F5A623" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '3.5rem', fontWeight: '800', fontFamily: 'Space Grotesk', color: todayRest ? '#888' : '#F5A623', lineHeight: 1 }}>
                      {streak?.current_streak ?? 0}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.82rem', marginTop: '0.2rem' }}>day streak</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
                    <TrendingUp size={13} color="#555" />
                    <span style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Best</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Space Grotesk', color: '#F0EDE8' }}>
                    {streak?.best_streak ?? 0}
                  </div>
                  <div style={{ color: '#555', fontSize: '0.72rem' }}>days</div>
                </div>
              </div>
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.3rem' }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: '3px', borderRadius: '999px',
                    background: i < ((streak?.current_streak || 0) % 7 || ((streak?.current_streak || 0) >= 7 ? 7 : 0)) ? '#F5A623' : '#2A2A2A'
                  }} />
                ))}
              </div>
              {weeklyTarget < 7 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#0A0A0A', borderRadius: '8px' }}>
                  <span style={{ color: '#555', fontSize: '0.75rem' }}>This week</span>
                  <span style={{ color: weekPosts >= weeklyTarget ? '#4CAF50' : '#F5A623', fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {weekPosts}/{weeklyTarget} posts {weekPosts >= weeklyTarget && <Check size={14} color="#4CAF50" />}
                  </span>
                </div>
              )}
              <div style={{ color: '#444', fontSize: '0.72rem', marginTop: '0.4rem' }}>
                {7 - ((streak?.current_streak || 0) % 7) === 7 && (streak?.current_streak || 0) > 0
                  ? 'Week complete!'
                  : `${7 - ((streak?.current_streak || 0) % 7)} days to next week milestone`}
              </div>
            </motion.div>

            {/* Check-in buttons */}
            <div style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {todayDone ? (
                <div style={styles.checkedIn}>
                  <CheckCircle2 size={18} color="#4CAF50" />
                  {celebrated ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Flame size={16} color="#F5A623" /> Streak extended! Keep going.
                    </span>
                  ) : (
                    'Checked in for today'
                  )}
                </div>
              ) : todayPending ? (
                <div style={{ ...styles.checkedIn, borderColor: '#F5A62340', color: '#F5A623' }}>
                  <Clock size={18} color="#F5A623" />
                  Waiting for {partner?.name || 'partner'} to confirm
                </div>
              ) : todayRest ? (
                <div style={{ ...styles.checkedIn, borderColor: '#33337A40', color: '#888' }}>
                  <Coffee size={18} color="#888" />
                  Rest day — streak protected
                </div>
              ) : (
                <>
                  <motion.button style={styles.checkInBtn} onClick={() => setShowProofForm(true)} whileTap={{ scale: 0.98 }}>
                    <CheckCircle2 size={20} color="#0A0A0A" />
                    I Posted Today
                  </motion.button>
                  <button style={styles.restBtn} onClick={handleUseRestToken} disabled={usingRestToken || restTokens <= 0}>
                    <Coffee size={16} color={restTokens > 0 ? '#888' : '#333'} />
                    {usingRestToken ? 'Applying...' : `Use Rest Token (${restTokens} left)`}
                  </button>
                </>
              )}
            </div>

            {/* Proof form */}
            <AnimatePresence>
              {showProofForm && (
                <motion.div style={styles.proofForm} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Submit Proof of Post</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowProofForm(false)}>
                      <X size={18} color="#555" />
                    </button>
                  </div>
                  <p style={{ color: '#555', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                    {partner ? `${partner.name} will confirm your post before your streak counts.` : 'No partner — your check-in will be confirmed automatically.'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={styles.label}>Post Link (optional)</label>
                      <input
                        style={{ ...styles.input, marginTop: '0.3rem' }}
                        placeholder="https://instagram.com/p/..."
                        value={proofLink}
                        onChange={e => setProofLink(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Screenshot (optional)</label>
                      <div style={styles.uploadBox} onClick={() => fileRef.current?.click()}>
                        <Upload size={18} color="#555" />
                        <span style={{ color: '#555', fontSize: '0.85rem' }}>{proofFile ? proofFile.name : 'Tap to upload screenshot'}</span>
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setProofFile(e.target.files?.[0] || null)} />
                    </div>
                    <button style={styles.submitBtn} onClick={submitProof} disabled={submittingProof}>
                      {submittingProof ? 'Submitting...' : partner ? 'Submit for Confirmation' : 'Confirm Check-in'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <ShareCard name={profile?.name || 'Creator'} streak={streak?.current_streak || 0} bestStreak={streak?.best_streak || 0} />
              <a href="/planner" style={styles.quickAction}>
                <Calendar size={15} color="#888" />
                Plan Content
              </a>
            </div>

            {/* Today's tasks */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={15} color="#555" />
                  <span style={{ color: '#555', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's Plan</span>
                </div>
                {tasksToday.length > 0 && (
                  <span style={{ color: '#555', fontSize: '0.75rem' }}>
                    {tasksToday.filter(t => t.completed).length}/{tasksToday.length} done
                  </span>
                )}
              </div>
              {tasksToday.length === 0 ? (
                <div style={styles.emptyBox}>
                  No tasks planned for today.{' '}
                  <a href="/planner" style={{ color: '#F5A623', textDecoration: 'none' }}>Add some →</a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tasksToday.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={fetchAll} />
                  ))}
                </div>
              )}
            </div>

            <Heatmap />
          </>
        ) : (
          <>
            <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Distraction-free. Just create.</p>
            <div style={{ background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
              <p style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Quick Capture</p>
              <input
                style={styles.input}
                placeholder="Capture an idea before it disappears..."
                onKeyDown={async e => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                    await supabase.from('vault').insert({ user_id: user!.id, title: (e.target as HTMLInputElement).value.trim(), status: 'idea' })
                    ;(e.target as HTMLInputElement).value = ''
                    showToast('Idea saved to vault!')
                  }
                }}
              />
              <p style={{ color: '#333', fontSize: '0.75rem', marginTop: '0.5rem' }}>Press Enter to save to Content Vault</p>
            </div>
            {tasksToday.length > 0 && (
              <div style={{ background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
                <p style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                  Today — {tasksToday.filter(t => t.completed).length}/{tasksToday.length} done
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tasksToday.map(task => <TaskItem key={task.id} task={task} onToggle={fetchAll} />)}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { href: '/vault', title: 'Content Vault', desc: 'Browse and manage your ideas' },
                { href: '/planner', title: 'Content Planner', desc: 'Plan what to post this week' },
                { href: '/challenges', title: 'Challenges', desc: 'Stay on track with your commitments' },
              ].map(link => (
                <a key={link.href} href={link.href} style={styles.creatorLink}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>{link.title}</div>
                    <div style={{ color: '#555', fontSize: '0.82rem' }}>{link.desc}</div>
                  </div>
                  <div style={{ color: '#F5A623', fontSize: '0.82rem' }}>Open →</div>
                </a>
              ))}
            </div>
          </>
        )}

        {showReflection && (
          <MissedDayReflection streakLost={lostStreak} onClose={() => setShowReflection(false)} />
        )}
        {currentMilestone && (
          <MilestoneCard milestone={currentMilestone} name={profile?.name || 'Creator'} stat={streak?.current_streak} onClose={() => setCurrentMilestone(null)} />
        )}
        {showOnboarding && (
          <OnboardingTour onComplete={() => setShowOnboarding(false)} />
        )}

        <AICoach name={profile?.name || 'Creator'} streak={streak?.current_streak || 0} todayDone={todayDone} tasksCount={tasksToday.length} />

        {toast && <div style={styles.toast}>{toast}</div>}

      </motion.div>
    </Layout>
  )
}

function TaskItem({ task, onToggle }: any) {
  const toggle = async () => {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id)
    onToggle()
  }
  return (
    <div style={{ ...styles.taskItem, opacity: task.completed ? 0.5 : 1 }} onClick={toggle}>
      {task.completed ? <CheckCircle2 size={17} color="#4CAF50" /> : <Circle size={17} color="#333" />}
      <span style={{ flex: 1, textDecoration: task.completed ? 'line-through' : 'none', fontSize: '0.92rem' }}>{task.title}</span>
      {task.platform && <span style={styles.platform}>{task.platform}</span>}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  skel: { background: 'linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '8px' },
  avatarWrap: { width: '48px', height: '48px', borderRadius: '50%', background: '#1A1A1A', border: '2px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  modeToggle: { display: 'flex', background: '#111111', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '0.25rem', marginBottom: '1.25rem', gap: '0.25rem' },
  modeBtn: { flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' },
  streakCard: { border: '1px solid #1E1E1E', borderRadius: '20px', padding: '1.5rem' },
  flameWrap: { borderRadius: '14px', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  checkInBtn: { width: '100%', background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '14px', padding: '1rem', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', cursor: 'pointer' },
  restBtn: { width: '100%', background: 'none', color: '#666', border: '1px solid #1E1E1E', borderRadius: '14px', padding: '0.75rem', fontSize: '0.88rem', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' },
  checkedIn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px', color: '#4CAF50', fontWeight: '500', fontSize: '0.92rem' },
  confirmCard: { background: '#111111', border: '1px solid #F5A62330', borderRadius: '14px', padding: '1.1rem', marginBottom: '0.75rem' },
  confirmBtn: { flex: 1, background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '8px', padding: '0.7rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' },
  rejectBtn: { background: 'none', border: '1px solid #E53E3E30', borderRadius: '8px', padding: '0.7rem 1rem', color: '#E53E3E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' },
  proofForm: { background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' },
  label: { color: '#555', fontSize: '0.72rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  input: { background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px', padding: '0.75rem 1rem', color: '#F0EDE8', fontSize: '0.92rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'Inter' },
  uploadBox: { background: '#0A0A0A', border: '1px dashed #2A2A2A', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '0.3rem' },
  submitBtn: { width: '100%', background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '8px', padding: '0.75rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' },
  quickAction: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#111111', color: '#888', border: '1px solid #1E1E1E', borderRadius: '8px', padding: '0.65rem 1rem', fontWeight: '500', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'none' },
  emptyBox: { background: '#111111', border: '1px dashed #1E1E1E', borderRadius: '12px', padding: '1.25rem', color: '#555', textAlign: 'center', fontSize: '0.88rem' },
  taskItem: { background: '#111111', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' },
  platform: { background: '#1A1400', color: '#F5A623', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '500' },
  creatorLink: { background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px', padding: '1.1rem', textDecoration: 'none', color: '#F0EDE8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  toast: { position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '0.75rem 1.25rem', color: '#F0EDE8', fontSize: '0.85rem', zIndex: 999, whiteSpace: 'nowrap' as const, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }
}
