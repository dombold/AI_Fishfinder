'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardNav from '@/components/DashboardNav'
import { resizeImage } from '@/lib/image-utils'

const SOUNDER_OPTIONS = ['NONE', 'GARMIN', 'SIMRAD', 'LOWRANCE', 'HUMMINBIRD', 'RAYMARINE', 'FURUNO', 'B&G']

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
  const [form, setForm] = useState({ email: '', sounderType: 'NONE', seasicknessTolerance: 3, weeklyDigestOptIn: false })
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarChanged, setAvatarChanged] = useState(false)
  const [avatarHover, setAvatarHover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setUsername(data.username ?? '')
        setAvatar(data.avatar ?? null)
        setForm({
          email: data.email ?? '',
          sounderType: data.sounderType ?? 'NONE',
          seasicknessTolerance: data.seasicknessTolerance ?? 3,
          weeklyDigestOptIn: data.weeklyDigestOptIn ?? false,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { base64, mimeType } = await resizeImage(file)
      setAvatar(`data:${mimeType};base64,${base64}`)
      setAvatarChanged(true)
    } catch {
      setError('Failed to process image — please try another file')
    }
  }

  function handleRemoveAvatar() {
    setAvatar(null)
    setAvatarChanged(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match')
      return
    }
    setPwSaving(true)
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwError(data.error ?? 'Failed to change password')
      } else {
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setPwSuccess(true)
        setTimeout(() => setPwSuccess(false), 3000)
      }
    } catch {
      setPwError('Network error — please try again')
    } finally {
      setPwSaving(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const body: Record<string, unknown> = { ...form }
      if (avatarChanged) body.avatar = avatar
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save')
      } else {
        setAvatarChanged(false)
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

      <DashboardNav />

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

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(107,143,163,0.15)' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={() => setAvatarHover(true)}
                  onMouseLeave={() => setAvatarHover(false)}
                  aria-label="Upload avatar"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: '2px solid var(--color-seafoam)',
                    boxShadow: '0 0 0 4px rgba(60,191,174,0.15), 0 4px 16px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: 0,
                    background: 'none',
                    position: 'relative',
                    display: 'block',
                    opacity: avatarHover ? 0.8 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="Your avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'var(--color-current)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.75rem',
                      color: 'var(--color-foam)',
                      letterSpacing: '-0.03em',
                    }}>
                      {username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {avatarHover && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(11,25,41,0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-foam)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-foam)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Profile photo
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-mist)', lineHeight: 1.5 }}>
                  Click to upload. JPEG or PNG, max 1024px.
                </p>
                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    style={{ marginTop: '0.375rem', fontSize: '0.8rem', color: 'var(--color-warning)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

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
                      <option key={s} value={s}>
                        {s === 'NONE' ? 'None (no sounder)' : s === 'B&G' ? 'B&G' : s.charAt(0) + s.slice(1).toLowerCase()}
                      </option>
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

                {/* Weekly digest opt-in */}
                <div style={{ paddingTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', flexShrink: 0, marginTop: '1px' }}>
                      <input
                        type="checkbox"
                        checked={form.weeklyDigestOptIn}
                        onChange={e => setForm(f => ({ ...f, weeklyDigestOptIn: e.target.checked }))}
                        style={{ position: 'absolute', opacity: 0, width: '18px', height: '18px', margin: 0, cursor: 'pointer' }}
                      />
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: `2px solid ${form.weeklyDigestOptIn ? 'var(--color-seafoam)' : 'rgba(107,143,163,0.4)'}`,
                        background: form.weeklyDigestOptIn ? 'var(--color-seafoam)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.15s, border-color 0.15s',
                        pointerEvents: 'none',
                      }}>
                        {form.weeklyDigestOptIn && (
                          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                            <path d="M1 4L4 7.5L10 1" stroke="#0B1929" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-foam)', fontWeight: 500 }}>
                        Weekly fishing intelligence email
                      </span>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-mist)', marginTop: '0.2rem', lineHeight: 1.5 }}>
                        Receive a weekly digest of crowd-sourced species activity and hotspots across all four WA bioregions.
                      </span>
                    </div>
                  </label>
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

            {/* Divider */}
            <div style={{ borderTop: '1px solid rgba(107,143,163,0.15)', margin: '2rem 0' }} />

            {/* Change Password */}
            <form onSubmit={handleChangePassword} noValidate>
              <p style={{ ...labelStyle, marginBottom: '1.25rem', fontSize: '0.9rem', textTransform: 'none', letterSpacing: 'normal', color: 'var(--color-foam)', fontWeight: 600 }}>
                Change Password
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Current Password</label>
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <input
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </div>

                {pwError && (
                  <div role="alert" style={{ background: 'rgba(224,92,42,0.15)', border: '1px solid rgba(224,92,42,0.4)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--color-warning)', fontSize: '0.875rem' }}>
                    {pwError}
                  </div>
                )}

                {pwSuccess && (
                  <div style={{ background: 'rgba(46,204,138,0.12)', border: '1px solid rgba(46,204,138,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--color-success)', fontSize: '0.875rem' }}>
                    Password changed successfully.
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-ghost"
                  disabled={pwSaving}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {pwSaving ? (
                    <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
                      &nbsp;Updating…
                    </span>
                  ) : 'Update Password'}
                </button>
              </div>
            </form>

          </div>
        )}
      </div>
    </div>
  )
}
