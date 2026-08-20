import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Send, Trash2, Link2, MessageCircle, Heart, User } from 'lucide-react';

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [newLink, setNewLink] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyPostId, setReplyPostId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles!community_posts_user_id_fkey (id, name, email),
          comments: community_comments (id, content, user_id, created_at, profiles!community_comments_user_id_fkey (name))
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      toast.error('Please write something');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert([{ user_id: user!.id, content: newContent.trim(), link: newLink.trim() || null }])
        .select();
      if (error) throw error;
      toast.success('Message sent');
      setNewContent('');
      setNewLink('');
      setPosts(prev => [data[0], ...prev]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      toast.error('Failed to post');
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
    if (!replyContent.trim()) {
      toast.error('Write a reply');
      return;
    }
    try {
      await supabase
        .from('community_comments')
        .insert([{ post_id: postId, user_id: user!.id, content: replyContent.trim() }]);
      toast.success('Reply added');
      setReplyContent('');
      setReplyPostId(null);
      fetchPosts();
    } catch (err) {
      toast.error('Failed to reply');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const isLiked = likedPosts.has(postId);
      const { data: existing } = await supabase
        .from('community_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('community_likes').delete().eq('id', existing.id);
        setLikedPosts(prev => { const newSet = new Set(prev); newSet.delete(postId); return newSet; });
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes: p.likes?.filter((l: any) => l.user_id !== user!.id) || [] } : p
        ));
      } else {
        await supabase.from('community_likes').insert([{ post_id: postId, user_id: user!.id }]);
        setLikedPosts(prev => new Set(prev).add(postId));
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes: [...(p.likes || []), { user_id: user!.id }] } : p
        ));
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
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>💬 Community</h1>
          <p style={styles.subtitle}>Share your wins, ask for feedback, and connect with creators.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputRow}>
            <textarea
              placeholder="What's on your mind?"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              style={styles.textarea}
              rows={2}
            />
            <button type="submit" style={styles.sendBtn}>
              <Send size={18} />
            </button>
          </div>
          <div style={styles.linkInputWrapper}>
            <Link2 size={16} color="#666" style={{ flexShrink: 0 }} />
            <input
              placeholder="Paste a link (optional)"
              value={newLink}
              onChange={e => setNewLink(e.target.value)}
              style={styles.linkInput}
            />
          </div>
        </form>

        {posts.length === 0 ? (
          <p style={styles.empty}>No messages yet. Start the conversation!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} style={styles.messageCard}>
              <div style={styles.messageHeader}>
                <div style={styles.avatar}>
                  {post.profiles?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={styles.meta}>
                  <span style={styles.sender}>{post.profiles?.name || 'Unknown'}</span>
                  <span style={styles.time}>{formatTime(post.created_at)}</span>
                </div>
                {post.user_id === user?.id && (
                  <button onClick={() => handleDelete(post.id)} style={styles.deleteBtn}>
                    <Trash2 size={16} color="#E53E3E" />
                  </button>
                )}
              </div>

              <p style={styles.content}>{post.content}</p>

              {post.link && (
                <div style={styles.linkContainer}>
                  <Link2 size={14} color="#F5A623" />
                  <a href={post.link} target="_blank" rel="noopener noreferrer" style={styles.link}>
                    {post.link}
                  </a>
                </div>
              )}

              <div style={styles.actionBar}>
                <button onClick={() => handleLike(post.id)} style={styles.actionBtn}>
                  <Heart size={16} color={likedPosts.has(post.id) ? '#F5A623' : '#666'} />
                  <span>{post.likes?.length || 0}</span>
                </button>
                <button onClick={() => setReplyPostId(replyPostId === post.id ? null : post.id)} style={styles.actionBtn}>
                  <MessageCircle size={16} color="#666" />
                  <span>{post.comments?.length || 0}</span>
                </button>
              </div>

              {replyPostId === post.id && (
                <div style={styles.replyThread}>
                  {(post.comments || []).map((c: any) => (
                    <div key={c.id} style={styles.replyItem}>
                      <span style={styles.replySender}>{c.profiles?.name || 'Anonymous'}</span>
                      <span style={styles.replyText}>{c.content}</span>
                    </div>
                  ))}
                  <div style={styles.replyInputRow}>
                    <input
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      style={styles.replyInput}
                    />
                    <button onClick={() => handleReply(post.id)} style={styles.replySendBtn}>
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
    color: '#555',
    margin: '0.3rem 0 0',
    fontSize: '0.9rem',
  },
  form: {
    background: '#181818',
    borderRadius: '16px',
    padding: '1.25rem',
    marginBottom: '2rem',
    border: '1px solid #2A2A2A',
    boxShadow: '0 0 20px rgba(245, 166, 35, 0.06)',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  inputRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
  },
  textarea: {
    flex: 1,
    background: '#0A0A0A',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    padding: '0.85rem 1rem',
    color: '#F0EDE8',
    fontSize: '0.95rem',
    resize: 'vertical',
    fontFamily: 'inherit',
    minHeight: '60px',
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  sendBtn: {
    background: '#F5A623',
    border: 'none',
    borderRadius: '12px',
    padding: '0 1.2rem',
    cursor: 'pointer',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0A0A0A',
    fontWeight: '600',
    transition: 'background 0.2s, transform 0.1s',
    flexShrink: 0,
  },
  linkInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    background: '#0A0A0A',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    padding: '0 0.85rem',
    marginTop: '0.6rem',
    transition: 'border-color 0.3s',
  },
  linkInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '0.7rem 0',
    color: '#F0EDE8',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  empty: {
    color: '#555',
    textAlign: 'center',
    padding: '2rem 0',
  },
  messageCard: {
    background: '#1A1A1A',
    borderRadius: '16px',
    padding: '1.25rem 1.5rem',
    marginBottom: '1.25rem',
    border: '1px solid #2A2A2A',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.6rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '0.05rem',
  },
  sender: {
    fontWeight: '600',
    fontSize: '0.95rem',
    color: '#F0EDE8',
  },
  time: {
    fontSize: '0.7rem',
    color: '#666',
  },
  content: {
    margin: '0.2rem 0 0.6rem',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: '#DDD',
  },
  linkContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#0D0D0D',
    padding: '0.55rem 0.85rem',
    borderRadius: '8px',
    marginBottom: '0.75rem',
    border: '1px solid #2A2A2A',
  },
  link: {
    color: '#F5A623',
    fontSize: '0.85rem',
    textDecoration: 'none',
    wordBreak: 'break-all',
    flex: 1,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.2rem',
    borderRadius: '4px',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  actionBar: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '0.3rem',
    paddingTop: '0.6rem',
    borderTop: '1px solid #282828',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    padding: '0.2rem 0.1rem',
    transition: 'color 0.2s',
  },
  replyThread: {
    marginTop: '0.75rem',
    paddingLeft: '1rem',
    borderLeft: '2px solid #2A2A2A',
  },
  replyItem: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.9rem',
    padding: '0.3rem 0',
    borderBottom: '1px solid #1A1A1A',
    color: '#CCC',
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
  replyInputRow: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    background: '#0A0A0A',
    border: '1px solid #2A2A2A',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
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
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0A0A0A',
    flexShrink: 0,
  },
  loading: {
    padding: '2rem',
    color: '#888',
    textAlign: 'center',
  },
};
