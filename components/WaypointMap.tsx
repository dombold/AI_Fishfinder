'use client'

import dynamic from 'next/dynamic'
import type { SSTGridPoint } from '@/lib/marine-api'

const WaypointMapInner = dynamic(() => import('./WaypointMapInner'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '240px', background: 'rgba(14,42,69,0.4)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-mist)', fontSize: '0.875rem' }}>
      Loading map…
    </div>
  ),
})

interface Waypoint {
  name: string
  latitude: number
  longitude: number
  depth?: string
  notes: string
}

export default function WaypointMap({ waypoints, sstGrid }: { waypoints: Waypoint[]; sstGrid?: SSTGridPoint[] }) {
  if (!waypoints?.length) return null
  return <WaypointMapInner waypoints={waypoints} sstGrid={sstGrid} />
}
