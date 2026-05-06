'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { startAuthentication } from '@simplewebauthn/browser'

function FingerprintIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 17c1 .5 2.6 1.5 4 1.5" />
      <path d="M20 12c.7 2 .5 6.4-1.3 9" />
      <path d="M5.5 15.5c.5-1.5.5-5.5 1-7.5" />
      <path d="M8.5 8a5 5 0 0 1 8 4.8" />
    </svg>
  )
}

function BiometricButton() {
  const [supported, setSupported] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && !!window.PublicKeyCredential)
  }, [])

  if (!supported) return null

  async function handleBiometric() {
    setLoading(true)
    setError(null)
    try {
      const optRes = await fetch('/api/webauthn/auth/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!optRes.ok) throw new Error('Failed to get options')
      const options = await optRes.json()

      const assertion = await startAuthentication(options)

      const verRes = await fetch('/api/webauthn/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: assertion }),
      })
      const data = await verRes.json()
      if (!verRes.ok) throw new Error(data.error ?? 'Authentication failed')

      window.location.href = data.redirectTo ?? '/dashboard'
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') return
      setError(err instanceof Error ? err.message : 'Biometric login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(107,143,163,0.2)' }} />
        <span style={{ margin: '0 0.75rem', fontSize: '0.75rem', color: 'var(--color-mist)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(107,143,163,0.2)' }} />
      </div>
      {error && (
        <div role="alert" style={{ background: 'rgba(224,92,42,0.15)', border: '1px solid rgba(224,92,42,0.4)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '0.75rem', color: 'var(--color-warning)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleBiometric}
        disabled={loading}
        className="btn-ghost"
        style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <FingerprintIcon />
        {loading ? 'Verifying…' : 'Sign in with Biometrics'}
      </button>
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        username: form.username,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid username or password')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ display: 'block', height: '72px', width: 'auto', marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Western Australia</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-foam)' }}>
            Sign In
          </h2>

          {registered && (
            <div style={{ background: 'rgba(46,204,138,0.12)', border: '1px solid rgba(46,204,138,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: 'var(--color-success)', fontSize: '0.875rem' }}>
              Account created — please sign in.
            </div>
          )}

          {error && (
            <div role="alert" style={{ background: 'rgba(224,92,42,0.15)', border: '1px solid rgba(224,92,42,0.4)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: 'var(--color-warning)', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-mist)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="Your username"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-mist)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
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
                    &nbsp;Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </div>
          </form>

          <p style={{ marginTop: '1.25rem', textAlign: 'center', color: 'var(--color-mist)', fontSize: '0.875rem' }}>
            New here?{' '}
            <Link href="/register" style={{ color: 'var(--color-seafoam)', textDecoration: 'none', fontWeight: 500 }}>
              Create an account
            </Link>
          </p>

          <BiometricButton />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
