'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/profile', label: 'Profile' },
  { href: '/saved-plans', label: 'Saved Plans' },
  { href: '/catch-log', label: 'Catch Logs' },
  { href: '/groups', label: 'Groups' },
]

export default function UserDropdown() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [inviteCount, setInviteCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => { if (data.avatar) setAvatar(data.avatar) })
      .catch(() => {})
    fetch('/api/invites')
      .then(r => r.json())
      .then(data => { setInviteCount(data.invites?.length ?? 0) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          background: open ? 'rgba(107,143,163,0.12)' : 'transparent',
          border: '1px solid rgba(107,143,163,0.25)',
          borderRadius: '0.5rem',
          padding: '0.375rem 0.75rem',
          cursor: 'pointer',
          color: 'var(--color-foam)',
          fontSize: '0.875rem',
          transition: 'background 200ms',
        }}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt="Your avatar"
            style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(60,191,174,0.5)', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--color-current)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-display)',
            color: 'var(--color-foam)',
            flexShrink: 0,
          }}>
            {(session?.user?.name ?? '?').charAt(0).toUpperCase()}
          </div>
        )}
        <span style={{ color: 'var(--color-mist)' }}>{session?.user?.name ?? '…'}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden="true"
          style={{
            color: 'var(--color-mist)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms',
          }}
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 0.5rem)',
            minWidth: '176px',
            background: '#0E2A45',
            border: '1px solid rgba(107,143,163,0.2)',
            borderRadius: '0.625rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            zIndex: 200,
          }}
        >
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="dropdown-item"
              style={{
                display: 'block',
                padding: '0.625rem 1rem',
                color: 'var(--color-foam)',
                fontSize: '0.875rem',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(107,143,163,0.1)',
              }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/invites"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="dropdown-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.625rem 1rem',
              color: 'var(--color-foam)',
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            <span>Invites</span>
            {inviteCount > 0 && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-seafoam)', background: 'rgba(61,184,200,0.12)', border: '1px solid rgba(61,184,200,0.3)', borderRadius: '20px', padding: '0.1rem 0.45rem', lineHeight: 1.4 }}>
                {inviteCount}
              </span>
            )}
          </Link>

          <div style={{ borderTop: '1px solid rgba(107,143,163,0.2)' }}>
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="dropdown-item"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.625rem 1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-warning)',
                fontSize: '0.875rem',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
