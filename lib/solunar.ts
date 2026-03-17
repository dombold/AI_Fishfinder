// Solunar theory — calculates major (2h) and minor (1h) feeding windows from moon data.
// All inputs are ISO datetime strings; outputs use HH:MM format.

export interface SolunarWindow {
  type: 'MAJOR' | 'MINOR'
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  centerTime: string  // HH:MM
  quality: 'PEAK' | 'STRONG' | 'MODERATE'
}

function toHHMM(ms: number): string {
  // Normalise to a single day's milliseconds (0–86400000)
  const dayMs = ((ms % 86400000) + 86400000) % 86400000
  const totalMins = Math.round(dayMs / 60000)
  const h = Math.floor(totalMins / 60) % 24
  const m = totalMins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function qualityFromIllumination(illumination: number): 'PEAK' | 'STRONG' | 'MODERATE' {
  if (illumination >= 90 || illumination <= 10) return 'PEAK'
  if (illumination >= 70 || illumination <= 30) return 'STRONG'
  return 'MODERATE'
}

/**
 * Calculate solunar feeding windows for a single day.
 *
 * @param moonrise  ISO string for moonrise (e.g. "2026-03-17T20:15:00")
 * @param moonset   ISO string for moonset  (e.g. "2026-03-17T07:30:00")
 * @param illumination Moon illumination percentage (0–100)
 * @returns Up to 4 windows sorted by centerTime, filtered to 04:00–22:00
 */
export function calculateSolunarWindows(
  moonrise: string,
  moonset: string,
  illumination: number
): SolunarWindow[] {
  if (!moonrise || !moonset) return []

  const riseMs = new Date(moonrise).getTime()
  const setMs  = new Date(moonset).getTime()

  if (isNaN(riseMs) || isNaN(setMs)) return []

  // Moon transit = midpoint between rise and set within the same ~24h arc.
  // If set appears before rise on the clock (crosses midnight), add 24h to set.
  const adjustedSetMs = setMs < riseMs ? setMs + 86400000 : setMs
  const transitMs    = (riseMs + adjustedSetMs) / 2
  const antiTransMs  = transitMs + 43200000   // +12h

  const quality = qualityFromIllumination(illumination)
  const HOUR_MS = 3600000

  const candidates: SolunarWindow[] = [
    // MAJOR: ±1h around transit
    { type: 'MAJOR', centerTime: toHHMM(transitMs),   startTime: toHHMM(transitMs - HOUR_MS),   endTime: toHHMM(transitMs + HOUR_MS),   quality },
    // MAJOR: ±1h around anti-transit
    { type: 'MAJOR', centerTime: toHHMM(antiTransMs), startTime: toHHMM(antiTransMs - HOUR_MS), endTime: toHHMM(antiTransMs + HOUR_MS), quality },
    // MINOR: ±30min around moonrise
    { type: 'MINOR', centerTime: toHHMM(riseMs),      startTime: toHHMM(riseMs - 1800000),      endTime: toHHMM(riseMs + 1800000),      quality },
    // MINOR: ±30min around moonset
    { type: 'MINOR', centerTime: toHHMM(setMs),       startTime: toHHMM(setMs - 1800000),       endTime: toHHMM(setMs + 1800000),       quality },
  ]

  // Filter to windows whose centre falls between 04:00 and 22:00 (skip overnight)
  const filtered = candidates.filter(w => {
    const [h] = w.centerTime.split(':').map(Number)
    return h >= 4 && h < 22
  })

  // Sort by centerTime string (HH:MM sorts lexicographically correctly)
  return filtered.sort((a, b) => a.centerTime.localeCompare(b.centerTime))
}
