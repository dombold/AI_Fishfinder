'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import BOAT_RAMPS from '@/lib/data/boat-ramps.json'
import { WA_STATIONS } from '@/lib/marine-api'

// WA bounding box
const WA_BOUNDS = { minLat: -35, maxLat: -13, minLng: 113, maxLng: 129 }
const WA_CENTER: [number, number] = [-25.5, 121.5]

type MapMode = 'map' | 'satellite'

interface Props {
  value: { lat: number; lng: number } | null
  onChange: (coords: { lat: number; lng: number }) => void
  height?: number
}

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

export default function MapPickerInner({ value, onChange, height = 640 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef      = useRef<any>(null)
  const markerRef   = useRef<any>(null)
  const layersRef              = useRef<any[]>([])
  const boatRampLayersRef        = useRef<any[]>([])
  const weatherStationLayersRef  = useRef<any[]>([])
  const myCatchLayersRef         = useRef<any[]>([])
  const newsletterCatchLayersRef = useRef<any[]>([])
  const myCatchDataRef           = useRef<any[] | null>(null)
  const newsletterCatchDataRef   = useRef<any[] | null>(null)
  const [mode, setMode] = useState<MapMode>('satellite')
  const [ready, setReady] = useState(false)
  const [showBoatRamps, setShowBoatRamps]               = useState(false)
  const [showWeatherStations, setShowWeatherStations]   = useState(false)
  const [showMyCatches, setShowMyCatches]               = useState(false)
  const [showNewsletterCatches, setShowNewsletterCatches] = useState(false)

  // ── Initialize map ────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    let map: any = null

    import('leaflet').then((mod) => {
      // Guard: if the effect was cleaned up before the async import resolved
      // (React 18 StrictMode unmounts and remounts), bail out to avoid creating
      // two Leaflet instances on the same DOM node.
      if (!mounted) return

      const L = mod.default

      // Fix default icon URLs
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const el = containerRef.current
      if (!el) return

      // If this container already has a Leaflet map (React 18 StrictMode runs
      // effects twice), skip — the cleanup from the first run will remove it
      // and clear _leaflet_id so the next legitimate mount proceeds cleanly.
      if ((el as any)._leaflet_id) return

      map = L.map(el, {
        center: WA_CENTER,
        zoom: 5,
        maxBounds: [[-38, 108], [-10, 134]] as any,
        maxBoundsViscosity: 0.9,
      })

      mapRef.current = map

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        if (lat < WA_BOUNDS.minLat || lat > WA_BOUNDS.maxLat ||
            lng < WA_BOUNDS.minLng || lng > WA_BOUNDS.maxLng) return
        onChange({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) })
      })

      setReady(true)
    })

    return () => {
      mounted = false
      try { mapRef.current?.remove() } catch {}
      mapRef.current = null
      markerRef.current = null
      layersRef.current = []
      boatRampLayersRef.current = []
      weatherStationLayersRef.current = []
      myCatchLayersRef.current = []
      newsletterCatchLayersRef.current = []
      if (containerRef.current) {
        ;(containerRef.current as any)._leaflet_id = undefined
      }
      setReady(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swap tile layers when mode changes ────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    import('leaflet').then((mod) => {
      const L = mod.default
      const map = mapRef.current
      if (!map) return

      // Remove old layers
      layersRef.current.forEach(l => map.removeLayer(l))
      layersRef.current = []

      // Add new layers
      TILES[mode].forEach(({ url, attribution }) => {
        const layer = L.tileLayer(url, { attribution })
        layer.addTo(map)
        layersRef.current.push(layer)
      })
    })
  }, [mode, ready])

  // ── Boat ramp overlay ─────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    import('leaflet').then((mod) => {
      const L   = mod.default
      const map = mapRef.current
      if (!map) return
      boatRampLayersRef.current.forEach(l => map.removeLayer(l))
      boatRampLayersRef.current = []
      if (!showBoatRamps) return
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:26px;height:26px;border-radius:50%;background:rgba(255,180,0,0.92);border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">⚓</div>`,
        iconSize:   [26, 26],
        iconAnchor: [13, 13],
      })
      ;(BOAT_RAMPS as { name: string; lat: number; lng: number; region: string }[]).forEach((ramp) => {
        const marker = L.marker([ramp.lat, ramp.lng], { icon }).bindPopup(
          `<div style="font-family:sans-serif;min-width:140px;"><strong>${ramp.name}</strong><div style="font-size:0.8em;color:#666;margin-top:3px;">${ramp.region}</div></div>`
        )
        marker.addTo(map)
        boatRampLayersRef.current.push(marker)
      })
    })
  }, [showBoatRamps, ready])

  // ── Weather station overlay ───────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    import('leaflet').then((mod) => {
      const L   = mod.default
      const map = mapRef.current
      if (!map) return
      weatherStationLayersRef.current.forEach(l => map.removeLayer(l))
      weatherStationLayersRef.current = []
      if (!showWeatherStations) return
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:26px;height:26px;border-radius:50%;background:rgba(0,190,220,0.92);border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">📡</div>`,
        iconSize:   [26, 26],
        iconAnchor: [13, 13],
      })
      WA_STATIONS.forEach((station) => {
        const marker = L.marker([station.lat, station.lng], { icon }).bindPopup(
          `<div style="font-family:sans-serif;min-width:140px;"><strong>${station.name}</strong><div style="font-size:0.8em;color:#666;margin-top:3px;">Station ID: ${station.id}</div></div>`
        )
        marker.addTo(map)
        weatherStationLayersRef.current.push(marker)
      })
    })
  }, [showWeatherStations, ready])

  // ── My catch log overlay ──────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    import('leaflet').then(async (mod) => {
      const L   = mod.default
      const map = mapRef.current
      if (!map) return
      myCatchLayersRef.current.forEach(l => map.removeLayer(l))
      myCatchLayersRef.current = []
      if (!showMyCatches) return
      if (!myCatchDataRef.current) {
        const res = await fetch('/api/catch-log')
        const data = await res.json()
        myCatchDataRef.current = data.catches ?? []
      }
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:26px;height:26px;border-radius:50%;background:rgba(34,197,94,0.92);border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">🎣</div>`,
        iconSize:   [26, 26],
        iconAnchor: [13, 13],
      })
      ;(myCatchDataRef.current ?? []).forEach((c: any) => {
        const marker = L.marker([c.latitude, c.longitude], { icon }).bindPopup(
          `<div style="font-family:sans-serif;min-width:140px;"><strong>${c.species}</strong> × ${c.quantity}<div style="font-size:0.8em;color:#666;margin-top:3px;">${c.date}</div></div>`
        )
        marker.addTo(map)
        myCatchLayersRef.current.push(marker)
      })
    })
  }, [showMyCatches, ready])

  // ── RecFishWest newsletter catch overlay ──────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    import('leaflet').then(async (mod) => {
      const L   = mod.default
      const map = mapRef.current
      if (!map) return
      newsletterCatchLayersRef.current.forEach(l => map.removeLayer(l))
      newsletterCatchLayersRef.current = []
      if (!showNewsletterCatches) return
      if (!newsletterCatchDataRef.current) {
        const res = await fetch('/api/catch-log/newsletter')
        const data = await res.json()
        newsletterCatchDataRef.current = data.catches ?? []
      }
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:26px;height:26px;border-radius:50%;background:rgba(147,51,234,0.92);border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">📰</div>`,
        iconSize:   [26, 26],
        iconAnchor: [13, 13],
      })
      ;(newsletterCatchDataRef.current ?? []).forEach((c: any) => {
        const marker = L.marker([c.latitude, c.longitude], { icon }).bindPopup(
          `<div style="font-family:sans-serif;min-width:140px;"><strong>${c.species}</strong> × ${c.quantity}<div style="font-size:0.8em;color:#666;margin-top:3px;">${c.date}</div><em style="font-size:0.8em;color:#888;">RecFishWest</em></div>`
        )
        marker.addTo(map)
        newsletterCatchLayersRef.current.push(marker)
      })
    })
  }, [showNewsletterCatches, ready])

  // ── Sync marker with value prop ───────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return
    import('leaflet').then((mod) => {
      const L = mod.default
      const map = mapRef.current
      if (!map) return

      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
      if (value) {
        markerRef.current = L.marker([value.lat, value.lng]).addTo(map)
      }
    })
  }, [value, ready])

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ height: `${height}px`, width: '100%', borderRadius: '0.75rem' }}
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
        <div style={{ display: 'flex', gap: '4px' }}>
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

      <div style={{ marginTop: '0.625rem', fontSize: '0.8125rem', color: 'var(--color-mist)' }}>
        {value
          ? <span style={{ color: 'var(--color-seafoam)' }}>Selected: {value.lat.toFixed(4)}°S, {value.lng.toFixed(4)}°E</span>
          : 'Click on the map to select a fishing location in Western Australia'}
      </div>
    </div>
  )
}
