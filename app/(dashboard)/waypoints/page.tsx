'use client'

import { useEffect, useRef, useState } from 'react'
import DashboardNav from '@/components/DashboardNav'
import { parseCoords, formatCoords } from '@/lib/parse-coords'
import type { Waypoint } from '@/lib/claude-api'

// ── Export helpers ────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildGpx(waypoints: Waypoint[]): string {
  const wptElements = waypoints.map(wp => [
    `  <wpt lat="${wp.latitude}" lon="${wp.longitude}">`,
    `    <name>${escapeXml(wp.name)}</name>`,
    wp.notes ? `    <desc>${escapeXml(wp.notes)}</desc>` : `    <desc></desc>`,
    `    <sym>Fishing Hot Spot</sym>`,
    `  </wpt>`,
  ].join('\n')).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="AI Fishfinder"',
    '  xmlns="http://www.topografix.com/GPX/1/1"',
    '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">',
    '  <metadata>',
    '    <name>AI Fishfinder — Custom Waypoints</name>',
    `    <time>${new Date().toISOString()}</time>`,
    '  </metadata>',
    wptElements,
    '</gpx>',
  ].join('\n')
}

function buildNavionicsCSV(waypoints: Waypoint[]): string {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`
  const rows = waypoints.map(wp =>
    [q(wp.name), wp.latitude.toFixed(6), wp.longitude.toFixed(6), q('FISHING_HOTSPOT'), q(wp.notes ?? '')].join(',')
  )
  return ['Name,Latitude,Longitude,Symbol,Comment', ...rows].join('\n')
}

function buildKML(waypoints: Waypoint[]): string {
  const placemarks = waypoints.map(wp => [
    '  <Placemark>',
    `    <name>${escapeXml(wp.name)}</name>`,
    wp.notes ? `    <description>${escapeXml(wp.notes)}</description>` : '',
    '    <Point>',
    `      <coordinates>${wp.longitude},${wp.latitude},0</coordinates>`,
    '    </Point>',
    '  </Placemark>',
  ].filter(Boolean).join('\n')).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    '  <Document>',
    '  <name>AI Fishfinder — Custom Waypoints</name>',
    placemarks,
    '  </Document>',
    '</kml>',
  ].join('\n')
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WaypointsPage() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [coordInput, setCoordInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const coordInputRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().slice(0, 10)
  const filename = `custom-waypoints-${today}`

  useEffect(() => {
    if (!exportOpen) return
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [exportOpen])

  function handleAdd() {
    const trimmed = coordInput.trim()
    if (!trimmed) {
      setError('Please enter a coordinate.')
      return
    }
    const parsed = parseCoords(trimmed)
    if (!parsed) {
      setError('Could not parse those coordinates. Try: 26.355°S 113.639°E or -26.355, 113.639')
      return
    }
    const wpName = nameInput.trim() || `WP ${waypoints.length + 1}`
    setWaypoints(prev => [...prev, {
      name: wpName,
      latitude: parsed.lat,
      longitude: parsed.lng,
      notes: notesInput.trim(),
    }])
    setCoordInput('')
    setNameInput('')
    setNotesInput('')
    setError(null)
    coordInputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') setExportOpen(false)
  }

  function handleRemove(index: number) {
    setWaypoints(prev => prev.filter((_, i) => i !== index))
  }

  const disabled = waypoints.length === 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-deep)' }}>
      <DashboardNav />

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--color-foam)',
            margin: '0 0 0.5rem',
          }}>
            Waypoint Export
          </h1>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
            Enter coordinates manually and export them to your sounder or chartplotter in GPX, CSV, or KML format.
          </p>
        </div>

        {/* Input card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(107,143,163,0.18)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(107,143,163,0.6)' }}>
            Add Waypoint
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {/* Coordinate input */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-mist)', marginBottom: '0.375rem' }}>
                Coordinates <span style={{ color: 'var(--color-seafoam)' }}>*</span>
              </label>
              <input
                ref={coordInputRef}
                type="text"
                value={coordInput}
                onChange={e => { setCoordInput(e.target.value); setError(null) }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 26.355°S 113.639°E  or  -26.355, 113.639"
                style={{
                  width: '100%',
                  background: 'rgba(11,25,41,0.6)',
                  border: `1px solid ${error ? 'var(--color-warning)' : 'rgba(107,143,163,0.25)'}`,
                  borderRadius: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  color: 'var(--color-foam)',
                  fontSize: '0.9375rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 200ms',
                }}
                onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'rgba(61,184,200,0.5)' }}
                onBlur={e => { if (!error) e.currentTarget.style.borderColor = 'rgba(107,143,163,0.25)' }}
              />
              {error && (
                <p style={{ margin: '0.375rem 0 0', fontSize: '0.8125rem', color: 'var(--color-warning)' }}>{error}</p>
              )}
              <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'rgba(107,143,163,0.5)' }}>
                Accepts DMS, DDM, decimal degrees with N/S/E/W, or signed decimals
              </p>
            </div>

            {/* Name input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-mist)', marginBottom: '0.375rem' }}>
                Name <span style={{ color: 'rgba(107,143,163,0.5)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`WP ${waypoints.length + 1}`}
                style={{
                  width: '100%',
                  background: 'rgba(11,25,41,0.6)',
                  border: '1px solid rgba(107,143,163,0.25)',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  color: 'var(--color-foam)',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 200ms',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(61,184,200,0.5)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(107,143,163,0.25)' }}
              />
            </div>

            {/* Notes input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-mist)', marginBottom: '0.375rem' }}>
                Notes <span style={{ color: 'rgba(107,143,163,0.5)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Reef edge, 45m"
                style={{
                  width: '100%',
                  background: 'rgba(11,25,41,0.6)',
                  border: '1px solid rgba(107,143,163,0.25)',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  color: 'var(--color-foam)',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 200ms',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(61,184,200,0.5)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(107,143,163,0.25)' }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="btn-primary"
            style={{ fontSize: '0.9375rem' }}
          >
            + Add Waypoint
          </button>
        </div>

        {/* Waypoint list */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(107,143,163,0.18)',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          overflow: 'hidden',
        }}>
          {/* List header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(107,143,163,0.12)',
          }}>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(107,143,163,0.6)' }}>
              Waypoints
            </p>
            {waypoints.length > 0 && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-seafoam)', fontWeight: 600 }}>
                {waypoints.length} {waypoints.length === 1 ? 'waypoint' : 'waypoints'}
              </span>
            )}
          </div>

          {waypoints.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.375rem', fontSize: '2rem', opacity: 0.3 }}>📍</p>
              <p style={{ margin: 0, color: 'rgba(107,143,163,0.5)', fontSize: '0.9375rem' }}>
                No waypoints added yet. Enter coordinates above to get started.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(107,143,163,0.1)' }}>
                    {['#', 'Name', 'Coordinates', 'Notes', ''].map(h => (
                      <th key={h} style={{
                        padding: '0.625rem 1rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'rgba(107,143,163,0.5)',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {waypoints.map((wp, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: i < waypoints.length - 1 ? '1px solid rgba(107,143,163,0.08)' : 'none' }}
                    >
                      <td style={{ padding: '0.75rem 1rem', color: 'rgba(107,143,163,0.45)', fontSize: '0.8125rem', width: '2.5rem' }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-foam)', fontSize: '0.9375rem', fontWeight: 500 }}>
                        {wp.name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-seafoam)', fontSize: '0.875rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {formatCoords(wp.latitude, wp.longitude)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-mist)', fontSize: '0.875rem' }}>
                        {wp.notes || <span style={{ color: 'rgba(107,143,163,0.35)' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleRemove(i)}
                          aria-label={`Remove ${wp.name}`}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(107,143,163,0.2)',
                            borderRadius: '0.375rem',
                            padding: '0.25rem 0.5rem',
                            color: 'rgba(107,143,163,0.5)',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            transition: 'color 150ms, border-color 150ms',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-warning)'; e.currentTarget.style.borderColor = 'var(--color-warning)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(107,143,163,0.5)'; e.currentTarget.style.borderColor = 'rgba(107,143,163,0.2)' }}
                          onFocus={e => { e.currentTarget.style.color = 'var(--color-warning)'; e.currentTarget.style.borderColor = 'var(--color-warning)' }}
                          onBlur={e => { e.currentTarget.style.color = 'rgba(107,143,163,0.5)'; e.currentTarget.style.borderColor = 'rgba(107,143,163,0.2)' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex' }} onKeyDown={e => { if (e.key === 'Escape') setExportOpen(false) }}>
            {/* Primary GPX button */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => downloadBlob(buildGpx(waypoints), `${filename}.gpx`, 'application/gpx+xml')}
              className="btn-ghost"
              style={{
                fontSize: '0.9375rem',
                borderRadius: '0.375rem 0 0 0.375rem',
                borderRight: 'none',
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              ⬇ Export GPX
            </button>

            {/* Chevron toggle */}
            <button
              type="button"
              disabled={disabled}
              aria-haspopup="true"
              aria-expanded={exportOpen}
              aria-label="More export formats"
              onClick={() => setExportOpen(v => !v)}
              className="btn-ghost"
              style={{
                fontSize: '0.75rem',
                padding: '0 0.5rem',
                borderRadius: '0 0.375rem 0.375rem 0',
                borderLeft: '1px solid rgba(107,143,163,0.25)',
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {exportOpen ? '▲' : '▼'}
            </button>

            {/* Dropdown */}
            {exportOpen && !disabled && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  background: 'rgba(11,25,41,0.97)',
                  border: '1px solid rgba(107,143,163,0.25)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                  minWidth: '180px',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                {[
                  { label: 'Navionics CSV', ext: 'csv', build: () => buildNavionicsCSV(waypoints), mime: 'text/csv' },
                  { label: 'KML (Google Earth)', ext: 'kml', build: () => buildKML(waypoints), mime: 'application/vnd.google-earth.kml+xml' },
                ].map(item => (
                  <button
                    key={item.ext}
                    role="menuitem"
                    type="button"
                    onClick={() => { downloadBlob(item.build(), `${filename}.${item.ext}`, item.mime); setExportOpen(false) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.625rem 1rem',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-foam)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(61,184,200,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    onFocus={e => { e.currentTarget.style.background = 'rgba(61,184,200,0.1)' }}
                    onBlur={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {disabled && (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'rgba(107,143,163,0.45)' }}>
              Add at least one waypoint to export
            </p>
          )}
        </div>

      </main>
    </div>
  )
}
