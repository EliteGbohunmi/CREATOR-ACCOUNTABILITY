import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import {
  LayoutDashboard, CalendarDays, Trophy, BarChart2, Settings,
  Flame, LogOut, Users, Award, BookMarked, UserCheck, Grid, X
} from 'lucide-react'

const mainNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/planner', label: 'Planner', icon: CalendarDays },
  { path: '/challenges', label: 'Challenges', icon: Trophy },
  { path: '/leaderboard', label: 'Leaderboard', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const moreNav = [
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/achievements', label: 'Achievements', icon: Award },
  { path: '/vault', label: 'Content Vault', icon: BookMarked },
  { path: '/partners', label: 'Partners', icon: UserCheck },
]

const allNav = [...mainNav, ...moreNav]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { signOut } = useAuth()
  const [showMore, setShowMore] = useState(false)

  return (
    <div style={styles.wrapper}>
      {/* Desktop sidebar */}
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

      <main style={styles.main}>
{children}
        <div style={{ height: '120px' }} />
      </main>

      {/* Mobile bottom nav */}
      <nav style={styles.mobileNav}>
        {mainNav.map(item => {
          const Icon = item.icon
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.mobileItem,
                color: active ? '#F5A623' : '#555'
              }}
            >
              <Icon size={22} color={active ? '#F5A623' : '#555'} />
            </Link>
          )
        })}

        {/* More button */}
        <button
          style={{
            ...styles.mobileItem,
            background: 'none',
            border: 'none',
            color: showMore ? '#F5A623' : '#555',
            cursor: 'pointer'
          }}
          onClick={() => setShowMore(!showMore)}
        >
          <Grid size={22} color={showMore ? '#F5A623' : '#555'} />
        </button>
      </nav>

      {/* More drawer */}
      {showMore && (
        <>
          <div style={styles.overlay} onClick={() => setShowMore(false)} />
          <div style={styles.moreDrawer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>More</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }} onClick={() => setShowMore(false)}>
                <X size={18} color="#555" />
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
                      background: active ? '#1A1400' : '#111111',
                      borderColor: active ? '#F5A62340' : '#1E1E1E',
                      color: active ? '#F5A623' : '#888'
                    }}
                    onClick={() => setShowMore(false)}
                  >
                    <Icon size={20} color={active ? '#F5A623' : '#555'} />
                    <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>{item.label}</span>
                  </Link>
                )
              })}
              <button
                style={{ ...styles.moreItem, borderColor: '#1E1E1E', color: '#E53E3E', cursor: 'pointer' }}
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
  wrapper: { display: 'flex', minHeight: '100vh', background: '#0A0A0A ' },
  sidebar: {
    width: '230px',
    background: '#111111',
    borderRight: '1px solid #1E1E1E',
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    overflowY: 'auto'
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0 0.5rem', fontFamily: 'Space Grotesk',
    fontSize: '1.2rem', fontWeight: '700', color: '#F0EDE8'
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.7rem 0.85rem', borderRadius: '10px',
    color: '#666', fontSize: '0.9rem', fontWeight: '500'
  },
  navActive: {
    background: '#1A1400', color: '#F5A623',
    borderLeft: '2px solid #F5A623',
    paddingLeft: 'calc(0.85rem - 2px)'
  },
  signOut: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    background: 'none', border: '1px solid #1E1E1E',
    borderRadius: '10px', color: '#555',
    padding: '0.65rem 0.85rem', fontSize: '0.85rem', cursor: 'pointer'
  },
  main: {
  marginLeft: '230px', flex: 1, minWidth: 0,
  padding: '2.5rem', maxWidth: '860px', paddingBottom: '160px'
},
  mobileNav: {
    display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0,
    background: '#111111', borderTop: '1px solid #1E1E1E',
    padding: '0.6rem 0 1.2rem', zIndex: 100,
    justifyContent: 'space-around', alignItems: 'center'
  },
  mobileItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    flex: 1, padding: '0.3rem', textDecoration: 'none'
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200
  },
  moreDrawer: {
    position: 'fixed', bottom: '70px', left: '1rem', right: '1rem',
    background: '#111111', border: '1px solid #1E1E1E',
    borderRadius: '16px', padding: '1.25rem', zIndex: 201
  },
  moreItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.5rem', padding: '1rem', border: '1px solid',
    borderRadius: '12px', textDecoration: 'none', background: '#111111'
  }
}
