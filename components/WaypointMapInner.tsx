'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import BOAT_RAMPS from '@/lib/data/boat-ramps.json'
import { WA_STATIONS } from '@/lib/marine-api'

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
  const [showBoatRamps, setShowBoatRamps]               = useState(false)
  const [showWeatherStations, setShowWeatherStations]   = useState(false)
  const [showMyCatches, setShowMyCatches]               = useState(false)
  const [showNewsletterCatches, setShowNewsletterCatches] = useState(false)
  const [myCatchData, setMyCatchData]                   = useState<any[] | null>(null)
  const [newsletterCatchData, setNewsletterCatchData]   = useState<any[] | null>(null)

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

  // ── Fetch my catches when toggled on ──────────────────────────
  useEffect(() => {
    if (!showMyCatches || myCatchData) return
    fetch('/api/catch-log').then(r => r.json()).then(d => setMyCatchData(d.catches ?? []))
  }, [showMyCatches]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch newsletter catches when toggled on ───────────────────
  useEffect(() => {
    if (!showNewsletterCatches || newsletterCatchData) return
    fetch('/api/catch-log/newsletter').then(r => r.json()).then(d => setNewsletterCatchData(d.catches ?? []))
  }, [showNewsletterCatches]) // eslint-disable-line react-hooks/exhaustive-deps

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

      if (showBoatRamps) {
        const boatIcon = L.divIcon({
          className: '',
          html: `<div style="width:26px;height:26px;border-radius:50%;background:rgba(255,180,0,0.92);border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">⚓</div>`,
          iconSize:   [26, 26],
          iconAnchor: [13, 13],
        })
        ;(BOAT_RAMPS as { name: string; lat: number; lng: number; region: string }[]).forEach((ramp) => {
          L.marker([ramp.lat, ramp.lng], { icon: boatIcon })
            .bindPopup(`<div style="font-family:sans-serif;min-width:140px;"><strong>${ramp.name}</strong><div style="font-size:0.8em;color:#666;margin-top:3px;">${ramp.region}</div></div>`)
            .addTo(map)
        })
      }

      if (showWeatherStations) {
        const stationIcon = L.divIcon({
          className: '',
          html: `<div style="width:26px;height:26px;border-radius:50%;background:rgba(0,190,220,0.92);border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">📡</div>`,
          iconSize:   [26, 26],
          iconAnchor: [13, 13],
        })
        WA_STATIONS.forEach((station) => {
          L.marker([station.lat, station.lng], { icon: stationIcon })
            .bindPopup(`<div style="font-family:sans-serif;min-width:140px;"><strong>${station.name}</strong><div style="font-size:0.8em;color:#666;margin-top:3px;">Station ID: ${station.id}</div></div>`)
            .addTo(map)
        })
      }

      if (showMyCatches && myCatchData) {
        const catchIcon = L.divIcon({
          className: '',
          html: `<div style="width:26px;height:26px;border-radius:50%;background:rgba(34,197,94,0.92);border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">🎣</div>`,
          iconSize:   [26, 26],
          iconAnchor: [13, 13],
        })
        myCatchData.forEach((c: any) => {
          L.marker([c.latitude, c.longitude], { icon: catchIcon })
            .bindPopup(`<div style="font-family:sans-serif;min-width:140px;"><strong>${c.species}</strong> × ${c.quantity}<div style="font-size:0.8em;color:#666;margin-top:3px;">${c.date}</div></div>`)
            .addTo(map)
        })
      }

      if (showNewsletterCatches && newsletterCatchData) {
        const newsletterIcon = L.divIcon({
          className: '',
          html: `<div style="width:26px;height:26px;border-radius:50%;background:rgba(147,51,234,0.92);border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">📰</div>`,
          iconSize:   [26, 26],
          iconAnchor: [13, 13],
        })
        newsletterCatchData.forEach((c: any) => {
          L.marker([c.latitude, c.longitude], { icon: newsletterIcon })
            .bindPopup(`<div style="font-family:sans-serif;min-width:140px;"><strong>${c.species}</strong> × ${c.quantity}<div style="font-size:0.8em;color:#666;margin-top:3px;">${c.date}</div><em style="font-size:0.8em;color:#888;">RecFishWest</em></div>`)
            .addTo(map)
        })
      }
    })
  }, [ready, mode, showBoatRamps, showWeatherStations, showMyCatches, showNewsletterCatches, myCatchData, newsletterCatchData]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ height: '320px', width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}
      />

      {/* Top-right controls */}
      <div style={{
        position: 'absolute', top: '10px', right: '10px', zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end',
      }}>
        {/* Map / Satellite toggle */}
        <div style={{
          display: 'flex', borderRadius: '0.375rem', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
        }}>
          {(['map', 'satellite'] as MapMode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', border: 'none',
                background: mode === m ? 'var(--color-current)' : 'rgba(11,25,41,0.85)',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.7)',
                textTransform: 'capitalize', letterSpacing: '0.03em',
                transition: 'background 150ms',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Overlay toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setShowBoatRamps(v => !v)}
            title="Toggle boat ramps"
            style={{
              width: '30px', height: '30px', borderRadius: '0.375rem',
              border: '1px solid rgba(255,255,255,0.25)',
              background: showBoatRamps ? 'rgba(255,180,0,0.85)' : 'rgba(11,25,41,0.85)',
              color: '#fff', fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 150ms',
            }}
          >⚓</button>
          <button
            type="button"
            onClick={() => setShowWeatherStations(v => !v)}
            title="Toggle weather stations"
            style={{
              width: '30px', height: '30px', borderRadius: '0.375rem',
              border: '1px solid rgba(255,255,255,0.25)',
              background: showWeatherStations ? 'rgba(0,190,220,0.85)' : 'rgba(11,25,41,0.85)',
              color: '#fff', fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 150ms',
            }}
          >📡</button>
          <button
            type="button"
            onClick={() => setShowMyCatches(v => !v)}
            title="Toggle my catch logs"
            style={{
              width: '30px', height: '30px', borderRadius: '0.375rem',
              border: '1px solid rgba(255,255,255,0.25)',
              background: showMyCatches ? 'rgba(34,197,94,0.85)' : 'rgba(11,25,41,0.85)',
              color: '#fff', fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 150ms',
            }}
          >🎣</button>
          <button
            type="button"
            onClick={() => setShowNewsletterCatches(v => !v)}
            title="Toggle RecFishWest catches"
            style={{
              width: '30px', height: '30px', borderRadius: '0.375rem',
              border: '1px solid rgba(255,255,255,0.25)',
              background: showNewsletterCatches ? 'rgba(147,51,234,0.85)' : 'rgba(11,25,41,0.85)',
              color: '#fff', fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 150ms',
            }}
          >📰</button>
        </div>
      </div>
    </div>
  )
}
