/**
 * Crowd-source aggregation: combines community catch log entries and newsletter reports
 * per bioregion into a CrowdSummary object, then persists it to CrowdSourceSummary.
 *
 * Called by the weekly cron job. Results are read at plan-generation time.
 */

import { prisma } from '@/lib/prisma'
import { getBioregion } from '@/lib/regulations'
import type { Bioregion } from '@/lib/regulations'

export interface SpeciesActivity {
  species: string
  totalSightings: number
  last30Days: number
  last90Days: number
  trend: 'increasing' | 'stable' | 'decreasing'
  avgLat: number
  avgLng: number
}

export interface HotspotCluster {
  centerLat: number
  centerLng: number
  count: number
  userCount?: number   // observations from user GPS logs (undefined = legacy, treat as all-user)
  species: string[]    // top species at this location
  lastSeen: string     // YYYY-MM-DD
}

export interface CrowdSummary {
  bioregion: string
  generatedAt: string  // ISO timestamp
  catchLogCount: number
  topSpecies: SpeciesActivity[]  // top 8 by total sightings
  hotspots: HotspotCluster[]     // top 10 clusters
}

// Unified observation point used internally for aggregation
interface ObsPoint {
  species: string | null
  latitude: number
  longitude: number
  date: string  // YYYY-MM-DD
  isNewsletter: boolean
}

function toDateStr(d: Date | string): string {
  return typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10)
}

function daysBetween(dateStr: string, now: Date): number {
  const then = new Date(dateStr)
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
}

function computeTrend(last30: number, last90: number): SpeciesActivity['trend'] {
  if (last90 === 0) return last30 > 0 ? 'increasing' : 'stable'
  const rate30 = last30 / 30
  const rate90 = last90 / 90
  if (rate30 > rate90 * 1.2) return 'increasing'
  if (rate30 < rate90 * 0.8) return 'decreasing'
  return 'stable'
}

// Round to 2 decimal places (~1.1km grid)
function gridKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`
}

function buildHotspots(points: ObsPoint[]): HotspotCluster[] {
  // Step 1: group by grid cell
  const cells = new Map<string, { lats: number[]; lngs: number[]; userLats: number[]; userLngs: number[]; species: string[]; dates: string[] }>()
  for (const p of points) {
    const key = gridKey(p.latitude, p.longitude)
    let cell = cells.get(key)
    if (!cell) {
      cell = { lats: [], lngs: [], userLats: [], userLngs: [], species: [], dates: [] }
      cells.set(key, cell)
    }
    cell.lats.push(p.latitude)
    cell.lngs.push(p.longitude)
    if (!p.isNewsletter) {
      cell.userLats.push(p.latitude)
      cell.userLngs.push(p.longitude)
    }
    if (p.species) cell.species.push(p.species)
    cell.dates.push(p.date)
  }

  // Step 2: build preliminary clusters from cells
  type RawCluster = { centerLat: number; centerLng: number; count: number; userCount: number; species: string[]; lastSeen: string }
  const raw: RawCluster[] = Array.from(cells.entries()).map(([, cell]) => {
    // Centroid from user GPS points only; fall back to all points if no user data
    const centroidLats = cell.userLats.length > 0 ? cell.userLats : cell.lats
    const centroidLngs = cell.userLngs.length > 0 ? cell.userLngs : cell.lngs
    const avgLat = centroidLats.reduce((a, b) => a + b, 0) / centroidLats.length
    const avgLng = centroidLngs.reduce((a, b) => a + b, 0) / centroidLngs.length
    const sortedDates = [...cell.dates].sort().reverse()
    return {
      centerLat: avgLat,
      centerLng: avgLng,
      count: cell.lats.length,
      userCount: cell.userLats.length,
      species: cell.species,
      lastSeen: sortedDates[0] ?? '',
    }
  })

  // Step 3: merge adjacent cells within 0.05° (~5km)
  const merged: RawCluster[] = []
  const used = new Set<number>()
  const sorted = raw.sort((a, b) => b.count - a.count)

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(i)) continue
    const cluster = { ...sorted[i], species: [...sorted[i].species] }
    for (let j = i + 1; j < sorted.length; j++) {
      if (used.has(j)) continue
      const dlat = Math.abs(sorted[j].centerLat - cluster.centerLat)
      const dlng = Math.abs(sorted[j].centerLng - cluster.centerLng)
      if (dlat <= 0.05 && dlng <= 0.05) {
        cluster.count += sorted[j].count
        cluster.userCount += sorted[j].userCount
        cluster.species.push(...sorted[j].species)
        if (sorted[j].lastSeen > cluster.lastSeen) cluster.lastSeen = sorted[j].lastSeen
        used.add(j)
      }
    }
    merged.push(cluster)
    used.add(i)
  }

  // Step 4: compute top species per cluster, sort by count, return top 10
  return merged
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(c => {
      const speciesCount = new Map<string, number>()
      for (const s of c.species) speciesCount.set(s, (speciesCount.get(s) ?? 0) + 1)
      const topSpecies = [...speciesCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([s]) => s)
      return {
        centerLat: parseFloat(c.centerLat.toFixed(3)),
        centerLng: parseFloat(c.centerLng.toFixed(3)),
        count: c.count,
        userCount: c.userCount,
        species: topSpecies,
        lastSeen: c.lastSeen,
      }
    })
}

export async function aggregateCrowdData(bioregion: Bioregion): Promise<CrowdSummary> {
  const now = new Date()
  const cutoff180 = new Date(now)
  cutoff180.setDate(cutoff180.getDate() - 180)
  const cutoffStr = cutoff180.toISOString().slice(0, 10)

  // Fetch user catch logs (last 180 days)
  // CatchLogs use date field (YYYY-MM-DD string). Filter by bioregion if set, else by lat/lng fallback.
  const catchLogs = await prisma.catchLog.findMany({
    where: {
      bioregion,
      date: { gte: cutoffStr },
    },
    select: { species: true, latitude: true, longitude: true, date: true, source: true },
  })

  const catchLogCount = catchLogs.length

  // Merge into unified observation points
  const allPoints: ObsPoint[] = catchLogs.map(c => ({
    species: c.species,
    latitude: c.latitude,
    longitude: c.longitude,
    date: c.date,
    isNewsletter: c.source === 'recfishwest-newsletter',
  }))

  // Species activity (only points with a known app species)
  const matchedPoints = allPoints.filter(p => p.species)
  const speciesMap = new Map<string, ObsPoint[]>()
  for (const p of matchedPoints) {
    const key = p.species!
    if (!speciesMap.has(key)) speciesMap.set(key, [])
    speciesMap.get(key)!.push(p)
  }

  const topSpecies: SpeciesActivity[] = []
  for (const [species, pts] of speciesMap.entries()) {
    const last30 = pts.filter(p => daysBetween(p.date, now) <= 30).length
    const last90 = pts.filter(p => daysBetween(p.date, now) <= 90).length
    // Centroid from user GPS only; fall back to all points if no user data for this species
    const userPts = pts.filter(p => !p.isNewsletter)
    const centroidPts = userPts.length > 0 ? userPts : pts
    const avgLat = centroidPts.reduce((a, b) => a + b.latitude, 0) / centroidPts.length
    const avgLng = centroidPts.reduce((a, b) => a + b.longitude, 0) / centroidPts.length
    topSpecies.push({
      species,
      totalSightings: pts.length,
      last30Days: last30,
      last90Days: last90,
      trend: computeTrend(last30, last90),
      avgLat: parseFloat(avgLat.toFixed(2)),
      avgLng: parseFloat(avgLng.toFixed(2)),
    })
  }

  topSpecies.sort((a, b) => b.totalSightings - a.totalSightings)

  const hotspots = buildHotspots(allPoints)

  return {
    bioregion,
    generatedAt: now.toISOString(),
    catchLogCount,
    topSpecies: topSpecies.slice(0, 8),
    hotspots,
  }
}

export async function writeCrowdSummary(summary: CrowdSummary): Promise<void> {
  await prisma.crowdSourceSummary.upsert({
    where: { bioregion: summary.bioregion },
    create: {
      bioregion: summary.bioregion,
      summaryJson: JSON.stringify(summary),
    },
    update: {
      summaryJson: JSON.stringify(summary),
    },
  })
}

export async function getCrowdSummaryForBioregion(lat: number, lng: number): Promise<CrowdSummary | null> {
  const bioregion = getBioregion(lat, lng)
  const row = await prisma.crowdSourceSummary.findUnique({ where: { bioregion } })
  if (!row) return null
  try {
    return JSON.parse(row.summaryJson) as CrowdSummary
  } catch {
    return null
  }
}
