'use client'

import { useState } from 'react'
import { REGULATIONS } from '@/lib/regulations'
import type { Bioregion } from '@/lib/regulations'

const BIOREGIONS: { id: Bioregion; label: string; desc: string }[] = [
  { id: 'north-coast', label: 'North Coast', desc: 'North of 21°46′S — Onslow, Exmouth, Broome, Kimberley' },
  { id: 'gascoyne',    label: 'Gascoyne',    desc: '21°46′S to 27°S — Shark Bay, Carnarvon, Kalbarri' },
  { id: 'west-coast',  label: 'West Coast',  desc: '27°S south to Augusta — Perth Metro, Geraldton, Busselton' },
  { id: 'south-coast', label: 'South Coast', desc: 'East of 115°30′E — Esperance, Albany, Great Australian Bight' },
]

const SPECIES_LIST = Object.keys(REGULATIONS)

export default function RegulationsPanel() {
  const [active, setActive] = useState<Bioregion>('west-coast')
  const region = BIOREGIONS.find(b => b.id === active)!

  return (
    <div>
      {/* Bioregion tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {BIOREGIONS.map(b => (
          <button
            key={b.id}
            type="button"
            onClick={() => setActive(b.id)}
            style={{
              padding: '0.5rem 1.125rem',
              borderRadius: '2rem',
              border: `1px solid ${active === b.id ? 'var(--color-current)' : 'rgba(107,143,163,0.25)'}`,
              background: active === b.id ? 'rgba(10,126,164,0.2)' : 'transparent',
              color: active === b.id ? 'var(--color-seafoam)' : 'var(--color-mist)',
              fontSize: '0.875rem',
              fontWeight: active === b.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'background 150ms, border-color 150ms, color 150ms',
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Region description */}
      <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
        {region.desc}
      </p>

      {/* Species table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="briefing-table" aria-label={`Fishing regulations — ${region.label}`}>
          <thead>
            <tr>
              <th style={{ minWidth: '160px' }}>Species</th>
              <th style={{ minWidth: '140px' }}>Min Size</th>
              <th style={{ minWidth: '140px' }}>Daily Bag</th>
              <th style={{ minWidth: '200px' }}>Combined Limit</th>
              <th>Notes / Closures</th>
            </tr>
          </thead>
          <tbody>
            {SPECIES_LIST.map((species, i) => {
              const reg = REGULATIONS[species][active]
              const isClosed = reg.closureActive === true
              const hasSeasonal = !!reg.seasonalClosures
              return (
                <tr
                  key={species}
                  style={{
                    background: isClosed
                      ? 'rgba(224,92,42,0.07)'
                      : i % 2 === 0 ? 'transparent' : 'rgba(107,143,163,0.03)',
                  }}
                >
                  <td style={{ fontWeight: 600, color: 'var(--color-foam)', whiteSpace: 'nowrap' }}>
                    {species}
                  </td>
                  <td style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>
                    {reg.minSize ?? '—'}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    {isClosed ? (
                      <span style={{ color: 'var(--color-warning)' }}>⚠ {reg.bagLimit}</span>
                    ) : (
                      <span style={{ color: 'var(--color-sand)' }}>{reg.bagLimit}</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>
                    {reg.combinedLimit ?? '—'}
                  </td>
                  <td style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                    {isClosed && (
                      <span style={{ display: 'inline-block', marginBottom: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', background: 'rgba(224,92,42,0.15)', color: 'var(--color-warning)', border: '1px solid rgba(224,92,42,0.3)', whiteSpace: 'nowrap' }}>
                        BOAT CLOSURE
                      </span>
                    )}
                    {hasSeasonal && (
                      <span style={{ display: 'inline-block', marginBottom: '0.25rem', marginLeft: isClosed ? '0.375rem' : 0, padding: '0.15rem 0.5rem', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', background: 'rgba(201,168,76,0.15)', color: 'var(--color-sand)', border: '1px solid rgba(201,168,76,0.3)', whiteSpace: 'nowrap' }}>
                        SEASONAL
                      </span>
                    )}
                    {isClosed && reg.closureReason ? (
                      <div style={{ color: 'var(--color-warning)', opacity: 0.85 }}>{reg.closureReason}</div>
                    ) : hasSeasonal && reg.seasonalClosures ? (
                      <div style={{ color: 'var(--color-sand)', opacity: 0.85 }}>{reg.seasonalClosures}</div>
                    ) : reg.notes ? (
                      <div style={{ color: 'var(--color-mist)' }}>{reg.notes}</div>
                    ) : (
                      <span style={{ color: 'rgba(107,143,163,0.4)' }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: '1rem', padding: '0.5rem 0.875rem', fontSize: '0.7rem', color: 'rgba(107,143,163,0.5)', lineHeight: 1.6 }}>
        Sourced from DPIRD Recreational Fishing Guide 2026 and rules.fish.wa.gov.au. Always verify current regulations at{' '}
        <a href="https://fish.wa.gov.au" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(107,143,163,0.7)', textDecoration: 'underline' }}>fish.wa.gov.au</a>{' '}
        before fishing. Rules are subject to change without notice.
      </p>
    </div>
  )
}
