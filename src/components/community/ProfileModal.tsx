import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader, Users, Trophy, Flame, Calendar, Mail, ShieldCheck } from 'lucide-react'

function getInitials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
function getAvatarGradient(name?: string | null) {
  const g = [['#F5A623', '#D9821A'], ['#6FA8F5', '#3D7DD9'], ['#F56F91', '#D93D63'], ['#6FCB73', '#3DA843'], ['#B98CF5', '#8A4DD9']]
  const key = name || '?'
  let h = 0
  for (let i = 0; i < key.length; i++) h = key.charCodeAt(i) + ((h << 5) - h)
  const [a, b] = g[Math.abs(h) % g.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

interface Props {
  open: boolean
  profileData: any | null
  loading: boolean
  isOwnProfile: boolean
  onClose: () => void
}

export default function ProfileModal({ open, profileData, loading, isOwnProfile, onClose }: Props) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={overlayStyle} onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            style={cardStyle}
            onClick={e => e.stopPropagation()}
          >
            <button style={closeStyle} onClick={onClose} aria-label="Close">
              <X size={18} color="#8A8A8A" />
            </button>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader size={26} color="#5C5C5C" className="animate-spin" />
              </div>
            ) : profileData ? (
              <>
                <div style={{ position: 'relative', height: 92 }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(245,166,35,0.28), transparent 65%), radial-gradient(circle at bottom left, rgba(111,168,245,0.14), transparent 60%)' }} />
                  <div style={{
                    position: 'absolute', bottom: -32, left: '1.4rem', padding: 3,
                    borderRadius: 24, background: 'linear-gradient(135deg, #F5A623, #D9821A)',
                    boxShadow: '0 12px 30px -12px rgba(245,166,35,0.6)',
                  }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A',
                      fontFamily: 'Space Grotesk', overflow: 'hidden',
                      border: '3px solid #0A0A0A',
                      background: profileData.avatar_url ? 'transparent' : getAvatarGradient(profileData.name),
                    }}>
                      {profileData.avatar_url
                        ? <img src={profileData.avatar_url} alt={profileData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : getInitials(profileData.name)}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0 1.4rem 1.4rem', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F5F1EA', margin: '0.8rem 0 0.1rem', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
                    {profileData.name}
                    {isOwnProfile && <span style={{ fontSize: '0.62rem', marginLeft: '0.5rem', color: '#F5A623', background: 'rgba(245,166,35,0.12)', padding: '0.1rem 0.5rem', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, verticalAlign: 'middle' }}>you</span>}
                  </h2>
                  {profileData.username && <p style={{ color: '#F5A623', fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>@{profileData.username}</p>}
                  <p style={{ color: '#7A7A7A', fontSize: '0.78rem', margin: '0.25rem 0 0', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Mail size={11} /> {profileData.email}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', padding: '0.4rem 1.4rem 1rem', marginTop: '1.6rem' }}>
                  <Stat icon={<Flame size={13} color="#F5A623" />} value={profileData.streak?.current_streak || 0} label="Streak" />
                  <Stat icon={<Trophy size={13} color="#4CAF50" />} value={profileData.streak?.best_streak || 0} label="Best" />
                  <Stat icon={<Users size={13} color="#6FA8F5" />} value={profileData.partnerCount} label="Partners" />
                  <Stat icon={<ShieldCheck size={13} color="#B98CF5" />} value={profileData.postCount} label="Posts" />
                </div>

                <div style={{ padding: '0 1.4rem 1.4rem' }}>
                  <div style={{ color: '#5C5C5C', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.4rem' }}>
                    About
                  </div>
                  <p style={{ color: '#B0B0B0', fontSize: '0.85rem', lineHeight: 1.55, margin: 0, background: 'rgba(255,255,255,0.02)', border: '1px solid #1A1A1A', borderRadius: 12, padding: '0.75rem 0.9rem' }}>
                    {profileData.bio || "This creator hasn't added a bio yet."}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#7A7A7A', fontSize: '0.73rem', fontWeight: 500 }}>
                      <Calendar size={11} /> Joined {new Date(profileData.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: '#8A8A8A', padding: '2rem', textAlign: 'center' }}>No profile data</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1E1E1E', borderRadius: 12, padding: '0.6rem 0.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
      <span style={{ display: 'flex', marginBottom: '0.1rem' }}>{icon}</span>
      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.95rem', color: '#F5F1EA', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A7A7A', fontWeight: 600 }}>{label}</span>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.25rem',
}
const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #161616 0%, #0A0A0A 100%)',
  border: '1px solid #262626', borderRadius: 24, width: '100%', maxWidth: 420,
  position: 'relative', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
  maxHeight: '90vh', overflowY: 'auto',
}
const closeStyle: React.CSSProperties = {
  position: 'absolute', top: '0.75rem', right: '0.75rem',
  background: 'rgba(0,0,0,0.5)', border: '1px solid #262626', borderRadius: 10,
  width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', zIndex: 2, backdropFilter: 'blur(6px)',
}
