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
  engagement_type: 'comment' | 'like' | 'share' | 'watch' | null
  profiles?: { name: string | null; role: string | null; verified: boolean | null; avatar_url: string | null } | null
  reactions: Reaction[]
  comment_count: number
  bookmarked: boolean
  likes_count: number
}

export async function getPostById(postId: string, currentUserId: string | null): Promise<FullPost | null> {
  const { data: post, error } = await supabase
    .from('community_posts')
    .select('id, content, link, user_id, created_at, post_type, platform, engagement_type, profiles(name, role, verified, avatar_url)')
    .eq('id', postId)
    .maybeSingle()
  if (error) { console.error('getPostById post:', error); return null }
  if (!post) return null

  // tolerant parallel fetches — a missing table must not kill the whole load
  const safe = async <T,>(fn: () => Promise<{ data: T | null; error: any; count?: number | null }>) => {
    try { return await fn() } catch { return { data: null as any, error: null, count: null } }
  }

  const reactRes = await safe(() => supabase.from('community_reactions').select('emoji, user_id').eq('post_id', postId))
  const commentsRes = await safe(() => supabase.from('community_comments').select('id', { count: 'exact', head: true }).eq('post_id', postId))
  const bookmarkRes = currentUserId
    ? await safe(() => supabase.from('community_bookmarks').select('id').eq('post_id', postId).eq('user_id', currentUserId).maybeSingle())
    : { data: null as any, error: null, count: null }
  const likesRes = await safe(() => supabase.from('community_likes').select('id', { count: 'exact', head: true }).eq('post_id', postId))

  const counts: Record<string, { count: number; mine: boolean }> = {}
  ;((reactRes.data as any[]) || []).forEach((r: any) => {
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
    ...(post as any),
    engagement_type: (post as any).engagement_type || null,
    reactions,
    comment_count: (commentsRes as any)?.count || 0,
    bookmarked: !!((bookmarkRes as any)?.data),
    likes_count: (likesRes as any)?.count || 0,
  }
}

export async function getCommentTree(postId: string): Promise<ThreadComment[]> {
  const { data, error } = await supabase
    .from('community_comments')
    .select('id, post_id, user_id, parent_id, content, created_at, profiles(name, role, verified, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) { console.error('getCommentTree:', error); return [] }
  if (!data) return []

  const mapped: ThreadComment[] = (data as any[]).map((c: any) => ({ ...c, likes_count: 0, children: [] }))
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
  if (error) { console.error('addThreadComment:', error); return { ok: false, error: error.message } }
  return { ok: true, error: null }
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

export async function getBookmarkedPosts(userId: string) {
  const { data, error } = await supabase
    .from('community_bookmarks')
    .select('post_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

export async function getMyReactions(userId: string) {
  const { data, error } = await supabase
    .from('community_reactions')
    .select('post_id, emoji')
    .eq('user_id', userId)
  if (error) return []
  return data || []
}
