'use client'

import { useState } from 'react'

interface Props {
  sessionId: string
  initialSaved: boolean
}

export default function SavePlanButton({ sessionId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function toggle() {
    setLoading(true)
    setError('')
    try {
      const next = !saved
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saved: next }),
      })
      if (res.ok) {
        setSaved(next)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Error ${res.status}`)
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="btn-ghost"
        style={{
          fontSize: '0.875rem',
          color: saved ? 'var(--color-seafoam)' : undefined,
          borderColor: saved ? 'var(--color-seafoam)' : undefined,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '…' : saved ? '★ Saved' : '☆ Save Plan'}
      </button>
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>{error}</span>}
    </div>
  )
}
