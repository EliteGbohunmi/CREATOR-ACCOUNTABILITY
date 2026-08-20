import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Send, Trash2, Link2, Reply } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles: { name: string };
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  link: string;
  created_at: string;
  profiles: { id: string; name: string; email: string };
  comments: Comment[];
}

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newLink, setNewLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles!community_posts_user_id_fkey (id, name, email),
        comments: community_comments (id, content, user_id, created_at, profiles!community_comments_user_id_fkey (name))
      `)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load messages');
      console.error(error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return toast.error('Please write something');
    setSubmitting(true);
    const { data, error } = await supabase
      .from('community_posts')
      .insert([{ user_id: user!.id, content: newContent.trim(), link: newLink.trim() || null }])
      .select();
    if (error) {
      toast.error('Failed to post');
    } else {
      toast.success('Message sent');
      setNewContent('');
      setNewLink('');
      setPosts(prev => [data[0], ...prev]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    setSubmitting(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this message?')) return;
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Message deleted');
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const handleReply = async (postId: string) => {
    if (!replyContent.trim()) return toast.error('Write a reply');
    const { data, error } = await supabase
      .from('community_comments')
      .insert([{ post_id: postId, user_id: user!.id, content: replyContent.trim() }])
      .select();
    if (error) {
      toast.error('Failed to reply');
    } else {
      toast.success('Reply added');
      setReplyContent('');
      setReplyOpen(null);
      fetchPosts();
    }
  };

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>💬 Community Chat</h1>
        <p style={{ color: '#555' }}>Share your wins, ask for feedback, and connect with other creators.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ ...styles.card, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <textarea
            placeholder="What's on your mind? (required)"
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            style={{ ...styles.textarea, flex: 1 }}
            rows={2}
          />
          <button type="submit" disabled={submitting} style={styles.sendBtn}>
            <Send size={18} />
          </button>
        </div>
        <input
          placeholder="Optional: paste a link (e.g., your latest post)"
          value={newLink}
          onChange={e => setNewLink(e.target.value)}
          style={styles.input}
        />
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : posts.length === 0 ? (
        <p style={{ color: '#555', textAlign: 'center' }}>No messages yet. Start the conversation!</p>
      ) : (
        posts.map(post => (
          <div key={post.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong style={{ color: '#F0EDE8' }}>{post.profiles?.name || 'Unknown'}</strong>
                <span style={{ color: '#555', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                  {new Date(post.created_at).toLocaleString()}
                </span>
              </div>
              {post.user_id === user?.id && (
                <button onClick={() => handleDelete(post.id)} style={styles.deleteBtn}>
                  <Trash2 size={16} color="#E53E3E" />
                </button>
              )}
            </div>
            <p style={styles.postContent}>{post.content}</p>
            {post.link && (
              <a href={post.link} target="_blank" rel="noopener noreferrer" style={styles.link}>
                <Link2 size={14} /> {post.link}
              </a>
            )}

            <button onClick={() => setReplyOpen(replyOpen === post.id ? null : post.id)} style={styles.replyBtn}>
              <Reply size={14} /> <span>{post.comments.length} {post.comments.length === 1 ? 'reply' : 'replies'}</span>
            </button>

            {replyOpen === post.id && (
              <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid #2A2A2A' }}>
                {post.comments.map(c => (
                  <div key={c.id} style={{ fontSize: '0.9rem', color: '#ccc', padding: '0.3rem 0', borderBottom: '1px solid #1A1A1A' }}>
                    <strong>{c.profiles?.name || 'Anonymous'}</strong> {c.content}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    style={{ ...styles.input, flex: 1, marginTop: 0 }}
                    onKeyDown={e => { if (e.key === 'Enter') handleReply(post.id); }}
                  />
                  <button onClick={() => handleReply(post.id)} style={styles.replySendBtn}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#111111',
    border: '1px solid #1E1E1E',
    borderRadius: '14px',
    padding: '1.25rem',
    marginBottom: '1rem',
  },
  textarea: {
    background: '#0A0A0A',
    border: '1px solid #1E1E1E',
    borderRadius: '8px',
    padding: '0.75rem',
    color: '#F0EDE8',
    fontSize: '0.95rem',
    resize: 'vertical',
    fontFamily: 'inherit',
    width: '100%',
  },
  input: {
    width: '100%',
    background: '#0A0A0A',
    border: '1px solid #1E1E1E',
    borderRadius: '8px',
    padding: '0.75rem',
    color: '#F0EDE8',
    fontSize: '0.95rem',
    marginTop: '0.5rem',
  },
  sendBtn: {
    background: '#F5A623',
    color: '#0A0A0A',
    border: 'none',
    borderRadius: '8px',
    padding: '0.6rem 1rem',
    cursor: 'pointer',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
  },
  replyBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.85rem',
    marginTop: '0.5rem',
  },
  replySendBtn: {
    background: '#F5A623',
    color: '#0A0A0A',
    border: 'none',
    borderRadius: '8px',
    padding: '0.4rem 0.8rem',
    cursor: 'pointer',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
  },
  postContent: {
    color: '#F0EDE8',
    fontSize: '1rem',
    margin: '0.5rem 0',
    lineHeight: 1.5,
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    color: '#F5A623',
    fontSize: '0.9rem',
    textDecoration: 'none',
    marginBottom: '0.5rem',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
};
