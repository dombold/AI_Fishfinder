'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'

// WA bounding box
const WA_BOUNDS = { minLat: -35, maxLat: -13, minLng: 113, maxLng: 129 }
const WA_CENTER: [number, number] = [-25.5, 121.5]

type MapMode = 'map' | 'satellite'

interface Props {
  value: { lat: number; lng: number } | null
  onChange: (coords: { lat: number; lng: number }) => void
}

function ClickHandler({ onChange }: { onChange: Props['onChange'] }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      if (lat < WA_BOUNDS.minLat || lat > WA_BOUNDS.maxLat || lng < WA_BOUNDS.minLng || lng > WA_BOUNDS.maxLng) {
        return // outside WA
      }
      onChange({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) })
    },
  })
  return null
}

export default function MapPickerInner({ value, onChange }: Props) {
  const [L, setL] = useState<any>(null)
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
      setL(L)
    })
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={WA_CENTER}
        zoom={5}
        style={{ height: '320px', width: '100%', borderRadius: '0.75rem' }}
        maxBounds={[[-38, 108], [-10, 134]]}
        maxBoundsViscosity={0.9}
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
        <ClickHandler onChange={onChange} />
        {value && L && (
          <Marker position={[value.lat, value.lng]} />
        )}
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

      <div style={{ marginTop: '0.625rem', fontSize: '0.8125rem', color: 'var(--color-mist)' }}>
        {value
          ? <span style={{ color: 'var(--color-seafoam)' }}>Selected: {value.lat.toFixed(4)}°S, {value.lng.toFixed(4)}°E</span>
          : 'Click on the map to select a fishing location in Western Australia'}
      </div>
    </div>
  )
}
