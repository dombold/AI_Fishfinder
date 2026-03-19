'use client'

import { useState, useEffect, useCallback } from 'react'
import { listPendingCatches } from '@/lib/offline-db'

interface Props {
  onClick?: () => void
}

export default function PendingSyncBadge({ onClick }: Props) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    const items = await listPendingCatches()
    setCount(items.length)
  }, [])

  useEffect(() => {
    refresh()

    const handleSync = () => refresh()
    const handlePending = () => refresh()

    window.addEventListener('catches-synced', handleSync)
    window.addEventListener('pending-catches-changed', handlePending)
    return () => {
      window.removeEventListener('catches-synced', handleSync)
      window.removeEventListener('pending-catches-changed', handlePending)
    }
  }, [refresh])

  if (count === 0) return null

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${count} catch${count !== 1 ? 'es' : ''} waiting to sync`}
      aria-label={`${count} pending catch${count !== 1 ? 'es' : ''} — tap to sync`}
      style={{
        background: 'rgba(201,168,76,0.15)',
        border: '1px solid rgba(201,168,76,0.35)',
        borderRadius: '20px',
        padding: '0.2rem 0.6rem',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#C9A84C',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '0.625rem' }}>⬆</span>
      {count}
    </button>
  )
}
