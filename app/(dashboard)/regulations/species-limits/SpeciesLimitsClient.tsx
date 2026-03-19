'use client'

import { useState, useRef, useEffect } from 'react'
import { REGULATIONS, SpeciesRegulation } from '@/lib/regulations'

const SPECIES_LIST = Object.keys(REGULATIONS).sort()

const BIOREGIONS: { key: 'north-coast' | 'gascoyne' | 'west-coast' | 'south-coast'; label: string }[] = [
  { key: 'north-coast', label: 'North Coast' },
  { key: 'gascoyne',    label: 'Gascoyne Coast' },
  { key: 'west-coast',  label: 'West Coast' },
  { key: 'south-coast', label: 'South Coast' },
]

function RegField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(107,143,163,0.6)' }}>
        {label}
      </span>
      <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', margin: '0.15rem 0 0', lineHeight: 1.5 }}>
        {value}
      </p>
    </div>
  )
}

function BioregionCard({ label, reg }: { label: string; reg: SpeciesRegulation }) {
  return (
    <div style={{
      padding: '1.25rem 1.375rem',
      background: reg.closureActive ? 'rgba(224,92,42,0.06)' : 'rgba(107,143,163,0.05)',
      border: reg.closureActive ? '1px solid rgba(224,92,42,0.3)' : '1px solid rgba(107,143,163,0.15)',
      borderLeft: reg.closureActive ? '4px solid var(--color-warning)' : '4px solid rgba(107,143,163,0.2)',
      borderRadius: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-foam)', margin: 0, letterSpacing: '-0.02em' }}>
        {label}
      </p>

      {reg.closureActive && reg.closureReason && (
        <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(224,92,42,0.12)', border: '1px solid rgba(224,92,42,0.3)', borderRadius: '0.375rem' }}>
          <p style={{ color: 'var(--color-warning)', fontSize: '0.8125rem', margin: 0, lineHeight: 1.55, fontWeight: 600 }}>
            {reg.closureReason}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <RegField label="Size Limit" value={reg.minSize ?? 'No minimum size'} />
        <RegField label="Bag Limit" value={reg.bagLimit} />
        {reg.combinedLimit && <RegField label="Combined Limit" value={reg.combinedLimit} />}
        {reg.seasonalClosures && <RegField label="Seasonal Closures" value={reg.seasonalClosures} />}
      </div>

      {reg.notes && (
        <p style={{ fontSize: '0.8125rem', color: 'rgba(201,168,76,0.9)', lineHeight: 1.6, margin: 0, borderTop: '1px solid rgba(107,143,163,0.12)', paddingTop: '0.625rem' }}>
          {reg.notes}
        </p>
      )}
    </div>
  )
}

export default function SpeciesLimitsClient() {
  const [query, setQuery]           = useState('')
  const [open, setOpen]             = useState(false)
  const [selected, setSelected]     = useState<string | null>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)
  const containerRef                = useRef<HTMLDivElement>(null)

  const filtered = query.trim().length === 0
    ? SPECIES_LIST
    : SPECIES_LIST.filter(s => s.toLowerCase().includes(query.toLowerCase()))

  function pick(species: string) {
    setSelected(species)
    setQuery(species)
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setOpen(true)
    if (val === '') setSelected(null)
    else if (selected && val !== selected) setSelected(null)
  }

  function handleInputFocus() {
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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

  const regulations = selected ? REGULATIONS[selected] : null

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-label" style={{ margin: '0 0 0.75rem', display: 'inline-block' }}>WA DPIRD 2026</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Species Limits
        </h1>
        <p style={{ color: 'var(--color-mist)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Size limits, bag limits and combined limits by bioregion for Western Australian recreational fishing.
        </p>
      </div>

      {/* Search box */}
      <div ref={containerRef} style={{ position: 'relative', maxWidth: '440px', marginBottom: '2.5rem' }}>
        <div style={{ position: 'relative' }}>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            aria-hidden="true"
            style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(107,143,163,0.5)', pointerEvents: 'none' }}
          >
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search species…"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            autoComplete="off"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              paddingLeft: '2.5rem',
              paddingRight: query ? '2.25rem' : '0.875rem',
              paddingTop: '0.625rem',
              paddingBottom: '0.625rem',
              background: 'rgba(107,143,163,0.07)',
              border: open ? '1px solid rgba(107,143,163,0.4)' : '1px solid rgba(107,143,163,0.2)',
              borderRadius: open && filtered.length > 0 ? '0.625rem 0.625rem 0 0' : '0.625rem',
              color: 'var(--color-foam)',
              fontSize: '0.9375rem',
              outline: 'none',
              transition: 'border-color 150ms',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSelected(null); setOpen(false); inputRef.current?.focus() }}
              aria-label="Clear"
              style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(107,143,163,0.5)', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown list */}
        {open && filtered.length > 0 && (
          <ul
            role="listbox"
            style={{
              position: 'absolute',
              left: 0, right: 0,
              top: '100%',
              maxHeight: '240px',
              overflowY: 'auto',
              background: '#0E2A45',
              border: '1px solid rgba(107,143,163,0.3)',
              borderTop: 'none',
              borderRadius: '0 0 0.625rem 0.625rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              margin: 0,
              padding: 0,
              listStyle: 'none',
              zIndex: 100,
            }}
          >
            {filtered.map((s, i) => (
              <li
                key={s}
                role="option"
                aria-selected={s === selected}
                onMouseDown={() => pick(s)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  color: s === selected ? 'var(--color-seafoam)' : 'var(--color-foam)',
                  cursor: 'pointer',
                  background: s === selected ? 'rgba(107,163,143,0.1)' : 'transparent',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(107,143,163,0.08)' : 'none',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => { if (s !== selected) (e.currentTarget as HTMLElement).style.background = 'rgba(107,143,163,0.08)' }}
                onMouseLeave={e => { if (s !== selected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}

        {open && filtered.length === 0 && query.trim().length > 0 && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '100%',
            background: '#0E2A45', border: '1px solid rgba(107,143,163,0.3)', borderTop: 'none',
            borderRadius: '0 0 0.625rem 0.625rem', padding: '0.75rem 1rem',
            fontSize: '0.875rem', color: 'rgba(107,143,163,0.6)', zIndex: 100,
          }}>
            No species found
          </div>
        )}
      </div>

      {/* Regulations display */}
      {!selected && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'rgba(107,143,163,0.45)' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.4 }}>
            <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2" />
            <path d="M30 30L42 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: '0.9375rem', margin: 0 }}>Select a species to view its regulations</p>
        </div>
      )}

      {selected && regulations && (
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--color-foam)', marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>
            {selected}
          </h2>
          <p style={{ color: 'rgba(107,143,163,0.55)', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
            Regulations by bioregion — WA DPIRD 2026
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {BIOREGIONS.map(({ key, label }) => (
              <BioregionCard key={key} label={label} reg={regulations[key]} />
            ))}
          </div>
        </section>
      )}

      <p style={{ marginTop: '3rem', fontSize: '0.75rem', color: 'rgba(107,143,163,0.45)', lineHeight: 1.6 }}>
        Always verify current regulations at{' '}
        <a href="https://fish.wa.gov.au" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(107,143,163,0.7)', textDecoration: 'underline' }}>
          fish.wa.gov.au
        </a>{' '}
        before your trip. Regulations can change with short notice.
      </p>
    </div>
  )
}
