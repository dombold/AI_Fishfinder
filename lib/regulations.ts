// WA fishing regulations — sourced from DPIRD Recreational Fishing Guide 2026
// and rules.fish.wa.gov.au
// IMPORTANT: Regulations change — always verify at fish.wa.gov.au before fishing

export type Bioregion = 'north-coast' | 'gascoyne' | 'west-coast' | 'south-coast'

export interface ClosureWarning {
  severity: 'CLOSED' | 'RESTRICTED' | 'SEASONAL'
  message: string
}

export interface SpeciesRegulation {
  minSize?: string
  bagLimit: string
  combinedLimit?: string
  seasonalClosures?: string
  notes?: string
  closureActive?: boolean
  closureReason?: string
}

/** Determine official WA DPIRD bioregion from latitude and longitude.
 *  Boundaries per IMCRA / DPIRD:
 *  - North Coast:   north of 21°46′S (Ashburton River near Onslow)
 *  - Gascoyne Coast: 21°46′S to 27°S (Zuytdorp Cliffs / Kalbarri)
 *  - West Coast:    27°S south to Black Point east of Augusta (~115°30′E)
 *  - South Coast:   east of 115°30′E to WA–SA border
 */
export function getBioregion(lat: number, lng: number): Bioregion {
  if (lat > -21.767) return 'north-coast'
  if (lat > -27.0)   return 'gascoyne'
  if (lng >= 115.5 && lat < -33.5) return 'south-coast'
  return 'west-coast'
}

const DEMERSAL_SPECIES = new Set([
  'Dhufish', 'Pink Snapper', 'Baldchin Groper', 'Redthroat Emperor',
  'Spangled Emperor', 'Coral Trout', 'Tuskfish', 'Black Snapper (Grass Emperor)',
])

// Approximate bounding box for Cockburn Sound + Warnbro Sound
const COCKBURN_WARNBRO_BOUNDS = { minLat: -32.45, maxLat: -32.05, minLng: 115.62, maxLng: 115.82 }

// Shark Bay Pink Snapper spawning closure zones (Gascoyne bioregion)
const SHARK_BAY_EASTERN_GULF_BOUNDS  = { minLat: -26.5, maxLat: -25.3, minLng: 113.6, maxLng: 114.5 }
const SHARK_BAY_FREYCINET_BOUNDS     = { minLat: -26.4, maxLat: -25.8, minLng: 113.9, maxLng: 114.5 }
const SHARK_BAY_BERNIER_NORTH_BOUNDS = { minLat: -25.0, maxLat: -24.3, minLng: 112.7, maxLng: 113.5 }

/** Check for active fishery closures based on location, fishing setup, and selected species */
export function checkFishingClosures(
  lat: number,
  lng: number,
  fishingType: string,
  targetType: string,
  selectedSpecies: string[] = [],
): ClosureWarning[] {
  const warnings: ClosureWarning[] = []
  const bioregion = getBioregion(lat, lng)

  // West Coast Boat Demersal Closure: Dec 16 2025 – Spring 2027
  // Only warn if targetType includes demersal AND at least one demersal species is selected
  const targetsDemersals =
    (targetType === 'demersal' || targetType === 'both') &&
    selectedSpecies.some(s => DEMERSAL_SPECIES.has(s))
  if (bioregion === 'west-coast' && fishingType === 'boat' && targetsDemersals) {
    warnings.push({
      severity: 'CLOSED',
      message:
        'BOAT DEMERSAL FISHING CLOSED — Recreational boat fishing for demersal scalefish is CLOSED in the West Coast Bioregion (Kalbarri to Augusta) until approximately September 2027. Land-based (beach) fishing for demersal species remains permitted. Source: DPIRD WA.',
    })
  }

  // Cockburn/Warnbro Sounds Pink Snapper spawning closure: Aug 1 – Jan 31
  // Only warn if user selected Pink Snapper AND location is within these specific sounds
  const inCockburnWarnbro =
    lat >= COCKBURN_WARNBRO_BOUNDS.minLat && lat <= COCKBURN_WARNBRO_BOUNDS.maxLat &&
    lng >= COCKBURN_WARNBRO_BOUNDS.minLng && lng <= COCKBURN_WARNBRO_BOUNDS.maxLng

  if (bioregion === 'west-coast' && (targetType === 'demersal' || targetType === 'both') && selectedSpecies.includes('Pink Snapper') && inCockburnWarnbro) {
    const now = new Date()
    const month = now.getMonth() + 1 // 1-indexed
    if (month >= 8 || month <= 1) {
      warnings.push({
        severity: 'SEASONAL',
        message:
          'Pink Snapper spawning closure in effect for Cockburn Sound and Warnbro Sound (Aug 1 – Jan 31). No fishing for pink snapper in these specific areas. Other West Coast areas remain open for beach fishing.',
      })
    }
  }

  // Shark Bay Pink Snapper spawning closures (all methods — boat and land-based)
  const targetsSharkBaySnapper =
    (targetType === 'demersal' || targetType === 'both') &&
    selectedSpecies.includes('Pink Snapper') &&
    bioregion === 'gascoyne'

  if (targetsSharkBaySnapper) {
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()

    // Eastern Gulf (Henri Freycinet Harbour): closed 1 May – 31 Jul
    const inEasternGulf =
      lat >= SHARK_BAY_EASTERN_GULF_BOUNDS.minLat && lat <= SHARK_BAY_EASTERN_GULF_BOUNDS.maxLat &&
      lng >= SHARK_BAY_EASTERN_GULF_BOUNDS.minLng && lng <= SHARK_BAY_EASTERN_GULF_BOUNDS.maxLng
    if (inEasternGulf && month >= 5 && month <= 7) {
      warnings.push({
        severity: 'SEASONAL',
        message:
          'Pink Snapper spawning closure in effect — Shark Bay Eastern Gulf / Henri Freycinet Harbour (1 May – 31 Jul). No fishing for pink snapper by any method. Source: DPIRD WA.',
      })
    }

    // Freycinet Estuary: closed 15 Aug – 30 Sep
    const inFreycinet =
      lat >= SHARK_BAY_FREYCINET_BOUNDS.minLat && lat <= SHARK_BAY_FREYCINET_BOUNDS.maxLat &&
      lng >= SHARK_BAY_FREYCINET_BOUNDS.minLng && lng <= SHARK_BAY_FREYCINET_BOUNDS.maxLng
    if (inFreycinet && (month === 9 || (month === 8 && day >= 15))) {
      warnings.push({
        severity: 'SEASONAL',
        message:
          'Pink Snapper spawning closure in effect — Shark Bay Freycinet Estuary (15 Aug – 30 Sep). No fishing for pink snapper by any method. Source: DPIRD WA.',
      })
    }

    // Northern Bernier Island / Koks Island area: closed 1 Jun – 31 Aug
    const inBernierNorth =
      lat >= SHARK_BAY_BERNIER_NORTH_BOUNDS.minLat && lat <= SHARK_BAY_BERNIER_NORTH_BOUNDS.maxLat &&
      lng >= SHARK_BAY_BERNIER_NORTH_BOUNDS.minLng && lng <= SHARK_BAY_BERNIER_NORTH_BOUNDS.maxLng
    if (inBernierNorth && month >= 6 && month <= 8) {
      warnings.push({
        severity: 'SEASONAL',
        message:
          'Pink Snapper spawning closure in effect — Northern Bernier Island / Koks Island area (1 Jun – 31 Aug). No fishing for pink snapper by any method. Source: DPIRD WA.',
      })
    }
  }

  return warnings
}

type BioregionRules = {
  'north-coast': SpeciesRegulation
  gascoyne:      SpeciesRegulation
  'west-coast':  SpeciesRegulation
  'south-coast': SpeciesRegulation
}

// Full regulations map — keyed by species name
export const REGULATIONS: Record<string, BioregionRules> = {
  'Spanish Mackerel': {
    'north-coast': { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Wire trace prohibited near Esperance Jetty' },
    gascoyne:      { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Wire trace banned Perth metro, Busselton and Esperance jetties' },
    'south-coast': { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Wire trace prohibited near Esperance Jetty' },
  },
  'Wahoo': {
    'north-coast': { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    gascoyne:      { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Mahi-Mahi': {
    'north-coast': { minSize: '500mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    gascoyne:      { minSize: '500mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { minSize: '500mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { minSize: '500mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Yellowfin Tuna': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Bigeye Tuna': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Striped Marlin': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Blue Marlin': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Sailfish': {
    'north-coast': { bagLimit: '1 fish', combinedLimit: 'Counts within 3 fish large pelagic mixed bag', notes: 'Catch-and-release strongly recommended' },
    gascoyne:      { bagLimit: '1 fish', combinedLimit: 'Counts within 3 fish large pelagic mixed bag', notes: 'Catch-and-release strongly recommended' },
    'west-coast':  { bagLimit: '1 fish', combinedLimit: 'Counts within 3 fish large pelagic mixed bag', notes: 'Catch-and-release strongly recommended' },
    'south-coast': { bagLimit: '1 fish', combinedLimit: 'Counts within 3 fish large pelagic mixed bag', notes: 'Catch-and-release strongly recommended' },
  },
  'Queenfish': {
    'north-coast': { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Giant Trevally': {
    'north-coast': { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Yellowtail Kingfish': {
    'north-coast': { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    gascoyne:      { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Samson Fish': {
    'north-coast': { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    gascoyne:      { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Amberjack': {
    'north-coast': { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    gascoyne:      { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Dhufish': {
    'north-coast': { bagLimit: '2 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Abrolhos Islands: 1 fish daily limit. Release weight required for barotrauma.' },
    gascoyne:      { bagLimit: '2 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Release weight required for barotrauma.' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.', notes: 'No spearfishing for dhufish. Release weight required.' },
    'south-coast': { bagLimit: '2 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Release weight required for barotrauma.' },
  },
  'Pink Snapper': {
    'north-coast': { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal mixed bag', notes: 'Check DPIRD for specific area rules.' },
    gascoyne:      { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal mixed bag (2 pink snapper + 1 rankin cod + 1 red emperor + 1 goldband snapper)', seasonalClosures: 'Eastern Gulf closed 1 May–31 Jul; Freycinet Estuary closed 15 Aug–30 Sep; Northern Bernier Island closed 1 Jun–31 Aug (all methods)', notes: 'No tagging required. Check fish.wa.gov.au for current rules.' },
    'west-coast':  { minSize: '500mm total length (south of 31°S) / 410mm (north of 31°S)', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.', seasonalClosures: 'Cockburn Sound & Warnbro Sound closed Aug 1 – Jan 31 for pink snapper (all methods)', notes: 'Release weight required.' },
    'south-coast': { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag', notes: 'Release weight required.' },
  },
  'Baldchin Groper': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag', seasonalClosures: 'Abrolhos Islands: closed Oct 1 – Dec 31 (spawning)', notes: 'Abrolhos Islands: 1 fish limit.' },
    gascoyne:      { bagLimit: '2 fish', combinedLimit: '4 fish demersal mixed bag', notes: 'Shark Bay inner gulfs: combined bag limit of 2 for baldchin groper + tuskfish. Release weight required.' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.', notes: 'Release weight required.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag', notes: 'Release weight required.' },
  },
  'Redthroat Emperor': {
    'north-coast': { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag' },
    gascoyne:      { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal mixed bag' },
    'west-coast':  { minSize: '410mm total length', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.' },
    'south-coast': { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag' },
  },
  'Spangled Emperor': {
    'north-coast': { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal mixed bag' },
    gascoyne:      { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal mixed bag' },
    'west-coast':  { minSize: '410mm total length', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.' },
    'south-coast': { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag' },
  },
  'Coral Trout': {
    'north-coast': { minSize: '450mm total length', bagLimit: '1 fish', notes: 'Totally protected in Rowley Shoals Marine Park — no take.' },
    gascoyne:      { minSize: '450mm total length', bagLimit: '1 fish', notes: 'Check local marine park rules.' },
    'west-coast':  { minSize: '450mm total length', bagLimit: '1 fish (land-based only)', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.' },
    'south-coast': { minSize: '450mm total length', bagLimit: '1 fish' },
  },
  'Tuskfish': {
    'north-coast': { minSize: 'None (blackspot/blue tuskfish: 400mm)', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag' },
    gascoyne:      { minSize: 'None (blackspot/blue tuskfish: 400mm)', bagLimit: '2 fish', combinedLimit: '4 fish demersal mixed bag', notes: 'Shark Bay inner gulfs: combined bag limit of 2 for baldchin groper + tuskfish.' },
    'west-coast':  { minSize: 'None (blackspot/blue tuskfish: 400mm)', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.' },
    'south-coast': { minSize: 'None (blackspot/blue tuskfish: 400mm)', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag' },
  },
  'Black Snapper (Grass Emperor)': {
    'north-coast': { minSize: '320mm total length', bagLimit: '5 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { minSize: '320mm total length', bagLimit: '5 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { minSize: '320mm total length', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based permitted.' },
    'south-coast': { minSize: '320mm total length', bagLimit: '5 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
  },
  'Tailor': {
    'north-coast': { minSize: '300mm total length', bagLimit: '8 fish (max 2 over 500mm)', notes: 'Wire trace prohibited near Esperance Jetty' },
    gascoyne:      { minSize: '300mm total length', bagLimit: '8 fish (max 2 over 500mm)' },
    'west-coast':  { minSize: '300mm total length', bagLimit: '8 fish (max 2 over 500mm)', notes: 'Wire trace prohibited near Perth metro, Busselton and Esperance jetties' },
    'south-coast': { minSize: '300mm total length', bagLimit: '8 fish (max 2 over 500mm)', notes: 'Wire trace prohibited near Esperance Jetty' },
  },
  'Australian Salmon (Western Australian Salmon)': {
    'north-coast': { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Yellowfin Whiting': {
    'north-coast': { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    gascoyne:      { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    'west-coast':  { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    'south-coast': { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
  },
  'Trevally': {
    'north-coast': { minSize: 'None (silver trevally: 250mm)', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: 'None (silver trevally: 250mm)', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: 'None (silver trevally: 250mm)', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: 'None (silver trevally: 250mm)', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Herring': {
    'north-coast': { bagLimit: '20 fish per 24 hours' },
    gascoyne:      { bagLimit: '20 fish per 24 hours' },
    'west-coast':  { bagLimit: '20 fish per 24 hours' },
    'south-coast': { bagLimit: '20 fish per 24 hours' },
  },
  'Bream': {
    'north-coast': { minSize: '250mm (yellowfin bream: 300mm)', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '250mm (yellowfin bream: 300mm)', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '250mm (yellowfin bream: 300mm)', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag', notes: 'Max 2 black bream over 400mm in Swan and Canning rivers' },
    'south-coast': { minSize: '250mm (yellowfin bream: 300mm)', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Whiting': {
    'north-coast': { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    gascoyne:      { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    'west-coast':  { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    'south-coast': { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
  },
  'Flathead': {
    'north-coast': { minSize: '300mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '300mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '300mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '300mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Mulloway': {
    'north-coast': { minSize: '500mm total length', bagLimit: '2 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '500mm total length', bagLimit: '2 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '500mm total length', bagLimit: '2 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '500mm total length', bagLimit: '2 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Flounder': {
    'north-coast': { minSize: '250mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '250mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '250mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '250mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
}

export function getRegulations(species: string, lat: number, lng: number): SpeciesRegulation | null {
  const bioregion = getBioregion(lat, lng)
  return REGULATIONS[species]?.[bioregion] ?? null
}
