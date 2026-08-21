import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Trash2, Link2, Send, Zap, Users, MessageSquare } from 'lucide-react'

export type CommunityPost = {
  id: string
  content: string
  link: string | null
  user_id: string
  created_at: string
  profiles?: { name: string; email?: string } | null
  comments: {
    id: string
    content: string
    user_id: string
    created_at: string
    profiles?: { name: string } | null
  }[]
  likes: { user_id: string }[]
  boosts: { user_id: string }[]
}

interface Props {
  posts: CommunityPost[]
  currentUserId: string | null
  likedPostIds: Set<string>
  boostedPostIds: Set<string>
  loading: boolean
  isPosting: boolean
  isReplying: boolean
  onCreatePost: (content: string, link: string | null) => void
  onDeletePost: (postId: string) => void
  onToggleLike: (postId: string) => void
  onToggleBoost: (postId: string) => void
  onReply: (postId: string, content: string) => void
  onDeleteReply: (postId: string, commentId: string) => void
}

export default function CommunityDesign({
  posts,
  currentUserId,
  likedPostIds,
  boostedPostIds,
  loading,
  isPosting,
  isReplying,
  onCreatePost,
  onDeletePost,
  onToggleLike,
  onToggleBoost,
  onReply,
  onDeleteReply,
}: Props) {
  const [newContent, setNewContent] = useState('')
  const [newLink, setNewLink] = useState('')
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim()) return
    onCreatePost(newContent.trim(), newLink.trim() || null)
    setNewContent('')
    setNewLink('')
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
      <div style={styles.header}>
        <h1 style={styles.title}>Community Board</h1>
        <p style={styles.subtitle}>Say hi. Ask for engagement. Show up for each other.</p>
      </div>

      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <MessageSquare size={14} color="#666" />
          <span>{totalPosts} Posts</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <Users size={14} color="#666" />
          <span>{totalCreators} Creators</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <Zap size={14} color="#F5A623" />
          <span>{totalBoosts} Boosts</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <MessageCircle size={14} color="#666" />
          <span>{totalReplies} Replies</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formRow}>
          <textarea
            placeholder="What's on your mind?"
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            style={styles.textarea}
            rows={2}
          />
          <button type="submit" disabled={isPosting || !newContent.trim()} style={styles.sendBtn}>
            {isPosting ? '...' : <Send size={18} />}
          </button>
        </div>
        <div style={styles.linkWrapper}>
          <Link2 size={14} color="#666" />
          <input
            placeholder="Optional: paste a link"
            value={newLink}
            onChange={e => setNewLink(e.target.value)}
            style={styles.linkInput}
          />
        </div>
      </form>

      <div style={styles.feed}>
        <AnimatePresence>
          {posts.length === 0 ? (
            <p style={styles.empty}>No posts yet. Start the conversation!</p>
          ) : (
            posts.map((post, index) => {
              const liked = likedPostIds.has(post.id)
              const boosted = boostedPostIds.has(post.id)
              const isOwner = post.user_id === currentUserId
              const replyKey = post.id
              const isReplyOpen = replyOpen[replyKey] || false

              return (
                <motion.div
                  key={post.id}
                  style={styles.card}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.avatar}>
                      {post.profiles?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={styles.meta}>
                      <span style={styles.name}>{post.profiles?.name || 'Unknown'}</span>
                      <span style={styles.time}>{formatTime(post.created_at)}</span>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => onDeletePost(post.id)}
                        style={styles.deleteBtn}
                        title="Delete post"
                      >
                        <Trash2 size={14} color="#E53E3E" />
                      </button>
                    )}
                  </div>

                  <p style={styles.content}>{post.content}</p>
                  {post.link && (
                    <a href={post.link} target="_blank" rel="noopener noreferrer" style={styles.link}>
                      <Link2 size={14} /> {post.link}
                    </a>
                  )}

                  <div style={styles.actions}>
                    <button
                      onClick={() => onToggleLike(post.id)}
                      style={{ ...styles.actionBtn, color: liked ? '#F5A623' : '#666' }}
                    >
                      <Heart size={16} fill={liked ? '#F5A623' : 'none'} />
                      <span>{post.likes?.length || 0}</span>
                    </button>
                    <button
                      onClick={() => onToggleBoost(post.id)}
                      style={{ ...styles.actionBtn, color: boosted ? '#F5A623' : '#666' }}
                    >
                      <Zap size={16} fill={boosted ? '#F5A623' : 'none'} />
                      <span>{post.boosts?.length || 0}</span>
                    </button>
                    <button
                      onClick={() => setReplyOpen(prev => ({ ...prev, [replyKey]: !prev[replyKey] }))}
                      style={styles.actionBtn}
                    >
                      <MessageCircle size={16} />
                      <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {isReplyOpen && (
                      <motion.div
                        style={styles.replySection}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {post.comments.map(comment => (
                          <div key={comment.id} style={styles.replyItem}>
                            <span style={styles.replyName}>
                              {comment.profiles?.name || 'Anonymous'}
                            </span>
                            <span style={styles.replyText}>{comment.content}</span>
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
                        <div style={styles.replyInputRow}>
                          <input
                            placeholder="Write a reply..."
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '740px',
    margin: '0 auto',
    padding: '1.5rem 1rem 3rem',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '700',
    fontFamily: 'Space Grotesk, sans-serif',
    margin: '0 0 0.25rem',
    color: '#F0EDE8',
  },
  subtitle: {
    color: '#666',
    fontSize: '0.9rem',
    margin: 0,
  },
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    background: 'rgba(20,20,20,0.4)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '12px',
    padding: '0.6rem 1rem',
    marginBottom: '1.5rem',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    color: '#888',
  },
  statDivider: {
    width: '1px',
    height: '20px',
    background: 'rgba(255,255,255,0.06)',
  },
  form: {
    background: 'rgba(20,20,20,0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '1rem 1.25rem',
    marginBottom: '2rem',
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.4)',
  },
  formRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
  },
  textarea: {
    flex: 1,
    background: 'rgba(10,10,10,0.6)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    color: '#F0EDE8',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '56px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    background: '#F5A623',
    border: 'none',
    borderRadius: '12px',
    padding: '0 1.2rem',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0A0A0A',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background 0.2s, transform 0.1s',
    flexShrink: 0,
  },
  linkWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.6rem',
    background: 'rgba(10,10,10,0.4)',
    borderRadius: '10px',
    padding: '0 0.75rem',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  linkInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '0.6rem 0',
    color: '#F0EDE8',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
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
    background: 'rgba(20,20,20,0.5)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '16px',
    padding: '1.25rem',
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.3)',
    transition: 'border-color 0.2s',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.6rem',
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
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)',
  },
  meta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.05rem',
  },
  name: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: '#F0EDE8',
  },
  time: {
    fontSize: '0.7rem',
    color: '#666',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.2rem',
    borderRadius: '4px',
    opacity: 0.6,
    transition: 'opacity 0.2s',
  },
  content: {
    margin: '0.2rem 0 0.6rem',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: '#DDD',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    color: '#F5A623',
    textDecoration: 'none',
    fontSize: '0.85rem',
    background: 'rgba(245,166,35,0.08)',
    padding: '0.2rem 0.7rem',
    borderRadius: '6px',
    marginBottom: '0.6rem',
    wordBreak: 'break-all',
  },
  actions: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '0.3rem',
    paddingTop: '0.6rem',
    borderTop: '1px solid rgba(255,255,255,0.04)',
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
    color: '#666',
  },
  replySection: {
    marginTop: '0.75rem',
    paddingLeft: '1rem',
    borderLeft: '2px solid rgba(245,166,35,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  replyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: '#CCC',
    padding: '0.3rem 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
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
  replyDelete: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    opacity: 0.5,
    transition: 'opacity 0.2s',
  },
  replyInputRow: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.4rem',
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    background: 'rgba(10,10,10,0.6)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    color: '#F0EDE8',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  replySend: {
    background: '#F5A623',
    border: 'none',
    borderRadius: '8px',
    padding: '0.4rem 0.7rem',
    height: '36px',
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
    color: '#666',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid #1A1A1A',
    borderTop: '3px solid #F5A623',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
