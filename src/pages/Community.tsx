import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Layout from '../components/Layout'
import CommunityDesign, { type CommunityPost } from '../components/community/CommunityDesign'

export default function Community() {
  const { user } = useAuth()
  const currentUserId = user?.id ?? null

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [boostedPostIds, setBoostedPostIds] = useState<Set<string>>(new Set())

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        id,
        content,
        link,
        user_id,
        created_at,
        profiles!community_posts_user_id_fkey ( name, email ),
        community_comments (
          id,
          content,
          user_id,
          created_at,
          profiles!community_comments_user_id_fkey ( name )
        ),
        community_likes ( id, user_id ),
        community_boosts ( id, user_id )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      toast.error("Couldn't load the community board")
      setLoading(false)
      return
    }

    const rows = (data ?? []) as any[]

    const mapped: CommunityPost[] = rows.map((row) => ({
      id: row.id,
      content: row.content,
      link: row.link,
      user_id: row.user_id,
      created_at: row.created_at,
      profiles: row.profiles,
      comments: (row.community_comments ?? [])
        .map((cm: any) => ({
          id: cm.id,
          content: cm.content,
          user_id: cm.user_id,
          created_at: cm.created_at,
          profiles: cm.profiles,
        }))
        .sort(
          (a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      likes: row.community_likes ?? [],
      boosts: row.community_boosts ?? [],
    }))

    setPosts(mapped)
    setLikedPostIds(
      new Set(
        mapped
          .filter((p) => p.likes?.some((l) => l.user_id === currentUserId))
          .map((p) => p.id)
      )
    )
    setBoostedPostIds(
      new Set(
        mapped
          .filter((p) => p.boosts?.some((b) => b.user_id === currentUserId))
          .map((p) => p.id)
      )
    )
    setLoading(false)
  }, [currentUserId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    const channel = supabase
      .channel('community-board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_comments' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_likes' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_boosts' },
        () => fetchPosts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPosts])

  const onCreatePost = async (content: string, link: string | null) => {
    if (!currentUserId) {
      toast.error('Sign in to post')
      return
    }
    setIsPosting(true)
    const { error } = await supabase
      .from('community_posts')
      .insert({ content, link, user_id: currentUserId })
    setIsPosting(false)
    if (error) {
      console.error(error)
      toast.error("Couldn't post that")
      return
    }
    toast.success('Posted to the community board')
    fetchPosts()
  }

  const onDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)
    if (error) {
      console.error(error)
      toast.error("Couldn't delete that post")
      return
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    toast.success('Post deleted')
  }

  const onToggleLike = async (postId: string) => {
    if (!currentUserId) {
      toast.error('Sign in to react')
      return
    }
    const liked = likedPostIds.has(postId)

    setLikedPostIds((prev) => {
      const next = new Set(prev)
      liked ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              likes: liked
                ? (p.likes ?? []).filter((l) => l.user_id !== currentUserId)
                : [...(p.likes ?? []), { user_id: currentUserId }],
            }
      )
    )

    const { error } = liked
      ? await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
      : await supabase
          .from('community_likes')
          .insert({ post_id: postId, user_id: currentUserId })

    if (error) {
      console.error(error)
      toast.error("Couldn't update your reaction")
      fetchPosts()
    }
  }

  const onToggleBoost = async (postId: string) => {
    if (!currentUserId) {
      toast.error('Sign in to boost')
      return
    }
    const boosted = boostedPostIds.has(postId)

    setBoostedPostIds((prev) => {
      const next = new Set(prev)
      boosted ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              boosts: boosted
                ? (p.boosts ?? []).filter((b) => b.user_id !== currentUserId)
                : [...(p.boosts ?? []), { user_id: currentUserId }],
            }
      )
    )

    const { error } = boosted
      ? await supabase
          .from('community_boosts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
      : await supabase
          .from('community_boosts')
          .insert({ post_id: postId, user_id: currentUserId })

    if (error) {
      console.error(error)
      toast.error("Couldn't update your boost")
      fetchPosts()
    }
  }

  const onReply = async (postId: string, content: string) => {
    if (!currentUserId) {
      toast.error('Sign in to reply')
      return
    }
    setIsReplying(true)
    const { error } = await supabase
      .from('community_comments')
      .insert({ post_id: postId, content, user_id: currentUserId })
    setIsReplying(false)
    if (error) {
      console.error(error)
      toast.error("Couldn't send that reply")
      return
    }
    fetchPosts()
  }

  const onDeleteReply = async (_postId: string, commentId: string) => {
    const { error } = await supabase
      .from('community_comments')
      .delete()
      .eq('id', commentId)
    if (error) {
      console.error(error)
      toast.error("Couldn't delete that reply")
      return
    }
    fetchPosts()
  }

  const view = useMemo(() => posts, [posts])

  return (
    <Layout>
      <CommunityDesign
        posts={view}
        currentUserId={currentUserId}
        likedPostIds={likedPostIds}
        boostedPostIds={boostedPostIds}
        loading={loading}
        isPosting={isPosting}
        isReplying={isReplying}
        onCreatePost={onCreatePost}
        onDeletePost={onDeletePost}
        onToggleLike={onToggleLike}
        onToggleBoost={onToggleBoost}
        onReply={onReply}
        onDeleteReply={onDeleteReply}
      />
    </Layout>
  )
}
