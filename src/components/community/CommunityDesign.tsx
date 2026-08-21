import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, MessageCircle, Trash2, Link2, Send, Zap, Users, MessageSquare,
  Flame, Hand, ExternalLink, Plus
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
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.label}>
          <Flame size={18} color="#F4A719" />
          Community
        </div>
        <h1 style={styles.title}>Creator Community</h1>
        <p style={styles.description}>
          Say hi. Ask for engagement. Show up for each other.
        </p>
        <p style={styles.subDescription}>
          Introduce yourself, drop the post you just shipped, and tell creators exactly how to support it.
        </p>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statNumber}>{totalPosts}</span>
          <span style={styles.statLabel}>Posts</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statNumber}>{totalCreators}</span>
          <span style={styles.statLabel}>Creators</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statNumber}>{totalBoosts}</span>
          <span style={styles.statLabel}>Boosts</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statNumber}>{totalReplies}</span>
          <span style={styles.statLabel}>Replies</span>
        </div>
      </div>

      {/* Composer */}
      <div style={styles.composer}>
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

        <form onSubmit={handleSubmit}>
          <textarea
            placeholder={
              postType === 'say_hi'
                ? "Say hi – who are you, what are you building, what's your niche?"
                : "What's your post about? Why should people engage?"
            }
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            style={styles.textarea}
            rows={4}
          />
          <div style={styles.composerFooter}>
            <span style={styles.charCounter}>{newContent.length}/2000</span>
            <button type="submit" disabled={isPosting || !newContent.trim()} style={styles.publishBtn}>
              {isPosting ? '...' : 'Say hi'}
            </button>
          </div>

          {postType === 'boost' && (
            <div style={styles.boostFields}>
              <div style={styles.fieldRow}>
                <Link2 size={16} color="#666" />
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
      </div>

      {/* Filter tabs */}
      <div style={styles.feedTabs}>
        <button
          style={{ ...styles.feedTab, ...(filter === 'all' ? styles.feedTabActive : {}) }}
          onClick={() => onFilterChange('all')}
        >
          Everything
        </button>
        <button
          style={{ ...styles.feedTab, ...(filter === 'boost' ? styles.feedTabActive : {}) }}
          onClick={() => onFilterChange('boost')}
        >
          Boosts
        </button>
        <button
          style={{ ...styles.feedTab, ...(filter === 'mine' ? styles.feedTabActive : {}) }}
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
                  style={{ ...styles.postCard, ...(isBoost ? styles.boostedPost : {}) }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Header */}
                  <div style={styles.postHeader}>
                    <div style={styles.postAuthor}>
                      <div style={styles.avatar}>
                        {post.profiles?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={styles.authorInfo}>
                        <div style={styles.authorName}>
                          {post.profiles?.name || 'Unknown'}
                          {isBoost && <span style={styles.boostBadge}>BOOST</span>}
                        </div>
                        <span style={styles.postTime}>{formatTime(post.created_at)}</span>
                      </div>
                    </div>
                    {isOwner && (
                      <button onClick={() => onDeletePost(post.id)} style={styles.deleteBtn}>
                        <Trash2 size={18} color="#8b8986" />
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <p style={styles.postContent}>{post.content}</p>

                  {/* Link preview */}
                  {isBoost && post.link && (
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.linkPreview}
                    >
                      <div style={styles.linkInfo}>
                        <div style={styles.linkDomain}>{post.platform || 'Link'}</div>
                        <div style={styles.linkUrl}>{post.link}</div>
                      </div>
                      <div style={styles.linkAction}>
                        <ExternalLink size={16} />
                        Visit
                      </div>
                    </a>
                  )}

                  {/* Footer actions */}
                  <div style={styles.postFooter}>
                    <button
                      onClick={() => onToggleLike(post.id)}
                      style={{ ...styles.postAction, ...(liked ? styles.postActionLiked : {}) }}
                    >
                      <Heart size={20} fill={liked ? '#F4A719' : 'none'} />
                      {post.likes?.length || 0}
                    </button>
                    <button
                      onClick={() => setReplyOpen(prev => ({ ...prev, [replyKey]: !prev[replyKey] }))}
                      style={styles.postAction}
                    >
                      <MessageCircle size={20} />
                      {post.comments?.length || 0}
                    </button>
                    {isBoost && (
                      <>
                        <button
                          onClick={() => onToggleEngagement(post.id)}
                          style={{
                            ...styles.postAction,
                            background: engaged ? 'rgba(244,167,25,0.15)' : 'transparent',
                            color: engaged ? '#F4A719' : '#85827f',
                            padding: '4px 12px',
                            borderRadius: '20px',
                          }}
                        >
                          {engaged ? '✓ Engaged' : 'I engaged'}
                        </button>
                        <span style={styles.engagedCount}>
                          {engagementCount} {engagementCount === 1 ? 'creator' : 'creators'} engaged
                        </span>
                      </>
                    )}
                  </div>

                  {/* Replies */}
                  <AnimatePresence>
                    {isReplyOpen && (
                      <motion.div
                        style={styles.commentSection}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {repliesToShow.map(comment => (
                          <div key={comment.id} style={styles.comment}>
                            <div style={styles.commentHeader}>
                              <span style={styles.commentName}>
                                {comment.user_id === currentUserId ? 'You' : comment.profiles?.name || 'Anonymous'}
                              </span>
                              <span>{formatTime(comment.created_at)}</span>
                              {comment.user_id === currentUserId && (
                                <button
                                  onClick={() => onDeleteReply(post.id, comment.id)}
                                  style={styles.replyDelete}
                                >
                                  <Trash2 size={14} color="#8b8986" />
                                </button>
                              )}
                            </div>
                            <p style={styles.commentText}>{comment.content}</p>
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
                        <div style={styles.commentInputWrapper}>
                          <input
                            placeholder="Say something useful..."
                            value={replyContent[replyKey] || ''}
                            onChange={e =>
                              setReplyContent(prev => ({ ...prev, [replyKey]: e.target.value }))
                            }
                            style={styles.commentInput}
                          />
                          <button
                            onClick={() => {
                              const content = (replyContent[replyKey] || '').trim()
                              if (!content) return
                              onReply(post.id, content)
                              setReplyContent(prev => ({ ...prev, [replyKey]: '' }))
                            }}
                            disabled={isReplying}
                            style={styles.commentSend}
                          >
                            <Send size={18} color="#171717" />
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

      {/* Floating action button */}
      <button style={styles.floatingAdd}>
        <Plus size={32} strokeWidth={2.5} />
      </button>
    </div>
  )
}

// ---- Styles (exact match to your CSS) ----
const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    maxWidth: '620px',
    minHeight: '100vh',
    margin: '0 auto',
    padding: '34px 26px 110px',
    fontFamily: '"DM Sans", sans-serif',
    color: '#f4f2ee',
  },
  header: {
    marginBottom: '30px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    color: '#F4A719',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
  },
  title: {
    maxWidth: '570px',
    color: '#f4f2ee',
    fontFamily: 'Impact, "Arial Narrow", sans-serif',
    fontSize: 'clamp(35px, 7vw, 48px)',
    fontWeight: 900,
    lineHeight: 0.98,
    letterSpacing: '-1.2px',
    textTransform: 'uppercase',
  },
  description: {
    maxWidth: '570px',
    marginTop: '25px',
    color: '#9d9b98',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '17px',
    fontWeight: 500,
    lineHeight: 1.7,
  },
  subDescription: {
    maxWidth: '570px',
    marginTop: '5px',
    color: '#888',
    fontSize: '14px',
    fontFamily: '"Space Grotesk", sans-serif',
    fontWeight: 400,
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginTop: '30px',
  },
  stat: {
    minHeight: '92px',
    padding: '18px 14px',
    border: '1px solid #303030',
    borderRadius: '22px',
    background: 'rgba(18,18,18,0.7)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  statNumber: {
    display: 'block',
    color: '#f2f0ed',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '27px',
    fontWeight: 600,
    lineHeight: 1,
  },
  statLabel: {
    display: 'block',
    marginTop: '13px',
    color: '#9c9a97',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '13px',
    fontWeight: 500,
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  composer: {
    marginTop: '42px',
    padding: '26px',
    border: '1px solid #343434',
    borderRadius: '30px',
    background: '#121212',
  },
  composerTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
  },
  composerTab: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    minHeight: '54px',
    padding: '0 22px',
    border: '1px solid #323232',
    borderRadius: '30px',
    background: 'transparent',
    color: '#9d9a96',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  composerTabActive: {
    borderColor: '#F4A719',
    background: '#F4A719',
    color: '#171717',
  },
  textarea: {
    width: '100%',
    minHeight: '168px',
    padding: '26px 25px',
    resize: 'none',
    outline: 'none',
    border: '1px solid #333',
    borderRadius: '22px',
    background: '#111',
    color: '#eee',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '17px',
    fontWeight: 500,
    lineHeight: 1.65,
    transition: 'border-color 0.2s ease',
  },
  composerFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '24px',
  },
  charCounter: {
    color: '#aaa7a3',
    fontSize: '14px',
  },
  publishBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minWidth: '145px',
    minHeight: '58px',
    padding: '0 24px',
    borderRadius: '17px',
    background: '#F4A719',
    color: '#171717',
    fontFamily: '"Space Grotesk", sans-serif',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    border: 'none',
  },
  boostFields: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#111',
    borderRadius: '16px',
    padding: '0 16px',
    border: '1px solid #333',
  },
  linkInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '14px 0',
    color: '#eee',
    fontSize: '15px',
    outline: 'none',
    fontFamily: '"DM Sans", sans-serif',
  },
  select: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '14px 0',
    color: '#eee',
    fontSize: '15px',
    outline: 'none',
    fontFamily: '"DM Sans", sans-serif',
    cursor: 'pointer',
  },
  feedTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '38px 0 28px',
  },
  feedTab: {
    height: '55px',
    padding: '0 23px',
    border: '1px solid #333',
    borderRadius: '30px',
    background: 'transparent',
    color: '#85827e',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  feedTabActive: {
    borderColor: '#F4A719',
    color: '#F4A719',
    background: 'rgba(244,167,25,0.03)',
  },
  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    padding: '3rem 0',
    fontFamily: '"DM Sans", sans-serif',
  },
  postCard: {
    position: 'relative',
    marginBottom: '22px',
    padding: '29px',
    border: '1px solid #303030',
    borderRadius: '30px',
    background: '#121212',
    overflow: 'hidden',
  },
  boostedPost: {
    borderColor: '#3b3428',
  },
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '17px',
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '64px',
    height: '64px',
    border: '2px solid #d68c14',
    borderRadius: '50%',
    background: '#171717',
    color: '#F4A719',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '20px',
    fontWeight: 600,
  },
  authorInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  authorName: {
    color: '#eee',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '18px',
    fontWeight: 600,
  },
  boostBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '7px',
    padding: '6px 10px',
    borderRadius: '8px',
    background: 'rgba(244,167,25,0.15)',
    color: '#F4A719',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.6px',
  },
  postTime: {
    color: '#888581',
    fontSize: '13px',
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '47px',
    height: '47px',
    border: '1px solid #343434',
    borderRadius: '16px',
    background: 'transparent',
    color: '#8b8986',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  postContent: {
    marginTop: '28px',
    color: '#e9e6e2',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '19px',
    fontWeight: 500,
    lineHeight: 1.8,
  },
  linkPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '25px',
    padding: '22px',
    border: '1px solid #333',
    borderRadius: '22px',
    background: '#101010',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  linkInfo: {
    minWidth: 0,
  },
  linkDomain: {
    marginBottom: '8px',
    color: '#e5e2de',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '15px',
    fontWeight: 600,
  },
  linkUrl: {
    maxWidth: '370px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    color: '#878480',
    fontSize: '13px',
  },
  linkAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#F4A719',
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  postFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
    marginTop: '27px',
  },
  postAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    color: '#85827f',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    border: 'none',
  },
  postActionLiked: {
    color: '#F4A719',
  },
  engagedCount: {
    fontSize: '13px',
    color: '#85827f',
  },
  commentSection: {
    marginTop: '22px',
    paddingTop: '22px',
    borderTop: '1px solid #2b2b2b',
  },
  comment: {
    marginBottom: '16px',
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#a5a29e',
    fontSize: '14px',
  },
  commentName: {
    color: '#eee',
    fontWeight: 600,
  },
  commentText: {
    marginTop: '6px',
    color: '#ddd',
    fontSize: '15px',
    lineHeight: 1.6,
  },
  replyDelete: {
    background: 'none',
    border: 'none',
    color: '#8b8986',
    cursor: 'pointer',
  },
  showMoreBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 0',
    fontFamily: '"DM Sans", sans-serif',
  },
  commentInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '18px',
  },
  commentInput: {
    flex: 1,
    minHeight: '58px',
    padding: '0 20px',
    border: '1px solid #333',
    borderRadius: '19px',
    outline: 'none',
    background: '#101010',
    color: '#eee',
    fontSize: '14px',
    fontFamily: '"DM Sans", sans-serif',
  },
  commentSend: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    borderRadius: '18px',
    background: '#F4A719',
    color: '#171717',
    border: 'none',
    cursor: 'pointer',
  },
  floatingAdd: {
    position: 'fixed',
    right: 'max(25px, calc((100vw - 620px) / 2 - 5px))',
    bottom: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '74px',
    height: '74px',
    borderRadius: '50%',
    background: '#F4A719',
    color: '#191919',
    border: 'none',
    boxShadow: '0 0 0 8px rgba(244,167,25,0.04), 0 10px 35px rgba(244,167,25,0.25)',
    fontSize: '40px',
    fontWeight: 300,
    zIndex: 100,
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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
    borderTop: '3px solid #F4A719',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
