/**
 * Parse a coordinate string in any common format into { lat, lng }.
 * Returns null if the input cannot be recognised or is out of valid range.
 *
 * Supported formats:
 *   -21.8891, 113.9659          (DD with negatives, comma or space separated)
 *   21.8891°S 113.9659°E        (DD with cardinal suffix)
 *   S21.8891 E113.9659          (DD with cardinal prefix)
 *   21°53.346'S 113°57.954'E    (DDM — degrees decimal-minutes)
 *   21°53'20.8"S 113°57'57.2"E  (DMS — degrees minutes seconds)
 *   21.8891 113.9659            (plain pair, WA heuristic applied)
 */
export function parseCoords(raw: string): { lat: number; lng: number } | null {
  // Normalise: trim, collapse runs of whitespace, standardise symbols
  const s = raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[°º˚]/g, '°')
    .replace(/[′ʹ']/g, "'")
    .replace(/[″ʺ"]/g, '"')
    .toUpperCase()

  // ── Helpers ──────────────────────────────────────────────────────────────

  function toDecimal(deg: number, min = 0, sec = 0): number {
    return deg + min / 60 + sec / 3600
  }

  function applySign(val: number, cardinal: string): number {
    return cardinal === 'S' || cardinal === 'W' ? -val : val
  }

  function valid(lat: number, lng: number): { lat: number; lng: number } | null {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
    return { lat, lng }
  }

  // ── Pattern 1: DMS  21°53'20.8"S 113°57'57.2"E ──────────────────────────
  {
    const dms = /^(\d{1,3})°(\d{1,2})'([\d.]+)"([NS])[,\s]+(\d{1,3})°(\d{1,2})'([\d.]+)"([EW])$/
    const m = s.match(dms)
    if (m) {
      const lat = applySign(toDecimal(+m[1], +m[2], +m[3]), m[4])
      const lng = applySign(toDecimal(+m[5], +m[6], +m[7]), m[8])
      return valid(lat, lng)
    }
  }

  // ── Pattern 2: DDM  21°53.346'S 113°57.954'E ─────────────────────────────
  {
    const ddm = /^(\d{1,3})°([\d.]+)'([NS])[,\s]+(\d{1,3})°([\d.]+)'([EW])$/
    const m = s.match(ddm)
    if (m) {
      const lat = applySign(toDecimal(+m[1], +m[2]), m[3])
      const lng = applySign(toDecimal(+m[4], +m[5]), m[6])
      return valid(lat, lng)
    }
  }

  // ── Pattern 3: DD cardinal suffix  21.8891°S 113.9659°E ──────────────────
  // Also handles no degree symbol: 21.8891S 113.9659E
  {
    const dd = /^([\d.]+)°?([NS])[,\s]+([\d.]+)°?([EW])$/
    const m = s.match(dd)
    if (m) {
      const lat = applySign(+m[1], m[2])
      const lng = applySign(+m[3], m[4])
      return valid(lat, lng)
    }
  }

  // ── Pattern 4: DD cardinal prefix  S21.8891 E113.9659 ────────────────────
  {
    const ddp = /^([NS])\s*([\d.]+)[,\s]+([EW])\s*([\d.]+)$/
    const m = s.match(ddp)
    if (m) {
      const lat = applySign(+m[2], m[1])
      const lng = applySign(+m[4], m[3])
      return valid(lat, lng)
    }
  }

  // ── Pattern 5: Signed DD  -21.8891, 113.9659  (comma or space) ───────────
  {
    const signed = /^(-?[\d.]+)[,\s]+(-?[\d.]+)$/
    const m = s.match(signed)
    if (m) {
      const a = +m[1]
      const b = +m[2]
      if (!isNaN(a) && !isNaN(b)) {
        // If one value is clearly a longitude (> 90 or < -90) swap to lat, lng
        let lat = a
        let lng = b
        if (Math.abs(a) > 90 && Math.abs(b) <= 90) {
          lat = b
          lng = a
        }
        return valid(lat, lng)
      }
    }
  }

  return null
}

/** Format a parsed coord pair into the site's canonical display string. */
export function formatCoords(lat: number, lng: number): string {
  return `${Math.abs(lat).toFixed(4)}°${lat < 0 ? 'S' : 'N'} ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`
}
