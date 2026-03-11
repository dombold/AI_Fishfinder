'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.5rem' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          An unexpected error occurred. Please try again or return to the dashboard.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
          <Link href="/" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
