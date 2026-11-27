import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck, MoreHorizontal, Heart, MessageCircle,
  Send, Bookmark, ChevronDown, Sparkles, Megaphone,
} from 'lucide-react'
import type { FullPost } from '../../lib/communityThreads'

const c = {
  bg: '#141414', border: '#4A3B18', divider: '#2E2E2E',
  text: '#F5F5F5', dim: '#A1A1AA', faint: '#71717A',
  gold: '#E3A008', goldSoft: '#2E2610', pill: '#1F1F1F',
  coral: '#F87171',
}

const AVATAR_COLORS = ['#E3A008', '#6FA8F5', '#F56F91', '#6FCB73', '#B98CF5']
function avatarBg(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean)
  if (!p.length) return '?'
  if (p.length === 1) return p[0][0]?.toUpperCase() || '?'
  return (p[0][0] + p[1][0]).toUpperCase()
}
function relDate(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h'
  if (diff < 604_800_000) return Math.floor(diff / 86_400_000) + 'd'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
function typeLabel(post: FullPost) {
  if (post.post_type === 'boost') {
    return post.engagement_type ? `Boost · ${post.engagement_type}` : 'Boost'
  }
  if (post.engagement_type) return `Say hi · ${post.engagement_type}`
  return 'Say hi'
}
function typeIcon(post: FullPost) {
  return post.post_type === 'boost'
    ? <Megaphone size={12} color={c.faint} />
    : <Sparkles size={12} color={c.faint} />
}

interface Props {
  post: FullPost
  currentUserId: string | null
  onReact: () => void
  onBookmark: () => void
  onShare: () => void
  onMenu: () => void
}

export default function ThreadedPostCard({ post, currentUserId, onReact, onBookmark, onShare, onMenu }: Props) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const name = post.profiles?.name || 'Anonymous'
  const role = post.profiles?.role || ''
  const verified = post.profiles?.verified
  const avatarUrl = post.profiles?.avatar_url
  const goDetail = () => navigate(`/post/${post.id}`)

  const likeCount = post.reactions.find(r => r.emoji === '❤️')?.count ?? post.likes_count ?? 0
  const liked = post.reactions.find(r => r.emoji === '❤️')?.mine || false
  const long = post.content.length > 220
  const body = expanded || !long ? post.content : post.content.slice(0, 220).trimEnd() + '…'

  return (
    <article
      style={{
        background: c.bg, border: `1px solid ${c.border}`, borderRadius: 16,
        padding: 16, marginBottom: 14,
        transition: 'border-color 200ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#5F4D20' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {typeIcon(post)}
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.dim }}>
            {typeLabel(post)}
          </span>
        </div>
        <span style={{ fontSize: 11, color: c.faint }}>{relDate(post.created_at)}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.user_id}`) }}
          style={{
            width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
            background: avatarUrl ? 'transparent' : avatarBg(name),
            border: 'none', padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: '#0A0A0A', fontWeight: 700, fontSize: 14,
            fontFamily: 'Space Grotesk',
          }}
          aria-label={`View ${name}'s profile`}
        >
          {avatarUrl ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
            {verified && <BadgeCheck size={14} color="#3B82F6" fill="#3B82F6" stroke="#141414" />}
          </div>
          {role && <div style={{ fontSize: 12, color: c.dim, marginTop: 1 }}>{role}</div>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onMenu() }}
          style={{ width: 32, height: 32, borderRadius: '50%', background: '#262626', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          aria-label="More actions"
        >
          <MoreHorizontal size={16} color={c.dim} />
        </button>
      </div>

      <div
        onClick={goDetail}
        style={{ color: c.text, fontSize: 15, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 12, cursor: 'pointer' }}
      >
        {body}
        {long && !expanded && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
            style={{ background: 'none', border: 'none', color: c.gold, fontWeight: 700, fontSize: 15, cursor: 'pointer', padding: 0, marginLeft: 4 }}
          >
            Show more
          </button>
        )}
      </div>

      <div style={{ borderTop: `1px dashed ${c.divider}`, margin: '4px 0 12px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onReact() }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: liked ? c.goldSoft : 'transparent',
            border: `1px solid ${liked ? c.gold : 'transparent'}`,
            borderRadius: 999, padding: '5px 10px', cursor: 'pointer',
            color: liked ? c.gold : c.dim,
          }}
          aria-label="Like"
        >
          <Heart size={15} fill={liked ? c.gold : 'none'} />
          <span style={{ fontWeight: 700, fontSize: 12 }}>{likeCount}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goDetail() }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: c.dim, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
          aria-label="View comments"
        >
          <MessageCircle size={16} /> {post.comment_count}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onShare() }}
          style={{ background: 'none', border: 'none', color: c.coral, cursor: 'pointer', padding: 0 }}
          aria-label="Share"
        >
          <Send size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onBookmark() }}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
          aria-label="Bookmark"
        >
          <Bookmark size={18} color={post.bookmarked ? c.gold : c.dim} fill={post.bookmarked ? c.gold : 'none'} />
        </button>
      </div>

      {post.comment_count > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goDetail() }}
          style={{ marginTop: 12, width: '100%', background: c.pill, border: 'none', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex' }}>
            {[0, 1, 2].slice(0, Math.min(3, post.comment_count)).map((i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], border: `1.5px solid ${c.pill}`, marginLeft: i === 0 ? 0 : -6 }} />
            ))}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: c.text, flex: 1, textAlign: 'left' }}>
            View {post.comment_count} {post.comment_count === 1 ? 'reply' : 'replies'}
          </span>
          <ChevronDown size={16} color={c.dim} />
        </button>
      )}
    </article>
  )
}
