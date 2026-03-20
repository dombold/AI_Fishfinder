const CMEMS_ERDDAP = 'https://erddap.marine.copernicus.eu/erddap/griddap'

// Dataset: Global Ocean Physics Analysis & Forecast (1/12°, 6-hourly)
// Variable: thetao = potential temperature (°C) at depth
const DATASET = 'cmems_mod_glo_phy-tem_anfc_0.083deg_PT6H-i'

export interface SubsurfaceTemps {
  depth25m:  number | null
  depth50m:  number | null
  depth100m: number | null
}

/**
 * Sub-surface ocean temperature profiles via CMEMS ERDDAP.
 * Returns temperatures at 25m, 50m, 100m depth.
 * Requires CMEMS_USERNAME and CMEMS_PASSWORD env vars (free at marine.copernicus.eu).
 * Returns null if credentials not configured or request fails.
 */
export async function getSubsurfaceTemps(lat: number, lng: number): Promise<SubsurfaceTemps | null> {
  const username = process.env.CMEMS_USERNAME
  const password = process.env.CMEMS_PASSWORD
  if (!username || !password) return null

  const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

  // CMEMS depth levels closest to 25m, 50m, 100m in this dataset
  const depths = [25.0, 50.0, 100.0] as const

  async function fetchAtDepth(depth: number): Promise<number | null> {
    try {
      // Query: last time step, exact depth, lat±0.083° snapped, lng±0.083° snapped
      const url = `${CMEMS_ERDDAP}/${DATASET}.json?thetao%5B(last)%5D%5B(${depth})%5D%5B(${lat})%5D%5B(${lng})%5D`
      const res = await fetch(url, {
        headers: { Authorization: auth },
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) return null
      const data = await res.json()
      const colIdx = data.table?.columnNames?.indexOf('thetao') ?? -1
      const val = data.table?.rows?.[0]?.[colIdx]
      if (val === null || val === undefined || isNaN(val)) return null
      return parseFloat((val as number).toFixed(1))
    } catch {
      return null
    }
  }

  const [r25, r50, r100] = await Promise.allSettled(depths.map(d => fetchAtDepth(d)))

  const get = (r: PromiseSettledResult<number | null>) =>
    r.status === 'fulfilled' ? r.value : null

  const result: SubsurfaceTemps = {
    depth25m:  get(r25),
    depth50m:  get(r50),
    depth100m: get(r100),
  }

  // Return null if we got nothing useful
  if (result.depth25m === null && result.depth50m === null && result.depth100m === null) {
    return null
  }

  return result
}
