'use client'

import Link from 'next/link'

export default function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      marginTop: 'auto',
      borderTop: '1px solid rgba(107,143,163,0.12)',
      background: 'rgba(11,25,41,0.6)',
      backdropFilter: 'blur(8px)',
      padding: '1.5rem',
    }}>
      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'rgba(107,143,163,0.5)' }}>
          © {year} AI Fishfinder. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link
            href="/contact"
            style={{ fontSize: '0.8125rem', color: 'rgba(107,143,163,0.65)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-mist)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(107,143,163,0.65)' }}
          >Contact</Link>
          <Link
            href="/about"
            style={{ fontSize: '0.8125rem', color: 'rgba(107,143,163,0.65)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-mist)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(107,143,163,0.65)' }}
          >About</Link>
        </div>
      </div>
    </footer>
  )
}
