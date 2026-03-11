'use client'

import { useState } from 'react'

interface BoatRamp {
  name: string
  distanceKm: number
}

interface Reef {
  name: string
  type?: string
  distanceKm: number
}

interface ContextData {
  locationDepthM: number | null
  chlorophyllMgM3: number | null
  salinityPSU: number | null
  nearbyBoatRamps: BoatRamp[]
  nearbyReefs: Reef[]
  fetchedAt?: string
}

interface Props {
  contextData: string | null
  latitude: number
  longitude: number
}

function chlorophyllLabel(val: number): string {
  if (val < 0.1) return 'oligotrophic (low productivity)'
  if (val < 1.0) return 'moderate productivity'
  if (val < 3.0) return 'high productivity'
  return 'very high / bloom conditions'
}

export default function DataSourcesModal({ contextData, latitude, longitude }: Props) {
  const [open, setOpen] = useState(false)

  let ctx: ContextData | null = null
  if (contextData) {
    try { ctx = JSON.parse(contextData) } catch { /* ignore */ }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(6,16,24,0.82)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  }

  const panelStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #0E2235 0%, #0B1929 100%)',
    border: '1px solid rgba(107,143,163,0.25)',
    borderRadius: '1rem',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: '1.75rem',
    position: 'relative',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
  }

  const sectionHeadStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--color-seafoam)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.5rem',
    marginTop: '1.25rem',
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    color: 'var(--color-mist)',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '0.375rem 0.625rem',
    borderBottom: '1px solid rgba(107,143,163,0.2)',
  }

  const tdStyle: React.CSSProperties = {
    padding: '0.375rem 0.625rem',
    color: 'var(--color-foam)',
    borderBottom: '1px solid rgba(107,143,163,0.1)',
    verticalAlign: 'top',
  }

  const tdMutedStyle: React.CSSProperties = {
    ...tdStyle,
    color: 'var(--color-mist)',
    fontSize: '0.8125rem',
  }

  const footnoteStyle: React.CSSProperties = {
    marginTop: '1.25rem',
    padding: '0.75rem 1rem',
    background: 'rgba(107,143,163,0.07)',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    color: 'var(--color-mist)',
    lineHeight: 1.6,
  }

  return (
    <>
      <button
        className="btn-ghost"
        onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>⊕</span> Data Sources
      </button>

      {open && (
        <div style={overlayStyle} onClick={() => setOpen(false)}>
          <div style={panelStyle} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--color-foam)', margin: 0 }}>
                  AI Data Sources
                </h2>
                <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Data used to select fishing spots for{' '}
                  {Math.abs(latitude).toFixed(4)}°{latitude < 0 ? 'S' : 'N'},{' '}
                  {Math.abs(longitude).toFixed(4)}°{longitude >= 0 ? 'E' : 'W'}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-mist)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem', lineHeight: 1, flexShrink: 0 }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {!ctx ? (
              <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(107,143,163,0.08)', borderRadius: '0.625rem', color: 'var(--color-mist)', fontSize: '0.875rem', textAlign: 'center' }}>
                Data not available for this plan — regenerate to capture context.
              </div>
            ) : (
              <>
                {/* Location & Conditions */}
                <p style={sectionHeadStyle}>Location &amp; Conditions</p>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Parameter</th>
                      <th style={thStyle}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={tdMutedStyle}>Depth at pin</td>
                      <td style={tdStyle}>
                        {ctx.locationDepthM != null
                          ? `${Math.abs(ctx.locationDepthM).toFixed(0)}m (GEBCO 2020)`
                          : 'Unavailable'}
                      </td>
                    </tr>
                    <tr>
                      <td style={tdMutedStyle}>Chlorophyll-a</td>
                      <td style={tdStyle}>
                        {ctx.chlorophyllMgM3 != null
                          ? `${ctx.chlorophyllMgM3.toFixed(2)} mg/m³ — ${chlorophyllLabel(ctx.chlorophyllMgM3)}`
                          : 'Unavailable'}
                      </td>
                    </tr>
                    <tr>
                      <td style={tdMutedStyle}>Surface Salinity</td>
                      <td style={tdStyle}>
                        {ctx.salinityPSU != null
                          ? `${ctx.salinityPSU.toFixed(1)} PSU`
                          : 'Unavailable (nearshore or no data)'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Boat Ramps */}
                <p style={sectionHeadStyle}>Nearest Boat Ramps</p>
                {ctx.nearbyBoatRamps && ctx.nearbyBoatRamps.length > 0 ? (
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Name</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ctx.nearbyBoatRamps.map((r, i) => (
                        <tr key={i}>
                          <td style={tdStyle}>{r.name}</td>
                          <td style={{ ...tdMutedStyle, textAlign: 'right' }}>{r.distanceKm.toFixed(1)} km</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>No public ramps within 20 km — beach launch only.</p>
                )}

                {/* Nearby Reefs */}
                <p style={sectionHeadStyle}>Nearby Reefs &amp; Structures</p>
                {ctx.nearbyReefs && ctx.nearbyReefs.length > 0 ? (
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Type</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ctx.nearbyReefs.map((r, i) => (
                        <tr key={i}>
                          <td style={tdStyle}>{r.name}</td>
                          <td style={tdMutedStyle}>{r.type ?? '—'}</td>
                          <td style={{ ...tdMutedStyle, textAlign: 'right' }}>{r.distanceKm.toFixed(1)} km</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>No named features within 20 km.</p>
                )}

                {/* Footnote */}
                <div style={footnoteStyle}>
                  <strong style={{ color: 'var(--color-foam)', display: 'block', marginBottom: '0.375rem' }}>Data Sources</strong>
                  <ul style={{ margin: 0, paddingLeft: '1.125rem', lineHeight: 1.7 }}>
                    <li>Depth: GEBCO 2020 via OpenTopoData</li>
                    <li>Chlorophyll-a: VIIRS DINEOF gap-filled (NOAA CoastWatch)</li>
                    <li>Salinity: SMAP L3 daily (NOAA CoastWatch)</li>
                    <li>Boat ramps: WA Transport static dataset</li>
                    <li>Reefs &amp; structures: WA reef features dataset</li>
                  </ul>
                  {ctx.fetchedAt && (
                    <p style={{ margin: '0.5rem 0 0', color: 'rgba(107,143,163,0.6)', fontSize: '0.7rem' }}>
                      Fetched: {new Date(ctx.fetchedAt).toLocaleString('en-AU')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
