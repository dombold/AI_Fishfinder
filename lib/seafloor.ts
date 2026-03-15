import reefsData from '@/lib/data/wa-reefs.json'
import type { Waypoint } from '@/lib/claude-api'

interface ReefFeature {
  name: string
  type: string
  lat: number
  lng: number
  depth_min?: number
  depth_max?: number
  substrate?: string
  features?: string[]
  species?: string[]
  notes?: string
}

const GEBCO_API = 'https://api.opentopodata.org/v1/gebco2020'

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Get ocean depth (metres, negative) or land elevation (positive) at a coordinate */
export async function getDepthAt(lat: number, lng: number): Promise<number | null> {
  try {
    const res = await fetch(`${GEBCO_API}?locations=${lat},${lng}`)
    const data = await res.json()
    return data.results?.[0]?.elevation ?? null
  } catch {
    return null
  }
}

/** Batch depth query for multiple coordinates */
export async function batchDepths(coords: { lat: number; lng: number }[]): Promise<(number | null)[]> {
  if (!coords.length) return []
  try {
    const locs = coords.map(c => `${c.lat},${c.lng}`).join('|')
    const res = await fetch(`${GEBCO_API}?locations=${locs}`)
    const data = await res.json()
    return data.results?.map((r: any) => r.elevation ?? null) ?? coords.map(() => null)
  } catch {
    return coords.map(() => null)
  }
}

/**
 * Validate waypoints against real bathymetry:
 * - Removes waypoints on land (elevation >= 0)
 * - Annotates each valid waypoint with real depth
 */
export async function validateWaypoints(waypoints: Waypoint[]): Promise<Waypoint[]> {
  if (!waypoints.length) return []
  const depths = await batchDepths(waypoints.map(w => ({ lat: w.latitude, lng: w.longitude })))
  return waypoints
    .map((wp, i) => ({
      ...wp,
      depth: depths[i] !== null && depths[i]! < 0
        ? `${Math.abs(depths[i]!)}m`
        : wp.depth,
    }))
    .filter((_, i) => depths[i] === null || depths[i]! < 0) // null = API error, keep; >= 0 = land, discard
}

/** Get named reef/structure features within maxKm of a coordinate */
export function getNearbyReefs(lat: number, lng: number, maxKm = 20) {
  const reefs = reefsData as ReefFeature[]
  return reefs
    .map(r => ({ ...r, distanceKm: haversineKm(lat, lng, r.lat, r.lng) }))
    .filter(r => r.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 8)
}
