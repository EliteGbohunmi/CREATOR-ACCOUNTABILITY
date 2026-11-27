import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { setupPushNotifications } from './lib/push'
import NotificationModal from './components/NotificationModal'   // default import
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Planner from './pages/Planner'
import Challenges from './pages/Challenges'
import ChallengeInvite from './pages/ChallengeInvite'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Achievements from './pages/Achievements'
import Landing from './pages/Landing'
import Vault from './pages/Vault'
import Feed from './pages/Feed'
import Partners from './pages/Partners'
import Leaderboard from './pages/Leaderboard'
import Community from './pages/Community'
import SavedPosts from './pages/SavedPosts'
import PostDetailPage from './pages/PostDetailPage'
import Notifications from './pages/Notifications'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        const { title, body } = event.data.payload
        toast(`${title}: ${body}`, { duration: 5000 })
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    if (user) setupPushNotifications(user.id)
  }, [user])

  if (loading) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0A0A0A',
      gap: '1.25rem'
    }}>
      <style>{`
        @keyframes pwa-spin { to { transform: rotate(360deg); } }
        @keyframes pwa-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
      <img
        src="/app-icon.png"
        alt="Creator Accountability"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          animation: 'pwa-pulse 1.4s ease-in-out infinite'
        }}
      />
      <div style={{
        width: '28px',
        height: '28px',
        border: '2px solid #1E1E1E',
        borderTopColor: '#F5A623',
        borderRadius: '50%',
        animation: 'pwa-spin 0.8s linear infinite'
      }} />
      <span style={{ color: '#555', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
        Loading...
      </span>
    </div>
  )
  if (!user) return <Navigate to="/login" />
  return (
    <>
      {children}
      <NotificationModal />
    </>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
      <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
      <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
      <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
      <Route path="/partners" element={<ProtectedRoute><Partners /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
