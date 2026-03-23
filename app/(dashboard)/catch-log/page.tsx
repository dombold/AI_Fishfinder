'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardNav from '@/components/DashboardNav'
import CatchLogForm from '@/components/CatchLogForm'
import { listPendingCatches, type PendingCatch } from '@/lib/offline-db'
import { syncPendingCatches } from '@/lib/sync-manager'

interface CatchEntry {
  id: string
  date: string
  latitude: number
  longitude: number
  species: string
  quantity: number
  weightKg: number | null
  lengthCm: number | null
  notes: string | null
  captureTime: string | null
  environment: string | null
  fishingMethod: string | null
  sst: number | null
  tideDirection: string | null
  moonPhase: string | null
  waterDepthM: number | null
  photoBase64: string | null
  shared: boolean
  sharedGroups: { groupId: string }[]
}

export default function CatchLogPage() {
  const [catches, setCatches] = useState<CatchEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingCatches, setPendingCatches] = useState<PendingCatch[]>([])
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const fetchCatches = useCallback(() => {
    fetch('/api/catch-log')
      .then(r => r.json())
      .then(d => {
        setCatches(d.catches ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const refreshPending = useCallback(async () => {
    const items = await listPendingCatches()
    setPendingCatches(items)
  }, [])

  useEffect(() => {
    fetchCatches()
    refreshPending()

    // Auto-sync when page loads (if online)
    if (navigator.onLine) {
      syncPendingCatches().then(() => {
        fetchCatches()
        refreshPending()
      })
    }

    const handleOnline = () => {
      syncPendingCatches().then(() => {
        fetchCatches()
        refreshPending()
      })
    }
    const handleSynced = () => {
      fetchCatches()
      refreshPending()
    }
    const handlePending = () => refreshPending()

    window.addEventListener('online', handleOnline)
    window.addEventListener('catches-synced', handleSynced)
    window.addEventListener('pending-catches-changed', handlePending)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('catches-synced', handleSynced)
      window.removeEventListener('pending-catches-changed', handlePending)
    }
  }, [fetchCatches, refreshPending])

  useEffect(() => {
    if (!lightboxSrc) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxSrc(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxSrc])

  function sharingState(c: CatchEntry): 'all' | 'partial' | 'private' {
    if (c.shared) return 'all'
    if (c.sharedGroups.length > 0) return 'partial'
    return 'private'
  }

  async function cycleSharing(c: CatchEntry) {
    const next = c.shared
      ? { shared: false, sharedGroupIds: [] }
      : { shared: true, sharedGroupIds: [] }
    try {
      const res = await fetch(`/api/catch-log/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (res.ok) {
        setCatches(prev => prev.map(x =>
          x.id === c.id ? { ...x, shared: next.shared, sharedGroups: [] } : x
        ))
      }
    } catch {}
  }

  async function deleteCatch(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/catch-log/${id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        setCatches(prev => prev.filter(c => c.id !== id))
      }
    } catch {}
    finally { setDeletingId(null) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>

      <DashboardNav />

      <div style={{ maxWidth: '680px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.25rem' }}>
              Catch Log
            </h1>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem' }}>
              Your personal fishing history.
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowForm(v => !v)}
            style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem', flexShrink: 0, marginTop: '0.25rem' }}
          >
            {showForm ? '✕ Cancel' : '+ Log a Catch'}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <CatchLogForm onSuccess={() => { fetchCatches(); setShowForm(false) }} />
          </div>
        )}

        {/* Pending offline catches */}
        {pendingCatches.length > 0 && (
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingCatches.map(c => (
              <div key={c.localId} className="card" style={{ padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderColor: 'rgba(201,168,76,0.3)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--color-foam)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.15rem' }}>
                    {c.formData.species}{' '}
                    <span style={{ color: 'var(--color-mist)', fontWeight: 400, fontSize: '0.875rem' }}>× {c.formData.quantity}</span>
                  </p>
                  <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>
                    {new Date(c.formData.date + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{Math.abs(c.formData.latitude).toFixed(3)}°S, {c.formData.longitude.toFixed(3)}°E
                  </p>
                </div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#C9A84C', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '20px', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Pending sync
                </span>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', gap: '4px', padding: '2rem', justifyContent: 'center' }}>
            <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
          </div>
        ) : catches.length === 0 && pendingCatches.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              No catches logged yet.
            </p>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem' }}>
              Use <strong style={{ color: 'var(--color-seafoam)' }}>+ Log a Catch</strong> above to start building your history.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {catches.map(c => (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="card" style={{ padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  {c.photoBase64 && (
                    <button
                      type="button"
                      onClick={() => setLightboxSrc(c.photoBase64!)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'zoom-in', flexShrink: 0 }}
                      aria-label="View full-size photo"
                    >
                      <img
                        src={`data:image/jpeg;base64,${c.photoBase64}`}
                        alt={`${c.species} catch photo`}
                        style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', display: 'block', border: '1px solid rgba(107,143,163,0.2)' }}
                      />
                    </button>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'var(--color-foam)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.15rem' }}>
                      {c.species}{' '}
                      <span style={{ color: 'var(--color-mist)', fontWeight: 400, fontSize: '0.875rem' }}>
                        × {c.quantity}{c.weightKg ? ` · ${c.weightKg}kg` : ''}{c.lengthCm ? ` · ${c.lengthCm}cm` : ''}
                      </span>
                    </p>
                    <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>
                      {new Date(c.date + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{Math.abs(c.latitude).toFixed(3)}°S, {c.longitude.toFixed(3)}°E
                    </p>
                    {c.notes && (
                      <p style={{ color: 'rgba(107,143,163,0.7)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{c.notes}</p>
                    )}
                    {(c.sst != null || c.tideDirection || c.moonPhase || c.waterDepthM != null) && (
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {c.sst != null && (
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(10,126,164,0.12)', border: '1px solid rgba(10,126,164,0.3)', color: 'var(--color-current, #2196c4)' }}>
                            {c.sst.toFixed(1)}°C
                          </span>
                        )}
                        {c.waterDepthM != null && (
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(10,126,164,0.08)', border: '1px solid rgba(10,126,164,0.25)', color: 'var(--color-current, #2196c4)' }}>
                            {c.waterDepthM % 1 === 0 ? c.waterDepthM : c.waterDepthM.toFixed(1)}m depth
                          </span>
                        )}
                        {c.tideDirection && (
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(60,191,174,0.1)', border: '1px solid rgba(60,191,174,0.3)', color: 'var(--color-seafoam)' }}>
                            {c.tideDirection.charAt(0).toUpperCase() + c.tideDirection.slice(1)} tide
                          </span>
                        )}
                        {c.moonPhase && (
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--color-sand, #c9a84c)' }}>
                            {c.moonPhase}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, alignItems: 'center' }}>
                    {(() => {
                      const state = sharingState(c)
                      const badgeLabel = state === 'all' ? 'All groups' : state === 'partial' ? `${c.sharedGroups.length} group${c.sharedGroups.length > 1 ? 's' : ''}` : 'Private'
                      const badgeTip = state === 'all' ? 'Visible to all groups — click to make private' : state === 'partial' ? `Shared with ${c.sharedGroups.length} group${c.sharedGroups.length > 1 ? 's' : ''} — click to make private` : 'Private — click to share with all groups'
                      const badgeBg = state === 'all' ? 'rgba(61,184,200,0.1)' : state === 'partial' ? 'rgba(201,168,76,0.08)' : 'rgba(107,143,163,0.08)'
                      const badgeBorder = state === 'all' ? 'rgba(61,184,200,0.3)' : state === 'partial' ? 'rgba(201,168,76,0.3)' : 'rgba(107,143,163,0.25)'
                      const badgeColor = state === 'all' ? 'var(--color-seafoam)' : state === 'partial' ? '#c9a84c' : 'var(--color-mist)'
                      return (
                        <button
                          type="button"
                          onClick={() => cycleSharing(c)}
                          title={badgeTip}
                          style={{
                            background: badgeBg,
                            border: `1px solid ${badgeBorder}`,
                            borderRadius: '20px',
                            padding: '0.15rem 0.5rem',
                            cursor: 'pointer',
                            color: badgeColor,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            lineHeight: 1.4,
                            flexShrink: 0,
                            letterSpacing: '0.03em',
                          }}
                        >
                          {badgeLabel}
                        </button>
                      )
                    })()}
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                      style={{ background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: 'var(--color-seafoam)', fontSize: '1rem', lineHeight: 1, opacity: editingId === c.id ? 1 : 0.55, flexShrink: 0 }}
                      title="Edit catch"
                      aria-label="Edit catch"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCatch(c.id)}
                      disabled={deletingId === c.id}
                      style={{ background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: 'rgba(224,92,42,0.6)', fontSize: '1rem', lineHeight: 1, opacity: deletingId === c.id ? 0.4 : 1, flexShrink: 0 }}
                      title="Delete catch"
                      aria-label="Delete catch"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {editingId === c.id && (
                  <div className="card" style={{ padding: '1.5rem', marginTop: '0.25rem', borderTop: '1px solid rgba(107,143,163,0.12)' }}>
                    <CatchLogForm
                      catchId={c.id}
                      initialValues={{
                        date: c.date,
                        latitude: c.latitude,
                        longitude: c.longitude,
                        species: c.species,
                        quantity: c.quantity,
                        weightKg: c.weightKg,
                        lengthCm: c.lengthCm,
                        notes: c.notes,
                        captureTime: c.captureTime,
                        environment: c.environment,
                        fishingMethod: c.fishingMethod,
                        sst: c.sst,
                        tideDirection: c.tideDirection,
                        moonPhase: c.moonPhase,
                        waterDepthM: c.waterDepthM,
                        shared: c.shared,
                        sharedGroupIds: c.sharedGroups.map(sg => sg.groupId),
                      }}
                      onSuccess={() => { fetchCatches(); setEditingId(null) }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(4,20,30,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/jpeg;base64,${lightboxSrc}`}
            alt="Catch photo"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 'min(90vw, 800px)',
              maxHeight: '85vh',
              borderRadius: '12px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              objectFit: 'contain',
            }}
          />
          <button
            type="button"
            onClick={() => setLightboxSrc(null)}
            aria-label="Close"
            style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              background: 'rgba(107,143,163,0.15)', border: '1px solid rgba(107,143,163,0.3)',
              color: 'var(--color-foam)', borderRadius: '50%',
              width: '2rem', height: '2rem', cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
      )}
    </div>
  )
}
