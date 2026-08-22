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
      <div style={styles.page}>
        <style>{css}</style>

        <div className="auth-bg-glow auth-bg-glow-a" />
        <div className="auth-bg-glow auth-bg-glow-b" />

        <div className="auth-card-wrap">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <span className="auth-accent" />

            <h1 style={styles.title}>Check your email</h1>

            <p style={styles.sub}>
              We&apos;ve sent a confirmation link to
              <br />
              <strong style={{ color: '#F4F1EC' }}>{email}</strong>
            </p>

            <p style={{ ...styles.sub, marginBottom: '1.75rem' }}>
              Please click the link in the email to activate your account
              before signing in.
            </p>

            <Link to="/login" className="auth-btn auth-btn-link">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <div className="auth-bg-glow auth-bg-glow-a" />
      <div className="auth-bg-glow auth-bg-glow-b" />

      <div className="auth-card-wrap">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <span className="auth-accent" />

          <h1 style={styles.title}>Start your streak</h1>
          <p style={styles.sub}>Build the posting habit. Day by day.</p>

          {error && (
            <div className="auth-error">
              <span className="auth-error-bar" />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-field">
            <input
              className="auth-input"
              type="text"
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <label className="auth-floating-label">Name</label>
          </div>

          <div className="auth-field">
            <input
              className="auth-input"
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <label className="auth-floating-label">Email</label>
          </div>

          <div className="auth-field">
            <input
              className="auth-input"
              type="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <label className="auth-floating-label">Password (min 6 chars)</label>
          </div>

          <button className="auth-btn" onClick={handleSignup} disabled={loading}>
            {loading ? (
              <span className="auth-btn-loading">
                <span className="auth-spinner" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          <p style={styles.link}>
            Have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden',
    background: '#0A0A12'
  },
  title: {
    fontSize: '1.7rem',
    fontFamily: 'Space Grotesk, sans-serif',
    color: '#F4F1EC',
    margin: '1rem 0 0.35rem',
    fontWeight: 600,
    letterSpacing: '-0.01em'
  },
  sub: {
    color: '#8A87A0',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    margin: '0 0 2rem'
  },
  link: {
    color: '#8A87A0',
    fontSize: '0.88rem',
    margin: '1.75rem 0 0'
  }
}

const css = `
  .auth-bg-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;
    z-index: 0;
  }

  .auth-bg-glow-a {
    width: 420px;
    height: 420px;
    top: -140px;
    left: -100px;
    background: radial-gradient(circle, rgba(245,166,35,0.28) 0%, rgba(245,166,35,0) 70%);
  }

  .auth-bg-glow-b {
    width: 460px;
    height: 460px;
    bottom: -160px;
    right: -120px;
    background: radial-gradient(circle, rgba(123,97,255,0.24) 0%, rgba(123,97,255,0) 70%);
  }

  .auth-card-wrap {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 400px;
    border-radius: 24px;
    padding: 1.5px;
    background: linear-gradient(135deg, rgba(245,166,35,0.7), rgba(123,97,255,0.5), rgba(245,166,35,0.15));
    box-shadow: 0 0 40px rgba(245, 166, 35, 0.12), 0 0 90px rgba(123, 97, 255, 0.08);
    animation: auth-rise 0.4s ease;
  }

  .auth-card {
    position: relative;
    background: #14121C;
    border-radius: 22.5px;
    padding: 2.75rem 2.25rem 2.25rem;
    width: 100%;
    box-sizing: border-box;
  }

  .auth-accent {
    display: block;
    width: 34px;
    height: 3px;
    margin: 0 auto;
    border-radius: 2px;
    background: #F5A623;
    box-shadow: 0 0 12px rgba(245, 166, 35, 0.8);
  }

  .auth-error {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    text-align: left;
    background: rgba(229, 62, 62, 0.08);
    color: #F16565;
    font-size: 0.85rem;
    border-radius: 8px;
    padding: 0.7rem 0.85rem;
    margin-bottom: 1.4rem;
  }

  .auth-error-bar {
    width: 3px;
    align-self: stretch;
    border-radius: 2px;
    background: #E53E3E;
    flex-shrink: 0;
  }

  .auth-field {
    position: relative;
    margin-bottom: 1.6rem;
    text-align: left;
  }

  .auth-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid #2A283A;
    border-radius: 10px;
    padding: 1.35rem 0.9rem 0.5rem;
    color: #F4F1EC;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-sizing: border-box;
  }

  .auth-input:focus {
    border-color: #F5A623;
    box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.15), 0 0 18px rgba(245, 166, 35, 0.25);
  }

  .auth-floating-label {
    position: absolute;
    left: 0.9rem;
    top: 1.05rem;
    color: #6E6B85;
    font-size: 1rem;
    pointer-events: none;
    transition: all 0.18s ease;
  }

  .auth-input:focus + .auth-floating-label,
  .auth-input:not(:placeholder-shown) + .auth-floating-label {
    top: 0.4rem;
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #F5A623;
  }

  .auth-btn {
    display: block;
    width: 100%;
    background: linear-gradient(135deg, #F5A623, #FFC55C);
    color: #14121C;
    border: none;
    border-radius: 999px;
    padding: 0.95rem;
    font-weight: 600;
    font-size: 1rem;
    margin-top: 0.6rem;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    box-sizing: border-box;
    box-shadow: 0 8px 24px rgba(245, 166, 35, 0.35);
    transition: transform 0.1s ease, filter 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  }

  .auth-btn-link {
    margin-top: 0;
  }

  .auth-btn:hover:not(:disabled) {
    filter: brightness(1.06);
    box-shadow: 0 10px 30px rgba(245, 166, 35, 0.5);
  }

  .auth-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .auth-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }

  .auth-btn-loading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .auth-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(20, 18, 28, 0.35);
    border-top-color: #14121C;
    border-radius: 50%;
    animation: auth-spin 0.6s linear infinite;
  }

  .auth-link {
    color: #F5A623;
    text-decoration: none;
    font-weight: 500;
  }

  .auth-link:hover {
    text-decoration: underline;
  }

  @keyframes auth-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes auth-rise {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`
