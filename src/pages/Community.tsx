import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { X, Loader, Users, Trophy, Flame, Calendar, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import CommunityDesign, { type CommunityPost } from '../components/community/CommunityDesign'
import ThreadedPostCard from '../components/community/ThreadedPostCard'
import { toggleBookmark, type FullPost } from '../lib/communityThreads'

function getInitials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
function getAvatarGradient(name?: string | null) {
  const g = [['#F5A623', '#D9821A'], ['#6FA8F5', '#3D7DD9'], ['#F56F91', '#D93D63'], ['#6FCB73', '#3DA843'], ['#B98CF5', '#8A4DD9']]
  const key = name || '?'
  let h = 0
  for (let i = 0; i < key.length; i++) h = key.charCodeAt(i) + ((h << 5) - h)
  const [a, b] = g[Math.abs(h) % g.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

export default function Community() {
  const { user } = useAuth()
  const currentUserId = user?.id ?? null
  const [searchParams, setSearchParams] = useSearchParams()

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

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const fetchPosts = useCallback(async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select(`id, content, link, user_id, created_at, post_type, platform, engagement_type, engaged_by, profiles ( name, email, avatar_url )`)
        .order('created_at', { ascending: false })
      if (postsError) throw postsError
      const postIds = postsData?.map(p => p.id) || []

      const [commentsRes, likesRes, boostsRes, engagementsRes] = await Promise.all([
        supabase.from('community_comments').select('id, content, user_id, created_at, post_id, profiles ( name, avatar_url )').in('post_id', postIds.length ? postIds : ['']),
        supabase.from('community_likes').select('id, user_id, post_id').in('post_id', postIds.length ? postIds : ['']),
        supabase.from('community_boosts').select('id, user_id, post_id').in('post_id', postIds.length ? postIds : ['']),
        supabase.from('community_engagements').select('id, user_id, post_id').in('post_id', postIds.length ? postIds : ['']),
      ])

      const group = <T extends { post_id: string }>(rows: T[] | null) => {
        const m: Record<string, T[]> = {}
        rows?.forEach(r => { if (!m[r.post_id]) m[r.post_id] = []; m[r.post_id].push(r) })
        return m
      }
      const commentsByPost = group(commentsRes.data as any[])
      const likesByPost = group(likesRes.data as any[])
      const boostsByPost = group(boostsRes.data as any[])
      const engagementsByPost = group(engagementsRes.data as any[])

      const mapped: CommunityPost[] = (postsData || []).map((post: any) => ({
        id: post.id, content: post.content, link: post.link, user_id: post.user_id,
        created_at: post.created_at, post_type: post.post_type || 'say_hi',
        platform: post.platform, engagement_type: post.engagement_type,
        engaged_by: post.engaged_by || [], profiles: post.profiles,
        comments: (commentsByPost[post.id] || []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        likes: likesByPost[post.id] || [],
        boosts: boostsByPost[post.id] || [],
        engagements: engagementsByPost[post.id] || [],
      }))

      setPosts(mapped)
      setLikedPostIds(new Set(mapped.filter(p => p.likes?.some(l => l.user_id === currentUserId)).map(p => p.id)))
      setBoostedPostIds(new Set(mapped.filter(p => p.boosts?.some(b => b.user_id === currentUserId)).map(p => p.id)))
      setEngagedPostIds(new Set(mapped.filter(p => p.engagements?.some(e => e.user_id === currentUserId)).map(p => p.id)))
    } catch (err: any) {
      console.error('Fetch error:', err)
      toast.error('Could not load the community board')
    } finally { setLoading(false) }
  }, [currentUserId])

  useEffect(() => { fetchPosts() }, [fetchPosts])
  useEffect(() => {
    const targetUser = searchParams.get('profile')
    if (targetUser) {
      setSelectedUserId(targetUser)
      fetchUserProfile(targetUser)
      // clean the URL so refresh doesn't re-open
      const next = new URLSearchParams(searchParams)
      next.delete('profile')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams])


  useEffect(() => {
    const channel = supabase.channel('community-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_likes' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_boosts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_engagements' }, () => fetchPosts())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchPosts])

  const filteredPosts = useMemo(() => {
    let r = posts
    if (filter === 'say_hi') r = r.filter(p => p.post_type === 'say_hi')
    if (filter === 'boost') r = r.filter(p => p.post_type === 'boost')
    if (filter === 'mine') r = r.filter(p => p.user_id === currentUserId)
    if (platformFilter) r = r.filter(p => p.platform === platformFilter)
    return r
  }, [posts, filter, platformFilter, currentUserId])

  const sortedPosts = useMemo(() => {
    if (sortBy === 'needs_engagement') return [...filteredPosts].sort((a, b) => (a.engagements?.length || 0) - (b.engagements?.length || 0))
    return [...filteredPosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [filteredPosts, sortBy])

  const fetchUserProfile = async (userId: string) => {
    setLoadingProfile(true)
    try {
      const { data: profile, error: pErr } = await supabase.from('profiles').select('id, name, email, created_at, bio, avatar_url, username').eq('id', userId).single()
      if (pErr) throw pErr
      const { data: streak } = await supabase.from('streaks').select('current_streak, best_streak, last_checked_in').eq('user_id', userId).single()
      const { count: partnerCount } = await supabase.from('accountability_partners').select('*', { count: 'exact', head: true }).or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      const { count: postCount } = await supabase.from('community_posts').select('*', { count: 'exact', head: true }).eq('user_id', userId)
      setProfileData({ ...profile, streak: streak || { current_streak: 0, best_streak: 0, last_checked_in: null }, partnerCount: partnerCount || 0, postCount: postCount || 0 })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load profile')
    } finally { setLoadingProfile(false) }
  }

  const handleViewProfile = (userId: string) => {
    if (!userId) return
    setSelectedUserId(userId)
    fetchUserProfile(userId)
  }
  const closeProfile = () => { setSelectedUserId(null); setProfileData(null) }

  const onCreatePost = async (content: string, link: string | null, postType: 'say_hi' | 'boost', platform: string | null, engagementType: string | null) => {
    if (!currentUserId) { toast.error('Sign in to post'); return }
    setIsPosting(true)
    const { error } = await supabase.from('community_posts').insert({ content, link, user_id: currentUserId, post_type: postType, platform: platform || null, engagement_type: engagementType || null, engaged_by: [] })
    setIsPosting(false)
    if (error) { toast.error("Couldn't post that"); return }
    toast.success('Posted to the community board')
    fetchPosts()
  }

  const onDeletePost = async (postId: string) => {
    const { error } = await supabase.from('community_posts').delete().eq('id', postId)
    if (error) { toast.error("Couldn't delete that post"); return }
    setPosts(prev => prev.filter(p => p.id !== postId))
    toast.success('Post deleted')
  }

  const onToggleLike = async (postId: string) => {
    if (!currentUserId) { toast.error('Sign in to react'); return }
    const liked = likedPostIds.has(postId)
    setLikedPostIds(prev => { const n = new Set(prev); liked ? n.delete(postId) : n.add(postId); return n })
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, likes: liked ? (p.likes ?? []).filter(l => l.user_id !== currentUserId) : [...(p.likes ?? []), { user_id: currentUserId }] }))
    const { error } = liked
      ? await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', currentUserId)
      : await supabase.from('community_likes').insert({ post_id: postId, user_id: currentUserId })
    if (error) { toast.error("Couldn't update reaction"); fetchPosts() }
  }
  const onToggleBoost = async (postId: string) => {
    if (!currentUserId) { toast.error('Sign in to boost'); return }
    const boosted = boostedPostIds.has(postId)
    setBoostedPostIds(prev => { const n = new Set(prev); boosted ? n.delete(postId) : n.add(postId); return n })
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, boosts: boosted ? (p.boosts ?? []).filter(b => b.user_id !== currentUserId) : [...(p.boosts ?? []), { user_id: currentUserId }] }))
    const { error } = boosted
      ? await supabase.from('community_boosts').delete().eq('post_id', postId).eq('user_id', currentUserId)
      : await supabase.from('community_boosts').insert({ post_id: postId, user_id: currentUserId })
    if (error) { toast.error("Couldn't update boost"); fetchPosts() }
  }
  const onToggleEngagement = async (postId: string) => {
    if (!currentUserId) { toast.error('Sign in to engage'); return }
    const engaged = engagedPostIds.has(postId)
    setEngagedPostIds(prev => { const n = new Set(prev); engaged ? n.delete(postId) : n.add(postId); return n })
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, engagements: engaged ? (p.engagements ?? []).filter(e => e.user_id !== currentUserId) : [...(p.engagements ?? []), { user_id: currentUserId }] }))
    const { error } = engaged
      ? await supabase.from('community_engagements').delete().eq('post_id', postId).eq('user_id', currentUserId)
      : await supabase.from('community_engagements').insert({ post_id: postId, user_id: currentUserId })
    if (error) { toast.error("Couldn't update engagement"); fetchPosts() }
  }
  const onReply = async (postId: string, content: string) => {
    if (!currentUserId) { toast.error('Sign in to reply'); return }
    setIsReplying(true)
    const { error } = await supabase.from('community_comments').insert({ post_id: postId, content, user_id: currentUserId })
    setIsReplying(false)
    if (error) { toast.error("Couldn't send reply"); return }
    fetchPosts()
  }
  const onDeleteReply = async (_postId: string, commentId: string) => {
    const { error } = await supabase.from('community_comments').delete().eq('id', commentId)
    if (error) { toast.error("Couldn't delete reply"); return }
    fetchPosts()
  }

  const toFullPost = (p: CommunityPost): FullPost => ({
    id: p.id, content: p.content, link: p.link, user_id: p.user_id, created_at: p.created_at,
    post_type: p.post_type, platform: p.platform,
    profiles: p.profiles ? { name: p.profiles.name, role: null, verified: false, avatar_url: p.profiles.avatar_url ?? null } : null,
    reactions: [
      { emoji: '❤️', count: p.likes?.length || 0, mine: p.likes?.some(l => l.user_id === currentUserId) || false },
      { emoji: '🔥', count: p.boosts?.length || 0, mine: p.boosts?.some(b => b.user_id === currentUserId) || false },
      { emoji: '👏', count: p.engagements?.length || 0, mine: p.engagements?.some(e => e.user_id === currentUserId) || false },
    ],
    comment_count: p.comments?.length || 0,
    bookmarked: false,
    likes_count: p.likes?.length || 0,
  })

  const renderCard = (p: CommunityPost) => {
    const full = toFullPost(p)
    return (
      <ThreadedPostCard
        post={full}
        currentUserId={currentUserId}
        onReact={() => onToggleLike(p.id)}
        onBookmark={() => {
          if (!currentUserId) { toast.error('Sign in to bookmark'); return }
          toggleBookmark(p.id, currentUserId).then(async r => {
            if (r.error) { toast.error('Could not update bookmark'); return }
            toast.success(r.on ? 'Bookmarked' : 'Removed bookmark')
            await fetchPosts()
          })
        }}
        onShare={() => {
          const url = `${window.location.origin}/post/${p.id}`
          if (navigator.share) navigator.share({ title: p.profiles?.name || 'Post', url }).catch(() => {})
          else navigator.clipboard.writeText(url).then(() => toast.success('Link copied'))
        }}
        onMenu={() => toast('More actions coming soon')}
        onViewProfile={handleViewProfile}
      />
    )
  }

  const isOwnProfile = selectedUserId === currentUserId

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
        renderCard={renderCard}
      />

      <AnimatePresence>
        {selectedUserId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={modalStyles.overlay} onClick={closeProfile}
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              style={modalStyles.card} onClick={e => e.stopPropagation()}
            >
              <button style={modalStyles.close} onClick={closeProfile} aria-label="Close">
                <X size={18} color="#8A8A8A" />
              </button>
              {loadingProfile ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Loader size={26} color="#5C5C5C" className="animate-spin" />
                </div>
              ) : profileData ? (
                <>
                  <div style={modalStyles.top}>
                    <div style={modalStyles.banner} />
                    <div style={modalStyles.avatarRing}>
                      <div style={{ ...modalStyles.avatar, background: profileData.avatar_url ? 'transparent' : getAvatarGradient(profileData.name) }}>
                        {profileData.avatar_url
                          ? <img src={profileData.avatar_url} alt={profileData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : getInitials(profileData.name)}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '0 1.4rem 1.4rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F5F1EA', margin: '0.8rem 0 0.1rem', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
                      {profileData.name}
                      {isOwnProfile && <span style={{ fontSize: '0.62rem', marginLeft: '0.5rem', color: '#F5A623', background: 'rgba(245,166,35,0.12)', padding: '0.1rem 0.5rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, verticalAlign: 'middle' }}>you</span>}
                    </h2>
                    {profileData.username && <p style={{ color: '#F5A623', fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>@{profileData.username}</p>}
                    <p style={{ color: '#7A7A7A', fontSize: '0.78rem', margin: '0.25rem 0 0', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Mail size={11} /> {profileData.email}
                    </p>
                  </div>
                  <div style={modalStyles.stats}>
                    <div style={modalStyles.stat}>
                      <span style={modalStyles.statIcon}><Flame size={13} color="#F5A623" /></span>
                      <span style={modalStyles.statValue}>{profileData.streak.current_streak || 0}</span>
                      <span style={modalStyles.statLabel}>Streak</span>
                    </div>
                    <div style={modalStyles.stat}>
                      <span style={modalStyles.statIcon}><Trophy size={13} color="#4CAF50" /></span>
                      <span style={modalStyles.statValue}>{profileData.streak.best_streak || 0}</span>
                      <span style={modalStyles.statLabel}>Best</span>
                    </div>
                    <div style={modalStyles.stat}>
                      <span style={modalStyles.statIcon}><Users size={13} color="#6FA8F5" /></span>
                      <span style={modalStyles.statValue}>{profileData.partnerCount}</span>
                      <span style={modalStyles.statLabel}>Partners</span>
                    </div>
                    <div style={modalStyles.stat}>
                      <span style={modalStyles.statIcon}><ShieldCheck size={13} color="#B98CF5" /></span>
                      <span style={modalStyles.statValue}>{profileData.postCount}</span>
                      <span style={modalStyles.statLabel}>Posts</span>
                    </div>
                  </div>
                  <div style={{ padding: '0 1.4rem 1.4rem' }}>
                    <div style={modalStyles.sectionLabel}>About</div>
                    <p style={modalStyles.bio}>{profileData.bio || "This creator hasn't added a bio yet."}</p>
                    <div style={modalStyles.metaRow}>
                      <span style={modalStyles.metaItem}><Calendar size={11} /> Joined {new Date(profileData.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color: '#8A8A8A', padding: '2rem', textAlign: 'center' }}>No profile data</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.25rem' },
  card: { background: 'linear-gradient(180deg, #161616 0%, #0A0A0A 100%)', border: '1px solid #262626', borderRadius: '24px', width: '100%', maxWidth: '420px', position: 'relative', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9)', maxHeight: '90vh', overflowY: 'auto' },
  close: { position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(0,0,0,0.5)', border: '1px solid #262626', borderRadius: '10px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, backdropFilter: 'blur(6px)' },
  top: { position: 'relative', height: '92px' },
  banner: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(245,166,35,0.28), transparent 65%), radial-gradient(circle at bottom left, rgba(111,168,245,0.14), transparent 60%)' },
  avatarRing: { position: 'absolute', bottom: '-32px', left: '1.4rem', padding: 3, borderRadius: '24px', background: 'linear-gradient(135deg, #F5A623, #D9821A)', boxShadow: '0 12px 30px -12px rgba(245,166,35,0.6)' },
  avatar: { width: '72px', height: '72px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', fontFamily: 'Space Grotesk', overflow: 'hidden', border: '3px solid #0A0A0A' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', padding: '0.4rem 1.4rem 1rem', marginTop: '1.6rem' },
  stat: { background: 'rgba(255,255,255,0.03)', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '0.6rem 0.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' },
  statIcon: { display: 'flex', marginBottom: '0.1rem' },
  statValue: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.95rem', color: '#F5F1EA', lineHeight: 1 },
  statLabel: { fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A7A7A', fontWeight: 600 },
  sectionLabel: { color: '#5C5C5C', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.4rem' },
  bio: { color: '#B0B0B0', fontSize: '0.85rem', lineHeight: 1.55, margin: 0, background: 'rgba(255,255,255,0.02)', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '0.75rem 0.9rem' },
  metaRow: { display: 'flex', gap: '0.75rem', marginTop: '0.6rem', flexWrap: 'wrap' },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#7A7A7A', fontSize: '0.73rem', fontWeight: 500 },
}
