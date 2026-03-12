'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PlanPoller({ sessionId, initialStatus }: { sessionId: string; initialStatus: string }) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (status === 'COMPLETE' || status === 'ERROR') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/status`)
        const data = await res.json()
        setStatus(data.status)
        if (data.errorMessage) setErrorMessage(data.errorMessage)
        if (data.status === 'COMPLETE') {
          clearInterval(interval)
          router.refresh()
        }
      } catch {
        // Ignore network errors during polling
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [sessionId, status, router])

  if (status === 'ERROR') {
    return (
      <div style={{ maxWidth: '560px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>Plan Generation Failed</h2>
        {errorMessage && <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{errorMessage}</p>}
        <a href="/dashboard" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Try Again</a>
      </div>
    )
  }

  const steps = [
    { label: 'Fetching location data', done: status !== 'PENDING' },
    { label: 'Gathering ocean conditions', done: status === 'GENERATING' || status === 'COMPLETE' },
    { label: 'AI crafting your briefing…', done: status === 'COMPLETE' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem' }}>
      {/* Wave animation */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
        {[...Array(7)].map((_, i) => (
          <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s`, height: `${14 + (i % 3) * 6}px` }} />
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-foam)', marginBottom: '0.25rem' }}>
          Preparing Your Fishing Plan
        </h2>
        <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem' }}>
          Analysing marine conditions and generating your briefing…
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '320px' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: step.done ? 'none' : '2px solid rgba(107,143,163,0.3)',
              background: step.done ? 'var(--color-success)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '0.7rem',
            }}>
              {step.done && '✓'}
            </div>
            <span style={{ fontSize: '0.875rem', color: step.done ? 'var(--color-foam)' : 'var(--color-mist)' }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
