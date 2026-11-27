import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, BadgeCheck, Heart, MessageCircle, Send,
  Bookmark, MoreHorizontal, Loader, Sparkles, Megaphone,
  CornerDownRight, Share2,
} from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../lib/AuthContext'
import {
  getPostById, getCommentTree, addThreadComment, toggleBookmark, toggleReaction,
  type FullPost, type ThreadComment,
} from '../lib/communityThreads'
import ThreadedComment from '../components/community/ThreadedComment'
import ProfileModal from '../components/community/ProfileModal'
import { supabase } from '../lib/supabase'

const c = {
  card: '#141414', border: '#4A3B18', divider: '#2E2E2E', line: '#2A2A2A',
  text: '#F5F5F5', dim: '#A1A1AA', faint: '#71717A', gold: '#E3A008',
  goldSoft: '#2E2610', coral: '#F87171', inputBorder: '#262626',
  surface: '#0F0F0F',
}

const AVATAR_COLORS = ['#E3A008', '#6FA8F5', '#F56F91', '#6FCB73', '#B98CF5']
function avatarBg(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean)
  if (!p.length) return '?'
  if (p.length === 1) return p[0][0]?.toUpperCase() || '?'
  return (p[0][0] + p[1][0]).toUpperCase()
}
function relDate(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago'
  if (diff < 604_800_000) return Math.floor(diff / 86_400_000) + 'd ago'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
function typeLabel(post: FullPost) {
  if (post.post_type === 'boost') {
    return post.engagement_type ? `Boost · ${post.engagement_type}` : 'Boost'
  }
  if (post.engagement_type) return `Say hi · ${post.engagement_type}`
  return 'Say hi'
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const currentUserId = user?.id ?? null

  const [post, setPost] = useState<FullPost | null>(null)
  const [tree, setTree] = useState<ThreadComment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const load = async () => {
    if (!postId) { setNotFound(true); setLoading(false); return }
    const p = await getPostById(postId, currentUserId)
    if (!p) { setNotFound(true); setLoading(false); return }
    setPost(p)
    setBookmarked(p.bookmarked)
    const t = await getCommentTree(postId)
    setTree(t)
    setLoading(false)
  }

  useEffect(() => { load() }, [postId, currentUserId])

  const submitRoot = async () => {
    if (!currentUserId || !postId) { toast.error('Sign in to reply'); return }
    const body = draft.trim()
    if (!body) return
    setPosting(true)
    const res = await addThreadComment({ postId, userId: currentUserId, content: body, parentId: null })
    setPosting(false)
    if (!res.ok) { toast.error('Could not post reply: ' + (res.error || 'unknown')); return }
    setDraft('')
    await load()
  }

  const submitNested = async (parentId: string, content: string) => {
    if (!currentUserId || !postId) { toast.error('Sign in to reply'); return }
    const res = await addThreadComment({ postId, userId: currentUserId, content, parentId })
    if (!res.ok) { toast.error('Could not post reply: ' + (res.error || 'unknown')); return }
    await load()
  }

  const onBookmark = async () => {
    if (!currentUserId || !postId) { toast.error('Sign in to bookmark'); return }
    const r = await toggleBookmark(postId, currentUserId)
    if (r.error) { toast.error('Could not update bookmark'); return }
    setBookmarked(r.on)
    toast.success(r.on ? 'Bookmarked' : 'Removed bookmark')
  }

  const onReact = async () => {
    if (!currentUserId || !postId || !post) { toast.error('Sign in to like'); return }
    const r = await toggleReaction(postId, currentUserId, '❤️')
    if (r.error) { toast.error('Could not like'); return }
    setPost({
      ...post,
      reactions: post.reactions.map(rr =>
        rr.emoji === '❤️'
          ? { ...rr, count: rr.mine ? Math.max(0, rr.count - 1) : rr.count + 1, mine: !rr.mine }
          : rr
      ),
    })
  }

  const onShare = () => {
    if (!post) return
    const url = `${window.location.origin}/post/${post.id}`
    if (navigator.share) navigator.share({ title: post.profiles?.name || 'Post', url }).catch(() => {})
    else navigator.clipboard.writeText(url).then(() => toast.success('Link copied'))
  }

  const onLikeComment = (id: string) => {
    setTree(prev => toggleLikeInTree(prev, id))
  }

  const openProfile = async (userId: string) => {
    if (!userId) return
    setSelectedUserId(userId)
    setLoadingProfile(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id, name, email, created_at, bio, avatar_url, username').eq('id', userId).single()
      const { data: streak } = await supabase.from('streaks').select('current_streak, best_streak, last_checked_in').eq('user_id', userId).single()
      const { count: partnerCount } = await supabase.from('accountability_partners').select('*', { count: 'exact', head: true }).or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      const { count: postCount } = await supabase.from('community_posts').select('*', { count: 'exact', head: true }).eq('user_id', userId)
      setProfileData({ ...profile, streak: streak || { current_streak: 0, best_streak: 0 }, partnerCount: partnerCount || 0, postCount: postCount || 0 })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load profile')
    } finally {
      setLoadingProfile(false)
    }
  }
  const closeProfile = () => { setSelectedUserId(null); setProfileData(null) }

  if (loading) {
    return (
      <Layout>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ height: 44, borderRadius: 12, background: '#141414', marginBottom: 16 }} />
          <div style={{ height: 200, borderRadius: 16, background: '#141414' }} />
        </div>
      </Layout>
    )
  }

  if (notFound || !post) {
    return (
      <Layout>
        <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: '0 1.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: c.surface, border: `1px solid ${c.inputBorder}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Sparkles size={24} color={c.faint} />
          </div>
          <h2 style={{ color: c.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px', fontFamily: 'Space Grotesk' }}>
            Post not found
          </h2>
          <p style={{ color: c.dim, fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
            This post may have been deleted or the link is incorrect.
          </p>
          <button
            onClick={() => navigate('/community')}
            style={{ background: c.gold, color: '#0A0A0A', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            Back to community
          </button>
        </div>
      </Layout>
    )
  }

  const name = post.profiles?.name || 'Anonymous'
  const role = post.profiles?.role || ''
  const verified = post.profiles?.verified
  const avatarUrl = post.profiles?.avatar_url
  const liked = post.reactions.find(r => r.emoji === '❤️')?.mine || false
  const likeCount = post.reactions.find(r => r.emoji === '❤️')?.count ?? 0
  const isBoost = post.post_type === 'boost'
  const replyCount = countTree(tree)

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 140 }}>
        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 4px', marginBottom: 4,
          borderBottom: `1px solid ${c.divider}`,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{ width: 40, height: 40, borderRadius: 12, background: c.surface, border: `1px solid ${c.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3A3A3A' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.inputBorder }}
            aria-label="Back"
          >
            <ArrowLeft size={18} color={c.text} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: c.faint, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>Thread</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: c.text, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>Post</div>
          </div>
          <button
            onClick={onShare}
            style={{ width: 40, height: 40, borderRadius: 12, background: c.surface, border: `1px solid ${c.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3A3A3A' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.inputBorder }}
            aria-label="Share"
          >
            <Share2 size={16} color={c.text} />
          </button>
        </div>

        {/* Main post */}
        <article style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 18,
          padding: 20,
          marginTop: 14,
          marginBottom: 16,
          boxShadow: '0 12px 40px -20px rgba(0,0,0,0.6)',
        }}>
          {/* Metadata pill row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: c.goldSoft, borderRadius: 20, padding: '5px 10px',
            }}>
              {isBoost ? <Megaphone size={11} color={c.gold} /> : <Sparkles size={11} color={c.gold} />}
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.gold }}>
                {typeLabel(post)}
              </span>
            </div>
            <span style={{ fontSize: 11, color: c.faint, fontWeight: 500 }}>{relDate(post.created_at)}</span>
          </div>

          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <button
              onClick={() => openProfile(post.user_id)}
              style={{
                width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                background: avatarUrl ? 'transparent' : avatarBg(name),
                border: 'none', padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: '#0A0A0A', fontWeight: 700, fontSize: 15,
                fontFamily: 'Space Grotesk',
              }}
              aria-label={`View ${name}'s profile`}
            >
              {avatarUrl ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                {verified && <BadgeCheck size={15} color="#3B82F6" fill="#3B82F6" stroke={c.card} />}
              </div>
              {role && <div style={{ fontSize: 12, color: c.dim, marginTop: 2 }}>{role}</div>}
            </div>
            <button style={{ width: 34, height: 34, borderRadius: 10, background: c.surface, border: `1px solid ${c.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <MoreHorizontal size={16} color={c.dim} />
            </button>
          </div>

          {/* Content */}
          <div style={{ color: c.text, fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 20, letterSpacing: '-0.005em' }}>
            {post.content}
          </div>

          {/* Footer actions */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            paddingTop: 16, borderTop: `1px solid ${c.divider}`,
          }}>
            <button
              onClick={onReact}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: liked ? c.goldSoft : c.surface,
                border: `1px solid ${liked ? 'rgba(227,160,8,0.4)' : c.inputBorder}`,
                borderRadius: 20, padding: '7px 13px', cursor: 'pointer',
                color: liked ? c.gold : c.dim,
                transition: 'all 0.15s',
              }}
              aria-label="Like"
            >
              <Heart size={15} fill={liked ? c.gold : 'none'} />
              <span style={{ fontWeight: 700, fontSize: 12.5 }}>{likeCount}</span>
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.surface, border: `1px solid ${c.inputBorder}`, borderRadius: 20, padding: '7px 13px', color: c.dim, fontSize: 12.5, fontWeight: 700 }}>
              <MessageCircle size={15} /> {post.comment_count}
            </div>
            <button
              onClick={onShare}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: c.surface, border: `1px solid ${c.inputBorder}`,
                borderRadius: 20, padding: '7px 13px', cursor: 'pointer',
                color: c.dim, transition: 'all 0.15s',
              }}
              aria-label="Share"
            >
              <Send size={14} />
            </button>
            <button
              onClick={onBookmark}
              style={{
                marginLeft: 'auto', width: 36, height: 36, borderRadius: 10,
                background: bookmarked ? c.goldSoft : c.surface,
                border: `1px solid ${bookmarked ? 'rgba(227,160,8,0.4)' : c.inputBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              aria-label="Bookmark"
            >
              <Bookmark size={16} color={bookmarked ? c.gold : c.dim} fill={bookmarked ? c.gold : 'none'} />
            </button>
          </div>
        </article>

        {/* Composer */}
        <div style={{
          background: c.card,
          border: `1px solid ${c.inputBorder}`,
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          transition: 'border-color 0.15s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <CornerDownRight size={12} color={c.gold} />
            <span style={{ fontSize: 10, color: c.dim, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
              Write a reply
            </span>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add to the conversation…"
            rows={2}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              color: c.text, fontSize: 14.5, lineHeight: 1.55, resize: 'vertical',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              minHeight: 48,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: c.faint }}>{draft.length}/2000</span>
            <button
              onClick={submitRoot}
              disabled={!draft.trim() || posting}
              style={{
                background: c.gold, color: '#0A0A0A', border: 'none',
                borderRadius: 10, padding: '9px 18px', fontWeight: 700,
                fontSize: 13, cursor: draft.trim() ? 'pointer' : 'not-allowed',
                opacity: draft.trim() ? 1 : 0.35,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'opacity 0.15s',
              }}
            >
              <Send size={13} />
              {posting ? 'Posting…' : 'Reply'}
            </button>
          </div>
        </div>

        {/* Replies section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingLeft: 4 }}>
          <span style={{ fontSize: 11, color: c.dim, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
            Replies
          </span>
          <span style={{
            background: replyCount > 0 ? c.goldSoft : c.surface,
            color: replyCount > 0 ? c.gold : c.faint,
            fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '2px 8px',
            border: `1px solid ${replyCount > 0 ? 'rgba(227,160,8,0.3)' : c.inputBorder}`,
          }}>
            {replyCount}
          </span>
          <div style={{ flex: 1, height: 1, background: c.divider }} />
        </div>

        {tree.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem 1.5rem',
            border: `1px dashed ${c.inputBorder}`, borderRadius: 16,
            background: c.surface,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: c.card, border: `1px solid ${c.inputBorder}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              <MessageCircle size={20} color={c.faint} />
            </div>
            <div style={{ color: c.text, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              No replies yet
            </div>
            <div style={{ color: c.faint, fontSize: 12.5 }}>
              Be the first to share your thoughts
            </div>
          </div>
        ) : (
          <div style={{
            background: c.card, border: `1px solid ${c.inputBorder}`,
            borderRadius: 16, padding: '8px 16px 16px',
          }}>
            {tree.map((comment, i) => (
              <div key={comment.id} style={{
                paddingTop: i === 0 ? 8 : 0,
                borderTop: i === 0 ? 'none' : `1px solid ${c.divider}`,
                marginTop: i === 0 ? 0 : 4,
                paddingBottom: 4,
              }}>
                <ThreadedComment
                  comment={comment}
                  depth={0}
                  currentUserId={currentUserId}
                  onReply={submitNested}
                  onLike={onLikeComment}
                  onViewProfile={openProfile}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <ProfileModal
        open={!!selectedUserId}
        profileData={profileData}
        loading={loadingProfile}
        isOwnProfile={selectedUserId === currentUserId}
        onClose={closeProfile}
      />
    </Layout>
  )
}

function countTree(nodes: ThreadComment[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countTree(n.children), 0)
}
function toggleLikeInTree(nodes: ThreadComment[], id: string): ThreadComment[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, likes_count: (n.likes_count || 0) + 1 }
    if (n.children.length) return { ...n, children: toggleLikeInTree(n.children, id) }
    return n
  })
}
