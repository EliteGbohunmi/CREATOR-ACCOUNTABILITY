import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import NotificationBell from './NotificationBell'
import {
  LayoutDashboard, CalendarDays, Trophy, BarChart2, Settings,
  Flame, LogOut, Users, Award, BookMarked, UserCheck, Grid, X,
  MessageCircle, Star, User
} from 'lucide-react'

const mainNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/planner', label: 'Planner', icon: CalendarDays },
  { path: '/challenges', label: 'Challenges', icon: Trophy },
]

const moreNav = [
  { path: '/leaderboard', label: 'Leaderboard', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/feed', label: 'Feed', icon: BarChart2 },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/achievements', label: 'Achievements', icon: Award },
  { path: '/vault', label: 'Content Vault', icon: BookMarked },
  { path: '/partners', label: 'Partners', icon: UserCheck },
  { path: '/community', label: 'Community', icon: MessageCircle },
]

const allNav = [...mainNav, ...moreNav]

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/planner': 'Planner',
  '/challenges': 'Challenges',
  '/leaderboard': 'Leaderboard',
  '/settings': 'Settings',
  '/feed': 'Feed',
  '/analytics': 'Analytics',
  '/achievements': 'Achievements',
  '/vault': 'Content Vault',
  '/partners': 'Partners',
  '/community': 'Community',
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])
  return matches
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [showMore, setShowMore] = useState(false)
  const [profile, setProfile] = useState<{ name: string | null; avatar_url: string | null; creator_score: number } | null>(null)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const pageTitle = ROUTE_TITLES[location.pathname] || 'Streak'

  useEffect(() => {
    if (!user) return
    let mounted = true
    supabase
      .from('profiles')
      .select('name, avatar_url, creator_score')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (mounted && data) {
          setProfile({ name: data.name, avatar_url: data.avatar_url, creator_score: data.creator_score ?? 0 })
        }
      })
    return () => { mounted = false }
  }, [user])

  const score = profile?.creator_score ?? 0
  const initials = (profile?.name || 'C').trim().charAt(0).toUpperCase()

  return (
    <div style={styles.wrapper}>
      {!isMobile && (
        <aside style={styles.sidebar}>
          <div style={styles.brand}>
            <Flame size={22} color="#F5A623" />
            <span>Streak</span>
          </div>
          <nav style={styles.nav}>
            {allNav.map(item => {
              const Icon = item.icon
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    ...styles.navItem,
                    ...(active ? styles.navActive : {})
                  }}
                >
                  <Icon size={18} color={active ? '#F5A623' : '#666'} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <button style={styles.signOut} onClick={signOut}>
            <LogOut size={15} color="#666" />
            <span>Sign out</span>
          </button>
        </aside>
      )}

      {/* Top header */}
      <header style={{
        ...styles.header,
        left: isMobile ? 0 : '230px',
      }}>
        <div style={styles.headerLeft}>
          {isMobile && (
            <div style={styles.mobileBrand}>
              <Flame size={18} color="#F5A623" />
              <span>Streak</span>
            </div>
          )}
          {!isMobile && (
            <span style={styles.pageTitle}>{pageTitle}</span>
          )}
        </div>

        <div style={styles.headerRight}>
          <Link to="/score" style={styles.scorePill}>
            <Star size={11} color="#F5A623" />
            <span style={styles.scoreNum}>{score}</span>
          </Link>
          <NotificationBell />
          <Link to="/settings" style={styles.avatarBtn}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={styles.avatarImg} />
            ) : (
              <span style={styles.avatarInitial}>{initials}</span>
            )}
          </Link>
        </div>
      </header>

      <main style={{
        ...styles.main,
        marginLeft: isMobile ? '0' : '230px',
        paddingTop: isMobile ? '4.5rem' : '4.5rem',
        paddingLeft: isMobile ? '1rem' : '2rem',
        paddingRight: isMobile ? '1rem' : '2rem',
        paddingBottom: isMobile ? '100px' : '2rem',
      }}>
        {children}
        {!isMobile && <div style={{ height: '20px' }} />}
      </main>

      {isMobile && (
        <nav style={styles.mobileNav}>
          {mainNav.map(item => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} style={styles.mobileItem}>
                <Icon
                  size={24}
                  color={active ? '#F5A623' : '#666'}
                  style={{
                    transform: active ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'transform 0.2s'
                  }}
                />
                <span style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: active ? '#F5A623' : '#888',
                  letterSpacing: '0.2px'
                }}>
                  {item.label}
                </span>
                {active && <div style={styles.activeDot} />}
              </Link>
            )
          })}
          <button
            style={styles.mobileItem}
            onClick={() => setShowMore(!showMore)}
          >
            <Grid
              size={24}
              color={showMore ? '#F5A623' : '#666'}
              style={{
                transform: showMore ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'transform 0.2s'
              }}
            />
            <span style={{
              fontSize: '11px',
              fontWeight: '500',
              color: showMore ? '#F5A623' : '#888',
              letterSpacing: '0.2px'
            }}>
              More
            </span>
            {showMore && <div style={styles.activeDot} />}
          </button>
        </nav>
      )}

      {isMobile && showMore && (
        <>
          <div style={styles.overlay} onClick={() => setShowMore(false)} />
          <div style={styles.moreDrawer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                More
              </span>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                onClick={() => setShowMore(false)}
              >
                <X size={18} color="#888" />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {moreNav.map(item => {
                const Icon = item.icon
                const active = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      ...styles.moreItem,
                      background: active ? '#1A1400' : '#1a1a1a',
                      borderColor: active ? '#F5A62340' : '#2a2a2a',
                      color: active ? '#F5A623' : '#aaa'
                    }}
                    onClick={() => setShowMore(false)}
                  >
                    <Icon size={20} color={active ? '#F5A623' : '#888'} />
                    <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>{item.label}</span>
                  </Link>
                )
              })}
              <button
                style={{
                  ...styles.moreItem,
                  borderColor: '#2a2a2a',
                  color: '#E53E3E',
                  cursor: 'pointer',
                  background: '#1a1a1a'
                }}
                onClick={signOut}
              >
                <LogOut size={20} color="#E53E3E" />
                <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0A0A0A'
  },
  sidebar: {
    width: '230px',
    background: '#0F0F0F',
    borderRight: '1px solid #1A1A1A',
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    overflowY: 'auto',
    zIndex: 60
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0 0.5rem',
    fontFamily: 'Space Grotesk',
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#F0EDE8'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    flex: 1
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.7rem 0.85rem',
    borderRadius: '10px',
    color: '#666',
    fontSize: '0.9rem',
    fontWeight: '500',
    textDecoration: 'none'
  },
  navActive: {
    background: '#1A1400',
    color: '#F5A623',
    borderLeft: '2px solid #F5A623',
    paddingLeft: 'calc(0.85rem - 2px)'
  },
  signOut: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    background: 'none',
    border: '1px solid #1A1A1A',
    borderRadius: '10px',
    color: '#555',
    padding: '0.65rem 0.85rem',
    fontSize: '0.85rem',
    cursor: 'pointer'
  },
  header: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '64px',
    background: 'rgba(10,10,10,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #1A1A1A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.25rem',
    zIndex: 55
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0
  },
  pageTitle: {
    fontFamily: 'Space Grotesk',
    fontWeight: '700',
    fontSize: '1.05rem',
    color: '#F0EDE8',
    letterSpacing: '-0.01em'
  },
  mobileBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'Space Grotesk',
    fontWeight: '700',
    fontSize: '1rem',
    color: '#F0EDE8'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem'
  },
  scorePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    background: '#1A1400',
    border: '1px solid rgba(245,166,35,0.18)',
    borderRadius: '20px',
    padding: '0.4rem 0.7rem',
    textDecoration: 'none',
    height: '30px'
  },
  scoreNum: {
    color: '#F5A623',
    fontSize: '0.75rem',
    fontWeight: '700',
    fontFamily: 'Space Grotesk'
  },
  avatarBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#1A1A1A',
    border: '1px solid #2A2A2A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    textDecoration: 'none',
    flexShrink: 0
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarInitial: {
    color: '#F5A623',
    fontWeight: '700',
    fontSize: '0.85rem',
    fontFamily: 'Space Grotesk'
  },
  main: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
    paddingBottom: '100px',
  },
  mobileNav: {
    display: 'flex',
    position: 'fixed',
    bottom: '16px',
    left: '16px',
    right: '16px',
    background: '#111111',
    border: '1px solid #1E1E1E',
    borderRadius: '24px',
    padding: '8px 4px 12px',
    zIndex: 100,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
  },
  mobileItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '4px 0',
    textDecoration: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#888',
    gap: '2px',
    position: 'relative'
  },
  activeDot: {
    position: 'absolute',
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '18px',
    height: '3px',
    background: '#F5A623',
    borderRadius: '4px'
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 200
  },
  moreDrawer: {
    position: 'fixed',
    bottom: '80px',
    left: '1rem',
    right: '1rem',
    background: '#111111',
    border: '1px solid #1E1E1E',
    borderRadius: '16px',
    padding: '1.25rem',
    zIndex: 201,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
  },
  moreItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    border: '1px solid',
    borderRadius: '12px',
    textDecoration: 'none',
    background: '#111111'
  }
}
