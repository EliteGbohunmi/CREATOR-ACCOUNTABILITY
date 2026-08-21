import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MessageCircle, Trash2, Link2, Send, Zap, Users, MessageSquare,
  Flame, Hand, ExternalLink
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
        <div style={styles.spinner} />
        <span>Loading community board...</span>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Creator Community</h1>
        <h2 style={styles.subtitle}>Say hi. Ask for engagement. Show up for each other.</h2>
        <p style={styles.description}>Introduce yourself, drop the post you just shipped, and tell creators exactly how to support it.</p>
      </div>

      {/* Stats */}
      <div style={styles.statsBar}>
        <span style={styles.statItem}>{totalPosts} Posts</span>
        <span style={styles.statDot}>·</span>
        <span style={styles.statItem}>{totalCreators} Creators</span>
        <span style={styles.statDot}>·</span>
        <span style={styles.statItem}>{totalBoosts} Boosts</span>
        <span style={styles.statDot}>·</span>
        <span style={styles.statItem}>{totalReplies} Replies</span>
      </div>

      {/* Composer tabs */}
      <div style={styles.composerTabs}>
        <button
          style={{ ...styles.composerTab, ...(postType === 'say_hi' ? styles.composerTabActive : {}) }}
          onClick={() => setPostType('say_hi')}
        >
          Say hi
        </button>
        <button
          style={{ ...styles.composerTab, ...(postType === 'boost' ? styles.composerTabActive : {}) }}
          onClick={() => setPostType('boost')}
        >
          Boost my post
        </button>
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} style={styles.composer}>
        <textarea
          placeholder={
            postType === 'say_hi'
              ? "Say hi – who are you, what are you building, what's your niche?"
              : "What's your post about? Why should people engage?"
          }
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          style={styles.textarea}
          rows={3}
        />
        <div style={styles.composerFooter}>
          <span style={styles.charCounter}>{newContent.length}/2000</span>
          <button type="submit" disabled={isPosting || !newContent.trim()} style={styles.postBtn}>
            {isPosting ? '...' : 'Say hi'}
          </button>
        </div>

        {postType === 'boost' && (
          <div style={styles.boostFields}>
            <div style={styles.fieldRow}>
              <Link2 size={14} color="#666" />
              <input
                placeholder="Paste your post link"
                value={newLink}
                onChange={e => setNewLink(e.target.value)}
                style={styles.linkInput}
              />
            </div>
            <div style={styles.fieldRow}>
              <select
                value={newPlatform}
                onChange={e => setNewPlatform(e.target.value)}
                style={styles.select}
              >
                <option value="">Platform</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={newEngagementType}
                onChange={e => setNewEngagementType(e.target.value)}
                style={styles.select}
              >
                <option value="">Ask for</option>
                {ENGAGEMENT_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        )}
      </form>

      {/* Filter tabs */}
      <div style={styles.filterTabs}>
        <button
          style={{ ...styles.filterTab, ...(filter === 'all' ? styles.filterTabActive : {}) }}
          onClick={() => onFilterChange('all')}
        >
          Everything
        </button>
        <button
          style={{ ...styles.filterTab, ...(filter === 'boost' ? styles.filterTabActive : {}) }}
          onClick={() => onFilterChange('boost')}
        >
          Boosts
        </button>
        <button
          style={{ ...styles.filterTab, ...(filter === 'mine' ? styles.filterTabActive : {}) }}
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
              const boosted = boostedPostIds.has(post.id)
              const engaged = engagedPostIds.has(post.id)
              const isOwner = post.user_id === currentUserId
              const replyKey = post.id
              const isReplyOpen = replyOpen[replyKey] || false
              const isBoost = post.post_type === 'boost'
              const engagementCount = post.engagements?.length || 0
              const repliesToShow = showAllReplies[replyKey] ? post.comments : post.comments.slice(0, 2)

              return (
                <motion.div
                  key={post.id}
                  style={styles.card}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Card header */}
                  <div style={styles.cardHeader}>
                    <div style={styles.avatar}>
                      {post.profiles?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={styles.meta}>
                      <div style={styles.nameRow}>
                        <span style={styles.name}>{post.profiles?.name || 'Unknown'}</span>
                        {isBoost && <span style={styles.boostChip}>BOOST</span>}
                      </div>
                      <span style={styles.time}>{formatTime(post.created_at)}</span>
                    </div>
                    {isOwner && (
                      <button onClick={() => onDeletePost(post.id)} style={styles.deleteBtn}>
                        <Trash2 size={14} color="#E53E3E" />
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <p style={styles.content}>{post.content}</p>

                  {/* Link preview (boost only) */}
                  {isBoost && post.link && (
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.linkPreview}
                    >
                      <div style={styles.linkPreviewContent}>
                        <span style={styles.linkPlatform}>{post.platform || 'Link'}</span>
                        <span style={styles.linkUrl}>{post.link}</span>
                      </div>
                      <ExternalLink size={14} color="#666" />
                    </a>
                  )}

                  {/* Engagement actions */}
                  <div style={styles.actions}>
                    <button
                      onClick={() => onToggleLike(post.id)}
                      style={{ ...styles.actionBtn, color: liked ? '#F5A623' : '#666' }}
                    >
                      <Heart size={16} fill={liked ? '#F5A623' : 'none'} />
                      <span>{post.likes?.length || 0}</span>
                    </button>
                    <button
                      onClick={() => setReplyOpen(prev => ({ ...prev, [replyKey]: !prev[replyKey] }))}
                      style={styles.actionBtn}
                    >
                      <MessageCircle size={16} />
                      <span>{post.comments?.length || 0}</span>
                    </button>
                    {isBoost && (
                      <>
                        <button
                          onClick={() => onToggleEngagement(post.id)}
                          style={{
                            ...styles.engageBtn,
                            background: engaged ? '#2A2A2A' : '#F5A623',
                            color: engaged ? '#888' : '#0A0A0A',
                          }}
                        >
                          {engaged ? 'Engaged ✓' : 'I engaged'}
                        </button>
                        <span style={styles.engagedCount}>
                          {engagementCount} {engagementCount === 1 ? 'creator' : 'creators'} engaged
                        </span>
                      </>
                    )}
                    <span style={styles.engageLabel}>Engage</span>
                  </div>

                  {/* Replies */}
                  <AnimatePresence>
                    {isReplyOpen && (
                      <motion.div
                        style={styles.replySection}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {repliesToShow.map(comment => (
                          <div key={comment.id} style={styles.replyItem}>
                            <span style={styles.replyName}>
                              {comment.user_id === currentUserId ? 'You' : comment.profiles?.name || 'Anonymous'}
                            </span>
                            <span style={styles.replyText}>{comment.content}</span>
                            <span style={styles.replyTime}>{formatTime(comment.created_at)}</span>
                            {comment.user_id === currentUserId && (
                              <button
                                onClick={() => onDeleteReply(post.id, comment.id)}
                                style={styles.replyDelete}
                              >
                                <Trash2 size={12} color="#E53E3E" />
                              </button>
                            )}
                          </div>
                        ))}
                        {post.comments.length > 2 && (
                          <button
                            onClick={() => setShowAllReplies(prev => ({ ...prev, [replyKey]: !prev[replyKey] }))}
                            style={styles.showMoreBtn}
                          >
                            {showAllReplies[replyKey] ? 'Show less' : `Show ${post.comments.length - 2} more`}
                          </button>
                        )}
                        <div style={styles.replyInputRow}>
                          <input
                            placeholder="Say something useful..."
                            value={replyContent[replyKey] || ''}
                            onChange={e =>
                              setReplyContent(prev => ({ ...prev, [replyKey]: e.target.value }))
                            }
                            style={styles.replyInput}
                          />
                          <button
                            onClick={() => {
                              const content = (replyContent[replyKey] || '').trim()
                              if (!content) return
                              onReply(post.id, content)
                              setReplyContent(prev => ({ ...prev, [replyKey]: '' }))
                            }}
                            disabled={isReplying}
                            style={styles.replySend}
                          >
                            <Send size={14} />
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
    </div>
  )
}

// ---- Styles ----
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '1.5rem 1rem 3rem',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#F0EDE8',
  },
  header: {
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    fontFamily: 'Space Grotesk, sans-serif',
    margin: '0 0 0.2rem',
    color: '#F0EDE8',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#F0EDE8',
    margin: '0 0 0.2rem',
  },
  description: {
    fontSize: '0.9rem',
    color: '#888',
    margin: 0,
  },
  statsBar: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
    color: '#888',
  },
  statItem: {
    fontWeight: '500',
  },
  statDot: {
    color: '#555',
  },
  composerTabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  composerTab: {
    background: 'none',
    border: 'none',
    padding: '0.4rem 1rem',
    borderRadius: '6px',
    color: '#888',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  composerTabActive: {
    background: '#F5A623',
    color: '#0A0A0A',
  },
  composer: {
    background: '#1C1C1C',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    marginBottom: '1.5rem',
  },
  textarea: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: '0.5rem 0',
    color: '#F0EDE8',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
    outline: 'none',
  },
  composerFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid #2A2A2A',
  },
  charCounter: {
    color: '#555',
    fontSize: '0.8rem',
  },
  postBtn: {
    background: '#F5A623',
    border: 'none',
    borderRadius: '6px',
    padding: '0.4rem 1.25rem',
    color: '#0A0A0A',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  boostFields: {
    marginTop: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#0F0F0F',
    borderRadius: '6px',
    padding: '0 0.75rem',
    border: '1px solid #2A2A2A',
  },
  linkInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '0.5rem 0',
    color: '#F0EDE8',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  select: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '0.5rem 0',
    color: '#F0EDE8',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
    appearance: 'auto',
  },
  filterTabs: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '1.25rem',
    borderBottom: '1px solid #2A2A2A',
    paddingBottom: '0.5rem',
  },
  filterTab: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '0.25rem 0',
    transition: 'color 0.2s',
  },
  filterTabActive: {
    color: '#F5A623',
    borderBottom: '2px solid #F5A623',
    marginBottom: '-0.5rem',
  },
  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  empty: {
    textAlign: 'center',
    color: '#555',
    padding: '2rem 0',
  },
  card: {
    background: '#1C1C1C',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #F5A623, #E88A1E)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.9rem',
    color: '#0A0A0A',
    flexShrink: 0,
  },
  meta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  name: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: '#F0EDE8',
  },
  boostChip: {
    fontSize: '0.6rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#F5A623',
    background: 'rgba(245,166,35,0.15)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
  },
  time: {
    fontSize: '0.7rem',
    color: '#888',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.2rem',
    opacity: 0.5,
  },
  content: {
    margin: '0.2rem 0 0.6rem',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: '#F0EDE8',
  },
  linkPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#0F0F0F',
    borderRadius: '6px',
    padding: '0.4rem 0.75rem',
    marginBottom: '0.6rem',
    textDecoration: 'none',
    cursor: 'pointer',
    border: '1px solid #2A2A2A',
  },
  linkPreviewContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
    overflow: 'hidden',
  },
  linkPlatform: {
    fontSize: '0.7rem',
    color: '#F5A623',
    fontWeight: '600',
  },
  linkUrl: {
    fontSize: '0.8rem',
    color: '#888',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid #2A2A2A',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'color 0.2s',
    color: '#888',
  },
  engageBtn: {
    border: 'none',
    borderRadius: '6px',
    padding: '0.2rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  engagedCount: {
    fontSize: '0.7rem',
    color: '#888',
  },
  engageLabel: {
    fontSize: '0.8rem',
    color: '#888',
    cursor: 'default',
    marginRight: '0.5rem',
  },
  replySection: {
    marginTop: '0.75rem',
    paddingLeft: '1rem',
    borderLeft: '2px solid #F5A623',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  replyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: '#888',
    padding: '0.2rem 0',
    borderBottom: '1px solid #2A2A2A',
  },
  replyName: {
    fontWeight: '600',
    color: '#F0EDE8',
    flexShrink: 0,
  },
  replyText: {
    flex: 1,
    wordBreak: 'break-word',
  },
  replyTime: {
    fontSize: '0.65rem',
    color: '#555',
    flexShrink: 0,
  },
  replyDelete: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    opacity: 0.4,
  },
  showMoreBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: '0.2rem 0',
    textAlign: 'left',
  },
  replyInputRow: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.3rem',
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    background: '#0F0F0F',
    border: '1px solid #2A2A2A',
    borderRadius: '6px',
    padding: '0.4rem 0.75rem',
    color: '#F0EDE8',
    fontSize: '0.85rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  replySend: {
    background: '#F5A623',
    border: 'none',
    borderRadius: '6px',
    padding: '0.3rem 0.7rem',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#0A0A0A',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 0',
    gap: '1rem',
    color: '#888',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid #2A2A2A',
    borderTop: '3px solid #F5A623',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
