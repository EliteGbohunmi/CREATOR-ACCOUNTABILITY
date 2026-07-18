import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async () => {
  if (!name.trim() || !email.trim() || !password.trim()) {
    setError('All fields are required')
    return
  }
  setLoading(true)
  setError('')

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  })

  if (signUpError) { setError(signUpError.message); setLoading(false); return }

  navigate('/dashboard')
  setLoading(false)
}
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🔥</div>
        <h1 style={styles.title}>Start your streak</h1>
        <p style={styles.sub}>Build the posting habit. Day by day.</p>

        {error && <p style={styles.error}>{error}</p>}

        <input style={styles.input} type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} />
        <button style={styles.btn} onClick={handleSignup} disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        <p style={styles.link}>
          Have an account? <Link to="/login" style={{ color: '#F5A623' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  card: { background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  logo: { fontSize: '2.5rem', textAlign: 'center' },
  title: { fontSize: '1.8rem', textAlign: 'center', fontFamily: 'Space Grotesk' },
  sub: { color: '#888', textAlign: 'center', fontSize: '0.9rem' },
  error: { color: '#E53E3E', fontSize: '0.85rem', textAlign: 'center' },
  input: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '0.85rem 1rem', color: '#F0EDE8', fontSize: '1rem', outline: 'none' },
  btn: { background: '#F5A623', color: '#0F0F0F', border: 'none', borderRadius: '8px', padding: '0.9rem', fontWeight: '600', fontSize: '1rem', marginTop: '0.5rem' },
  link: { color: '#888', textAlign: 'center', fontSize: '0.9rem' }
}