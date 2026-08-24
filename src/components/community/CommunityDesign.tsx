import { useState, useMemo, useRef } from "react";
import {
  Send,
  Trash2,
  Link2,
  MessageCircle,
  Heart,
  ExternalLink,
  Plus,
  X,
  Sparkles,
  Megaphone,
  Users,
  Zap,
} from "lucide-react";

export type CommunityPost = {
  id: string;
  content: string;
  link: string | null;
  user_id: string;
  created_at: string;
  post_type: 'say_hi' | 'boost';
  platform: string | null;
  engagement_type: 'comment' | 'like' | 'share' | 'watch' | null;
  engaged_by: string[];
  profiles?: { name: string; email?: string; streak_days?: number; avatar_url?: string | null } | null;
  comments: {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    profiles?: { name: string; avatar_url?: string | null } | null;
  }[];
  likes: { user_id: string }[];
  boosts: { user_id: string }[];
  engagements: { user_id: string }[];
};

interface Props {
  posts: CommunityPost[];
  currentUserId: string | null;
  likedPostIds: Set<string>;
  boostedPostIds: Set<string>;
  engagedPostIds: Set<string>;
  loading: boolean;
  isPosting: boolean;
  isReplying: boolean;
  filter: 'all' | 'say_hi' | 'boost' | 'mine';
  platformFilter: string;
  sortBy: 'newest' | 'needs_engagement';
  onFilterChange: (filter: 'all' | 'say_hi' | 'boost' | 'mine') => void;
  onPlatformFilterChange: (platform: string) => void;
  onSortChange: (sort: 'newest' | 'needs_engagement') => void;
  onCreatePost: (content: string, link: string | null, postType: 'say_hi' | 'boost', platform: string | null, engagementType: string | null) => void;
  onDeletePost: (postId: string) => void;
  onToggleLike: (postId: string) => void;
  onToggleBoost: (postId: string) => void;
  onToggleEngagement: (postId: string) => void;
  onReply: (postId: string, content: string) => void;
  onDeleteReply: (postId: string, commentId: string) => void;
  onViewProfile: (userId: string) => void;
}

const PLATFORMS = ['X', 'TikTok', 'YouTube', 'Instagram', 'LinkedIn', 'Substack'];
const ENGAGEMENT_TYPES = ['comment', 'like', 'share', 'watch'];
const MAX_LENGTH = 2000;

const c = {
  bg: "#0B0B0C",
  card: "#141416",
  raise: "#1B1B1F",
  sunk: "#0E0E10",
  line: "#232327",
  lineSoft: "#1C1C20",
  text: "#F2EFEA",
  dim: "#9A9AA0",
  muted: "#75757C",
  accent: "#F5A623",
  accentSoft: "rgba(245, 166, 35, 0.12)",
  danger: "#E5544B",
};

function getInitials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago';
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago';
  if (diff < 604_800_000) return Math.floor(diff / 86_400_000) + 'd ago';
  return new Date(date).toLocaleDateString();
}

function hostOf(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

export default function CommunityDesign({
  posts,
  currentUserId,
  likedPostIds,
  boostedPostIds,
  engagedPostIds,
  loading,
  isPosting,
  isReplying,
  filter,
  platformFilter,
  sortBy,
  onFilterChange,
  onPlatformFilterChange,
  onSortChange,
  onCreatePost,
  onDeletePost,
  onToggleLike,
  onToggleBoost,
  onToggleEngagement,
  onReply,
  onDeleteReply,
  onViewProfile,
}: Props) {
  const [mode, setMode] = useState<'say_hi' | 'boost'>('say_hi');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [platform, setPlatform] = useState('');
  const [engagementType, setEngagementType] = useState('');
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [showAllReplies, setShowAllReplies] = useState<Record<string, boolean>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => ({
    posts: posts.length,
    creators: new Set(posts.map(p => p.user_id)).size,
    boosts: posts.reduce((acc, p) => acc + (p.boosts?.length || 0), 0),
    replies: posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0),
  }), [posts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('Please write something.');
      return;
    }
    if (mode === 'boost' && !link.trim()) {
      alert('Please paste a link to your post.');
      return;
    }
    await onCreatePost(
      content.trim(),
      link.trim() || null,
      mode,
      mode === 'boost' ? platform || null : null,
      mode === 'boost' ? engagementType || null : null
    );
    setContent('');
    setLink('');
    setPlatform('');
    setEngagementType('');
  };

  const submitReply = async (postId: string) => {
    const draft = replyDraft[postId]?.trim();
    if (!draft || isReplying) return;
    await onReply(postId, draft);
    setReplyDraft(prev => ({ ...prev, [postId]: '' }));
  };

  const visiblePosts = useMemo(() => {
    let result = posts;
    if (filter === 'say_hi') result = result.filter(p => p.post_type === 'say_hi');
    if (filter === 'boost') result = result.filter(p => p.post_type === 'boost');
    if (filter === 'mine') result = result.filter(p => p.user_id === currentUserId);
    if (platformFilter) result = result.filter(p => p.platform === platformFilter);
    return result;
  }, [posts, filter, platformFilter, currentUserId]);

  const sortedPosts = useMemo(() => {
    if (sortBy === 'needs_engagement') {
      return [...visiblePosts].sort((a, b) => (a.engagements?.length || 0) - (b.engagements?.length || 0));
    }
    return [...visiblePosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [visiblePosts, sortBy]);

  if (loading) {
    return (
      <div style={s.loading}>
        <div style={s.spinner} />
        <span>Loading community board...</span>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{css}</style>

      <header style={s.hero}>
        <div style={s.heroKicker}>
          <Users size={13} color={c.accent} />
          <span>Creator community</span>
        </div>
        <h1 style={s.heroTitle}>Say hi. Ask for engagement. Show up for each other.</h1>
        <p style={s.heroSub}>
          Introduce yourself, drop the post you just shipped, and tell creators exactly how to support it.
        </p>
        <div style={s.statRow}>
          <Stat label="Posts" value={stats.posts} />
          <Stat label="Creators" value={stats.creators} />
          <Stat label="Boosts" value={stats.boosts} />
          <Stat label="Replies" value={stats.replies} />
        </div>
      </header>

      <form onSubmit={handleSubmit} style={s.composer} className="cd-card">
        <div style={s.modeRow}>
          <button
            type="button"
            onClick={() => setMode('say_hi')}
            className={`cd-mode${mode === 'say_hi' ? ' is-on' : ''}`}
          >
            <Sparkles size={14} /> Say hi
          </button>
          <button
            type="button"
            onClick={() => setMode('boost')}
            className={`cd-mode${mode === 'boost' ? ' is-on' : ''}`}
          >
            <Megaphone size={14} /> Boost my post
          </button>
        </div>

        <textarea
          ref={textareaRef}
          className="cd-input"
          rows={mode === 'boost' ? 4 : 3}
          maxLength={MAX_LENGTH}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            mode === 'boost'
              ? "What did you just post, and what kind of engagement helps most?"
              : "Say hi — who are you, what are you building, what's your niche?"
          }
          style={s.textarea}
        />

        {mode === 'boost' && (
          <>
            <div style={s.askRow}>
              {ENGAGEMENT_TYPES.map((a) => (
                <button key={a} type="button" className="cd-chip" onClick={() => setEngagementType(a)}>
                  {a}
                </button>
              ))}
            </div>
            <div style={s.linkWrap} className="cd-linkwrap">
              <Link2 size={15} color={c.accent} />
              <input
                className="cd-input"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Paste the link to your post"
                style={s.linkInput}
              />
            </div>
            <div style={s.linkWrap} className="cd-linkwrap">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                style={s.select}
              >
                <option value="">Platform</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </>
        )}

        <div style={s.composerFooter}>
          <span style={s.count}>
            {content.length}/{MAX_LENGTH}
          </span>
          <button type="submit" className="cd-send" disabled={!content.trim() || isPosting}>
            <Send size={15} />
            {isPosting ? 'Posting…' : mode === 'boost' ? 'Post boost' : 'Say hi'}
          </button>
        </div>
      </form>

      <div style={s.filterRow}>
        {(['all', 'boost', 'mine'] as const).map((key) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`cd-filter${filter === key ? ' is-on' : ''}`}
          >
            {key === 'all' ? 'Everything' : key === 'boost' ? 'Boosts' : 'Mine'}
          </button>
        ))}
        <select
          value={platformFilter}
          onChange={(e) => onPlatformFilterChange(e.target.value)}
          style={s.filterSelect}
        >
          <option value="">All platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'newest' | 'needs_engagement')}
          style={s.filterSelect}
        >
          <option value="newest">Newest</option>
          <option value="needs_engagement">Needs engagement</option>
        </select>
      </div>

      {sortedPosts.length === 0 ? (
        <div style={s.empty} className="cd-card">
          <Sparkles size={20} color={c.accent} />
          <p style={s.emptyTitle}>Nothing here yet</p>
          <p style={s.emptyText}>Be the first to say hi — the board rewards whoever starts.</p>
        </div>
      ) : (
        <div style={s.feed}>
          {sortedPosts.map((post) => {
            const liked = likedPostIds.has(post.id);
            const boosted = boostedPostIds.has(post.id);
            const engaged = engagedPostIds.has(post.id);
            const isOwner = post.user_id === currentUserId;
            const isBoost = post.post_type === 'boost';
            const open = replyOpen[post.id] || false;
            const repliesToShow = showAllReplies[post.id] ? post.comments : post.comments.slice(0, 2);

            const avatarUrl = post.profiles?.avatar_url;
            const name = post.profiles?.name || 'Anonymous';

            return (
              <article key={post.id} style={s.post} className="cd-card cd-post">
                <div style={s.postHead}>
                  <div
                    style={s.clickableArea}
                    onClick={() => {
                      console.log('👤 Clicked post author:', post.user_id);
                      onViewProfile(post.user_id);
                    }}
                    title="View profile"
                  >
                    <div style={s.avatarRing}>
                      <div style={{ ...s.avatar, overflow: 'hidden', background: avatarUrl ? 'transparent' : c.sunk }}>
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement!;
                              parent.textContent = getInitials(name);
                              parent.style.background = c.sunk;
                              parent.style.color = c.accent;
                              parent.style.fontWeight = '700';
                              parent.style.fontSize = '0.82rem';
                              parent.style.display = 'flex';
                              parent.style.alignItems = 'center';
                              parent.style.justifyContent = 'center';
                            }}
                          />
                        ) : (
                          getInitials(name)
                        )}
                      </div>
                    </div>
                    <div style={s.who}>
                      <div style={s.nameRow}>
                        <span style={s.name}>{name}</span>
                        {isOwner && <span style={s.youTag}>you</span>}
                        {isBoost && <span style={s.boostTag}>boost</span>}
                      </div>
                      <span style={s.time}>{formatTime(post.created_at)}</span>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      className="cd-del"
                      onClick={(e) => { e.stopPropagation(); onDeletePost(post.id); }}
                      aria-label="Delete post"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <p style={s.content}>{post.content}</p>

                {post.link && (
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cd-linkcard"
                    style={s.linkCard}
                  >
                    <div style={s.linkCardMeta}>
                      <span style={s.linkHost}>{post.platform || hostOf(post.link)}</span>
                      <span style={s.linkUrl}>{post.link}</span>
                    </div>
                    <span style={s.engageBtn}>
                      Engage <ExternalLink size={13} />
                    </span>
                  </a>
                )}

                <div style={s.actions}>
                  <button
                    className={`cd-action${liked ? ' is-on' : ''}`}
                    onClick={() => onToggleLike(post.id)}
                  >
                    <Heart size={15} fill={liked ? c.accent : 'none'} />
                    {post.likes?.length || 0}
                  </button>
                  <button
                    className={`cd-action${open ? ' is-on' : ''}`}
                    onClick={() => setReplyOpen(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  >
                    <MessageCircle size={15} />
                    {post.comments?.length || 0}
                  </button>
                  {isBoost && (
                    <>
                      <button
                        className={`cd-action${boosted ? ' is-on' : ''}`}
                        onClick={() => onToggleBoost(post.id)}
                      >
                        <Zap size={15} fill={boosted ? c.accent : 'none'} />
                        {post.boosts?.length || 0}
                      </button>
                      <button
                        className={`cd-action${engaged ? ' is-on' : ''}`}
                        onClick={() => onToggleEngagement(post.id)}
                      >
                        {engaged ? '✓ Engaged' : 'I engaged'}
                      </button>
                      <span style={s.engagedCount}>
                        {post.engagements?.length || 0} creators engaged
                      </span>
                    </>
                  )}
                  {post.comments.length > 0 && !open && (
                    <button className="cd-ghost" onClick={() => setReplyOpen(prev => ({ ...prev, [post.id]: true }))}>
                      View thread
                    </button>
                  )}
                </div>

                {open && (
                  <div style={s.thread}>
                    {repliesToShow.map((cm) => {
                      const commenterName = cm.user_id === currentUserId ? 'You' : cm.profiles?.name || 'Anonymous';
                      const commenterAvatar = cm.profiles?.avatar_url;

                      return (
                        <div key={cm.id} style={s.reply}>
                          <div
                            style={s.replyAvatarRing}
                            onClick={() => {
                              console.log('👤 Clicked reply author:', cm.user_id);
                              onViewProfile(cm.user_id);
                            }}
                            title="View profile"
                          >
                            <div style={{ ...s.replyAvatar, overflow: 'hidden', background: commenterAvatar ? 'transparent' : c.sunk }}>
                              {commenterAvatar ? (
                                <img
                                  src={commenterAvatar}
                                  alt={commenterName}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement!;
                                    parent.textContent = getInitials(commenterName);
                                    parent.style.background = c.sunk;
                                    parent.style.color = c.accent;
                                    parent.style.fontWeight = '700';
                                    parent.style.fontSize = '0.7rem';
                                    parent.style.display = 'flex';
                                    parent.style.alignItems = 'center';
                                    parent.style.justifyContent = 'center';
                                  }}
                                />
                              ) : (
                                getInitials(commenterName)
                              )}
                            </div>
                          </div>

                          <div style={s.replyBody}>
                            <div style={s.replyMeta}>
                              <span
                                style={{ ...s.replyName, cursor: 'pointer' }}
                                onClick={() => {
                                  console.log('👤 Clicked reply name:', cm.user_id);
                                  onViewProfile(cm.user_id);
                                }}
                                title="View profile"
                              >
                                {commenterName}
                              </span>
                              <span style={s.replyTime}>{formatTime(cm.created_at)}</span>
                            </div>
                            <p style={s.replyText}>{cm.content}</p>
                          </div>
                          {cm.user_id === currentUserId && (
                            <button
                              className="cd-del sm"
                              onClick={() => onDeleteReply(post.id, cm.id)}
                              aria-label="Delete reply"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {post.comments.length > 2 && (
                      <button
                        className="cd-ghost"
                        onClick={() => setShowAllReplies(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      >
                        {showAllReplies[post.id] ? 'Show less' : `Show ${post.comments.length - 2} more`}
                      </button>
                    )}
                    <div style={s.replyRow}>
                      <input
                        className="cd-input"
                        value={replyDraft[post.id] || ''}
                        onChange={(e) => setReplyDraft(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void submitReply(post.id);
                          }
                        }}
                        placeholder="Say something useful…"
                        style={s.replyInput}
                      />
                      <button
                        className="cd-send sm"
                        disabled={!replyDraft[post.id]?.trim() || isReplying}
                        onClick={() => void submitReply(post.id)}
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <button
        className="cd-fab"
        aria-label="New post"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => textareaRef.current?.focus(), 350);
        }}
      >
        <Plus size={22} />
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={s.stat}>
      <span style={s.statValue}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  );
}

const css = `
.cd-card { background:${c.card}; border:1px solid ${c.line}; border-radius:20px; }
.cd-post { transition: border-color .2s ease, transform .2s ease; }
.cd-post:hover { border-color:#2E2E34; transform: translateY(-1px); }
.cd-input { font-family: inherit; background: transparent; border: none; color:${c.text}; outline: none; }
.cd-input::placeholder { color:${c.muted}; }
.cd-mode { display:inline-flex; align-items:center; gap:.4rem; padding:.45rem .8rem; border-radius:999px;
  border:1px solid ${c.line}; background:${c.sunk}; color:${c.muted}; font:inherit; font-size:.8rem; cursor:pointer;
  transition: all .18s ease; }
.cd-mode:hover { color:${c.text}; }
.cd-mode.is-on { color:#100E0A; background:${c.accent}; border-color:${c.accent}; font-weight:600; }
.cd-chip { padding:.3rem .65rem; border-radius:999px; border:1px dashed ${c.line}; background:transparent;
  color:${c.muted}; font:inherit; font-size:.75rem; cursor:pointer; transition: all .18s ease; }
.cd-chip:hover { color:${c.accent}; border-color:${c.accent}; background:${c.accentSoft}; }
.cd-linkwrap:focus-within { border-color:${c.accent} !important; }
.cd-send { display:inline-flex; align-items:center; gap:.45rem; background:${c.accent}; color:#100E0A; border:none;
  border-radius:12px; padding:.6rem 1.1rem; font:inherit; font-size:.85rem; font-weight:600; cursor:pointer;
  transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease; }
.cd-send:hover:not(:disabled) { transform: translateY(-1px); box-shadow:0 8px 20px rgba(245,166,35,.28); }
.cd-send:disabled { opacity:.35; cursor:not-allowed; }
.cd-send.sm { padding:.5rem .6rem; border-radius:10px; }
.cd-filter { padding:.45rem .9rem; border-radius:999px; border:1px solid ${c.line}; background:transparent;
  color:${c.muted}; font:inherit; font-size:.8rem; cursor:pointer; transition: all .18s ease; }
.cd-filter:hover { color:${c.text}; }
.cd-filter.is-on { color:${c.accent}; border-color:${c.accent}; background:${c.accentSoft}; font-weight:600; }
.cd-action { display:inline-flex; align-items:center; gap:.4rem; background:transparent; border:1px solid transparent;
  color:${c.muted}; font:inherit; font-size:.82rem; padding:.4rem .7rem; border-radius:10px; cursor:pointer;
  transition: all .18s ease; }
.cd-action:hover { background:${c.raise}; color:${c.text}; }
.cd-action.is-on { color:${c.accent}; background:${c.accentSoft}; }
.cd-ghost { background:none; border:none; color:${c.muted}; font:inherit; font-size:.78rem; cursor:pointer; }
.cd-ghost:hover { color:${c.accent}; }
.cd-del { background:transparent; border:1px solid ${c.line}; color:${c.muted}; border-radius:10px; padding:.4rem;
  display:inline-flex; cursor:pointer; transition: all .18s ease; }
.cd-del:hover { color:${c.danger}; border-color:${c.danger}; background:rgba(229,84,75,.1); }
.cd-del.sm { border:none; padding:.2rem; }
.cd-linkcard { display:flex; align-items:center; justify-content:space-between; gap:1rem; text-decoration:none;
  border:1px solid ${c.line}; background:${c.sunk}; border-radius:14px; padding:.8rem .9rem; margin-bottom:.9rem;
  transition: all .18s ease; }
.cd-linkcard:hover { border-color:${c.accent}; background:${c.accentSoft}; }
.cd-fab { position:fixed; right:1.25rem; bottom:1.5rem; width:52px; height:52px; border-radius:50%; border:none;
  background:${c.accent}; color:#100E0A; display:flex; align-items:center; justify-content:center; cursor:pointer;
  box-shadow:0 10px 28px rgba(245,166,35,.35); z-index:40; }
.cd-skel { animation: cdPulse 1.4s ease-in-out infinite; }
@keyframes cdPulse { 0%,100% { opacity:.35 } 50% { opacity:.7 } }
@media (min-width: 720px) { .cd-fab { display:none } }
`;

const s = {
  page: {
    maxWidth: '100%',
    margin: "0",
    padding: "4px 1px 110px",
    color: c.text,
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  hero: { marginBottom: "1.6rem" },
  heroKicker: {
    display: "inline-flex",
    alignItems: "center",
    gap: ".4rem",
    fontSize: ".72rem",
    letterSpacing: ".14em",
    textTransform: "uppercase",
    color: c.accent,
    marginBottom: ".7rem",
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(1.55rem, 6vw, 2.15rem)",
    lineHeight: 1.12,
    letterSpacing: "-0.02em",
    fontWeight: 700,
  },
  heroSub: { margin: ".7rem 0 0", color: c.muted, fontSize: ".92rem", lineHeight: 1.6 },
  statRow: { display: "flex", gap: ".5rem", marginTop: "1.2rem", flexWrap: "wrap" },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: ".1rem",
    padding: ".55rem .85rem",
    border: `1px solid ${c.lineSoft}`,
    borderRadius: 14,
    background: c.card,
    minWidth: 72,
  },
  statValue: { fontSize: "1.05rem", fontWeight: 700 },
  statLabel: { fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".1em", color: c.muted },
  composer: { padding: "1rem", marginBottom: "1.4rem" },
  modeRow: { display: "flex", gap: ".5rem", marginBottom: ".9rem" },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    background: c.sunk,
    border: `1px solid ${c.line}`,
    borderRadius: 14,
    padding: ".85rem .95rem",
    fontSize: ".95rem",
    lineHeight: 1.6,
    resize: "vertical",
  },
  askRow: { display: "flex", gap: ".4rem", flexWrap: "wrap", marginTop: ".7rem" },
  linkWrap: {
    display: "flex",
    alignItems: "center",
    gap: ".55rem",
    background: c.sunk,
    border: `1px solid ${c.line}`,
    borderRadius: 12,
    padding: "0 .85rem",
    marginTop: ".7rem",
  },
  linkInput: { flex: 1, padding: ".65rem 0", fontSize: ".85rem", minWidth: 0 },
  select: {
    flex: 1,
    padding: ".65rem 0",
    fontSize: ".85rem",
    background: c.sunk,
    border: `1px solid ${c.line}`,
    borderRadius: 12,
    color: c.text,
    fontFamily: "inherit",
    outline: "none",
  },
  error: { color: c.danger, fontSize: ".75rem", marginTop: ".4rem" },
  composerFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ".75rem",
    marginTop: ".9rem",
  },
  count: { fontSize: ".72rem", color: c.muted },
  filterRow: {
    display: "flex",
    gap: ".5rem",
    marginBottom: "1.1rem",
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterSelect: {
    background: c.sunk,
    border: `1px solid ${c.line}`,
    borderRadius: 999,
    padding: ".4rem .8rem",
    color: c.text,
    fontSize: ".8rem",
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
  },
  skeletonWrap: { display: "grid", gap: "1rem" },
  skeleton: { height: 140, borderRadius: 20, background: c.card, border: `1px solid ${c.lineSoft}` },
  empty: { padding: "2.2rem 1.2rem", textAlign: "center" },
  emptyTitle: { margin: ".7rem 0 .3rem", fontWeight: 700 },
  emptyText: { margin: 0, color: c.muted, fontSize: ".88rem" },
  feed: { display: "grid", gap: "1rem" },
  post: { padding: "1.1rem" },
  postHead: { display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '.85rem' },
  clickableArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '.8rem',
    flex: 1,
    minWidth: 0,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
  avatarRing: {
    padding: 2,
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${c.accent}, #7A3A12)`,
    flexShrink: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: c.sunk,
    color: c.accent,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: ".82rem",
    fontWeight: 700,
  },
  who: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: ".15rem" },
  nameRow: { display: "flex", alignItems: "center", gap: ".4rem", flexWrap: "wrap" },
  name: { fontWeight: 600, fontSize: ".93rem" },
  youTag: {
    fontSize: ".62rem",
    textTransform: "uppercase",
    letterSpacing: ".08em",
    color: c.muted,
    border: `1px solid ${c.line}`,
    borderRadius: 999,
    padding: ".1rem .4rem",
  },
  boostTag: {
    fontSize: ".62rem",
    textTransform: "uppercase",
    letterSpacing: ".08em",
    color: c.accent,
    background: c.accentSoft,
    borderRadius: 999,
    padding: ".1rem .45rem",
  },
  time: { fontSize: ".72rem", color: c.muted },
  content: {
    margin: "0 0 .9rem",
    fontSize: ".95rem",
    lineHeight: 1.68,
    color: "#D8D5D0",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  linkCard: {},
  linkCardMeta: { display: "flex", flexDirection: "column", gap: ".15rem", minWidth: 0 },
  linkHost: { fontSize: ".84rem", fontWeight: 600, color: c.text },
  linkUrl: {
    fontSize: ".72rem",
    color: c.muted,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "48vw",
  },
  engageBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: ".35rem",
    fontSize: ".78rem",
    fontWeight: 600,
    color: c.accent,
    flexShrink: 0,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: ".35rem",
    paddingTop: ".7rem",
    borderTop: `1px solid ${c.lineSoft}`,
    flexWrap: "wrap",
  },
  spacer: { flex: 1 },
  engagedCount: {
    fontSize: ".7rem",
    color: c.muted,
    marginLeft: ".2rem",
  },
  thread: { marginTop: ".9rem", display: "grid", gap: ".6rem" },
  reply: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '.6rem',
  },
  replyAvatarRing: {
    padding: 1,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${c.accent}, #7A3A12)`,
    flexShrink: 0,
    cursor: 'pointer',
    marginTop: '2px',
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: c.sunk,
    color: c.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6rem',
    fontWeight: 700,
  },
  replyBody: { flex: 1, minWidth: 0 },
  replyMeta: { display: "flex", gap: ".5rem", alignItems: "baseline" },
  replyName: { fontSize: ".82rem", fontWeight: 600, color: c.text },
  replyTime: { fontSize: ".68rem", color: c.muted },
  replyText: { margin: ".15rem 0 0", fontSize: ".87rem", lineHeight: 1.55, color: "#C9C6C1", wordBreak: "break-word" },
  replyRow: { display: "flex", gap: ".5rem", alignItems: "center", marginTop: ".2rem" },
  replyInput: {
    flex: 1,
    background: c.sunk,
    border: `1px solid ${c.line}`,
    borderRadius: 12,
    padding: ".6rem .8rem",
    fontSize: ".87rem",
    minWidth: 0,
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 0",
    gap: "1rem",
    color: c.muted,
  },
  spinner: {
    width: 28,
    height: 28,
    border: `2px solid ${c.line}`,
    borderTop: `2px solid ${c.accent}`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
} satisfies Record<string, React.CSSProperties>;
