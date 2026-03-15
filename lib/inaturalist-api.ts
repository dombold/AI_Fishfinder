/**
 * iNaturalist API integration for WA marine fish observations.
 * Fetches research-grade citizen science observations per bioregion,
 * cross-references to app species, and deduplicates via the InatObservation table.
 *
 * API docs: https://api.inaturalist.org/v1/docs
 * Rate limit: 100 requests/minute (we paginate sequentially, well within limits)
 */

import { prisma } from '@/lib/prisma'
import type { Bioregion } from '@/lib/regulations'

// Bounding boxes for each WA bioregion (latitude/longitude bounds)
const BIOREGION_BOUNDS: Record<Bioregion, { swlat: number; swlng: number; nelat: number; nelng: number }> = {
  'north-coast': { swlat: -21.767, swlng: 112.0, nelat: -14.0,  nelng: 129.0 },
  'gascoyne':    { swlat: -27.0,   swlng: 112.0, nelat: -21.767, nelng: 115.0 },
  'west-coast':  { swlat: -33.5,   swlng: 113.5, nelat: -27.0,   nelng: 116.0 },
  'south-coast': { swlat: -35.5,   swlng: 115.5, nelat: -33.5,   nelng: 129.0 },
}

// Map from lowercased iNaturalist preferred_common_name → app species name.
// Multiple iNat names can map to the same app species.
const INAT_TO_APP_SPECIES: Record<string, string> = {
  // Mackerels
  'narrow-barred spanish mackerel': 'Spanish Mackerel',
  'spanish mackerel': 'Spanish Mackerel',
  'indo-pacific spanish mackerel': 'Spanish Mackerel',
  'spotted mackerel': 'Spotted Mackerel',
  'grey mackerel': 'Grey Mackerel',
  'school mackerel': 'School Mackerel',
  'shark mackerel': 'Shark Mackerel',

  // Billfish & high-speed pelagics
  'wahoo': 'Wahoo',
  'common dolphinfish': 'Mahi-Mahi',
  'mahi-mahi': 'Mahi-Mahi',
  'dolphinfish': 'Mahi-Mahi',

  // Tunas
  'yellowfin tuna': 'Yellowfin Tuna',
  'bigeye tuna': 'Bigeye Tuna',
  'longtail tuna': 'Longtail Tuna',
  'indo-pacific albacore': 'Albacore Tuna',
  'albacore': 'Albacore Tuna',
  'albacore tuna': 'Albacore Tuna',
  'southern bluefin tuna': 'Southern Bluefin Tuna',
  'skipjack tuna': 'Skipjack Tuna',
  'dogtooth tuna': 'Dogtooth Tuna',
  'wavyback skipjack': 'Skipjack Tuna',

  // Billfish
  'striped marlin': 'Striped Marlin',
  'blue marlin': 'Blue Marlin',
  'indo-pacific blue marlin': 'Blue Marlin',
  'indo-pacific sailfish': 'Sailfish',
  'sailfish': 'Sailfish',

  // Trevallies & Kingfish
  'queenfish': 'Queenfish',
  'giant trevally': 'Giant Trevally',
  'gt': 'Giant Trevally',
  'yellowtail kingfish': 'Yellowtail Kingfish',
  'samson fish': 'Samson Fish',
  'trevally': 'Trevally',
  'big-eye trevally': 'Trevally',
  'bigeye trevally': 'Trevally',

  // Demersals — WA endemics/key species
  'western dhufish': 'Dhufish',
  'dhufish': 'Dhufish',
  'australasian snapper': 'Pink Snapper',
  'pink snapper': 'Pink Snapper',
  'squirefish': 'Pink Snapper',
  'baldchin groper': 'Baldchin Groper',
  'breaksea cod': 'Breaksea Cod',
  'redthroat emperor': 'Redthroat Emperor',
  'long-nosed emperor': 'Redthroat Emperor',
  'spangled emperor': 'Spangled Emperor',
  'red emperor': 'Red Emperor',
  'coral trout': 'Coral Trout',
  'leopard coral grouper': 'Coral Trout',
  'greater amberjack': 'Amberjack',
  'amberjack': 'Amberjack',
  'tuskfish': 'Tuskfish',
  'venus tuskfish': 'Tuskfish',
  'grass emperor': 'Black Snapper (Grass Emperor)',
  'black snapper': 'Black Snapper (Grass Emperor)',
  'nannygai': 'Bight Redfish (Nannygai)',
  'red snapper': 'Bight Redfish (Nannygai)',

  // Estuarine/versatile
  'barramundi': 'Barramundi',
  'giant perch': 'Barramundi',
  'black jewfish': 'Black Jewfish',
  'mulloway': 'Mulloway',
  'jewfish': 'Mulloway',
  'giant threadfin': 'King Threadfin (Giant Threadfin)',
  'king threadfin': 'King Threadfin (Giant Threadfin)',

  // Beach species
  'tailor': 'Tailor',
  'bluefish': 'Tailor',
  'western australian salmon': 'Australian Salmon (Western Australian Salmon)',
  'australian salmon': 'Australian Salmon (Western Australian Salmon)',
  'yellowfin whiting': 'Yellowfin Whiting',
  'sand whiting': 'Whiting',
  'king george whiting': 'King George Whiting',
  'spotted whiting': 'King George Whiting',
  'australian herring': 'Australian Herring',
  'tommy ruff': 'Australian Herring',
  'southern garfish': 'Garfish (Southern Garfish)',
  'garfish': 'Garfish (Southern Garfish)',
  'bream': 'Bream',
  'yellowfin bream': 'Bream',
  'silver bream': 'Silver Bream',
  'pikey bream': 'Silver Bream',
  'flathead': 'Flathead',
  'rock flathead': 'Flathead',
  'southern rock flathead': 'Flathead',
  'flounder': 'Flounder',
  'largescale flounder': 'Flounder',
  'mangrove jack': 'Mangrove Jack',
  'red bass': 'Mangrove Jack',
  'squid': 'Squid',
  'southern calamari': 'Squid',
  'bigfin reef squid': 'Squid',
}

interface InatApiObservation {
  id: number
  taxon?: {
    name: string
    preferred_common_name?: string
  }
  location?: string | null        // "lat,lng" string
  observed_on?: string            // "YYYY-MM-DD"
  quality_grade?: string
}

interface InatApiResponse {
  total_results: number
  page: number
  per_page: number
  results: InatApiObservation[]
}

export async function fetchInatObservations(
  bioregion: Bioregion,
  sinceDays = 180,
): Promise<{ inserted: number; skipped: number }> {
  const bounds = BIOREGION_BOUNDS[bioregion]
  const since = new Date()
  since.setDate(since.getDate() - sinceDays)
  const d1 = since.toISOString().slice(0, 10)

  const allObservations: InatApiObservation[] = []
  const MAX_PAGES = 10
  const PER_PAGE = 200

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL('https://api.inaturalist.org/v1/observations')
    url.searchParams.set('taxon_id', '47178')    // Osteichthyes (bony fish)
    url.searchParams.set('quality_grade', 'research')
    url.searchParams.set('per_page', String(PER_PAGE))
    url.searchParams.set('page', String(page))
    url.searchParams.set('swlat', String(bounds.swlat))
    url.searchParams.set('swlng', String(bounds.swlng))
    url.searchParams.set('nelat', String(bounds.nelat))
    url.searchParams.set('nelng', String(bounds.nelng))
    url.searchParams.set('d1', d1)
    url.searchParams.set('order', 'desc')
    url.searchParams.set('order_by', 'observed_on')
    url.searchParams.set('has[]', 'geo')         // only observations with coordinates

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      console.error(`[iNaturalist] page ${page} fetch failed: ${res.status} ${res.statusText}`)
      break
    }

    const data: InatApiResponse = await res.json()
    allObservations.push(...data.results)

    if (data.results.length < PER_PAGE) break   // last page
  }

  if (allObservations.length === 0) return { inserted: 0, skipped: 0 }

  // Map to DB rows, cross-referencing to app species
  const rows = allObservations.flatMap(obs => {
    if (!obs.location || !obs.observed_on || !obs.taxon) return []

    const [latStr, lngStr] = obs.location.split(',')
    const latitude = parseFloat(latStr)
    const longitude = parseFloat(lngStr)
    if (isNaN(latitude) || isNaN(longitude)) return []

    const commonName = (obs.taxon.preferred_common_name ?? '').toLowerCase()
    const appSpecies = INAT_TO_APP_SPECIES[commonName] ?? null

    return [{
      id: String(obs.id),
      taxonName: obs.taxon.name,
      appSpecies,
      bioregion,
      latitude,
      longitude,
      observedOn: obs.observed_on,
      qualityGrade: obs.quality_grade ?? 'research',
    }]
  })

  if (rows.length === 0) return { inserted: 0, skipped: 0 }

  // Deduplicate against existing records
  const existingIds = new Set(
    (await prisma.inatObservation.findMany({
      where: { id: { in: rows.map(r => r.id) } },
      select: { id: true },
    })).map(r => r.id)
  )

  const newRows = rows.filter(r => !existingIds.has(r.id))
  const skipped = rows.length - newRows.length

  if (newRows.length > 0) {
    await prisma.inatObservation.createMany({
      data: newRows,
      skipDuplicates: true,   // safety net for race conditions
    })
  }

  return { inserted: newRows.length, skipped }
}
