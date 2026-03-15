'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type View = 'signin' | 'register'

interface AuthModalProps {
  defaultView?: View
}

export default function AuthModal({ defaultView = 'signin' }: AuthModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<View>(defaultView)

  // Sign in state
  const [signInForm, setSignInForm] = useState({ username: '', password: '' })
  const [signInError, setSignInError] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)

  // Register state
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' })
  const [registerError, setRegisterError] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    firstInputRef.current?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  // Refocus when view changes
  useEffect(() => {
    if (isOpen) setTimeout(() => firstInputRef.current?.focus(), 0)
  }, [view])

  function open() {
    setView(defaultView)
    setSignInError('')
    setSignInForm({ username: '', password: '' })
    setRegisterError('')
    setRegisterForm({ username: '', email: '', password: '' })
    setRegistered(false)
    setIsOpen(true)
  }

  function close() {
    if (signInLoading || registerLoading) return
    setIsOpen(false)
  }

  function switchView(v: View) {
    setSignInError('')
    setRegisterError('')
    setView(v)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSignInError('')
    setSignInLoading(true)
    try {
      const result = await signIn('credentials', {
        username: signInForm.username,
        password: signInForm.password,
        redirect: false,
      })
      if (result?.error) {
        setSignInError('Invalid username or password')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setSignInError('Network error — please try again')
    } finally {
      setSignInLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegisterError('')
    setRegisterLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setRegisterError(data.error || 'Registration failed')
      } else {
        setRegistered(true)
        setSignInForm({ username: registerForm.username, password: '' })
        setView('signin')
      }
    } catch {
      setRegisterError('Network error — please try again')
    } finally {
      setRegisterLoading(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--color-mist)',
    marginBottom: '0.375rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }

  const switchBtnStyle: React.CSSProperties = {
    color: 'var(--color-seafoam)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.875rem',
    padding: 0,
    fontFamily: 'var(--font-body)',
  }

  return (
    <>
      {/* Trigger */}
      {defaultView === 'register' ? (
        <button onClick={open} className="btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
          Create Free Account
        </button>
      ) : (
        <button
          onClick={open}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--color-seafoam)',
            fontSize: '1rem',
            fontWeight: 500,
            padding: '0.75rem 1.5rem',
            border: '1px solid rgba(59,191,174,0.3)',
            borderRadius: '0.5rem',
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'transform 0.15s, opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'rgba(59,191,174,0.6)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(59,191,174,0.3)' }}
        >
          Sign In
        </button>
      )}

      {/* Modal overlay */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={view === 'signin' ? 'Sign in' : 'Create account'}
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'rgba(6,16,24,0.85)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px' }}>

            {/* Logo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
              <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ display: 'block', height: '72px', width: 'auto', marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Western Australia</p>
            </div>

            <div className="card" style={{ padding: '2rem' }}>

              {/* ── Sign In view ── */}
              {view === 'signin' && (
                <>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-foam)' }}>
                    Sign In
                  </h2>

                  {registered && (
                    <div style={{ background: 'rgba(46,204,138,0.12)', border: '1px solid rgba(46,204,138,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: 'var(--color-success)', fontSize: '0.875rem' }}>
                      Account created — please sign in.
                    </div>
                  )}

                  {signInError && (
                    <div role="alert" style={{ background: 'rgba(224,92,42,0.15)', border: '1px solid rgba(224,92,42,0.4)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: 'var(--color-warning)', fontSize: '0.875rem' }}>
                      {signInError}
                    </div>
                  )}

                  <form onSubmit={handleSignIn} noValidate>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Username</label>
                        <input
                          ref={firstInputRef}
                          type="text"
                          value={signInForm.username}
                          onChange={e => setSignInForm(f => ({ ...f, username: e.target.value }))}
                          placeholder="Your username"
                          required
                          autoComplete="username"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Password</label>
                        <input
                          type="password"
                          value={signInForm.password}
                          onChange={e => setSignInForm(f => ({ ...f, password: e.target.value }))}
                          placeholder="Your password"
                          required
                          autoComplete="current-password"
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={signInLoading}
                        style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                      >
                        {signInLoading ? (
                          <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
                            &nbsp;Signing in…
                          </span>
                        ) : 'Sign In'}
                      </button>
                    </div>
                  </form>

                  <p style={{ marginTop: '1.25rem', textAlign: 'center', color: 'var(--color-mist)', fontSize: '0.875rem' }}>
                    New here?{' '}
                    <button onClick={() => switchView('register')} style={switchBtnStyle}>
                      Create an account
                    </button>
                  </p>
                </>
              )}

              {/* ── Register view ── */}
              {view === 'register' && (
                <>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-foam)' }}>
                    Create Account
                  </h2>

                  {registerError && (
                    <div role="alert" style={{ background: 'rgba(224,92,42,0.15)', border: '1px solid rgba(224,92,42,0.4)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: 'var(--color-warning)', fontSize: '0.875rem' }}>
                      {registerError}
                    </div>
                  )}

                  <form onSubmit={handleRegister} noValidate>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Username</label>
                        <input
                          ref={firstInputRef}
                          type="text"
                          value={registerForm.username}
                          onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value }))}
                          placeholder="e.g. fisho_dan"
                          required
                          autoComplete="username"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Email</label>
                        <input
                          type="email"
                          value={registerForm.email}
                          onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="you@example.com"
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Password</label>
                        <input
                          type="password"
                          value={registerForm.password}
                          onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                          placeholder="Min 8 characters"
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={registerLoading}
                        style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                      >
                        {registerLoading ? (
                          <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
                            &nbsp;Creating account…
                          </span>
                        ) : 'Create Account'}
                      </button>
                    </div>
                  </form>

                  <p style={{ marginTop: '1.25rem', textAlign: 'center', color: 'var(--color-mist)', fontSize: '0.875rem' }}>
                    Already have an account?{' '}
                    <button onClick={() => switchView('signin')} style={switchBtnStyle}>
                      Sign in
                    </button>
                  </p>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  )
}
