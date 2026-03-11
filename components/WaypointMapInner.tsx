'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

interface Waypoint {
  name: string
  latitude: number
  longitude: number
  depth?: string
  notes: string
}

type MapMode = 'map' | 'satellite'

export default function WaypointMapInner({ waypoints }: { waypoints: Waypoint[] }) {
  const [, setReady] = useState(false)
  const [mode, setMode] = useState<MapMode>('satellite')

  useEffect(() => {
    import('leaflet').then(leaflet => {
      const L = leaflet.default
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
      setReady(true)
    })
  }, [])

  const center: [number, number] = [
    waypoints.reduce((s, w) => s + w.latitude, 0) / waypoints.length,
    waypoints.reduce((s, w) => s + w.longitude, 0) / waypoints.length,
  ]

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '320px', width: '100%', borderRadius: '0.75rem' }}
        scrollWheelZoom={false}
      >
        {mode === 'map' ? (
          <TileLayer
            key="voyager"
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
        ) : (
          <>
            <TileLayer
              key="esri-sat"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA'
            />
            <TileLayer
              key="esri-labels"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution=""
            />
          </>
        )}
        {waypoints.map((wp, i) => (
          <Marker key={i} position={[wp.latitude, wp.longitude]}>
            <Popup>
              <div style={{ fontFamily: 'var(--font-body)', minWidth: '160px' }}>
                <strong>{i + 1}. {wp.name}</strong>
                {wp.depth && <div>Depth: {wp.depth}</div>}
                <div style={{ fontSize: '0.8em', marginTop: '4px' }}>{wp.notes}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

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
