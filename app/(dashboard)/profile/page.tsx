'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import UserDropdown from '@/components/UserDropdown'

const SOUNDER_OPTIONS = ['GARMIN', 'SIMRAD', 'LOWRANCE', 'HUMMINBIRD', 'RAYMARINE']

const TOLERANCE_LABELS: Record<number, string> = {
  1: 'Calm water only — bays and estuaries',
  2: 'Light conditions — up to 0.5m swell',
  3: 'Moderate offshore — up to 1.5m swell',
  4: 'Experienced — up to 2.5m swell',
  5: 'All conditions — bluewater capable',
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

export default function ProfilePage() {
  const [form, setForm] = useState({ email: '', sounderType: 'GARMIN', seasicknessTolerance: 3 })
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setUsername(data.username ?? '')
        setForm({
          email: data.email ?? '',
          sounderType: data.sounderType ?? 'GARMIN',
          seasicknessTolerance: data.seasicknessTolerance ?? 3,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save')
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>

      {/* Nav */}
      <nav style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(107,143,163,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11,25,41,0.7)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.25rem' }}>🎣</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--color-foam)', fontWeight: 600 }}>AI Fishfinder WA</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ color: 'var(--color-seafoam)', fontSize: '0.875rem', textDecoration: 'none' }}>← Dashboard</Link>
          <UserDropdown />
        </div>
      </nav>

      <div style={{ maxWidth: '560px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.25rem' }}>
          Your Profile
        </h1>
        <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Preferences used to personalise your fishing briefings.
        </p>

        {loading ? (
          <div style={{ display: 'flex', gap: '4px', padding: '2rem', justifyContent: 'center' }}>
            <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
          </div>
        ) : (
          <div className="card" style={{ padding: '2rem' }}>

            {/* Username (read-only) */}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(107,143,163,0.15)' }}>
              <label style={labelStyle}>Username</label>
              <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(107,143,163,0.08)', borderRadius: '0.5rem', border: '1px solid rgba(107,143,163,0.2)', color: 'var(--color-foam)', fontSize: '0.9375rem' }}>
                {username}
              </div>
              <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-mist)' }}>
                Username cannot be changed.
              </p>
            </div>

            <form onSubmit={handleSave} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                  />
                </div>

                {/* Sounder type */}
                <div>
                  <label style={labelStyle}>Fish Finder / Sounder Brand</label>
                  <select
                    value={form.sounderType}
                    onChange={e => setForm(f => ({ ...f, sounderType: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    {SOUNDER_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                  <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-mist)' }}>
                    Used to tailor sounder operation tips in your briefing.
                  </p>
                </div>

                {/* Seasickness tolerance */}
                <div>
                  <label style={labelStyle}>Sea Conditions Tolerance — {form.seasicknessTolerance}/5</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={form.seasicknessTolerance}
                    onChange={e => setForm(f => ({ ...f, seasicknessTolerance: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--color-current)', marginBottom: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} style={{ fontSize: '0.75rem', color: form.seasicknessTolerance === n ? 'var(--color-seafoam)' : 'rgba(107,143,163,0.5)', fontWeight: form.seasicknessTolerance === n ? 600 : 400 }}>
                        {n}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-seafoam)' }}>
                    {TOLERANCE_LABELS[form.seasicknessTolerance]}
                  </p>
                </div>

                {error && (
                  <div role="alert" style={{ background: 'rgba(224,92,42,0.15)', border: '1px solid rgba(224,92,42,0.4)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--color-warning)', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}

                {success && (
                  <div style={{ background: 'rgba(46,204,138,0.12)', border: '1px solid rgba(46,204,138,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--color-success)', fontSize: '0.875rem' }}>
                    Profile saved successfully.
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {saving ? (
                    <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
                      &nbsp;Saving…
                    </span>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
