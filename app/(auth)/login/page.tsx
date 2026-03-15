'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
