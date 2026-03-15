'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'

interface Waypoint {
  name: string
  latitude: number
  longitude: number
  depth?: string
  notes: string
}

type MapMode = 'map' | 'satellite'

const TILES: Record<MapMode, { url: string; attribution: string }[]> = {
  map: [
    {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    },
  ],
  satellite: [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
    },
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      attribution: '',
    },
  ],
}

export default function WaypointMapInner({ waypoints }: { waypoints: Waypoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [mode, setMode]   = useState<MapMode>('satellite')

  const center: [number, number] = [
    waypoints.reduce((s, w) => s + w.latitude, 0) / waypoints.length,
    waypoints.reduce((s, w) => s + w.longitude, 0) / waypoints.length,
  ]

  // ── Initialize Leaflet map ─────────────────────────────────────
  useEffect(() => {
    let mounted = true

    import('leaflet').then((mod) => {
      if (!mounted) return

      const L = mod.default

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const el = containerRef.current
      if (!el) return

      // Guard: React 18 StrictMode runs effects twice — if this container
      // already has a Leaflet map, bail out. The cleanup will remove it and
      // clear _leaflet_id so the next legitimate mount proceeds cleanly.
      if ((el as any)._leaflet_id) return

      const map = L.map(el, {
        center,
        zoom: 10,
        scrollWheelZoom: false,
        zoomControl: true,
      })

      mapRef.current = map
      setReady(true)
    })

    return () => {
      mounted = false
      try { mapRef.current?.remove() } catch {}
      mapRef.current = null
      if (containerRef.current) {
        ;(containerRef.current as any)._leaflet_id = undefined
      }
      setReady(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swap tile layers and re-add markers when mode changes ──────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    import('leaflet').then((mod) => {
      const L = mod.default
      const map = mapRef.current
      if (!map) return

      map.eachLayer((layer: any) => { try { map.removeLayer(layer) } catch {} })

      TILES[mode].forEach(({ url, attribution }) => {
        L.tileLayer(url, { attribution }).addTo(map)
      })

      waypoints.forEach((wp, i) => {
        const marker = L.marker([wp.latitude, wp.longitude])
        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 160px;">
            <strong>${i + 1}. ${wp.name}</strong>
            ${wp.depth ? `<div>Depth: ${wp.depth}</div>` : ''}
            <div style="font-size: 0.8em; margin-top: 4px;">${wp.notes}</div>
          </div>
        `)
        marker.addTo(map)
      })
    })
  }, [ready, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ height: '320px', width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}
      />

      {/* Map / Satellite toggle */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        display: 'flex',
        borderRadius: '0.375rem',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.25)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
      }}>
        {(['map', 'satellite'] as MapMode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: mode === m ? 'var(--color-current)' : 'rgba(11,25,41,0.85)',
              color: mode === m ? '#fff' : 'rgba(255,255,255,0.7)',
              textTransform: 'capitalize',
              letterSpacing: '0.03em',
              transition: 'background 150ms',
            }}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
