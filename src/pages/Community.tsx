import { useEffect, useState } from 'react';
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
      // silent fail – show empty list
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
        <div style={{ padding: '2rem', color: '#888' }}>Loading community...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', fontWeight: '700' }}>💬 Community Chat</h1>
        <p style={{ color: '#555' }}>Share your wins, ask for feedback, and connect with other creators.</p>
      </div>

      <form onSubmit={handleSubmit} style={cardStyle}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <textarea
            placeholder="What's on your mind? (required)"
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            style={{ ...inputStyle, flex: 1, minHeight: '60px' }}
            rows={2}
          />
          <button type="submit" style={buttonStyle}><Send size={18} /></button>
        </div>
        <input
          placeholder="Optional: paste a link"
          value={newLink}
          onChange={e => setNewLink(e.target.value)}
          style={inputStyle}
        />
      </form>

      {posts.length === 0 ? (
        <p style={{ color: '#555', textAlign: 'center' }}>No messages yet. Be the first!</p>
      ) : (
        posts.map(post => (
          <div key={post.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#F0EDE8' }}>{post.profiles?.name || 'Unknown'}</strong>
                <span style={{ color: '#555', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                  {new Date(post.created_at).toLocaleString()}
                </span>
              </div>
              {post.user_id === user?.id && (
                <button onClick={() => handleDelete(post.id)} style={{ background: 'none', border: 'none', color: '#E53E3E', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <p style={{ margin: '0.5rem 0', color: '#F0EDE8' }}>{post.content}</p>
            {post.link && (
              <a href={post.link} target="_blank" rel="noopener noreferrer" style={{ color: '#F5A623', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Link2 size={14} /> {post.link}
              </a>
            )}
            <button onClick={() => setReplyPostId(replyPostId === post.id ? null : post.id)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Reply size={14} /> {post.comments?.length || 0} replies
            </button>
            {replyPostId === post.id && (
              <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid #2A2A2A' }}>
                {(post.comments || []).map((c: any) => (
                  <div key={c.id} style={{ fontSize: '0.9rem', color: '#ccc', padding: '0.2rem 0', borderBottom: '1px solid #1A1A1A' }}>
                    <strong>{c.profiles?.name || 'Anonymous'}</strong> {c.content}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button onClick={() => handleReply(post.id)} style={buttonStyle}><Send size={16} /></button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </Layout>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#111111',
  border: '1px solid #1E1E1E',
  borderRadius: '14px',
  padding: '1.25rem',
  marginBottom: '1rem',
};

const inputStyle: React.CSSProperties = {
  background: '#0A0A0A',
  border: '1px solid #1E1E1E',
  borderRadius: '8px',
  padding: '0.75rem',
  color: '#F0EDE8',
  fontSize: '0.95rem',
  width: '100%',
  marginTop: '0.5rem',
  fontFamily: 'inherit',
};

const buttonStyle: React.CSSProperties = {
  background: '#F5A623',
  color: '#0A0A0A',
  border: 'none',
  borderRadius: '8px',
  padding: '0.6rem 1rem',
  cursor: 'pointer',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
};
