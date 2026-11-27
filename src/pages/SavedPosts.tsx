import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Loader } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { getPostById, type FullPost } from '../lib/communityThreads'
import ThreadedPostCard from '../components/community/ThreadedPostCard'
import toast from 'react-hot-toast'

export default function SavedPosts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const currentUserId = user?.id ?? null
  const [posts, setPosts] = useState<FullPost[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!currentUserId) { setLoading(false); return }
    const { data: bookmarks } = await supabase
      .from('community_bookmarks')
      .select('post_id, created_at')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })

    if (!bookmarks || bookmarks.length === 0) { setPosts([]); setLoading(false); return }

    const fulls = await Promise.all(bookmarks.map(b => getPostById(b.post_id, currentUserId)))
    setPosts(fulls.filter(Boolean) as FullPost[])
    setLoading(false)
  }

  useEffect(() => { load() }, [currentUserId])

  const onReact = async (postId: string) => {
    if (!currentUserId) { toast.error('Sign in to like'); return }
    const { toggleReaction } = await import('../lib/communityThreads')
    const r = await toggleReaction(postId, currentUserId, '❤️')
    if (r.error) { toast.error('Could not like'); return }
    setPosts(prev => prev.map(p =>
      p.id !== postId ? p : {
        ...p,
        reactions: p.reactions.map(rr =>
          rr.emoji === '❤️'
            ? { ...rr, count: rr.mine ? Math.max(0, rr.count - 1) : rr.count + 1, mine: !rr.mine }
            : rr
        ),
      }
    ))
  }

  const onBookmark = async (postId: string) => {
    if (!currentUserId) { toast.error('Sign in'); return }
    const { toggleBookmark } = await import('../lib/communityThreads')
    const r = await toggleBookmark(postId, currentUserId)
    if (r.error) { toast.error('Could not update bookmark'); return }
    toast.success(r.on ? 'Bookmarked' : 'Removed bookmark')
    await load()
  }

  return (
    <Layout>
      <div style={{ maxWidth: 700, margin: '0 auto', paddingBottom: 140 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#F5A623', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 6 }}>
            <Bookmark size={12} /> Saved
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.7rem', color: '#F5F1EA', letterSpacing: '-0.02em', margin: 0 }}>
            Your bookmarks
          </h1>
          <p style={{ color: '#8A8A8A', fontSize: '0.85rem', marginTop: 4 }}>
            Posts you've saved for later.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <Loader size={26} color="#5C5C5C" className="animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1px dashed #262626', borderRadius: 16 }}>
            <Bookmark size={26} color="#3A3A3A" />
            <p style={{ color: '#8A8A8A', fontSize: '0.88rem', marginTop: 12 }}>
              No bookmarks yet. Tap the bookmark icon on any post to save it here.
            </p>
            <button
              onClick={() => navigate('/community')}
              style={{ marginTop: 16, background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Go to community
            </button>
          </div>
        ) : (
          <div>
            {posts.map(p => (
              <ThreadedPostCard
                key={p.id}
                post={p}
                currentUserId={currentUserId}
                onReact={() => onReact(p.id)}
                onBookmark={() => onBookmark(p.id)}
                onShare={() => {
                  const url = `${window.location.origin}/post/${p.id}`
                  if (navigator.share) navigator.share({ title: p.profiles?.name || 'Post', url }).catch(() => {})
                  else navigator.clipboard.writeText(url).then(() => toast.success('Link copied'))
                }}
                onMenu={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
