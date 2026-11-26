import { useState, useMemo, useRef } from 'react'
import {
  Send, Trash2, Link2, MessageCircle, Heart, ExternalLink, Plus, X,
  Sparkles, Megaphone, Users, Zap, Filter, TrendingUp, ChevronDown,
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
    content: string,
    link: string | null,
    postType: 'say_hi' | 'boost',
    platform: string | null,
    engagementType: string | null
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
const ENGAGEMENT_TYPES = ['comment', 'like', 'share', 'watch'] as const
const MAX_LENGTH = 2000

function getInitials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatTime(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago'
  if (diff < 604_800_000) return Math.floor(diff / 86_400_000) + 'd ago'
  return new Date(date).toLocaleDateString()
}

function hostOf(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return link
  }
}

export default function CommunityDesign({
  posts, currentUserId, likedPostIds, boostedPostIds, engagedPostIds,
  loading, isPosting, isReplying, filter, platformFilter, sortBy,
  onFilterChange, onPlatformFilterChange, onSortChange,
  onCreatePost, onDeletePost, onToggleLike, onToggleBoost, onToggleEngagement,
  onReply, onDeleteReply, onViewProfile,
}: Props) {
  const [mode, setMode] = useState<'say_hi' | 'boost'>('say_hi')
  const [content, setContent] = useState('')
  const [link, setLink] = useState('')
  const [platform, setPlatform] = useState('')
  const [engagementType, setEngagementType] = useState('')
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({})
  const [showAllReplies, setShowAllReplies] = useState<Record<string, boolean>>({})
  const [showFilters, setShowFilters] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const stats = useMemo(() => ({
    posts: posts.length,
    creators: new Set(posts.map(p => p.user_id)).size,
    boosts: posts.reduce((acc, p) => acc + (p.boosts?.length || 0), 0),
    replies: posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0),
  }), [posts])

  const handleSubmit = async (e: React.FormEvent) => {
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
    setContent('')
    setLink('')
    setPlatform('')
    setEngagementType('')
  }

  const submitReply = async (postId: string) => {
    const draft = replyDraft[postId]?.trim()
    if (!draft || isReplying) return
    await onReply(postId, draft)
    setReplyDraft(prev => ({ ...prev, [postId]: '' }))
  }

  const visiblePosts = useMemo(() => {
    let result = posts
    if (filter === 'say_hi') result = result.filter(p => p.post_type === 'say_hi')
    if (filter === 'boost') result = result.filter(p => p.post_type === 'boost')
    if (filter === 'mine') result = result.filter(p => p.user_id === currentUserId)
    if (platformFilter) result = result.filter(p => p.platform === platformFilter)
    return result
  }, [posts, filter, platformFilter, currentUserId])

  const sortedPosts = useMemo(() => {
    if (sortBy === 'needs_engagement') {
      return [...visiblePosts].sort((a, b) => (a.engagements?.length || 0) - (b.engagements?.length || 0))
    }
    return [...visiblePosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [visiblePosts, sortBy])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem', color: 'var(--cm-muted)' }}>
        <div style={{ width: 28, height: 28, border: '2px solid var(--cm-line)', borderTop: '2px solid var(--cm-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span>Loading community board…</span>
      </div>
    )
  }

  const activeFilterCount = (platformFilter ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0) + (filter !== 'all' ? 1 : 0)

  return (
    <div style={{ maxWidth: '100%', padding: '4px 1px 110px', color: 'var(--cm-text)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Hero */}
      <header className="cm-hero">
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cm-accent)', marginBottom: '0.7rem', fontWeight: 700 }}>
            <Users size={13} color="var(--cm-accent)" />
            <span>Creator community</span>
          </div>
          <h1 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: 'clamp(1.55rem, 6vw, 2.15rem)', lineHeight: 1.12, letterSpacing: '-0.02em', fontWeight: 700, color: 'var(--cm-text)' }}>
            Say hi. Ask for engagement.<br />Show up for each other.
          </h1>
          <p style={{ margin: '0.7rem 0 0', color: 'var(--cm-muted)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '540px' }}>
            Introduce yourself, drop the post you just shipped, and tell creators exactly how to support it.
          </p>
          <div className="cm-stat-row">
            <Stat label="Posts" value={stats.posts} />
            <Stat label="Creators" value={stats.creators} />
            <Stat label="Boosts" value={stats.boosts} />
            <Stat label="Replies" value={stats.replies} />
          </div>
        </div>
      </header>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="cm-card cm-composer">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem' }}>
          <button type="button" onClick={() => setMode('say_hi')} className={`cm-mode${mode === 'say_hi' ? ' is-on' : ''}`}>
            <Sparkles size={14} /> Say hi
          </button>
          <button type="button" onClick={() => setMode('boost')} className={`cm-mode${mode === 'boost' ? ' is-on' : ''}`}>
            <Megaphone size={14} /> Boost my post
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="cm-input"
          rows={mode === 'boost' ? 4 : 3}
          maxLength={MAX_LENGTH}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            mode === 'boost'
              ? 'What did you just post, and what kind of engagement helps most?'
              : "Say hi — who are you, what are you building, what's your niche?"
          }
        />

        {mode === 'boost' && (
          <>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.7rem' }}>
              {ENGAGEMENT_TYPES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setEngagementType(a === engagementType ? '' : a)}
                  className={`cm-chip${engagementType === a ? ' is-on' : ''}`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="cm-linkwrap">
              <Link2 size={15} color="var(--cm-accent)" />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Paste the link to your post"
              />
            </div>
            <div className="cm-linkwrap">
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="cm-select">
                <option value="">Platform (optional)</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.9rem' }}>
          <span style={{ fontSize: '0.72rem', color: content.length > MAX_LENGTH * 0.9 ? 'var(--cm-danger)' : 'var(--cm-muted)', fontWeight: 600 }}>
            {content.length}/{MAX_LENGTH}
          </span>
          <button type="submit" className="cm-send" disabled={!content.trim() || isPosting || (mode === 'boost' && !link.trim())}>
            <Send size={15} />
            {isPosting ? 'Posting…' : mode === 'boost' ? 'Post boost' : 'Say hi'}
          </button>
        </div>
      </form>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        {(['all', 'boost', 'mine'] as const).map((key) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`cm-filter${filter === key ? ' is-on' : ''}`}
          >
            {key === 'all' ? 'Everything' : key === 'boost' ? 'Boosts' : 'Mine'}
          </button>
        ))}
        <button
          type="button"
          className={`cm-filter${showFilters ? ' is-on' : ''}`}
          onClick={() => setShowFilters(v => !v)}
          style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Filter size={13} />
          Filters {activeFilterCount > 0 && <span style={{ background: 'var(--cm-accent)', color: '#100E0A', borderRadius: '999px', fontSize: '0.65rem', padding: '0.05rem 0.4rem', fontWeight: 800 }}>{activeFilterCount}</span>}
          <ChevronDown size={13} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {showFilters && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
          <select value={platformFilter} onChange={(e) => onPlatformFilterChange(e.target.value)} className="cm-filter-select">
            <option value="">All platforms</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value as 'newest' | 'needs_engagement')} className="cm-filter-select">
            <option value="newest">Newest first</option>
            <option value="needs_engagement">Needs engagement</option>
          </select>
        </div>
      )}

      {/* Feed */}
      {sortedPosts.length === 0 ? (
        <div className="cm-card" style={{ padding: '2.2rem 1.2rem', textAlign: 'center' }}>
          <Sparkles size={20} color="var(--cm-accent)" />
          <p style={{ margin: '0.7rem 0 0.3rem', fontWeight: 700, color: 'var(--cm-text)' }}>Nothing here yet</p>
          <p style={{ margin: 0, color: 'var(--cm-muted)', fontSize: '0.88rem' }}>Be the first to say hi — the board rewards whoever starts.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {sortedPosts.map((post) => {
            const liked = likedPostIds.has(post.id)
            const boosted = boostedPostIds.has(post.id)
            const engaged = engagedPostIds.has(post.id)
            const isOwner = post.user_id === currentUserId
            const isBoost = post.post_type === 'boost'
            const open = replyOpen[post.id] || false
            const repliesToShow = showAllReplies[post.id] ? post.comments : post.comments.slice(0, 2)
            const avatarUrl = post.profiles?.avatar_url
            const name = post.profiles?.name || 'Anonymous'

            return (
              <article key={post.id} className="cm-card cm-post">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.85rem' }}>
                  <button
                    className="cm-author"
                    onClick={() => onViewProfile(post.user_id)}
                    style={{ background: 'transparent', border: 'none', textAlign: 'left', width: '100%' }}
                    aria-label={`View ${name}'s profile`}
                  >
                    <div className="cm-avatar-ring">
                      <div className="cm-avatar">
                        {avatarUrl ? <img src={avatarUrl} alt={name} /> : getInitials(name)}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.93rem', color: 'var(--cm-text)' }}>{name}</span>
                        {isOwner && <span style={tagStyle}>you</span>}
                        {isBoost && <span style={{ ...tagStyle, color: 'var(--cm-accent)', background: 'var(--cm-accent-soft)', border: 'none' }}>boost</span>}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--cm-muted)' }}>{formatTime(post.created_at)}</span>
                    </div>
                  </button>
                  {isOwner && (
                    <button className="cm-del" onClick={() => onDeletePost(post.id)} aria-label="Delete post">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <p style={{ margin: '0 0 0.9rem', fontSize: '0.95rem', lineHeight: 1.68, color: '#D8D5D0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {post.content}
                </p>

                {post.link && (
                  <a href={post.link} target="_blank" rel="noopener noreferrer" className="cm-linkcard">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--cm-text)' }}>{post.platform || hostOf(post.link)}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--cm-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '48vw' }}>{post.link}</span>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cm-accent)', flexShrink: 0 }}>
                      Engage <ExternalLink size={13} />
                    </span>
                  </a>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', paddingTop: '0.7rem', borderTop: '1px solid var(--cm-line-soft)', flexWrap: 'wrap' }}>
                  <button className={`cm-action${liked ? ' is-on' : ''}`} onClick={() => onToggleLike(post.id)}>
                    <Heart size={15} fill={liked ? 'var(--cm-accent)' : 'none'} />
                    {post.likes?.length || 0}
                  </button>
                  <button className={`cm-action${open ? ' is-on' : ''}`} onClick={() => setReplyOpen(prev => ({ ...prev, [post.id]: !prev[post.id] }))}>
                    <MessageCircle size={15} />
                    {post.comments?.length || 0}
                  </button>
                  {isBoost && (
                    <>
                      <button className={`cm-action${boosted ? ' is-on' : ''}`} onClick={() => onToggleBoost(post.id)}>
                        <Zap size={15} fill={boosted ? 'var(--cm-accent)' : 'none'} />
                        {post.boosts?.length || 0}
                      </button>
                      <button className={`cm-action${engaged ? ' is-on' : ''}`} onClick={() => onToggleEngagement(post.id)}>
                        {engaged ? '✓ Engaged' : 'I engaged'}
                      </button>
                      <span style={{ fontSize: '0.7rem', color: 'var(--cm-muted)', marginLeft: '0.2rem' }}>
                        {post.engagements?.length || 0} creators engaged
                      </span>
                    </>
                  )}
                  {post.comments.length > 0 && !open && (
                    <button className="cm-ghost" onClick={() => setReplyOpen(prev => ({ ...prev, [post.id]: true }))}>
                      View thread
                    </button>
                  )}
                </div>

                {open && (
                  <div style={{ marginTop: '0.9rem', display: 'grid', gap: '0.6rem' }}>
                    {repliesToShow.map((cm) => {
                      const commenterName = cm.user_id === currentUserId ? 'You' : cm.profiles?.name || 'Anonymous'
                      const commenterAvatar = cm.profiles?.avatar_url
                      return (
                        <div key={cm.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                          <button
                            onClick={() => onViewProfile(cm.user_id)}
                            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: '2px' }}
                            aria-label={`View ${commenterName}'s profile`}
                          >
                            <div className="cm-avatar-ring" style={{ padding: 1 }}>
                              <div className="cm-avatar" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>
                                {commenterAvatar ? <img src={commenterAvatar} alt={commenterName} /> : getInitials(commenterName)}
                              </div>
                            </div>
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                              <button
                                onClick={() => onViewProfile(cm.user_id)}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--cm-text)' }}
                              >
                                {commenterName}
                              </button>
                              <span style={{ fontSize: '0.68rem', color: 'var(--cm-muted)' }}>{formatTime(cm.created_at)}</span>
                            </div>
                            <p style={{ margin: '0.15rem 0 0', fontSize: '0.87rem', lineHeight: 1.55, color: '#C9C6C1', wordBreak: 'break-word' }}>{cm.content}</p>
                          </div>
                          {cm.user_id === currentUserId && (
                            <button className="cm-del sm" onClick={() => onDeleteReply(post.id, cm.id)} aria-label="Delete reply">
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                    {post.comments.length > 2 && (
                      <button className="cm-ghost" onClick={() => setShowAllReplies(prev => ({ ...prev, [post.id]: !prev[post.id] }))} style={{ textAlign: 'left' }}>
                        {showAllReplies[post.id] ? 'Show less' : `Show ${post.comments.length - 2} more`}
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                      <input
                        className="cm-input"
                        style={{ flex: 1, padding: '0.6rem 0.8rem', fontSize: '0.87rem', minWidth: 0, background: 'var(--cm-sunk)' }}
                        value={replyDraft[post.id] || ''}
                        onChange={(e) => setReplyDraft(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void submitReply(post.id)
                          }
                        }}
                        placeholder="Say something useful…"
                      />
                      <button
                        className="cm-send sm"
                        disabled={!replyDraft[post.id]?.trim() || isReplying}
                        onClick={() => void submitReply(post.id)}
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <button
        className="cm-fab"
        aria-label="New post"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setTimeout(() => textareaRef.current?.focus(), 350)
        }}
      >
        <Plus size={22} />
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="cm-stat">
      <span className="cm-stat-value">{value}</span>
      <span className="cm-stat-label">{label}</span>
    </div>
  )
}

const tagStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--cm-muted)',
  border: '1px solid var(--cm-line)',
  borderRadius: 999,
  padding: '0.1rem 0.4rem',
  fontWeight: 700,
}
