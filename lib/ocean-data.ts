const ERDDAP    = 'https://coastwatch.noaa.gov/erddap/griddap'
const ERDDAP_PF = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap'

/**
 * Chlorophyll-a (mg/m³) via VIIRS DINEOF gap-filled satellite composite.
 * Dataset: noaacwNPPN20S3ASCIDINEOF2kmDaily (2km, daily, gap-filled so no cloud nulls)
 * Returns null only on network/server error.
 */
export async function getChlorophyll(lat: number, lng: number): Promise<number | null> {
  try {
    const url = `${ERDDAP}/noaacwNPPN20S3ASCIDINEOF2kmDaily.json?chlor_a%5B(last)%5D%5B(0.0)%5D%5B(${lat})%5D%5B(${lng})%5D`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const data = await res.json()
    const colIdx = data.table?.columnNames?.indexOf('chlor_a') ?? -1
    const val = data.table?.rows?.[0]?.[colIdx]
    if (val === null || val === undefined || isNaN(val)) return null
    return parseFloat((val as number).toFixed(2))
  } catch {
    return null
  }
}

/**
 * Sea Level Anomaly (metres) via NOAA altimetry.
 * Dataset: nesdisSSH1day (0.25°, daily, multi-satellite merged)
 * Positive SLA = raised sea level = anticyclonic warm-core eddy = pelagic aggregation
 * Negative SLA = depressed sea level = cyclonic eddy / upwelling = cold nutrient-rich water
 */
export async function getSshAnomaly(lat: number, lng: number): Promise<number | null> {
  try {
    const url = `${ERDDAP_PF}/nesdisSSH1day.json?sla%5B(last)%5D%5B(${lat})%5D%5B(${lng})%5D`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const data = await res.json()
    const colIdx = data.table?.columnNames?.indexOf('sla') ?? -1
    const val = data.table?.rows?.[0]?.[colIdx]
    if (val === null || val === undefined || isNaN(val)) return null
    return parseFloat((val as number).toFixed(3))
  } catch {
    return null
  }
}

/**
 * Sea Surface Salinity (PSU) via SMAP satellite.
 * Dataset: noaacwSMAPsssDaily (0.25°, daily)
 * Note: SMAP has land-contamination within ~40km of coast — returns null for nearshore coords.
 */
export async function getSalinity(lat: number, lng: number): Promise<number | null> {
  try {
    const url = `${ERDDAP}/noaacwSMAPsssDaily.json?sss%5B(last)%5D%5B(0.0)%5D%5B(${lat})%5D%5B(${lng})%5D`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const data = await res.json()
    const colIdx = data.table?.columnNames?.indexOf('sss') ?? -1
    const val = data.table?.rows?.[0]?.[colIdx]
    if (val === null || val === undefined || isNaN(val)) return null
    return parseFloat((val as number).toFixed(1))
  } catch {
    return null
  }
}
