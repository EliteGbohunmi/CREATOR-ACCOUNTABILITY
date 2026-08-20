import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Send, Trash2, Link2, MessageCircle, Heart, ExternalLink, Plus, X } from 'lucide-react';

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [newLink, setNewLink] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyPostId, setReplyPostId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [composerFocused, setComposerFocused] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showComposeFab, setShowComposeFab] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_LENGTH = 2000;

  const fetchPosts = async () => {
    try {
      // Base query: posts + comments only (this is the shape that was already working).
      const { data: postsData, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles!community_posts_user_id_fkey (id, name, email),
          comments: community_comments (id, content, user_id, created_at, profiles!community_comments_user_id_fkey (name))
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;

      let rows = postsData || [];

      // Sort each post's comments oldest-first client-side (avoids relying on
      // ordering embedded/foreign-table rows at the query level).
      rows = rows.map((p: any) => ({
        ...p,
        comments: [...(p.comments || [])].sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      }));

      // Likes fetched separately (own query, own table) so a missing/ambiguous
      // relationship on community_likes can't break the whole feed load.
      const postIds = rows.map((p: any) => p.id);
      let likesByPost: Record<string, any[]> = {};
      if (postIds.length > 0) {
        const { data: likesData, error: likesError } = await supabase
          .from('community_likes')
          .select('id, post_id, user_id')
          .in('post_id', postIds);
        if (likesError) {
          // Don't fail the whole feed just because likes couldn't load.
          console.error('Failed to load likes', likesError);
        } else {
          likesByPost = (likesData || []).reduce((acc: Record<string, any[]>, like: any) => {
            (acc[like.post_id] ||= []).push(like);
            return acc;
          }, {});
        }
      }

      rows = rows.map((p: any) => ({ ...p, likes: likesByPost[p.id] || [] }));
      setPosts(rows);

      if (user) {
        const liked = new Set<string>();
        rows.forEach((p: any) => {
          if ((p.likes || []).some((l: any) => l.user_id === user.id)) liked.add(p.id);
        });
        setLikedPosts(liked);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('community-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_likes' }, () => fetchPosts())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const onScroll = () => setShowComposeFab(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToCompose = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => textareaRef.current?.focus(), 350);
  };

  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    const sameYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: sameYear ? undefined : 'numeric',
    });
  };

  const sanitizeLink = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (/^javascript:/i.test(trimmed)) return null;
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const url = new URL(withScheme);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      return url.toString();
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPosting) return;
    if (!newContent.trim()) {
      toast.error('Please write something');
      return;
    }
    if (!user) {
      toast.error('You need to be signed in to post');
      return;
    }

    let link: string | null = null;
    if (newLink.trim()) {
      link = sanitizeLink(newLink);
      if (!link) {
        toast.error('Please enter a valid link');
        return;
      }
    }

    setIsPosting(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert([{ user_id: user.id, content: newContent.trim(), link }])
        .select();
      if (error) throw error;
      toast.success('Message sent');
      setNewContent('');
      setNewLink('');
      setPosts(prev => [{ ...data[0], comments: [], likes: [] }, ...prev]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      toast.error('Failed to post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await supabase.from('community_posts').delete().eq('id', postId);
      toast.success('Deleted');
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleReply = async (postId: string) => {
    if (isReplying) return;
    if (!replyContent.trim()) {
      toast.error('Write a reply');
      return;
    }
    if (!user) {
      toast.error('You need to be signed in to reply');
      return;
    }
    setIsReplying(true);
    try {
      await supabase
        .from('community_comments')
        .insert([{ post_id: postId, user_id: user.id, content: replyContent.trim() }]);
      toast.success('Reply added');
      setReplyContent('');
      setReplyPostId(null);
      fetchPosts();
    } catch (err) {
      toast.error('Failed to reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteReply = async (postId: string, commentId: string) => {
    try {
      await supabase.from('community_comments').delete().eq('id', commentId);
      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, comments: (p.comments || []).filter((c: any) => c.id !== commentId) } : p
        )
      );
    } catch (err) {
      toast.error('Failed to delete reply');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const existingLike = (post.likes || []).find((l: any) => l.user_id === user.id);

    try {
      if (existingLike) {
        await supabase.from('community_likes').delete().eq('id', existingLike.id);
        setLikedPosts(prev => { const s = new Set(prev); s.delete(postId); return s; });
        setPosts(prev =>
          prev.map(p =>
            p.id === postId ? { ...p, likes: (p.likes || []).filter((l: any) => l.id !== existingLike.id) } : p
          )
        );
      } else {
        const { data, error } = await supabase
          .from('community_likes')
          .insert([{ post_id: postId, user_id: user.id }])
          .select();
        if (error) throw error;
        const newLike = data?.[0] || { user_id: user.id };
        setLikedPosts(prev => new Set(prev).add(postId));
        setPosts(prev =>
          prev.map(p => (p.id === postId ? { ...p, likes: [...(p.likes || []), newLike] } : p))
        );
      }
    } catch (err) {
      toast.error('Failed to like');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>Loading community...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>{`
        .composer-shell {
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }
        .composer-shell.is-focused {
          border-color: #F5A623 !important;
          box-shadow: 0 0 0 1px rgba(245, 166, 35, 0.35), 0 0 24px rgba(245, 166, 35, 0.18);
        }
        .composer-textarea:focus, .composer-link:focus, .reply-input:focus {
          outline: none;
        }
        .send-btn { transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease; }
        .send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(245, 166, 35, 0.35); }
        .send-btn:active:not(:disabled) { transform: translateY(0); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .msg-card { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .msg-card:hover { border-color: #3A3A3A; box-shadow: 0 4px 20px rgba(0,0,0,0.25); }

        .link-chip { transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; text-decoration: none; }
        .link-chip:hover { border-color: #F5A623; box-shadow: 0 0 16px rgba(245, 166, 35, 0.22); background: rgba(245, 166, 35, 0.1); }

        .action-btn { transition: background 0.2s ease, color 0.2s ease; }
        .action-btn:hover { background: #232323; color: #F0EDE8; }
        .action-btn.is-active { color: #F5A623; }

        .delete-btn { transition: background 0.2s ease, border-color 0.2s ease; }
        .delete-btn:hover { background: rgba(229, 62, 62, 0.12); border-color: #E53E3E; }

        .reply-delete-btn { transition: opacity 0.2s ease; opacity: 0.5; }
        .reply-delete-btn:hover { opacity: 1; }

        .reply-send-btn { transition: transform 0.15s ease, opacity 0.15s ease; }
        .reply-send-btn:hover:not(:disabled) { transform: translateY(-1px); }

        .compose-fab {
          transition: opacity 0.25s ease, transform 0.25s ease, box-shadow 0.2s ease;
        }
        .compose-fab:hover { box-shadow: 0 6px 24px rgba(245, 166, 35, 0.45); transform: translateY(-2px); }
      `}</style>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>💬 Community</h1>
          <p style={styles.subtitle}>Share your wins, ask for feedback, and connect with creators.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`composer-shell${composerFocused ? ' is-focused' : ''}`}
          style={styles.form}
        >
          <textarea
            ref={textareaRef}
            className="composer-textarea"
            placeholder="What's on your mind?"
            value={newContent}
            maxLength={MAX_LENGTH}
            onChange={e => setNewContent(e.target.value)}
            onFocus={() => setComposerFocused(true)}
            onBlur={() => setComposerFocused(false)}
            style={styles.textarea}
            rows={3}
          />
          <div style={styles.charCount}>{newContent.length}/{MAX_LENGTH}</div>

          <div style={styles.composerFooter}>
            <div style={styles.linkInputWrapper}>
              <Link2 size={15} color="#F5A623" style={{ flexShrink: 0 }} />
              <input
                className="composer-link"
                placeholder="Attach a link (optional)"
                value={newLink}
                onChange={e => setNewLink(e.target.value)}
                onFocus={() => setComposerFocused(true)}
                onBlur={() => setComposerFocused(false)}
                style={styles.linkInput}
              />
            </div>

            <button type="submit" className="send-btn" disabled={!newContent.trim() || isPosting} style={styles.sendBtn}>
              <span>{isPosting ? 'Posting…' : 'Post'}</span>
              <Send size={16} />
            </button>
          </div>
        </form>

        {posts.length === 0 ? (
          <p style={styles.empty}>No messages yet. Start the conversation!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="msg-card" style={styles.messageCard}>
              <div style={styles.messageHeader}>
                <div style={styles.avatar}>
                  {post.profiles?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={styles.meta}>
                  <span style={styles.sender}>{post.profiles?.name || 'Unknown'}</span>
                  <span style={styles.time}>{formatTime(post.created_at)}</span>
                </div>
                {post.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="delete-btn"
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={14} color="#E53E3E" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              <p style={styles.content}>{post.content}</p>

              {post.link && (
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-chip"
                  style={styles.linkChip}
                >
                  <div style={styles.linkChipLeft}>
                    <Link2 size={15} color="#F5A623" />
                    <span style={styles.linkChipText}>{post.link}</span>
                  </div>
                  <ExternalLink size={14} color="#F5A623" style={{ flexShrink: 0 }} />
                </a>
              )}

              <div style={styles.actionBar}>
                <button
                  onClick={() => handleLike(post.id)}
                  className={`action-btn${likedPosts.has(post.id) ? ' is-active' : ''}`}
                  style={styles.actionBtn}
                >
                  <Heart
                    size={16}
                    color={likedPosts.has(post.id) ? '#F5A623' : '#888'}
                    fill={likedPosts.has(post.id) ? '#F5A623' : 'none'}
                  />
                  <span>{post.likes?.length || 0} {post.likes?.length === 1 ? 'Like' : 'Likes'}</span>
                </button>
                <button
                  onClick={() => setReplyPostId(replyPostId === post.id ? null : post.id)}
                  className={`action-btn${replyPostId === post.id ? ' is-active' : ''}`}
                  style={styles.actionBtn}
                >
                  <MessageCircle size={16} color={replyPostId === post.id ? '#F5A623' : '#888'} />
                  <span>{post.comments?.length || 0} {post.comments?.length === 1 ? 'Reply' : 'Replies'}</span>
                </button>
              </div>

              {replyPostId === post.id && (
                <div style={styles.replyThread}>
                  {(post.comments || []).map((c: any) => (
                    <div key={c.id} style={styles.replyItem}>
                      <div style={styles.replyTextGroup}>
                        <span style={styles.replySender}>{c.profiles?.name || 'Anonymous'}</span>
                        <span style={styles.replyText}>{c.content}</span>
                      </div>
                      {c.user_id === user?.id && (
                        <button
                          onClick={() => handleDeleteReply(post.id, c.id)}
                          className="reply-delete-btn"
                          style={styles.replyDeleteBtn}
                        >
                          <X size={13} color="#888" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div style={styles.replyInputRow}>
                    <input
                      className="reply-input"
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      style={styles.replyInput}
                    />
                    <button
                      onClick={() => handleReply(post.id)}
                      className="reply-send-btn"
                      disabled={!replyContent.trim() || isReplying}
                      style={styles.replySendBtn}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {showComposeFab && (
        <button className="compose-fab" onClick={scrollToCompose} style={styles.composeFab} aria-label="New post">
          <Plus size={22} color="#0A0A0A" />
        </button>
      )}
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '820px',
    margin: '0 auto',
    padding: '1.5rem 0 2rem',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.8rem',
    fontFamily: 'Space Grotesk',
    fontWeight: '700',
    margin: 0,
    color: '#F0EDE8',
  },
  subtitle: {
    color: '#888',
    margin: '0.3rem 0 0',
    fontSize: '0.9rem',
  },
  form: {
    background: '#161616',
    borderRadius: '18px',
    padding: '1.4rem',
    marginBottom: '2.5rem',
    border: '1px solid #2A2A2A',
    boxShadow: '0 0 20px rgba(245, 166, 35, 0.05)',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#0A0A0A',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    padding: '0.9rem 1rem',
    color: '#F0EDE8',
    fontSize: '0.95rem',
    resize: 'vertical',
    fontFamily: 'inherit',
    minHeight: '70px',
    outline: 'none',
  },
  charCount: {
    textAlign: 'right',
    fontSize: '0.72rem',
    color: '#555',
    marginTop: '0.3rem',
  },
  composerFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  linkInputWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    background: '#0A0A0A',
    border: '1px solid #2A2A2A',
    borderRadius: '10px',
    padding: '0 0.85rem',
  },
  linkInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '0.6rem 0',
    color: '#F0EDE8',
    fontSize: '0.85rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    background: '#F5A623',
    border: 'none',
    borderRadius: '10px',
    padding: '0 1.4rem',
    cursor: 'pointer',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    color: '#0A0A0A',
    fontWeight: '600',
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  empty: {
    color: '#555',
    textAlign: 'center',
    padding: '2rem 0',
  },
  messageCard: {
    background: '#1A1A1A',
    borderRadius: '18px',
    padding: '1.5rem 1.6rem',
    marginBottom: '1.5rem',
    border: '1px solid #2A2A2A',
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    marginBottom: '0.9rem',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: '#F5A623',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '1rem',
    color: '#0A0A0A',
    flexShrink: 0,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.15rem',
  },
  sender: {
    fontWeight: '600',
    fontSize: '0.95rem',
    color: '#F0EDE8',
    lineHeight: 1.2,
  },
  time: {
    fontSize: '0.75rem',
    color: '#777',
    lineHeight: 1.2,
  },
  deleteBtn: {
    background: 'transparent',
    border: '1px solid #2A2A2A',
    borderRadius: '8px',
    cursor: 'pointer',
    padding: '0.4rem 0.7rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    color: '#E53E3E',
    fontSize: '0.78rem',
    fontWeight: '500',
    flexShrink: 0,
  },
  content: {
    margin: '0 0 1rem',
    fontSize: '0.97rem',
    lineHeight: 1.65,
    color: '#DDD',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  linkChip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    background: 'rgba(245, 166, 35, 0.06)',
    padding: '0.7rem 1rem',
    borderRadius: '10px',
    marginBottom: '1.1rem',
    border: '1px solid rgba(245, 166, 35, 0.3)',
  },
  linkChipLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    minWidth: 0,
  },
  linkChipText: {
    color: '#F5A623',
    fontSize: '0.85rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  actionBar: {
    display: 'flex',
    gap: '0.75rem',
    paddingTop: '0.9rem',
    borderTop: '1px solid #262626',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontSize: '0.85rem',
    padding: '0.45rem 0.8rem',
    borderRadius: '8px',
  },
  replyThread: {
    marginTop: '1rem',
    paddingLeft: '1.1rem',
    borderLeft: '2px solid #2A2A2A',
  },
  replyItem: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.5rem',
    fontSize: '0.9rem',
    padding: '0.45rem 0',
    borderBottom: '1px solid #1E1E1E',
    color: '#CCC',
  },
  replyTextGroup: {
    display: 'flex',
    gap: '0.5rem',
    minWidth: 0,
  },
  replySender: {
    fontWeight: '600',
    color: '#F0EDE8',
    flexShrink: 0,
  },
  replyText: {
    color: '#CCC',
    wordBreak: 'break-word',
  },
  replyDeleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.15rem',
    flexShrink: 0,
  },
  replyInputRow: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.6rem',
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    background: '#0A0A0A',
    border: '1px solid #2A2A2A',
    borderRadius: '8px',
    padding: '0.55rem 0.8rem',
    color: '#F0EDE8',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  replySendBtn: {
    background: '#F5A623',
    border: 'none',
    borderRadius: '8px',
    padding: '0.4rem 0.7rem',
    cursor: 'pointer',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0A0A0A',
    flexShrink: 0,
  },
  composeFab: {
    position: 'fixed',
    bottom: '5.5rem',
    right: '2rem',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#F5A623',
    border: 'none',
    boxShadow: '0 4px 18px rgba(245, 166, 35, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 50,
  },
  loading: {
    padding: '2rem',
    color: '#888',
    textAlign: 'center',
  },
};
