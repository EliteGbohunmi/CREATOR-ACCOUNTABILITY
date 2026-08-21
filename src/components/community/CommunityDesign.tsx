import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MessageCircle, Trash2, Link2, Send, Zap, Users, MessageSquare,
  Flame, Hand, ExternalLink, Plus, Sparkles, Megaphone,
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
  profiles?: { name: string; email?: string; streak_days?: number } | null
  comments: {
    id: string
    content: string
    user_id: string
    created_at: string
    profiles?: { name: string } | null
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
  onCreatePost: (content: string, link: string | null, postType: 'say_hi' | 'boost', platform: string | null, engagementType: string | null) => void
  onDeletePost: (postId: string) => void
  onToggleLike: (postId: string) => void
  onToggleBoost: (postId: string) => void
  onToggleEngagement: (postId: string) => void
  onReply: (postId: string, content: string) => void
  onDeleteReply: (postId: string, commentId: string) => void
}

const PLATFORMS = ['X', 'TikTok', 'YouTube', 'Instagram', 'LinkedIn', 'Substack']
const ENGAGEMENT_TYPES = ['comment', 'like', 'share', 'watch']

// Two-letter initials (e.g. "Tolu Adeyemi" -> "TA", "You" -> "Y")
const getInitials = (name?: string | null) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function CommunityDesign({
  posts,
  currentUserId,
  likedPostIds,
  boostedPostIds,
  engagedPostIds,
  loading,
  isPosting,
  isReplying,
  filter,
  platformFilter,
  sortBy,
  onFilterChange,
  onPlatformFilterChange,
  onSortChange,
  onCreatePost,
  onDeletePost,
  onToggleLike,
  onToggleBoost,
  onToggleEngagement,
  onReply,
  onDeleteReply,
}: Props) {
  const [newContent, setNewContent] = useState('')
  const [newLink, setNewLink] = useState('')
  const [newPlatform, setNewPlatform] = useState('')
  const [newEngagementType, setNewEngagementType] = useState('')
  const [postType, setPostType] = useState<'say_hi' | 'boost'>('say_hi')
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({})
  const [showAllReplies, setShowAllReplies] = useState<Record<string, boolean>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim()) {
      alert('Please write something before posting.')
      return
    }
    if (postType === 'boost' && !newLink.trim()) {
      alert('Please paste a link to your post.')
      return
    }
    onCreatePost(
      newContent.trim(),
      newLink.trim() || null,
      postType,
      postType === 'boost' ? newPlatform || null : null,
      postType === 'boost' ? newEngagementType || null : null
    )
    setNewContent('')
    setNewLink('')
    setNewPlatform('')
    setNewEngagementType('')
  }

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    if (diff < 60_000) return 'Just now'
    if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago'
    if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago'
    if (diff < 604_800_000) return Math.floor(diff / 86_400_000) + 'd ago'
    return new Date(date).toLocaleDateString()
  }

  const totalPosts = posts.length
  const totalCreators = new Set(posts.map(p => p.user_id)).size
  const totalBoosts = posts.reduce((acc, p) => acc + (p.boosts?.length || 0), 0)
  const totalReplies = posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0)

  const filteredPosts = posts.filter(p => {
    if (filter === 'say_hi' && p.post_type !== 'say_hi') return false
    if (filter === 'boost' && p.post_type !== 'boost') return false
    if (filter === 'mine' && p.user_id !== currentUserId) return false
    if (platformFilter && p.platform !== platformFilter) return false
    return true
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'needs_engagement') {
      const aEngaged = a.engagements?.length || 0
      const bEngaged = b.engagements?.length || 0
      return aEngaged - bEngaged
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (loading) {
    return (
      <div style={styles.loading}>
        <FontLoader />
        <div style={styles.spinner} />
        <span>Loading community board...</span>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <FontLoader />

      {/* Eyebrow */}
      <div style={styles.eyebrow}>
        <Users size={18} strokeWidth={2} />
        Creator Community
      </div>

      <h1 style={styles.title}>Say hi. Ask for engagement. Show up for each other.</h1>
      <p style={styles.subtitle}>Introduce yourself, drop the post you just shipped, and tell creators exactly how to support it.</p>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.stat}>
          <div style={styles.statNum}>{totalPosts}</div>
          <div style={styles.statLabel}>Posts</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statNum}>{totalCreators}</div>
          <div style={styles.statLabel}>Creators</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statNum}>{totalBoosts}</div>
          <div style={styles.statLabel}>Boosts</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statNum}>{totalReplies}</div>
          <div style={styles.statLabel}>Replies</div>
        </div>
      </div>

      {/* Composer */}
      <div style={styles.composer}>
        <div style={styles.toggleRow}>
          <button
            type="button"
            style={{ ...styles.pill, ...(postType === 'say_hi' ? styles.pillActive : {}) }}
            onClick={() => setPostType('say_hi')}
          >
            <Sparkles size={15} strokeWidth={2} />
            Say hi
          </button>
          <button
            type="button"
            style={{ ...styles.pill, ...(postType === 'boost' ? styles.pillActive : {}) }}
            onClick={() => setPostType('boost')}
          >
            <Megaphone size={15} strokeWidth={2} />
            Boost my post
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            style={styles.textarea}
            placeholder={
              postType === 'say_hi'
                ? "Say hi – who are you, what are you building, what's your niche?"
                : "What's your post about? Why should people engage?"
            }
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            maxLength={2000}
            rows={3}
          />
          <div style={styles.composerFooter}>
            <span style={styles.charCount}>{newContent.length}/2000</span>
            <button type="submit" disabled={isPosting || !newContent.trim()} style={styles.sendBtn}>
              <Send size={15} strokeWidth={2} />
              {isPosting ? '...' : postType === 'say_hi' ? 'Say hi' : 'Post boost'}
            </button>
          </div>

          {postType === 'boost' && (
            <div style={styles.boostFields}>
              <div style={styles.fieldRow}>
                <Link2 size={15} color="#6f6c69" />
                <input
                  style={styles.linkInput}
                  placeholder="Paste your post link"
                  value={newLink}
                  onChange={e => setNewLink(e.target.value)}
                />
              </div>
              <div style={styles.fieldRow}>
                <select
                  style={styles.select}
                  value={newPlatform}
                  onChange={e => setNewPlatform(e.target.value)}
                >
                  <option value="">Platform</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  style={styles.select}
                  value={newEngagementType}
                  onChange={e => setNewEngagementType(e.target.value)}
                >
                  <option value="">Ask for</option>
                  {ENGAGEMENT_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Filter tabs */}
      <div style={styles.tabs}>
        <button
          type="button"
          style={{ ...styles.tab, ...(filter === 'all' ? styles.tabActive : {}) }}
          onClick={() => onFilterChange('all')}
        >
          Everything
        </button>
        <button
          type="button"
          style={{ ...styles.tab, ...(filter === 'boost' ? styles.tabActive : {}) }}
          onClick={() => onFilterChange('boost')}
        >
          Boosts
        </button>
        <button
          type="button"
          style={{ ...styles.tab, ...(filter === 'mine' ? styles.tabActive : {}) }}
          onClick={() => onFilterChange('mine')}
        >
          Mine
        </button>
      </div>

      {/* Feed */}
      <div style={styles.feed}>
        <AnimatePresence>
          {sortedPosts.length === 0 ? (
            <p style={styles.empty}>No posts yet. Start the conversation!</p>
          ) : (
            sortedPosts.map((post, index) => {
              const liked = likedPostIds.has(post.id)
              const engaged = engagedPostIds.has(post.id)
              const isOwner = post.user_id === currentUserId
              const replyKey = post.id
              const isReplyOpen = replyOpen[replyKey] || false
              const isBoost = post.post_type === 'boost'
              const engagementCount = post.engagements?.length || 0
              const repliesToShow = showAllReplies[replyKey] ? post.comments : post.comments.slice(0, 2)
              const displayName = isOwner ? 'You' : (post.profiles?.name || 'Unknown')

              return (
                <motion.div
                  key={post.id}
                  style={styles.post}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Post head */}
                  <div style={styles.postHead}>
                    <div style={styles.avatar}>
                      {getInitials(post.profiles?.name)}
                    </div>
                    <div style={styles.who}>
                      <div style={styles.nameRow}>
                        <span style={styles.name}>{displayName}</span>
                        {isOwner && <span style={{ ...styles.badge, ...styles.badgeYou }}>You</span>}
                        {isBoost && <span style={{ ...styles.badge, ...styles.badgeBoost }}>Boost</span>}
                      </div>
                      <span style={styles.timestamp}>{formatTime(post.created_at)}</span>
                    </div>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => onDeletePost(post.id)}
                        style={styles.deleteBtn}
                        aria-label="Delete post"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    )}
                  </div>

                  {/* Body */}
                  <div style={styles.postBody}>{post.content}</div>

                  {/* Link card (boost only) */}
                  {isBoost && post.link && (
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.linkCard}
                    >
                      <div style={styles.linkText}>
                        <div style={styles.linkDomain}>{post.platform || 'Link'}</div>
                        <div style={styles.linkUrl}>{post.link}</div>
                      </div>
                      <div style={styles.engage}>
                        Engage
                        <ExternalLink size={13} strokeWidth={2.2} />
                      </div>
                    </a>
                  )}

                  {/* Post footer actions */}
                  <div style={styles.postFooter}>
                    <button
                      type="button"
                      onClick={() => onToggleLike(post.id)}
                      style={{ ...styles.statPill, ...(liked ? styles.statPillFilled : styles.statPillOutline) }}
                    >
                      <Heart size={15} fill={liked ? '#f0a637' : 'none'} />
                      {post.likes?.length || 0}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyOpen(prev => ({ ...prev, [replyKey]: !prev[replyKey] }))}
                      style={{ ...styles.statPill, ...styles.statPillOutline }}
                    >
                      <MessageCircle size={15} />
                      {post.comments?.length || 0}
                    </button>
                    {isBoost && (
                      <>
                        <button
                          type="button"
                          onClick={() => onToggleEngagement(post.id)}
                          style={{
                            ...styles.statPill,
                            ...(engaged ? styles.statPillFilled : styles.statPillOutline),
                          }}
                        >
                          <Zap size={15} />
                          {engaged ? 'Engaged' : 'I engaged'}
                        </button>
                        <span style={styles.engagedCount}>
                          {engagementCount} {engagementCount === 1 ? 'creator' : 'creators'} engaged
                        </span>
                      </>
                    )}
                    {post.comments.length > 0 && (
                      <span
                        style={styles.viewThread}
                        onClick={() => setReplyOpen(prev => ({ ...prev, [replyKey]: !prev[replyKey] }))}
                      >
                        View thread
                      </span>
                    )}
                  </div>

                  {/* Reply section */}
                  <AnimatePresence>
                    {isReplyOpen && (
                      <motion.div
                        style={styles.replyBlock}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div style={styles.replyTop}>
                          <div style={styles.replyStat}>
                            <Heart size={14} fill="#f0a637" />
                            {post.likes?.length || 0}
                          </div>
                          <div style={styles.replyStat}>
                            <MessageCircle size={14} />
                            {post.comments?.length || 0}
                          </div>
                        </div>

                        {repliesToShow.map(comment => (
                          <div key={comment.id} style={styles.replyComment}>
                            <div style={styles.whoRow}>
                              <span style={styles.name}>
                                {comment.user_id === currentUserId ? 'You' : comment.profiles?.name || 'Anonymous'}
                              </span>
                              <span style={styles.dot} />
                              <span style={styles.timestamp}>{formatTime(comment.created_at)}</span>
                              {comment.user_id === currentUserId && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteReply(post.id, comment.id)}
                                  style={styles.closeX}
                                  aria-label="Delete reply"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            <div style={styles.replyText}>{comment.content}</div>
                          </div>
                        ))}

                        {post.comments.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setShowAllReplies(prev => ({ ...prev, [replyKey]: !prev[replyKey] }))}
                            style={styles.showMore}
                          >
                            {showAllReplies[replyKey] ? 'Show less' : `Show ${post.comments.length - 2} more`}
                          </button>
                        )}

                        <div style={styles.sayInputRow}>
                          <input
                            style={styles.sayInput}
                            placeholder="Say something useful..."
                            value={replyContent[replyKey] || ''}
                            onChange={e =>
                              setReplyContent(prev => ({ ...prev, [replyKey]: e.target.value }))
                            }
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const content = (replyContent[replyKey] || '').trim()
                                if (!content) return
                                onReply(post.id, content)
                                setReplyContent(prev => ({ ...prev, [replyKey]: '' }))
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const content = (replyContent[replyKey] || '').trim()
                              if (!content) return
                              onReply(post.id, content)
                              setReplyContent(prev => ({ ...prev, [replyKey]: '' }))
                            }}
                            disabled={isReplying}
                            style={styles.sendRound}
                            aria-label="Send reply"
                          >
                            <Send size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <button type="button" style={styles.fab} aria-label="New post">
        <Plus size={26} strokeWidth={2.4} />
      </button>
    </div>
  )
}

// Injects the Google Fonts + keyframes this design depends on.
// Safe to render multiple times; move this <link>/<style> into your
// root index.html instead if you'd rather not inject it per-mount.
function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito+Sans:wght@400;600;700;800&display=swap');
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  )
}

// ---- Styles (exact match to provided HTML/CSS) ----
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '480px',
    margin: '0 auto',
    minHeight: '100vh',
    padding: '28px 20px 100px',
    position: 'relative',
    backgroundColor: '#121212',
    color: '#f4f2ee',
    fontFamily: '"Nunito Sans", sans-serif',
  },
  // Eyebrow
  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#f0a637',
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 600,
    fontSize: '13px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '14px',
  },
  title: {
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 700,
    fontSize: '34px',
    lineHeight: 1.12,
    letterSpacing: '0.01em',
    textTransform: 'uppercase',
    margin: '0 0 14px',
  },
  subtitle: {
    color: '#9c9895',
    fontSize: '15px',
    lineHeight: 1.5,
    margin: '0 0 20px',
    maxWidth: '46ch',
  },
  // Stats
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    marginBottom: '20px',
  },
  stat: {
    border: '1px solid #2c2c2c',
    borderRadius: '14px',
    padding: '14px 6px 12px',
    textAlign: 'center',
    background: '#1a1a1a',
  },
  statNum: {
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 600,
    fontSize: '22px',
    lineHeight: 1,
    marginBottom: '6px',
  },
  statLabel: {
    fontSize: '10.5px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#6f6c69',
    fontWeight: 700,
  },
  // Composer
  composer: {
    border: '1px solid #2c2c2c',
    borderRadius: '18px',
    background: '#1a1a1a',
    padding: '18px',
    marginBottom: '22px',
  },
  toggleRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
  },
  pill: {
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 500,
    fontSize: '14px',
    borderRadius: '999px',
    padding: '9px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #2c2c2c',
    cursor: 'pointer',
    background: 'transparent',
    color: '#f4f2ee',
    transition: 'all 0.2s',
  },
  pillActive: {
    background: '#f0a637',
    color: '#201404',
    borderColor: '#f0a637',
  },
  textarea: {
    width: '100%',
    minHeight: '84px',
    resize: 'none',
    background: 'transparent',
    border: '1px solid #2c2c2c',
    borderRadius: '14px',
    color: '#f4f2ee',
    fontFamily: '"Nunito Sans", sans-serif',
    fontSize: '15.5px',
    lineHeight: 1.5,
    padding: '14px',
    marginBottom: '12px',
    outline: 'none',
  },
  composerFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCount: {
    color: '#6f6c69',
    fontSize: '13px',
  },
  sendBtn: {
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 600,
    fontSize: '14px',
    background: '#4d3a1a',
    color: '#d8a05c',
    border: 'none',
    borderRadius: '999px',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    opacity: 0.85,
    transition: 'opacity 0.2s',
  },
  boostFields: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'transparent',
    border: '1px solid #2c2c2c',
    borderRadius: '999px',
    padding: '8px 16px',
  },
  linkInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#f4f2ee',
    fontSize: '14.5px',
    fontFamily: '"Nunito Sans", sans-serif',
    outline: 'none',
  },
  select: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#f4f2ee',
    fontSize: '14.5px',
    fontFamily: '"Nunito Sans", sans-serif',
    outline: 'none',
    cursor: 'pointer',
  },
  // Tabs
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tab: {
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 500,
    fontSize: '14px',
    padding: '8px 18px',
    borderRadius: '999px',
    border: '1px solid #2c2c2c',
    color: '#9c9895',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    borderColor: '#f0a637',
    color: '#f0a637',
    background: 'rgba(240,166,55,0.08)',
  },
  // Feed
  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  empty: {
    textAlign: 'center',
    color: '#6f6c69',
    padding: '2rem 0',
    fontFamily: '"Nunito Sans", sans-serif',
    fontSize: '15px',
  },
  // Post
  post: {
    border: '1px solid #2c2c2c',
    borderRadius: '18px',
    background: '#1a1a1a',
    padding: '18px',
  },
  postHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
    position: 'relative',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: '2px solid #f0a637',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 600,
    fontSize: '14px',
    color: '#f0a637',
    flexShrink: 0,
  },
  who: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  name: {
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 600,
    fontSize: '15.5px',
  },
  badge: {
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 600,
    fontSize: '10.5px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    padding: '3px 9px',
    borderRadius: '999px',
  },
  badgeYou: {
    border: '1px solid #2c2c2c',
    color: '#9c9895',
  },
  badgeBoost: {
    background: '#f0a637',
    color: '#201404',
  },
  timestamp: {
    fontSize: '12.5px',
    color: '#6f6c69',
  },
  deleteBtn: {
    marginLeft: 'auto',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6f6c69',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  },
  postBody: {
    fontSize: '15.5px',
    lineHeight: 1.55,
    color: '#f4f2ee',
    marginBottom: '14px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  linkCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    border: '1px solid #2c2c2c',
    borderRadius: '14px',
    padding: '14px 16px',
    marginBottom: '14px',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  linkText: {
    minWidth: 0,
    flex: 1,
  },
  linkDomain: {
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 500,
    fontSize: '14.5px',
    color: '#f4f2ee',
    marginBottom: '3px',
  },
  linkUrl: {
    fontSize: '12.5px',
    color: '#6f6c69',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  engage: {
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 600,
    fontSize: '14px',
    color: '#f0a637',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  postFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  statPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    borderRadius: '999px',
    padding: '7px 14px',
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 600,
    fontSize: '13.5px',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
  },
  statPillFilled: {
    background: '#4d3a1a',
    color: '#f0a637',
  },
  statPillOutline: {
    border: '1px solid #2c2c2c',
    color: '#9c9895',
  },
  engagedCount: {
    fontSize: '13.5px',
    color: '#6f6c69',
    marginLeft: '4px',
  },
  viewThread: {
    marginLeft: 'auto',
    fontSize: '13.5px',
    color: '#6f6c69',
    fontWeight: 600,
    fontFamily: '"Fredoka", sans-serif',
    cursor: 'pointer',
  },
  // Reply block
  replyBlock: {
    border: '1px solid #2c2c2c',
    borderRadius: '16px',
    background: '#1a1a1a',
    padding: '16px',
    marginTop: '16px',
    overflow: 'hidden',
  },
  replyTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  replyStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#4d3a1a',
    color: '#f0a637',
    borderRadius: '999px',
    padding: '6px 13px',
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: 600,
    fontSize: '13px',
  },
  replyComment: {
    borderTop: '1px solid #2c2c2c',
    paddingTop: '12px',
    marginTop: '4px',
  },
  whoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#6f6c69',
  },
  closeX: {
    marginLeft: 'auto',
    color: '#6f6c69',
    fontSize: '16px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  replyText: {
    fontSize: '15px',
    lineHeight: 1.5,
    color: '#f4f2ee',
    marginBottom: '12px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  showMore: {
    background: 'none',
    border: 'none',
    color: '#6f6c69',
    fontSize: '14px',
    fontFamily: '"Nunito Sans", sans-serif',
    cursor: 'pointer',
    padding: '4px 0',
  },
  sayInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #2c2c2c',
    borderRadius: '999px',
    padding: '10px 8px 10px 16px',
  },
  sayInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#f4f2ee',
    fontSize: '14.5px',
    fontFamily: '"Nunito Sans", sans-serif',
    outline: 'none',
  },
  sendRound: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: '#4d3a1a',
    color: '#f0a637',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: 'none',
    cursor: 'pointer',
  },
  // Floating action button
  fab: {
    position: 'fixed',
    right: '24px',
    bottom: '32px',
    width: '58px',
    height: '58px',
    borderRadius: '50%',
    background: '#f0a637',
    color: '#201404',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    boxShadow: '0 0 24px rgba(240,166,55,0.45)',
    cursor: 'pointer',
  },
  // Loading
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 0',
    gap: '1rem',
    color: '#6f6c69',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid #2c2c2c',
    borderTop: '3px solid #f0a637',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
