import { supabase } from './supabase'

export type ThreadComment = {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  likes_count: number
  profiles?: { name: string | null; role: string | null; verified: boolean | null; avatar_url: string | null } | null
  children: ThreadComment[]
}

export type Reaction = { emoji: '❤️' | '🔥' | '👏'; count: number; mine: boolean }

export type FullPost = {
  id: string
  content: string
  link: string | null
  user_id: string
  created_at: string
  post_type: 'say_hi' | 'boost'
  platform: string | null
  profiles?: { name: string | null; role: string | null; verified: boolean | null; avatar_url: string | null } | null
  reactions: Reaction[]
  comment_count: number
  bookmarked: boolean
  likes_count: number
}

export async function getPostById(postId: string, currentUserId: string | null): Promise<FullPost | null> {
  const { data: post, error } = await supabase
    .from('community_posts')
    .select('id, content, link, user_id, created_at, post_type, platform, profiles(name, role, verified, avatar_url)')
    .eq('id', postId)
    .maybeSingle()
  if (error || !post) return null

  const [reactRes, commentsRes, bookmarkRes, likesRes] = await Promise.all([
    supabase.from('community_reactions').select('emoji, user_id').eq('post_id', postId),
    supabase.from('community_comments').select('id', { count: 'exact', head: true }).eq('post_id', postId),
    currentUserId
      ? supabase.from('community_bookmarks').select('id').eq('post_id', postId).eq('user_id', currentUserId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('community_likes').select('id', { count: 'exact', head: true }).eq('post_id', postId),
  ])

  const counts: Record<string, { count: number; mine: boolean }> = {}
  ;(reactRes.data || []).forEach((r: any) => {
    if (!counts[r.emoji]) counts[r.emoji] = { count: 0, mine: false }
    counts[r.emoji].count++
    if (r.user_id === currentUserId) counts[r.emoji].mine = true
  })

  const reactions: Reaction[] = (['❤️', '🔥', '👏'] as const).map(e => ({
    emoji: e,
    count: counts[e]?.count || 0,
    mine: counts[e]?.mine || false,
  }))

  return {
    ...post,
    reactions,
    comment_count: commentsRes.count || 0,
    bookmarked: !!(bookmarkRes as any)?.data,
    likes_count: likesRes.count || 0,
  } as any
}

export async function getCommentTree(postId: string): Promise<ThreadComment[]> {
  const { data, error } = await supabase
    .from('community_comments')
    .select('id, post_id, user_id, parent_id, content, created_at, profiles(name, role, verified, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error || !data) return []

  const mapped: ThreadComment[] = data.map((c: any) => ({ ...c, likes_count: 0, children: [] }))
  const byId: Record<string, ThreadComment> = {}
  mapped.forEach(c => { byId[c.id] = c })

  const roots: ThreadComment[] = []
  mapped.forEach(c => {
    if (c.parent_id && byId[c.parent_id]) byId[c.parent_id].children.push(c)
    else roots.push(c)
  })
  return roots
}

export async function addThreadComment(input: {
  postId: string
  userId: string
  content: string
  parentId: string | null
}): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('community_comments').insert({
    post_id: input.postId,
    user_id: input.userId,
    content: input.content.trim(),
    parent_id: input.parentId,
  })
  return error ? { ok: false, error: error.message } : { ok: true, error: null }
}

export async function toggleBookmark(postId: string, userId: string): Promise<{ on: boolean; error: string | null }> {
  const { data: existing } = await supabase
    .from('community_bookmarks').select('id')
    .eq('post_id', postId).eq('user_id', userId).maybeSingle()
  if (existing) {
    const { error } = await supabase.from('community_bookmarks').delete().eq('id', existing.id)
    return { on: false, error: error?.message || null }
  }
  const { error } = await supabase.from('community_bookmarks').insert({ post_id: postId, user_id: userId })
  return { on: true, error: error?.message || null }
}

export async function toggleReaction(
  postId: string, userId: string, emoji: '❤️' | '🔥' | '👏'
): Promise<{ on: boolean; error: string | null }> {
  const { data: existing } = await supabase
    .from('community_reactions').select('id')
    .eq('post_id', postId).eq('user_id', userId).eq('emoji', emoji).maybeSingle()
  if (existing) {
    const { error } = await supabase.from('community_reactions').delete().eq('id', existing.id)
    return { on: false, error: error?.message || null }
  }
  const { error } = await supabase.from('community_reactions').insert({ post_id: postId, user_id: userId, emoji })
  return { on: true, error: error?.message || null }
}
