import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Send, Trash2, Link2, Reply } from 'lucide-react';

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [newLink, setNewLink] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyPostId, setReplyPostId] = useState<string | null>(null);
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
          <input
            placeholder="Optional: paste a link"
            value={newLink}
            onChange={e => setNewLink(e.target.value)}
            style={styles.linkInput}
          />
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
                  <span style={styles.time}>
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
                {post.user_id === user?.id && (
                  <button onClick={() => handleDelete(post.id)} style={styles.deleteBtn}>
                    <Trash2 size={16} color="#E53E3E" />
                  </button>
                )}
              </div>
              <p style={styles.content}>{post.content}</p>
              {post.link && (
                <a href={post.link} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  <Link2 size={14} /> {post.link}
                </a>
              )}
              <button
                onClick={() => setReplyPostId(replyPostId === post.id ? null : post.id)}
                style={styles.replyToggle}
              >
                <Reply size={14} /> {post.comments?.length || 0} replies
              </button>
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
    maxWidth: '800px',
    margin: '0 auto',
    padding: '1rem 0',
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
    background: '#1C1C1C',
    borderRadius: '16px',
    padding: '1rem',
    marginBottom: '2rem',
    border: '1px solid #2A2A2A',
  },
  inputRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
  textarea: {
    flex: 1,
    background: '#0A0A0A',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    padding: '0.75rem',
    color: '#F0EDE8',
    fontSize: '0.95rem',
    resize: 'vertical',
    fontFamily: 'inherit',
    minHeight: '60px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    background: '#F5A623',
    border: 'none',
    borderRadius: '12px',
    padding: '0.6rem 1rem',
    cursor: 'pointer',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0A0A0A',
    fontWeight: '600',
    transition: 'background 0.2s',
  },
  linkInput: {
    width: '100%',
    background: '#0A0A0A',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    padding: '0.75rem',
    color: '#F0EDE8',
    fontSize: '0.9rem',
    marginTop: '0.5rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  empty: {
    color: '#555',
    textAlign: 'center',
    padding: '2rem 0',
  },
  messageCard: {
    background: '#1A1A1A',
    borderRadius: '16px',
    padding: '1rem 1.25rem',
    marginBottom: '1rem',
    border: '1px solid #2A2A2A',
    transition: 'border-color 0.2s',
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#F5A623',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '0.9rem',
    color: '#0A0A0A',
    flexShrink: 0,
  },
  meta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
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
    margin: '0.3rem 0 0.5rem',
    fontSize: '0.95rem',
    lineHeight: 1.5,
    color: '#DDD',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    color: '#F5A623',
    fontSize: '0.85rem',
    textDecoration: 'none',
    marginBottom: '0.5rem',
    wordBreak: 'break-all',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.2rem',
    borderRadius: '4px',
    transition: 'background 0.2s',
  },
  replyToggle: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.85rem',
    padding: '0.2rem 0',
    marginTop: '0.3rem',
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
  },
  replyText: {
    color: '#CCC',
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
  },
  loading: {
    padding: '2rem',
    color: '#888',
    textAlign: 'center',
  },
};
