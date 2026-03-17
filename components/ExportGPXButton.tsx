'use client'

import { useEffect, useRef, useState } from 'react'
import type { DailyPlan, Waypoint } from '@/lib/claude-api'

interface Props {
  plans: DailyPlan[]
  locationName: string | null
  startDate: string
  endDate: string
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function deduplicateWaypoints(plans: DailyPlan[]): Waypoint[] {
  const seen = new Set<string>()
  const waypoints: Waypoint[] = []
  for (const plan of plans) {
    for (const wp of plan.waypoints ?? []) {
      const key = `${wp.name}|${wp.latitude.toFixed(4)}|${wp.longitude.toFixed(4)}`
      if (!seen.has(key)) {
        seen.add(key)
        waypoints.push(wp)
      }
    }
  }
  return waypoints
}

function buildGpx(plans: DailyPlan[], locationName: string | null): string {
  const waypoints = deduplicateWaypoints(plans)
  const wptElements = waypoints.map(wp => {
    const descParts = [wp.depth ? `Depth: ${wp.depth}` : null, wp.notes].filter(Boolean)
    return [
      `  <wpt lat="${wp.latitude}" lon="${wp.longitude}">`,
      `    <name>${escapeXml(wp.name)}</name>`,
      `    <desc>${escapeXml(descParts.join(' — '))}</desc>`,
      `    <sym>Fishing Hot Spot</sym>`,
      `  </wpt>`,
    ].join('\n')
  }).join('\n')

  const metaName = locationName ? `AI Fishfinder - ${locationName}` : 'AI Fishfinder'
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="AI Fishfinder"',
    '  xmlns="http://www.topografix.com/GPX/1/1"',
    '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">',
    '  <metadata>',
    `    <name>${escapeXml(metaName)}</name>`,
    `    <time>${new Date().toISOString()}</time>`,
    '  </metadata>',
    wptElements,
    '</gpx>',
  ].join('\n')
}

function buildNavionicsCSV(plans: DailyPlan[], locationName: string | null): string {
  const waypoints = deduplicateWaypoints(plans)
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`
  const rows = waypoints.map(wp => {
    const comment = [wp.depth ? `Depth: ${wp.depth}` : null, wp.notes].filter(Boolean).join(' — ')
    return [q(wp.name), wp.latitude.toFixed(6), wp.longitude.toFixed(6), q('FISHING_HOTSPOT'), q(comment)].join(',')
  })
  return ['Name,Latitude,Longitude,Symbol,Comment', ...rows].join('\n')
}

function buildKML(plans: DailyPlan[], locationName: string | null): string {
  const waypoints = deduplicateWaypoints(plans)
  const docName = locationName ? `AI Fishfinder — ${locationName}` : 'AI Fishfinder'
  const placemarks = waypoints.map(wp => {
    const desc = [wp.depth ? `Depth: ${wp.depth}` : null, wp.notes].filter(Boolean).join(' — ')
    // KML coordinates are longitude,latitude,altitude
    return [
      '  <Placemark>',
      `    <name>${escapeXml(wp.name)}</name>`,
      `    <description>${escapeXml(desc)}</description>`,
      '    <Point>',
      `      <coordinates>${wp.longitude},${wp.latitude},0</coordinates>`,
      '    </Point>',
      '  </Placemark>',
    ].join('\n')
  }).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    '  <Document>',
    `  <name>${escapeXml(docName)}</name>`,
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

export default function ExportGPXButton({ plans, locationName, startDate, endDate }: Props) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const slug = (locationName ?? 'waypoints')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const base = `fishing-waypoints-${slug}-${startDate}-${endDate}`

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex' }} onKeyDown={handleKeyDown}>
      {/* Primary GPX button */}
      <button
        type="button"
        onClick={() => downloadBlob(buildGpx(plans, locationName), `${base}.gpx`, 'application/gpx+xml')}
        className="btn-ghost"
        style={{ fontSize: '0.875rem', borderRadius: '0.375rem 0 0 0.375rem', borderRight: 'none' }}
      >
        ⬇ Export GPX
      </button>

      {/* Chevron toggle */}
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="More export formats"
        onClick={() => setOpen(v => !v)}
        className="btn-ghost"
        style={{
          fontSize: '0.75rem',
          padding: '0 0.5rem',
          borderRadius: '0 0.375rem 0.375rem 0',
          borderLeft: '1px solid rgba(107,143,163,0.25)',
        }}
      >
        {open ? '▲' : '▼'}
      </button>

      {/* Dropdown menu */}
      {open && (
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
            { label: 'Navionics CSV', ext: 'csv', build: () => buildNavionicsCSV(plans, locationName), mime: 'text/csv' },
            { label: 'KML (Google Earth)', ext: 'kml', build: () => buildKML(plans, locationName), mime: 'application/vnd.google-earth.kml+xml' },
          ].map(item => (
            <button
              key={item.ext}
              role="menuitem"
              type="button"
              onClick={() => { downloadBlob(item.build(), `${base}.${item.ext}`, item.mime); setOpen(false) }}
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
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(61,184,200,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onFocus={e => (e.currentTarget.style.background = 'rgba(61,184,200,0.1)')}
              onBlur={e => (e.currentTarget.style.background = 'transparent')}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
