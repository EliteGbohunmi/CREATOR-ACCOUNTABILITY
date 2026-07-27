import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const navigate = useNavigate()

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (signUpError) {
        setError(
          typeof signUpError.message === 'string'
            ? signUpError.message
            : 'Something went wrong. Please try again.'
        )
        return
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name,
            email,
          })

        if (profileError) {
          console.error(profileError)
        }

        const { error: streakError } = await supabase
          .from('streaks')
          .insert({
            user_id: data.user.id,
            current_streak: 0,
            best_streak: 0,
          })

        if (streakError) {
          console.error(streakError)
        }
      }

      // If email confirmation is OFF
      if (data.session) {
        navigate('/dashboard')
        return
      }

      // If email confirmation is ON
      setConfirmationSent(true)
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logo}>📧</div>

          <h1 style={styles.title}>Check your email</h1>

          <p style={styles.sub}>
            We've sent a confirmation link to
            <br />
            <strong>{email}</strong>
          </p>

          <p style={styles.sub}>
            Please click the link in the email to activate your account before
            signing in.
          </p>

          <Link to="/login" style={styles.loginButton}>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🔥</div>

        <h1 style={styles.title}>Start your streak</h1>

        <p style={styles.sub}>
          Build the posting habit. Day by day.
        </p>

        {error && <p style={styles.error}>{error}</p>}

        <input
          style={styles.input}
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          style={styles.btn}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p style={styles.link}>
          Have an account?{' '}
          <Link to="/login" style={{ color: '#F5A623' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    background: '#1C1C1C',
    border: '1px solid #2A2A2A',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    textAlign: 'center',
  },
  logo: {
    fontSize: '2.5rem',
  },
  title: {
    fontSize: '1.8rem',
    fontFamily: 'Space Grotesk',
  },
  sub: {
    color: '#888',
    fontSize: '0.95rem',
    lineHeight: '1.6',
  },
  error: {
    color: '#E53E3E',
    fontSize: '0.9rem',
  },
  input: {
    background: '#0F0F0F',
    border: '1px solid #2A2A2A',
    borderRadius: '8px',
    padding: '0.85rem 1rem',
    color: '#F0EDE8',
    fontSize: '1rem',
    outline: 'none',
  },
  btn: {
    background: '#F5A623',
    color: '#0F0F0F',
    border: 'none',
    borderRadius: '8px',
    padding: '0.9rem',
    fontWeight: '600',
    fontSize: '1rem',
    marginTop: '0.5rem',
    cursor: 'pointer',
  },
  loginButton: {
    display: 'inline-block',
    background: '#F5A623',
    color: '#0F0F0F',
    padding: '0.9rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    marginTop: '1rem',
  },
  link: {
    color: '#888',
    fontSize: '0.9rem',
  },
}