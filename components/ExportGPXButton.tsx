'use client'

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

function buildGpx(plans: DailyPlan[], locationName: string | null): string {
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

  const wptElements = waypoints.map(wp => {
    const descParts = [wp.depth ? `Depth: ${wp.depth}` : null, wp.notes].filter(Boolean)
    const desc = descParts.join(' — ')
    return [
      `  <wpt lat="${wp.latitude}" lon="${wp.longitude}">`,
      `    <name>${escapeXml(wp.name)}</name>`,
      `    <desc>${escapeXml(desc)}</desc>`,
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

export default function ExportGPXButton({ plans, locationName, startDate, endDate }: Props) {
  function handleExport() {
    const gpx = buildGpx(plans, locationName)
    const blob = new Blob([gpx], { type: 'application/gpx+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const slug = (locationName ?? 'waypoints')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    a.href = url
    a.download = `fishing-waypoints-${slug}-${startDate}-${endDate}.gpx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="btn-ghost"
      style={{ fontSize: '0.875rem' }}
    >
      ⬇ Export GPX
    </button>
  )
}
