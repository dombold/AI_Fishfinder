'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-warning)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
          This reset link is invalid or has expired.
        </p>
        <a
          href="/"
          style={{ color: 'var(--color-seafoam)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}
        >
          ← Back to sign in
        </a>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to reset password')
      } else {
        setDone(true)
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-seafoam)', fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Password updated
        </p>
        <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          You can now sign in with your new password.
        </p>
        <a
          href="/"
          style={{ color: 'var(--color-seafoam)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}
        >
          ← Sign in
        </a>
      </div>
    )
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

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-foam)' }}>
        Choose a new password
      </h2>

      {error && (
        <div role="alert" style={{ background: 'rgba(224,92,42,0.15)', border: '1px solid rgba(224,92,42,0.4)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: 'var(--color-warning)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              autoComplete="new-password"
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
                &nbsp;Updating…
              </span>
            ) : 'Set New Password'}
          </button>
        </div>
      </form>

      <p style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <a href="/" style={{ color: 'var(--color-seafoam)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to sign in
        </a>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 70% 0%, #0E2A45 0%, #0B1929 50%, #061018 100%)', display: 'flex', flexDirection: 'column' }}>

      <header style={{ padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(107,143,163,0.1)' }}>
        <a href="/">
          <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ height: '30px', width: 'auto' }} />
        </a>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <img src="/logo-mark.svg" alt="" aria-hidden="true" style={{ display: 'block', height: '72px', width: 'auto', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Western Australia</p>
          </div>

          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
