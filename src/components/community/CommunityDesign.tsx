import { useState, useMemo, useRef } from 'react'
import {
  Send, Trash2, Link2, MessageCircle, Heart, ExternalLink, Plus, X,
  Sparkles, Megaphone, Zap, Rows3, Columns3, List, LayoutGrid,
} from 'lucide-react'

export type CommunityPost = {
  id: string
  content: string
  link: string | null
  user_id: string
  created_at: string
  post_type: 'say_hi' | 'boost'
  platform: string | null
  engagement_type: 'comment' | 'like' | 'share' | 'watch' | null
  engaged_by: string[]
  profiles?: { name: string; email?: string; streak_days?: number; avatar_url?: string | null } | null
  comments: {
    id: string
    content: string
    user_id: string
    created_at: string
    profiles?: { name: string; avatar_url?: string | null } | null
  }[]
  likes: { user_id: string }[]
  boosts: { user_id: string }[]
  engagements: { user_id: string }[]
}

type Layout = 'a' | 'b' | 'c' | 'd'

interface Props {
  posts: CommunityPost[]
  currentUserId: string | null
  likedPostIds: Set<string>
  boostedPostIds: Set<string>
  engagedPostIds: Set<string>
  loading: boolean
  isPosting: boolean
  isReplying: boolean
  filter: 'all' | 'say_hi' | 'boost' | 'mine'
  platformFilter: string
  sortBy: 'newest' | 'needs_engagement'
  onFilterChange: (filter: 'all' | 'say_hi' | 'boost' | 'mine') => void
  onPlatformFilterChange: (platform: string) => void
  onSortChange: (sort: 'newest' | 'needs_engagement') => void
  onCreatePost: (
    content: string, link: string | null, postType: 'say_hi' | 'boost',
    platform: string | null, engagementType: string | null
  ) => void
  onDeletePost: (postId: string) => void
  onToggleLike: (postId: string) => void
  onToggleBoost: (postId: string) => void
  onToggleEngagement: (postId: string) => void
  onReply: (postId: string, content: string) => void
  onDeleteReply: (postId: string, commentId: string) => void
  onViewProfile: (userId: string) => void
}

const PLATFORMS = ['X', 'TikTok', 'YouTube', 'Instagram', 'LinkedIn', 'Substack']
const ENGAGEMENTS = ['comment', 'like', 'share', 'watch'] as const
const MAX = 2000

const AVATAR_COLORS = ['#E3A008', '#6FA8F5', '#F56F91', '#6FCB73', '#B98CF5']

function initials(name?: string | null) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/).filter(Boolean)
  if (!p.length) return '?'
  if (p.length === 1) return p[0][0]?.toUpperCase() || '?'
  return (p[0][0] + p[1][0]).toUpperCase()
}
function avatarColor(name?: string | null) {
  const key = name || '?'
  let h = 0
  for (let i = 0; i < key.length; i++) h = key.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 60_000) return 'now'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h'
  if (diff < 604_800_000) return Math.floor(diff / 86_400_000) + 'd'
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
function hostOf(link: string) {
  try { return new URL(link).hostname.replace(/^www\./, '') } catch { return link }
}

export default function CommunityDesign({
  posts, currentUserId, likedPostIds, boostedPostIds, engagedPostIds,
  loading, isPosting, isReplying, filter, platformFilter, sortBy,
  onFilterChange, onPlatformFilterChange, onSortChange,
  onCreatePost, onDeletePost, onToggleLike, onToggleBoost, onToggleEngagement,
  onReply, onDeleteReply, onViewProfile,
}: Props) {
  const [layout, setLayout] = useState<Layout>('a')
  const [mode, setMode] = useState<'say_hi' | 'boost'>('say_hi')
  const [content, setContent] = useState('')
  const [link, setLink] = useState('')
  const [platform, setPlatform] = useState('')
  const [engagementType, setEngagementType] = useState('')
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({})
  const [showAllReplies, setShowAllReplies] = useState<Record<string, boolean>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const stats = useMemo(() => ({
    posts: posts.length,
    creators: new Set(posts.map(p => p.user_id)).size,
    replies: posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0),
  }), [posts])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    if (mode === 'boost' && !link.trim()) return
    await onCreatePost(
      content.trim(),
      link.trim() || null,
      mode,
      mode === 'boost' ? platform || null : null,
      mode === 'boost' ? engagementType || null : null
    )
    setContent(''); setLink(''); setPlatform(''); setEngagementType('')
  }

  const postReply = async (postId: string) => {
    const draft = replyDraft[postId]?.trim()
    if (!draft || isReplying) return
    await onReply(postId, draft)
    setReplyDraft(prev => ({ ...prev, [postId]: '' }))
  }

  const visible = useMemo(() => {
    let r = posts
    if (filter === 'say_hi') r = r.filter(p => p.post_type === 'say_hi')
    if (filter === 'boost') r = r.filter(p => p.post_type === 'boost')
    if (filter === 'mine') r = r.filter(p => p.user_id === currentUserId)
    if (platformFilter) r = r.filter(p => p.platform === platformFilter)
    if (sortBy === 'needs_engagement') {
      return [...r].sort((a, b) => (a.engagements?.length || 0) - (b.engagements?.length || 0))
    }
    return [...r].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [posts, filter, platformFilter, sortBy, currentUserId])

  if (loading) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--cm-text-3)', fontSize: '0.85rem' }}>
        Loading community…
      </div>
    )
  }

  const counterClass = content.length > MAX * 0.95 ? 'danger' : content.length > MAX * 0.85 ? 'warn' : ''

  return (
    <div style={{ maxWidth: '100%', paddingBottom: '110px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Slim header */}
      <header className="cm-header">
        <h1 className="cm-header-title">Community</h1>
        <div className="cm-header-stats">
          <span><strong>{stats.posts}</strong> posts</span>
          <span><strong>{stats.creators}</strong> creators</span>
          <span><strong>{stats.replies}</strong> replies</span>
        </div>
      </header>

      {/* Layout switcher */}
      <div className="cm-layout" role="tablist" aria-label="Post layout">
        <button role="tab" aria-selected={layout === 'a'} onClick={() => setLayout('a')} className={layout === 'a' ? 'is-on' : ''}>
          <List size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Editorial
        </button>
        <button role="tab" aria-selected={layout === 'b'} onClick={() => setLayout('b')} className={layout === 'b' ? 'is-on' : ''}>
          <Columns3 size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Split
        </button>
        <button role="tab" aria-selected={layout === 'c'} onClick={() => setLayout('c')} className={layout === 'c' ? 'is-on' : ''}>
          <Rows3 size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Compact
        </button>
        <button role="tab" aria-selected={layout === 'd'} onClick={() => setLayout('d')} className={layout === 'd' ? 'is-on' : ''}>
          <LayoutGrid size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Notes
        </button>
      </div>

      {/* Composer */}
      <form onSubmit={submit} className="cm-compose">
        <div className="cm-compose-modes">
          <button type="button" onClick={() => setMode('say_hi')} className={`cm-mode${mode === 'say_hi' ? ' is-on' : ''}`}>
            <Sparkles size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Say hi
          </button>
          <button type="button" onClick={() => setMode('boost')} className={`cm-mode${mode === 'boost' ? ' is-on' : ''}`}>
            <Megaphone size={12} style={{ marginRight: 4, verticalAlign: -1 }} /> Boost
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="cm-textarea"
          rows={mode === 'boost' ? 4 : 2}
          maxLength={MAX}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={mode === 'boost'
            ? 'What did you post, and what engagement helps most?'
            : 'Say hi — who you are, what you build, what your niche is'}
        />

        {mode === 'boost' && (
          <>
            <div className="cm-inline-row">
              {ENGAGEMENTS.map(a => (
                <button
                  key={a}
                  type="button"
                  className={`cm-chip-sm${engagementType === a ? ' is-on' : ''}`}
                  onClick={() => setEngagementType(engagementType === a ? '' : a)}
                >{a}</button>
              ))}
            </div>
            <div className="cm-inline-row">
              <Link2 size={14} color="var(--cm-text-3)" style={{ alignSelf: 'center' }} />
              <input
                className="cm-input-line"
                placeholder="Paste post link"
                value={link}
                onChange={e => setLink(e.target.value)}
              />
            </div>
            <div className="cm-inline-row">
              <select
                className="cm-input-line"
                value={platform}
                onChange={e => setPlatform(e.target.value)}
              >
                <option value="">Platform (optional)</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </>
        )}

        <div className="cm-compose-footer">
          <span className={`cm-counter ${counterClass}`}>{content.length}/{MAX}</span>
          <button type="submit" className="cm-submit" disabled={!content.trim() || isPosting || (mode === 'boost' && !link.trim())}>
            <Send size={13} />
            {isPosting ? 'Posting…' : mode === 'boost' ? 'Post boost' : 'Say hi'}
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="cm-filters">
        {(['all', 'say_hi', 'boost', 'mine'] as const).map(k => (
          <button
            key={k}
            onClick={() => onFilterChange(k)}
            className={`cm-filter-pill${filter === k ? ' is-on' : ''}`}
          >
            {k === 'all' ? 'All' : k === 'say_hi' ? 'Say hi' : k === 'boost' ? 'Boosts' : 'Mine'}
          </button>
        ))}
        <select
          className="cm-filter-pill"
          value={platformFilter}
          onChange={e => onPlatformFilterChange(e.target.value)}
          style={{ paddingRight: '1.5rem' }}
        >
          <option value="">All platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          className="cm-filter-pill"
          value={sortBy}
          onChange={e => onSortChange(e.target.value as 'newest' | 'needs_engagement')}
          style={{ paddingRight: '1.5rem' }}
        >
          <option value="newest">Newest</option>
          <option value="needs_engagement">Needs engagement</option>
        </select>
      </div>

      {/* Feed */}
      {visible.length === 0 ? (
        <div className="cm-empty">
          <Sparkles size={20} color="var(--cm-text-3)" />
          <p className="cm-empty-title">Nothing here yet</p>
          <p className="cm-empty-text">Be the first to post — the board rewards whoever starts.</p>
        </div>
      ) : (
        <PostList
          layout={layout}
          posts={visible}
          currentUserId={currentUserId}
          likedPostIds={likedPostIds}
          boostedPostIds={boostedPostIds}
          engagedPostIds={engagedPostIds}
          replyOpen={replyOpen}
          replyDraft={replyDraft}
          showAllReplies={showAllReplies}
          isReplying={isReplying}
          onToggleReply={(id) => setReplyOpen(p => ({ ...p, [id]: !p[id] }))}
          onDraftChange={(id, v) => setReplyDraft(p => ({ ...p, [id]: v }))}
          onSubmitReply={postReply}
          onToggleShowAll={(id) => setShowAllReplies(p => ({ ...p, [id]: !p[id] }))}
          onToggleLike={onToggleLike}
          onToggleBoost={onToggleBoost}
          onToggleEngagement={onToggleEngagement}
          onDeletePost={onDeletePost}
          onDeleteReply={onDeleteReply}
          onViewProfile={onViewProfile}
        />
      )}

      <button
        className="cm-fab"
        aria-label="New post"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setTimeout(() => textareaRef.current?.focus(), 300)
        }}
      >
        <Plus size={20} />
      </button>
    </div>
  )
}

type ListProps = {
  layout: Layout
  posts: CommunityPost[]
  currentUserId: string | null
  likedPostIds: Set<string>
  boostedPostIds: Set<string>
  engagedPostIds: Set<string>
  replyOpen: Record<string, boolean>
  replyDraft: Record<string, string>
  showAllReplies: Record<string, boolean>
  isReplying: boolean
  onToggleReply: (id: string) => void
  onDraftChange: (id: string, v: string) => void
  onSubmitReply: (id: string) => void
  onToggleShowAll: (id: string) => void
  onToggleLike: (id: string) => void
  onToggleBoost: (id: string) => void
  onToggleEngagement: (id: string) => void
  onDeletePost: (id: string) => void
  onDeleteReply: (id: string, commentId: string) => void
  onViewProfile: (userId: string) => void
}

function PostList(p: ListProps) {
  const cls = p.layout === 'a' ? 'cm-a-list' : p.layout === 'b' ? 'cm-b-list' : p.layout === 'c' ? 'cm-c-list' : 'cm-d-grid'
  return (
    <div className={cls}>
      {p.posts.map(post => <PostItem key={post.id} {...p} post={post} />)}
    </div>
  )
}

function PostItem(p: ListProps & { post: CommunityPost }) {
  const { post, layout, currentUserId } = p
  const liked = p.likedPostIds.has(post.id)
  const boosted = p.boostedPostIds.has(post.id)
  const engaged = p.engagedPostIds.has(post.id)
  const isOwner = post.user_id === currentUserId
  const isBoost = post.post_type === 'boost'
  const name = post.profiles?.name || 'Anonymous'
  const avatarUrl = post.profiles?.avatar_url
  const open = p.replyOpen[post.id] || false
  const replies = p.showAllReplies[post.id] ? post.comments : post.comments.slice(0, 2)

  const Avatar = (size: 'sm' | 'lg') => (
    <button
      onClick={() => p.onViewProfile(post.user_id)}
      className={size === 'sm' ? 'cm-avatar-sm' : 'cm-avatar-lg'}
      style={avatarUrl ? undefined : { background: avatarColor(name) }}
      aria-label={`View ${name}'s profile`}
    >
      {avatarUrl ? <img src={avatarUrl} alt={name} /> : initials(name)}
    </button>
  )

  const LinkCard = post.link && (
    <a href={post.link} target="_blank" rel="noopener noreferrer" className="cm-link">
      <div style={{ minWidth: 0 }}>
        <div className="cm-link-host">{post.platform || hostOf(post.link)}</div>
        <div className="cm-link-url">{post.link}</div>
      </div>
      <span className="cm-link-cta">Open <ExternalLink size={11} /></span>
    </a>
  )

  const Thread = open && (
    <div className="cm-thread">
      {replies.map(cm => {
        const cName = cm.user_id === currentUserId ? 'You' : cm.profiles?.name || 'Anonymous'
        const cAvatar = cm.profiles?.avatar_url
        return (
          <div key={cm.id} className="cm-reply">
            <button
              onClick={() => p.onViewProfile(cm.user_id)}
              className="cm-avatar-sm"
              style={{ width: 24, height: 24, fontSize: '0.6rem', ...(cAvatar ? {} : { background: avatarColor(cName) }) }}
              aria-label={`View ${cName}'s profile`}
            >
              {cAvatar ? <img src={cAvatar} alt={cName} /> : initials(cName)}
            </button>
            <div className="cm-reply-body">
              <div className="cm-reply-meta">
                <button className="cm-reply-name" onClick={() => p.onViewProfile(cm.user_id)}>{cName}</button>
                <span className="cm-reply-time">{timeAgo(cm.created_at)}</span>
              </div>
              <p className="cm-reply-text">{cm.content}</p>
            </div>
            {cm.user_id === currentUserId && (
              <button className="cm-del-btn" onClick={() => p.onDeleteReply(post.id, cm.id)} aria-label="Delete reply">
                <X size={11} />
              </button>
            )}
          </div>
        )
      })}
      {post.comments.length > 2 && (
        <button className="cm-ghost-btn" onClick={() => p.onToggleShowAll(post.id)} style={{ alignSelf: 'flex-start' }}>
          {p.showAllReplies[post.id] ? 'Show less' : `Show ${post.comments.length - 2} more`}
        </button>
      )}
      <div className="cm-reply-input-row">
        <input
          className="cm-reply-input"
          value={p.replyDraft[post.id] || ''}
          onChange={e => p.onDraftChange(post.id, e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); p.onSubmitReply(post.id) } }}
          placeholder="Reply…"
        />
        <button
          className="cm-submit"
          style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem' }}
          disabled={!p.replyDraft[post.id]?.trim() || p.isReplying}
          onClick={() => p.onSubmitReply(post.id)}
        >
          <Send size={11} />
        </button>
      </div>
    </div>
  )

  // ===== A: Editorial =====
  if (layout === 'a') {
    return (
      <article className="cm-a-post">
        <div className="cm-a-meta">
          <strong>{name}</strong>
          {isOwner && <span>· you</span>}
          {isBoost && <span style={{ color: 'var(--cm-accent)' }}>· boost</span>}
          <span>· {timeAgo(post.created_at)}</span>
          {isOwner && (
            <button className="cm-del-btn" style={{ marginLeft: 'auto' }} onClick={() => p.onDeletePost(post.id)} aria-label="Delete">
              <Trash2 size={12} />
            </button>
          )}
        </div>
        <p className="cm-a-content">{post.content}</p>
        {LinkCard}
        <div className="cm-a-actions">
          <button className={`cm-a-action${liked ? ' is-on' : ''}`} onClick={() => p.onToggleLike(post.id)}>
            <Heart size={13} fill={liked ? 'currentColor' : 'none'} /> {post.likes?.length || 0}
          </button>
          <button className={`cm-a-action${open ? ' is-on' : ''}`} onClick={() => p.onToggleReply(post.id)}>
            <MessageCircle size={13} /> {post.comments?.length || 0}
          </button>
          {isBoost && (
            <>
              <button className={`cm-a-action${boosted ? ' is-on' : ''}`} onClick={() => p.onToggleBoost(post.id)}>
                <Zap size={13} fill={boosted ? 'currentColor' : 'none'} /> {post.boosts?.length || 0}
              </button>
              <button className={`cm-a-action${engaged ? ' is-on' : ''}`} onClick={() => p.onToggleEngagement(post.id)}>
                {engaged ? '✓ engaged' : 'i engaged'}
              </button>
            </>
          )}
        </div>
        {Thread}
      </article>
    )
  }

  // ===== B: Split rail =====
  if (layout === 'b') {
    return (
      <article className="cm-b-post">
        <div className="cm-b-rail">
          {Avatar('lg')}
          <button className="cm-b-rail-name" onClick={() => p.onViewProfile(post.user_id)}>{name}</button>
          <span className="cm-b-rail-time">{timeAgo(post.created_at)}</span>
          {isOwner && (
            <button className="cm-del-btn" onClick={() => p.onDeletePost(post.id)} aria-label="Delete">
              <Trash2 size={11} />
            </button>
          )}
        </div>
        <div>
          {isBoost && (
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--cm-accent)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Boost
            </div>
          )}
          <p className="cm-b-content">{post.content}</p>
          {LinkCard}
          <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center' }}>
            <button className={`cm-a-action${liked ? ' is-on' : ''}`} onClick={() => p.onToggleLike(post.id)}>
              <Heart size={13} fill={liked ? 'currentColor' : 'none'} /> {post.likes?.length || 0}
            </button>
            <button className={`cm-a-action${open ? ' is-on' : ''}`} onClick={() => p.onToggleReply(post.id)}>
              <MessageCircle size={13} /> {post.comments?.length || 0}
            </button>
            {isBoost && (
              <>
                <button className={`cm-a-action${boosted ? ' is-on' : ''}`} onClick={() => p.onToggleBoost(post.id)}>
                  <Zap size={13} fill={boosted ? 'currentColor' : 'none'} /> {post.boosts?.length || 0}
                </button>
                <button className={`cm-a-action${engaged ? ' is-on' : ''}`} onClick={() => p.onToggleEngagement(post.id)}>
                  {engaged ? '✓' : 'engage'}
                </button>
              </>
            )}
          </div>
          {Thread}
        </div>
      </article>
    )
  }

  // ===== C: Compact row =====
  if (layout === 'c') {
    return (
      <article className="cm-c-post">
        {Avatar('sm')}
        <div className="cm-c-body">
          <div className="cm-c-line">
            <strong style={{ cursor: 'pointer' }} onClick={() => p.onViewProfile(post.user_id)}>{name}</strong>
            {isOwner && <span>you</span>}
            {isBoost && <span style={{ color: 'var(--cm-accent)' }}>boost</span>}
            <span>{timeAgo(post.created_at)}</span>
            {isOwner && (
              <button className="cm-del-btn" style={{ marginLeft: 'auto' }} onClick={() => p.onDeletePost(post.id)} aria-label="Delete">
                <Trash2 size={11} />
              </button>
            )}
          </div>
          <p className="cm-c-text">{post.content}</p>
          {LinkCard}
          <div className="cm-c-actions">
            <button className={liked ? 'is-on' : ''} onClick={() => p.onToggleLike(post.id)}>
              <Heart size={12} fill={liked ? 'currentColor' : 'none'} /> {post.likes?.length || 0}
            </button>
            <button className={open ? 'is-on' : ''} onClick={() => p.onToggleReply(post.id)}>
              <MessageCircle size={12} /> {post.comments?.length || 0}
            </button>
            {isBoost && (
              <>
                <button className={boosted ? 'is-on' : ''} onClick={() => p.onToggleBoost(post.id)}>
                  <Zap size={12} fill={boosted ? 'currentColor' : 'none'} /> {post.boosts?.length || 0}
                </button>
                <button className={engaged ? 'is-on' : ''} onClick={() => p.onToggleEngagement(post.id)}>
                  {engaged ? '✓' : 'engage'}
                </button>
              </>
            )}
          </div>
          {Thread}
        </div>
      </article>
    )
  }

  // ===== D: Note card =====
  return (
    <article className="cm-d-card">
      <div className="cm-d-meta">
        <button
          onClick={() => p.onViewProfile(post.user_id)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--cm-text-2)', fontWeight: 600, fontSize: '0.7rem' }}
        >
          <strong>{name}</strong>
        </button>
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          {isOwner && <span>you</span>}
          {isBoost && <span style={{ color: 'var(--cm-accent)' }}>boost</span>}
          <span>· {timeAgo(post.created_at)}</span>
          {isOwner && (
            <button className="cm-del-btn" onClick={() => p.onDeletePost(post.id)} aria-label="Delete">
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
      <p className="cm-d-content">{post.content}</p>
      {LinkCard}
      <div className="cm-d-actions">
        <button className={liked ? 'is-on' : ''} onClick={() => p.onToggleLike(post.id)}>
          <Heart size={12} fill={liked ? 'currentColor' : 'none'} /> {post.likes?.length || 0}
        </button>
        <button className={open ? 'is-on' : ''} onClick={() => p.onToggleReply(post.id)}>
          <MessageCircle size={12} /> {post.comments?.length || 0}
        </button>
        {isBoost && (
          <button className={boosted ? 'is-on' : ''} onClick={() => p.onToggleBoost(post.id)}>
            <Zap size={12} fill={boosted ? 'currentColor' : 'none'} /> {post.boosts?.length || 0}
          </button>
        )}
      </div>
      {Thread}
    </article>
  )
}
