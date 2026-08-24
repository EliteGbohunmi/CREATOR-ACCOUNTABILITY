import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { X, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import CommunityDesign, { type CommunityPost } from '../components/community/CommunityDesign'

// --- Avatar helper (same as Partners) ---
const AVATAR_GRADIENTS = [
  ['#F5A623', '#D9821A'],
  ['#6FA8F5', '#3D7DD9'],
  ['#F56F91', '#D93D63'],
  ['#6FCB73', '#3DA843'],
  ['#B98CF5', '#8A4DD9'],
]

function getInitials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase() || '?'
}

function getAvatarGradient(name?: string | null) {
  const key = name || '?'
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash)
  const [a, b] = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

function renderAvatar(avatarUrl: string | null, name: string, size: 'small' | 'large' = 'small') {
  const sizeStyle = size === 'large'
    ? { width: '64px', height: '64px', borderRadius: '20px' }
    : { width: '36px', height: '36px', borderRadius: '11px' }
  const common = {
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: avatarUrl ? 'transparent' : getAvatarGradient(name),
    color: '#0A0A0A',
    fontWeight: 700,
    fontSize: size === 'large' ? '1.3rem' : '0.8rem',
    fontFamily: 'Space Grotesk',
    letterSpacing: '-0.01em',
    boxShadow: '0 4px 14px -4px rgba(0,0,0,0.5)',
    ...sizeStyle
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

// --- Color tokens for modal ---
const COLORS = {
  bg: '#0A0A0A',
  surface: '#111111',
  surfaceRaised: 'linear-gradient(180deg, #141414 0%, #0D0D0D 100%)',
  border: '#1E1E1E',
  gold: '#F5A623',
  text: '#F0EDE8',
  textDim: '#8A8A8A',
  textFaint: '#5C5C5C',
}

export default function Community() {
  const { user } = useAuth()
  const currentUserId = user?.id ?? null

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [boostedPostIds, setBoostedPostIds] = useState<Set<string>>(new Set())
  const [engagedPostIds, setEngagedPostIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'say_hi' | 'boost' | 'mine'>('all')
  const [platformFilter, setPlatformFilter] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'needs_engagement'>('newest')

  // --- Profile modal state ---
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const fetchPosts = useCallback(async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          id,
          content,
          link,
          user_id,
          created_at,
          post_type,
          platform,
          engagement_type,
          engaged_by,
          profiles ( name, email, avatar_url )
        `)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      const postIds = postsData?.map(p => p.id) || []

      const { data: commentsData, error: commentsError } = await supabase
        .from('community_comments')
        .select(`
          id,
          content,
          user_id,
          created_at,
          post_id,
          profiles ( name )
        `)
        .in('post_id', postIds.length ? postIds : [''])

      if (commentsError) throw commentsError

      const { data: likesData, error: likesError } = await supabase
        .from('community_likes')
        .select('id, user_id, post_id')
        .in('post_id', postIds.length ? postIds : [''])

      if (likesError) throw likesError

      const { data: boostsData, error: boostsError } = await supabase
        .from('community_boosts')
        .select('id, user_id, post_id')
        .in('post_id', postIds.length ? postIds : [''])

      if (boostsError) throw boostsError

      const { data: engagementsData, error: engagementsError } = await supabase
        .from('community_engagements')
        .select('id, user_id, post_id')
        .in('post_id', postIds.length ? postIds : [''])

      if (engagementsError) throw engagementsError

      const commentsByPost: Record<string, any[]> = {}
      commentsData?.forEach((c: any) => {
        if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = []
        commentsByPost[c.post_id].push(c)
      })

      const likesByPost: Record<string, any[]> = {}
      likesData?.forEach((l: any) => {
        if (!likesByPost[l.post_id]) likesByPost[l.post_id] = []
        likesByPost[l.post_id].push(l)
      })

      const boostsByPost: Record<string, any[]> = {}
      boostsData?.forEach((b: any) => {
        if (!boostsByPost[b.post_id]) boostsByPost[b.post_id] = []
        boostsByPost[b.post_id].push(b)
      })

      const engagementsByPost: Record<string, any[]> = {}
      engagementsData?.forEach((e: any) => {
        if (!engagementsByPost[e.post_id]) engagementsByPost[e.post_id] = []
        engagementsByPost[e.post_id].push(e)
      })

      const mapped: CommunityPost[] = postsData?.map((post: any) => ({
        id: post.id,
        content: post.content,
        link: post.link,
        user_id: post.user_id,
        created_at: post.created_at,
        post_type: post.post_type || 'say_hi',
        platform: post.platform,
        engagement_type: post.engagement_type,
        engaged_by: post.engaged_by || [],
        profiles: post.profiles,
        comments: (commentsByPost[post.id] || []).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
        likes: likesByPost[post.id] || [],
        boosts: boostsByPost[post.id] || [],
        engagements: engagementsByPost[post.id] || [],
      })) || []

      setPosts(mapped)
      setLikedPostIds(
        new Set(
          mapped
            .filter((p) => p.likes?.some((l) => l.user_id === currentUserId))
            .map((p) => p.id)
        )
      )
      setBoostedPostIds(
        new Set(
          mapped
            .filter((p) => p.boosts?.some((b) => b.user_id === currentUserId))
            .map((p) => p.id)
        )
      )
      setEngagedPostIds(
        new Set(
          mapped
            .filter((p) => p.engagements?.some((e) => e.user_id === currentUserId))
            .map((p) => p.id)
        )
      )
    } catch (err: any) {
      console.error('Fetch error:', err)
      toast.error('Could not load the community board: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [currentUserId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    const channel = supabase
      .channel('community-board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_comments' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_likes' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_boosts' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_engagements' },
        () => fetchPosts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPosts])

  const filteredPosts = useMemo(() => {
    let result = posts
    if (filter === 'say_hi') result = result.filter(p => p.post_type === 'say_hi')
    if (filter === 'boost') result = result.filter(p => p.post_type === 'boost')
    if (filter === 'mine') result = result.filter(p => p.user_id === currentUserId)
    if (platformFilter) result = result.filter(p => p.platform === platformFilter)
    return result
  }, [posts, filter, platformFilter, currentUserId])

  const sortedPosts = useMemo(() => {
    if (sortBy === 'needs_engagement') {
      return [...filteredPosts].sort((a, b) => (a.engagements?.length || 0) - (b.engagements?.length || 0))
    }
    return [...filteredPosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [filteredPosts, sortBy])

  // --- Profile fetch ---
  const fetchUserProfile = async (userId: string) => {
    setLoadingProfile(true)
    try {
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, email, created_at, bio, avatar_url')
        .eq('id', userId)
        .single()
      if (pErr) throw pErr

      const { data: streak, error: sErr } = await supabase
        .from('streaks')
        .select('current_streak, best_streak, last_checked_in')
        .eq('user_id', userId)
        .single()
      if (sErr && sErr.code !== 'PGRST116') throw sErr

      const { count: partnerCount, error: pcErr } = await supabase
        .from('accountability_partners')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      if (pcErr) throw pcErr

      setProfileData({
        ...profile,
        streak: streak || { current_streak: 0, best_streak: 0, last_checked_in: null },
        partnerCount: partnerCount || 0,
      })
    } catch (err) {
      toast.error('Failed to load profile')
      console.error(err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleViewProfile = (userId: string) => {
    if (!userId) return
    setSelectedUserId(userId)
    fetchUserProfile(userId)
  }

  const closeProfile = () => {
    setSelectedUserId(null)
    setProfileData(null)
  }

  const onCreatePost = async (
    content: string,
    link: string | null,
    postType: 'say_hi' | 'boost',
    platform: string | null,
    engagementType: string | null
  ) => {
    if (!currentUserId) {
      toast.error('Sign in to post')
      return
    }
    setIsPosting(true)
    const { error } = await supabase
      .from('community_posts')
      .insert({
        content,
        link,
        user_id: currentUserId,
        post_type: postType,
        platform: platform || null,
        engagement_type: engagementType || null,
        engaged_by: [],
      })
    setIsPosting(false)
    if (error) {
      console.error(error)
      toast.error("Couldn't post that: " + error.message)
      return
    }
    toast.success('Posted to the community board')
    fetchPosts()
  }

  const onDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)
    if (error) {
      console.error(error)
      toast.error("Couldn't delete that post: " + error.message)
      return
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    toast.success('Post deleted')
  }

  const onToggleLike = async (postId: string) => {
    if (!currentUserId) {
      toast.error('Sign in to react')
      return
    }
    const liked = likedPostIds.has(postId)

    setLikedPostIds((prev) => {
      const next = new Set(prev)
      liked ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              likes: liked
                ? (p.likes ?? []).filter((l) => l.user_id !== currentUserId)
                : [...(p.likes ?? []), { user_id: currentUserId }],
            }
      )
    )

    const { error } = liked
      ? await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
      : await supabase
          .from('community_likes')
          .insert({ post_id: postId, user_id: currentUserId })

    if (error) {
      console.error(error)
      toast.error("Couldn't update your reaction: " + error.message)
      fetchPosts()
    }
  }

  const onToggleBoost = async (postId: string) => {
    if (!currentUserId) {
      toast.error('Sign in to boost')
      return
    }
    const boosted = boostedPostIds.has(postId)

    setBoostedPostIds((prev) => {
      const next = new Set(prev)
      boosted ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              boosts: boosted
                ? (p.boosts ?? []).filter((b) => b.user_id !== currentUserId)
                : [...(p.boosts ?? []), { user_id: currentUserId }],
            }
      )
    )

    const { error } = boosted
      ? await supabase
          .from('community_boosts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
      : await supabase
          .from('community_boosts')
          .insert({ post_id: postId, user_id: currentUserId })

    if (error) {
      console.error(error)
      toast.error("Couldn't update your boost: " + error.message)
      fetchPosts()
    }
  }

  const onToggleEngagement = async (postId: string) => {
    if (!currentUserId) {
      toast.error('Sign in to engage')
      return
    }
    const engaged = engagedPostIds.has(postId)

    setEngagedPostIds((prev) => {
      const next = new Set(prev)
      engaged ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              engagements: engaged
                ? (p.engagements ?? []).filter((e) => e.user_id !== currentUserId)
                : [...(p.engagements ?? []), { user_id: currentUserId }],
            }
      )
    )

    const { error } = engaged
      ? await supabase
          .from('community_engagements')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
      : await supabase
          .from('community_engagements')
          .insert({ post_id: postId, user_id: currentUserId })

    if (error) {
      console.error(error)
      toast.error("Couldn't update your engagement: " + error.message)
      fetchPosts()
    }
  }

  const onReply = async (postId: string, content: string) => {
    if (!currentUserId) {
      toast.error('Sign in to reply')
      return
    }
    setIsReplying(true)
    const { error } = await supabase
      .from('community_comments')
      .insert({ post_id: postId, content, user_id: currentUserId })
    setIsReplying(false)
    if (error) {
      console.error(error)
      toast.error("Couldn't send that reply: " + error.message)
      return
    }
    fetchPosts()
  }

  const onDeleteReply = async (_postId: string, commentId: string) => {
    const { error } = await supabase
      .from('community_comments')
      .delete()
      .eq('id', commentId)
    if (error) {
      console.error(error)
      toast.error("Couldn't delete that reply: " + error.message)
      return
    }
    fetchPosts()
  }

  return (
    <Layout>
      <CommunityDesign
        posts={sortedPosts}
        currentUserId={currentUserId}
        likedPostIds={likedPostIds}
        boostedPostIds={boostedPostIds}
        engagedPostIds={engagedPostIds}
        loading={loading}
        isPosting={isPosting}
        isReplying={isReplying}
        filter={filter}
        platformFilter={platformFilter}
        sortBy={sortBy}
        onFilterChange={setFilter}
        onPlatformFilterChange={setPlatformFilter}
        onSortChange={setSortBy}
        onCreatePost={onCreatePost}
        onDeletePost={onDeletePost}
        onToggleLike={onToggleLike}
        onToggleBoost={onToggleBoost}
        onToggleEngagement={onToggleEngagement}
        onReply={onReply}
        onDeleteReply={onDeleteReply}
        onViewProfile={handleViewProfile}
      />

      {/* --- Profile Modal --- */}
      <AnimatePresence>
        {selectedUserId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={modalStyles.overlay}
            onClick={closeProfile}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={modalStyles.card}
              onClick={(e) => e.stopPropagation()}
            >
              <button style={modalStyles.close} onClick={closeProfile}>
                <X size={20} color={COLORS.textFaint} />
              </button>
              {loadingProfile ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loader size={30} color={COLORS.textFaint} className="animate-spin" />
                </div>
              ) : profileData ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    {renderAvatar(profileData.avatar_url, profileData.name, 'large')}
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: COLORS.text, margin: 0 }}>
                        {profileData.name}
                      </h2>
                      <p style={{ color: COLORS.textDim, fontSize: '0.9rem', margin: '0.2rem 0 0' }}>
                        {profileData.email}
                      </p>
                    </div>
                  </div>

                  <div style={modalStyles.stats}>
                    <div style={modalStyles.stat}>
                      <span style={{ color: COLORS.textFaint, fontSize: '0.7rem', textTransform: 'uppercase' }}>Joined</span>
                      <span style={{ color: COLORS.text, fontWeight: 600 }}>
                        {new Date(profileData.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={modalStyles.stat}>
                      <span style={{ color: COLORS.textFaint, fontSize: '0.7rem', textTransform: 'uppercase' }}>Partners</span>
                      <span style={{ color: COLORS.text, fontWeight: 600 }}>{profileData.partnerCount}</span>
                    </div>
                    <div style={modalStyles.stat}>
                      <span style={{ color: COLORS.textFaint, fontSize: '0.7rem', textTransform: 'uppercase' }}>Current Streak</span>
                      <span style={{ color: COLORS.gold, fontWeight: 700 }}>
                        {profileData.streak.current_streak || 0} days
                      </span>
                    </div>
                    <div style={modalStyles.stat}>
                      <span style={{ color: COLORS.textFaint, fontSize: '0.7rem', textTransform: 'uppercase' }}>Best Streak</span>
                      <span style={{ color: COLORS.text, fontWeight: 600 }}>
                        {profileData.streak.best_streak || 0} days
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ color: COLORS.textFaint, fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600 }}>
                      About
                    </span>
                    <p
                      style={{
                        color: COLORS.textDim,
                        fontSize: '0.9rem',
                        marginTop: '0.3rem',
                        borderTop: `1px solid ${COLORS.border}`,
                        paddingTop: '0.8rem',
                      }}
                    >
                      {profileData.bio || "This creator hasn't added a bio yet."}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ color: COLORS.textDim }}>No profile data</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

// --- Modal styles (inline object) ---
const modalStyles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1.5rem',
  },
  card: {
    background: COLORS.surfaceRaised,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '24px',
    padding: '2rem',
    maxWidth: '440px',
    width: '100%',
    position: 'relative' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
  },
  close: {
    position: 'absolute' as const,
    top: '0.8rem',
    right: '0.8rem',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '10px',
    width: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: COLORS.textFaint,
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem',
  },
  stat: {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '0.6rem 0.8rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.15rem',
  },
}
