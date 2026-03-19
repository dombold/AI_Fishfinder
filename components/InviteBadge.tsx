'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function InviteBadge() {
  const [count, setCount] = useState(0)
  const router = useRouter()

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/invites')
      if (res.ok) {
        const data = await res.json()
        setCount(data.invites?.length ?? 0)
      }
    } catch {}
  }, [])

  useEffect(() => {
    refresh()

    const handleFocus = () => refresh()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refresh])

  if (count === 0) return null

  return (
    <button
      type="button"
      onClick={() => router.push('/invites')}
      title={`${count} pending group invite${count !== 1 ? 's' : ''}`}
      aria-label={`${count} pending group invite${count !== 1 ? 's' : ''} — tap to view`}
      style={{
        background: 'rgba(61,184,200,0.12)',
        border: '1px solid rgba(61,184,200,0.3)',
        borderRadius: '20px',
        padding: '0.2rem 0.6rem',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--color-seafoam)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '0.625rem' }}>✉</span>
      {count}
    </button>
  )
}
