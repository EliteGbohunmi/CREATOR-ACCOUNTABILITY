import { useState } from 'react'
import { Heart, CornerDownRight, BadgeCheck } from 'lucide-react'
import type { ThreadComment } from '../../lib/communityThreads'

const c = {
  text: '#F5F5F5',
  dim: '#A1A1AA',
  faint: '#71717A',
  gold: '#E3A008',
  line: '#2A2A2A',
  surface: '#141414',
  border: '#262626',
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
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'now'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h'
  if (diff < 604_800_000) return Math.floor(diff / 86_400_000) + 'd'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

interface Props {
  comment: ThreadComment
  depth: number
  currentUserId: string | null
  onReply: (parentId: string, content: string) => Promise<void>
  onLike: (commentId: string) => void
}

export default function ThreadedComment({ comment, depth, currentUserId, onReply, onLike }: Props) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const name = comment.profiles?.name || 'Anonymous'
  const role = comment.profiles?.role || ''
  const verified = comment.profiles?.verified
  const avatarUrl = comment.profiles?.avatar_url

  const submit = async () => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    await onReply(comment.id, body)
    setSending(false)
    setDraft('')
    setReplyOpen(false)
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0, marginTop: 12, position: 'relative' }}>
      {depth > 0 && (
        <div style={{ position: 'absolute', left: -12, top: 4, bottom: 4, width: 1, background: c.line }} />
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: avatarUrl ? 'transparent' : avatarBg(name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0A0A0A', fontWeight: 700, fontSize: 12, fontFamily: 'Space Grotesk',
            overflow: 'hidden',
          }}
        >
          {avatarUrl ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: c.text }}>{name}</span>
            {verified && <BadgeCheck size={12} color="#3B82F6" fill="#3B82F6" stroke={c.surface} />}
            {role && <span style={{ fontSize: 11, color: c.faint }}>· {role}</span>}
            <span style={{ fontSize: 11, color: c.faint }}>· {timeAgo(comment.created_at)}</span>
          </div>
          <p style={{ margin: '4px 0 6px', fontSize: 14, lineHeight: 1.5, color: '#D8D5D0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {comment.content}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => onLike(comment.id)}
              style={{ background: 'none', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4, color: c.dim, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              <Heart size={12} /> {comment.likes_count || 0}
            </button>
            <button
              onClick={() => setReplyOpen(v => !v)}
              style={{ background: 'none', border: 'none', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4, color: replyOpen ? c.gold : c.dim, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              <CornerDownRight size={12} /> Reply
            </button>
          </div>

          {replyOpen && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
                placeholder={`Reply to ${name}…`}
                style={{
                  flex: 1, background: c.surface, border: `1px solid ${c.border}`,
                  borderRadius: 8, padding: '6px 10px', color: c.text,
                  fontSize: 13, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={submit}
                disabled={!draft.trim() || sending}
                style={{
                  background: c.gold, color: '#0A0A0A', border: 'none',
                  borderRadius: 8, padding: '6px 12px', fontWeight: 700,
                  fontSize: 12, cursor: draft.trim() ? 'pointer' : 'not-allowed',
                  opacity: draft.trim() ? 1 : 0.4,
                }}
              >
                {sending ? '…' : 'Reply'}
              </button>
            </div>
          )}

          {comment.children.map(child => (
            <ThreadedComment
              key={child.id}
              comment={child}
              depth={depth + 1}
              currentUserId={currentUserId}
              onReply={onReply}
              onLike={onLike}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
