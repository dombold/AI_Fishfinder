'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import UserDropdown from '@/components/UserDropdown'
import CatchLogForm from '@/components/CatchLogForm'

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
}

export default function CatchLogPage() {
  const [catches, setCatches] = useState<CatchEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const fetchCatches = useCallback(() => {
    fetch('/api/catch-log')
      .then(r => r.json())
      .then(d => {
        setCatches(d.catches ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchCatches() }, [fetchCatches])

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

      {/* Nav */}
      <nav style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(107,143,163,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11,25,41,0.7)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ height: '28px', width: 'auto' }} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/dashboard" style={{ color: 'var(--color-seafoam)', fontSize: '0.875rem', textDecoration: 'none' }}>← New Plan</Link>
          <UserDropdown />
        </div>
      </nav>

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

        {loading ? (
          <div style={{ display: 'flex', gap: '4px', padding: '2rem', justifyContent: 'center' }}>
            <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
          </div>
        ) : catches.length === 0 ? (
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
              <div key={c.id} className="card" style={{ padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
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
                </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
