'use client'

import { useState, useEffect, useCallback } from 'react'
import { listPendingCatches, type PendingCatch } from '@/lib/offline-db'
import { syncPendingCatches } from '@/lib/sync-manager'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SyncStatusModal({ open, onClose }: Props) {
  const [pending, setPending] = useState<PendingCatch[]>([])
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ synced: number; failed: number } | null>(null)

  const refresh = useCallback(async () => {
    const items = await listPendingCatches()
    setPending(items)
  }, [])

  useEffect(() => {
    if (open) {
      refresh()
      setResult(null)
    }
  }, [open, refresh])

  useEffect(() => {
    window.addEventListener('catches-synced', refresh)
    return () => window.removeEventListener('catches-synced', refresh)
  }, [refresh])

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    const res = await syncPendingCatches()
    setResult(res)
    setSyncing(false)
    await refresh()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Bottom-sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-modal-title"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 1001,
          background: '#0F2035',
          border: '1px solid rgba(107,143,163,0.2)',
          borderBottom: 'none',
          borderRadius: '1rem 1rem 0 0',
          padding: '1.5rem',
          maxHeight: '80vh',
          overflowY: 'auto',
          transform: 'translateY(0)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 id="sync-modal-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-foam)' }}>
            Pending Catches
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-mist)', fontSize: '1.25rem', lineHeight: 1, padding: '0.25rem' }}
          >
            ✕
          </button>
        </div>

        {pending.length === 0 ? (
          <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem' }}>
            {result ? 'All catches synced.' : 'No pending catches.'}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pending.map((c) => (
              <li
                key={c.localId}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(107,143,163,0.15)',
                  borderRadius: '8px',
                  padding: '0.625rem 0.875rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-foam)', fontWeight: 600 }}>
                    {c.formData.species}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-mist)', marginLeft: '0.5rem' }}>
                    ×{c.formData.quantity}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-mist)' }}>
                  {c.formData.date}
                </span>
              </li>
            ))}
          </ul>
        )}

        {result && (
          <p style={{ fontSize: '0.8125rem', color: result.failed > 0 ? 'var(--color-warning)' : '#3CBFAE', marginBottom: '1rem' }}>
            {result.synced > 0 && `${result.synced} catch${result.synced !== 1 ? 'es' : ''} uploaded. `}
            {result.failed > 0 && `${result.failed} failed — will retry when online.`}
            {result.synced > 0 && result.failed === 0 && 'All done.'}
          </p>
        )}

        {pending.length > 0 && (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', opacity: syncing ? 0.6 : 1 }}
          >
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        )}
      </div>
    </>
  )
}
