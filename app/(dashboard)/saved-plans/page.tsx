'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import UserDropdown from '@/components/UserDropdown'

interface SavedPlan {
  id: string
  locationName: string | null
  latitude: number
  startDate: string
  endDate: string
  fishingType: string
  createdAt: string
}

export default function SavedPlansPage() {
  const [plans, setPlans] = useState<SavedPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setPlans(data.savedPlans ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function deletePlan(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        setPlans(prev => prev.filter(p => p.id !== id))
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
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.25rem' }}>
          Saved Plans
        </h1>
        <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Your bookmarked fishing briefings.
        </p>

        {loading ? (
          <div style={{ display: 'flex', gap: '4px', padding: '2rem', justifyContent: 'center' }}>
            <span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" />
          </div>
        ) : plans.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              No saved plans yet.
            </p>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem' }}>
              Generate a plan and click <strong style={{ color: 'var(--color-seafoam)' }}>★ Save Plan</strong> to bookmark it here.
            </p>
            <Link href="/dashboard" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1.5rem', textDecoration: 'none' }}>
              Create a Plan
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {plans.map(plan => {
              const start = new Date(plan.startDate + 'T12:00:00')
              const end = new Date(plan.endDate + 'T12:00:00')
              const dateLabel = start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) +
                (plan.startDate !== plan.endDate
                  ? ` – ${end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : `, ${start.getFullYear()}`)
              return (
                <div key={plan.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'var(--color-foam)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                      {plan.locationName ?? `${Math.abs(plan.latitude).toFixed(2)}°S`}
                    </p>
                    <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>
                      {dateLabel} · {plan.fishingType}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <Link href={`/plan/${plan.id}`} style={{ color: 'var(--color-seafoam)', fontSize: '0.8125rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      View →
                    </Link>
                    <button
                      type="button"
                      onClick={() => deletePlan(plan.id)}
                      disabled={deletingId === plan.id}
                      style={{ background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: 'rgba(224,92,42,0.6)', fontSize: '1rem', lineHeight: 1, opacity: deletingId === plan.id ? 0.4 : 1 }}
                      title="Delete plan"
                      aria-label="Delete plan"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
