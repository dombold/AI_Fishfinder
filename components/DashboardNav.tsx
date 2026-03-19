'use client'

import { useState } from 'react'
import Link from 'next/link'
import UserDropdown from '@/components/UserDropdown'
import RegulationsDropdown from '@/components/RegulationsDropdown'
import PendingSyncBadge from '@/components/PendingSyncBadge'
import SyncStatusModal from '@/components/SyncStatusModal'

interface Props {
  backHref?: string
  backLabel?: string
}

export default function DashboardNav({ backHref, backLabel = '← Dashboard' }: Props) {
  const [syncOpen, setSyncOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <style>{`
        .dnav-links { display: flex; align-items: center; gap: 1rem; }
        .dnav-hamburger { display: none; }
        .dnav-mobile-panel { display: flex; flex-direction: column; }
        @media (max-width: 768px) {
          .dnav-links { display: none; }
          .dnav-hamburger { display: flex; }
        }
        @media (min-width: 769px) {
          .dnav-mobile-panel { display: none !important; }
        }
        .dnav-mobile-panel a:hover { color: var(--color-foam); }
        .dnav-mobile-panel a:last-child { border-bottom: none !important; }
      `}</style>

      <nav style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(107,143,163,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11,25,41,0.7)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo-mark.svg" alt="AI Fishfinder" style={{ height: '28px', width: 'auto' }} />
        </Link>

        {/* Desktop text links — hidden on mobile */}
        <div className="dnav-links">
          {backHref && (
            <Link href={backHref} style={{ color: 'var(--color-seafoam)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
              {backLabel}
            </Link>
          )}
          <Link href="/dashboard" style={{ color: 'var(--color-mist)', fontSize: '0.875rem', textDecoration: 'none' }}>Plan</Link>
          <Link href="/identify" style={{ color: 'var(--color-mist)', fontSize: '0.875rem', textDecoration: 'none' }}>Identify</Link>
          <Link href="/guide" style={{ color: 'var(--color-mist)', fontSize: '0.875rem', textDecoration: 'none' }}>Guide</Link>
          <Link href="/contact" style={{ color: 'var(--color-mist)', fontSize: '0.875rem', textDecoration: 'none' }}>Contact</Link>
          <Link href="/about" style={{ color: 'var(--color-mist)', fontSize: '0.875rem', textDecoration: 'none' }}>About</Link>
        </div>

        {/* Right cluster — always visible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <PendingSyncBadge onClick={() => setSyncOpen(true)} />
          <RegulationsDropdown />
          <UserDropdown />

          {/* Hamburger button — hidden on desktop */}
          <button
            type="button"
            className="dnav-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="dnav-mobile-panel"
            style={{
              background: menuOpen ? 'rgba(107,143,163,0.12)' : 'transparent',
              border: '1px solid rgba(107,143,163,0.25)',
              borderRadius: '0.5rem',
              padding: '0.375rem 0.5rem',
              cursor: 'pointer',
              color: menuOpen ? 'var(--color-foam)' : 'var(--color-mist)',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile slide-down panel */}
      <div
        id="dnav-mobile-panel"
        className="dnav-mobile-panel"
        aria-hidden={!menuOpen}
        style={{
          background: 'rgba(11,25,41,0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(107,143,163,0.2)',
          padding: '0.75rem 1.5rem 1rem',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          transition: 'transform 200ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 200ms cubic-bezier(0.25,0.46,0.45,0.94)',
          transform: menuOpen ? 'translateY(0)' : 'translateY(-8px)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        {backHref && (
          <Link href={backHref} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0', color: 'var(--color-seafoam)', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid rgba(107,143,163,0.1)' }}>
            {backLabel}
          </Link>
        )}
        <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0', color: 'var(--color-mist)', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(107,143,163,0.1)' }}>Plan</Link>
        <Link href="/identify" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0', color: 'var(--color-mist)', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(107,143,163,0.1)' }}>Identify</Link>
        <Link href="/guide" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0', color: 'var(--color-mist)', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(107,143,163,0.1)' }}>Guide</Link>
        <Link href="/contact" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0', color: 'var(--color-mist)', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid rgba(107,143,163,0.1)' }}>Contact</Link>
        <Link href="/about" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0', color: 'var(--color-mist)', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none' }}>About</Link>
      </div>

      <SyncStatusModal open={syncOpen} onClose={() => setSyncOpen(false)} />
    </>
  )
}
