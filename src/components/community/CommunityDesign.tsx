import { useState, useMemo, useRef } from 'react'
import {
  Send, Trash2, Link2, MessageCircle, Heart, ExternalLink, Plus, X,
  Sparkles, Megaphone, Zap,
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
  comments: { id: string; content: string; user_id: string; created_at: string; profiles?: { name: string; avatar_url?: string | null } | null }[]
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
  onCreatePost: (content: string, link: string | null, postType: 'say_hi' | 'boost', platform: string | null, engagementType: string | null) => void
  onDeletePost: (postId: string) => void
  onToggleLike: (postId: string) => void
  onToggleBoost: (postId: string) => void
  onToggleEngagement: (postId: string) => void
  onReply: (postId: string, content: string) => void
  onDeleteReply: (postId: string, commentId: string) => void
  onViewProfile: (userId: string) => void
  renderCard?: (post: CommunityPost) => React.ReactNode
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
function avatarBg(name?: string | null) {
  const key = name || '?'
  let h = 0
  for (let i = 0; i < key.length; i++) h = key.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'now'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h'
  if (diff < 604_800_000) return Math.floor(diff / 86_400_000) + 'd'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
function hostOf(link: string) {
  try { return new URL(link).hostname.replace(/^www\./, '') } catch { return link }
}

export default function CommunityDesign({
  posts, currentUserId, likedPostIds, boostedPostIds, engagedPostIds,
  loading, isPosting, isReplying, filter, platformFilter, sortBy,
  onFilterChange, onPlatformFilterChange, onSortChange,
  onCreatePost, onDeletePost, onToggleLike, onToggleBoost, onToggleEngagement,
  onReply, onDeleteReply, onViewProfile, renderCard,
}: Props) {
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
    replies: posts.reduce((a, p) => a + (p.comments?.length || 0), 0),
  }), [posts])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    if (mode === 'boost' && !link.trim()) return
    await onCreatePost(content.trim(), link.trim() || null, mode, mode === 'boost' ? platform || null : null, mode === 'boost' ? engagementType || null : null)
    setContent(''); setLink(''); setPlatform(''); setEngagementType('')
  }

  const submitReply = async (postId: string) => {
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
    if (sortBy === 'needs_engagement') return [...r].sort((a, b) => (a.engagements?.length || 0) - (b.engagements?.length || 0))
    return [...r].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [posts, filter, platformFilter, sortBy, currentUserId])

  if (loading) {
    return <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--cm-text-3)', fontSize: '0.85rem' }}>Loading community…</div>
  }

  const counterClass = content.length > MAX * 0.95 ? 'danger' : content.length > MAX * 0.85 ? 'warn' : ''

  return (
    <div style={{ maxWidth: '100%', paddingBottom: '110px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <header className="cm-header">
        <h1 className="cm-header-title">Community</h1>
        <div className="cm-header-stats">
          <span><strong>{stats.posts}</strong> posts</span>
          <span><strong>{stats.creators}</strong> creators</span>
          <span><strong>{stats.replies}</strong> replies</span>
        </div>
      </header>

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
          placeholder={mode === 'boost' ? 'What did you post, and what engagement helps most?' : 'Say hi — who you are, what you build, what your niche is'}
        />

        {mode === 'boost' && (
          <>
            <div className="cm-inline-row">
              {ENGAGEMENTS.map(a => (
                <button key={a} type="button" className={`cm-chip-sm${engagementType === a ? ' is-on' : ''}`} onClick={() => setEngagementType(engagementType === a ? '' : a)}>{a}</button>
              ))}
            </div>
            <div className="cm-inline-row">
              <Link2 size={14} color="var(--cm-text-3)" style={{ alignSelf: 'center' }} />
              <input className="cm-input-line" placeholder="Paste post link" value={link} onChange={e => setLink(e.target.value)} />
            </div>
            <div className="cm-inline-row">
              <select className="cm-input-line" value={platform} onChange={e => setPlatform(e.target.value)}>
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

      <div className="cm-filters">
        {(['all', 'say_hi', 'boost', 'mine'] as const).map(k => (
          <button key={k} onClick={() => onFilterChange(k)} className={`cm-filter-pill${filter === k ? ' is-on' : ''}`}>
            {k === 'all' ? 'All' : k === 'say_hi' ? 'Say hi' : k === 'boost' ? 'Boosts' : 'Mine'}
          </button>
        ))}
        <select className="cm-filter-pill" value={platformFilter} onChange={e => onPlatformFilterChange(e.target.value)} style={{ paddingRight: '1.5rem' }}>
          <option value="">All platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="cm-filter-pill" value={sortBy} onChange={e => onSortChange(e.target.value as 'newest' | 'needs_engagement')} style={{ paddingRight: '1.5rem' }}>
          <option value="newest">Newest</option>
          <option value="needs_engagement">Needs engagement</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="cm-empty">
          <Sparkles size={20} color="var(--cm-text-3)" />
          <p className="cm-empty-title">Nothing here yet</p>
          <p className="cm-empty-text">Be the first to post — the board rewards whoever starts.</p>
        </div>
      ) : renderCard ? (
        <div>
          {visible.map(post => (
            <div key={post.id}>{renderCard(post)}</div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {visible.map(post => {
            const liked = likedPostIds.has(post.id)
            const boosted = boostedPostIds.has(post.id)
            const engaged = engagedPostIds.has(post.id)
            const isOwner = post.user_id === currentUserId
            const isBoost = post.post_type === 'boost'
            const open = replyOpen[post.id] || false
            const replies = showAllReplies[post.id] ? post.comments : post.comments.slice(0, 2)
            const name = post.profiles?.name || 'Anonymous'
            const avatarUrl = post.profiles?.avatar_url

            return (
              <article key={post.id} className="cm-a-post">
                <div className="cm-a-meta">
                  <button
                    onClick={() => onViewProfile(post.user_id)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: avatarUrl ? 'transparent' : avatarBg(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0A0A0A', overflow: 'hidden' }}>
                      {avatarUrl ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
                    </div>
                    <strong>{name}</strong>
                  </button>
                  {isOwner && <span>· you</span>}
                  {isBoost && <span style={{ color: 'var(--cm-accent)' }}>· boost</span>}
                  <span>· {timeAgo(post.created_at)}</span>
                  {isOwner && (
                    <button className="cm-del-btn" style={{ marginLeft: 'auto' }} onClick={() => onDeletePost(post.id)} aria-label="Delete">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p className="cm-a-content">{post.content}</p>
                {post.link && (
                  <a href={post.link} target="_blank" rel="noopener noreferrer" className="cm-link">
                    <div style={{ minWidth: 0 }}>
                      <div className="cm-link-host">{post.platform || hostOf(post.link)}</div>
                      <div className="cm-link-url">{post.link}</div>
                    </div>
                    <span className="cm-link-cta">Open <ExternalLink size={11} /></span>
                  </a>
                )}
                <div className="cm-a-actions">
                  <button className={`cm-a-action${liked ? ' is-on' : ''}`} onClick={() => onToggleLike(post.id)}>
                    <Heart size={13} fill={liked ? 'currentColor' : 'none'} /> {post.likes?.length || 0}
                  </button>
                  <button className={`cm-a-action${open ? ' is-on' : ''}`} onClick={() => setReplyOpen(p => ({ ...p, [post.id]: !p[post.id] }))}>
                    <MessageCircle size={13} /> {post.comments?.length || 0}
                  </button>
                  {isBoost && (
                    <>
                      <button className={`cm-a-action${boosted ? ' is-on' : ''}`} onClick={() => onToggleBoost(post.id)}>
                        <Zap size={13} fill={boosted ? 'currentColor' : 'none'} /> {post.boosts?.length || 0}
                      </button>
                      <button className={`cm-a-action${engaged ? ' is-on' : ''}`} onClick={() => onToggleEngagement(post.id)}>
                        {engaged ? '✓ engaged' : 'i engaged'}
                      </button>
                    </>
                  )}
                </div>
                {open && (
                  <div className="cm-thread">
                    {replies.map(cm => {
                      const cName = cm.user_id === currentUserId ? 'You' : cm.profiles?.name || 'Anonymous'
                      return (
                        <div key={cm.id} className="cm-reply">
                          <div className="cm-reply-body">
                            <div className="cm-reply-meta">
                              <button className="cm-reply-name">{cName}</button>
                              <span className="cm-reply-time">{timeAgo(cm.created_at)}</span>
                            </div>
                            <p className="cm-reply-text">{cm.content}</p>
                          </div>
                          {cm.user_id === currentUserId && (
                            <button className="cm-del-btn" onClick={() => onDeleteReply(post.id, cm.id)} aria-label="Delete">
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                    {post.comments.length > 2 && (
                      <button className="cm-ghost-btn" onClick={() => setShowAllReplies(p => ({ ...p, [post.id]: !p[post.id] }))} style={{ alignSelf: 'flex-start' }}>
                        {showAllReplies[post.id] ? 'Show less' : `Show ${post.comments.length - 2} more`}
                      </button>
                    )}
                    <div className="cm-reply-input-row">
                      <input
                        className="cm-reply-input"
                        value={replyDraft[post.id] || ''}
                        onChange={e => setReplyDraft(p => ({ ...p, [post.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitReply(post.id) } }}
                        placeholder="Reply…"
                      />
                      <button className="cm-submit" style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem' }} disabled={!replyDraft[post.id]?.trim() || isReplying} onClick={() => submitReply(post.id)}>
                        <Send size={11} />
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
        onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => textareaRef.current?.focus(), 300) }}
      >
        <Plus size={20} />
      </button>
    </div>
  )
}
