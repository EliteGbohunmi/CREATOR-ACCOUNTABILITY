import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Pin, BadgeCheck, Smile, MessageCircle, Repeat2, Send, Bookmark, MoreHorizontal, Loader } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../lib/AuthContext'
import {
  getPostById, getCommentTree, addThreadComment, toggleBookmark, toggleReaction,
  type FullPost, type ThreadComment,
} from '../lib/communityThreads'
import ThreadedComment from '../components/community/ThreadedComment'

const c = {
  bg: '#0A0A0A',
  card: '#141414',
  border: '#4A3B18',
  divider: '#2E2E2E',
  line: '#2A2A2A',
  text: '#F5F5F5',
  dim: '#A1A1AA',
  faint: '#71717A',
  gold: '#E3A008',
  goldSoft: '#2E2610',
  green: '#4ADE80',
  coral: '#F87171',
  input: '#141414',
  inputBorder: '#262626',
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

  const load = async () => {
    if (!postId) return
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
    if (!res.ok) { toast.error('Could not post reply'); return }
    setDraft('')
    await load()
  }

  const submitNested = async (parentId: string, content: string) => {
    if (!currentUserId || !postId) { toast.error('Sign in to reply'); return }
    const res = await addThreadComment({ postId, userId: currentUserId, content, parentId })
    if (!res.ok) { toast.error('Could not post reply'); return }
    await load()
  }

  const onBookmark = async () => {
    if (!currentUserId || !postId) { toast.error('Sign in to bookmark'); return }
    const r = await toggleBookmark(postId, currentUserId)
    if (r.error) { toast.error('Could not update bookmark'); return }
    setBookmarked(r.on)
  }

  const onReact = async (emoji: '❤️' | '🔥' | '👏') => {
    if (!currentUserId || !postId || !post) { toast.error('Sign in to react'); return }
    const r = await toggleReaction(postId, currentUserId, emoji)
    if (r.error) { toast.error('Could not react'); return }
    setPost({
      ...post,
      reactions: post.reactions.map(rr =>
        rr.emoji === emoji
          ? { ...rr, count: rr.mine ? Math.max(0, rr.count - 1) : rr.count + 1, mine: !rr.mine }
          : rr
      ),
    })
  }

  const onLikeComment = (id: string) => {
    setTree(prev => toggleLikeInTree(prev, id))
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader size={26} color={c.faint} className="animate-spin" />
        </div>
      </Layout>
    )
  }

  if (notFound || !post) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <p style={{ color: c.dim, fontSize: 15 }}>This post doesn't exist or was removed.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 16, background: 'transparent', border: `1px solid ${c.inputBorder}`, color: c.dim, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
            Go back
          </button>
        </div>
      </Layout>
    )
  }

  const name = post.profiles?.name || 'Anonymous'
  const role = post.profiles?.role || ''
  const verified = post.profiles?.verified
  const avatarUrl = post.profiles?.avatar_url
  const totalReactions = post.reactions.reduce((a, r) => a + r.count, 0)
  const stacked = post.reactions.filter(r => r.count > 0).map(r => r.emoji)

  return (
    <Layout>
      <div style={{ maxWidth: 700, margin: '0 auto', paddingBottom: 140 }}>
        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 4px', marginBottom: 12,
          borderBottom: `1px solid ${c.divider}`,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${c.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            aria-label="Back"
          >
            <ArrowLeft size={18} color={c.text} />
          </button>
          <div>
            <div style={{ fontSize: 11, color: c.faint, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Thread</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>Post</div>
          </div>
        </div>

        {/* Full post card */}
        <article style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Pin size={12} color={c.faint} fill={c.faint} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.dim }}>
                {post.post_type === 'boost' ? 'Boost' : 'Value'}
              </span>
            </div>
            <span style={{ fontSize: 11, color: c.faint }}>{relDate(post.created_at)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: avatarUrl ? 'transparent' : avatarBg(name), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0A0A0A', fontWeight: 700, fontSize: 14, fontFamily: 'Space Grotesk' }}>
              {avatarUrl ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{name}</span>
                {verified && <BadgeCheck size={14} color="#3B82F6" fill="#3B82F6" stroke={c.card} />}
              </div>
              {role && <div style={{ fontSize: 12, color: c.dim, marginTop: 1 }}>{role}</div>}
            </div>
            <button style={{ width: 32, height: 32, borderRadius: '50%', background: '#262626', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <MoreHorizontal size={16} color={c.dim} />
            </button>
          </div>

          <div style={{ color: c.text, fontSize: 15, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 14 }}>
            {post.content}
          </div>

          <div style={{ borderTop: `1px dashed ${c.divider}`, margin: '4px 0 12px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: c.goldSoft, borderRadius: 999, padding: '5px 10px 5px 8px' }}>
                <Smile size={14} color={c.gold} />
                <span style={{ fontWeight: 700, fontSize: 12, color: c.gold }}>{totalReactions}</span>
              </div>
              {stacked.length > 0 && (
                <div style={{ display: 'flex' }}>
                  {stacked.map((e, i) => (
                    <span key={e} style={{ width: 20, height: 20, borderRadius: '50%', background: c.card, border: `1.5px solid ${c.card}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginLeft: i === 0 ? 0 : -6 }}>{e}</span>
                  ))}
                </div>
              )}
            </div>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: c.dim, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              <MessageCircle size={16} /> {post.comment_count}
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', color: c.green, cursor: 'pointer', padding: 0 }} aria-label="Repost">
              <Repeat2 size={16} />
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', color: c.coral, cursor: 'pointer', padding: 0 }} aria-label="Share">
              <Send size={16} />
            </button>
            <button onClick={onBookmark} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }} aria-label="Bookmark">
              <Bookmark size={18} color={bookmarked ? c.gold : c.dim} fill={bookmarked ? c.gold : 'none'} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {(['❤️', '🔥', '👏'] as const).map(emoji => {
              const r = post.reactions.find(x => x.emoji === emoji)
              return (
                <button
                  key={emoji}
                  onClick={() => onReact(emoji)}
                  style={{
                    background: r?.mine ? c.goldSoft : 'transparent',
                    border: `1px solid ${r?.mine ? c.gold : c.inputBorder}`,
                    borderRadius: 999, padding: '6px 12px',
                    fontSize: 13, color: c.text, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <span>{emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: 12, color: r?.mine ? c.gold : c.dim }}>{r?.count || 0}</span>
                </button>
              )
            })}
          </div>
        </article>

        {/* Root composer */}
        <div style={{ background: c.card, border: `1px solid ${c.inputBorder}`, borderRadius: 14, padding: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: c.faint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
            Write a reply
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add to the conversation…"
            rows={2}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              color: c.text, fontSize: 14, lineHeight: 1.5, resize: 'vertical',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              onClick={submitRoot}
              disabled={!draft.trim() || posting}
              style={{
                background: c.gold, color: '#0A0A0A', border: 'none',
                borderRadius: 10, padding: '8px 16px', fontWeight: 700,
                fontSize: 13, cursor: draft.trim() ? 'pointer' : 'not-allowed',
                opacity: draft.trim() ? 1 : 0.4,
              }}
            >
              {posting ? 'Posting…' : 'Reply'}
            </button>
          </div>
        </div>

        {/* Comment tree */}
        <div>
          <div style={{ fontSize: 11, color: c.faint, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
            {tree.length === 0 ? 'No replies yet' : `${countTree(tree)} ${countTree(tree) === 1 ? 'reply' : 'replies'}`}
          </div>
          {tree.map(comment => (
            <ThreadedComment
              key={comment.id}
              comment={comment}
              depth={0}
              currentUserId={currentUserId}
              onReply={submitNested}
              onLike={onLikeComment}
            />
          ))}
        </div>
      </div>
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
