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
  'Spangled Emperor', 'Coral Trout', 'Tuskfish', 'Grass Emperor',
  'Blue Morwong', 'Goldspotted Rockcod', 'Blackspotted Rockcod', 'Western Wirrah',
  'Harlequin', 'Chinaman Rockcod', 'Rankin Cod', 'Coronation Trout',
  "Robinson's Sea Bream", 'Foxfish', 'Pigfish', 'Hapuku', 'Bass Groper',
  'John Dory', 'Mirror Dory', 'Boarfish', 'Barramundi Cod', 'Blue-eye Trevalla',
  'Pearl Perch', 'Crimson Snapper', 'Saddletail Snapper', 'Jobfish',
  'Ruby Snapper', 'Goldband Snapper', 'Golden Snapper', 'Stripey Snapper',
  'Western Blue Groper', 'Sweetlip',
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
  'Spotted Mackerel': {
    'north-coast': { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Grey Mackerel': {
    'north-coast': { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'School Mackerel': {
    'north-coast': { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '500mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Shark Mackerel': {
    'north-coast': { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Wire trace mandatory — sharp teeth. Confirm ID with DPIRD guide.' },
    gascoyne:      { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Longtail Tuna': {
    'north-coast': { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag (small tunas)' },
    gascoyne:      { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag (small tunas)' },
    'west-coast':  { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag (small tunas)' },
    'south-coast': { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag (small tunas)' },
  },
  'Albacore Tuna': {
    'north-coast': { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag' },
    gascoyne:      { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag' },
    'west-coast':  { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag' },
    'south-coast': { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag' },
  },
  'Southern Bluefin Tuna': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Subject to international quota. Check AFMA regulations before targeting. Strongly recommended to tag and report.' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Subject to international quota. Check AFMA regulations before targeting.' },
    'west-coast':  { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Subject to CCSBT international quota. Recreational limit: 3 fish per person. Report catches to AFMA.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Subject to CCSBT international quota. Recreational limit: 3 fish per person. Report catches to AFMA.' },
  },
  'Skipjack Tuna': {
    'north-coast': { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag (small tunas)' },
    gascoyne:      { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag (small tunas)' },
    'west-coast':  { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag (small tunas)' },
    'south-coast': { bagLimit: '20 fish', combinedLimit: '20 fish tuna mixed bag (small tunas)' },
  },
  'Dogtooth Tuna': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Totally protected in Rowley Shoals Marine Park — no take of any species.' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Squid': {
    'north-coast': { bagLimit: '15 squid', notes: 'No minimum size. Combined bag of 15 for all squid species.' },
    gascoyne:      { bagLimit: '15 squid', notes: 'No minimum size. Combined bag of 15 for all squid species.' },
    'west-coast':  { bagLimit: '15 squid', notes: 'No minimum size. Combined bag of 15 for all squid species.' },
    'south-coast': { bagLimit: '15 squid', notes: 'No minimum size. Combined bag of 15 for all squid species.' },
  },
  'Breaksea Cod': {
    'north-coast': { minSize: '300mm total length', bagLimit: '5 fish', combinedLimit: '5 fish demersal mixed bag' },
    gascoyne:      { minSize: '300mm total length', bagLimit: '5 fish', combinedLimit: '5 fish demersal mixed bag' },
    'west-coast':  { minSize: '300mm total length', bagLimit: '5 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { minSize: '300mm total length', bagLimit: '5 fish', combinedLimit: '5 fish demersal mixed bag' },
  },
  'Red Emperor': {
    'north-coast': { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal mixed bag' },
    gascoyne:      { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal mixed bag (2 pink snapper + 1 rankin cod + 1 red emperor + 1 goldband snapper)', notes: 'Check DPIRD for Shark Bay specific rules.' },
    'west-coast':  { minSize: '410mm total length', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag' },
  },
  'Bight Redfish': {
    'north-coast': { minSize: '250mm total length', bagLimit: '10 fish', combinedLimit: '10 fish per person', notes: 'Release weight required — very susceptible to barotrauma at depth.' },
    gascoyne:      { minSize: '250mm total length', bagLimit: '10 fish', combinedLimit: '10 fish per person', notes: 'Release weight required.' },
    'west-coast':  { minSize: '250mm total length', bagLimit: '10 fish', combinedLimit: '10 fish per person', notes: 'Release weight required for barotrauma.' },
    'south-coast': { minSize: '250mm total length', bagLimit: '10 fish', combinedLimit: '10 fish per person', notes: 'Release weight required.' },
  },
  'Barramundi': {
    'north-coast': { minSize: '550mm total length (max 800mm — slot limit)', bagLimit: '5 fish', notes: 'Slot limit: fish between 550–800mm only; any fish outside this range must be released. Check local estuary-specific rules. Bag limit may vary by location.' },
    gascoyne:      { minSize: '550mm total length (max 800mm — slot limit)', bagLimit: '5 fish', notes: 'Slot limit applies. Verify at fish.wa.gov.au for local area rules.' },
    'west-coast':  { minSize: '550mm total length (max 800mm — slot limit)', bagLimit: '5 fish', notes: 'Slot limit applies. Note: barramundi are rare in the West Coast bioregion.' },
    'south-coast': { minSize: '550mm total length (max 800mm — slot limit)', bagLimit: '5 fish', notes: 'Slot limit applies. Note: barramundi are rare in the South Coast bioregion.' },
  },
  'Black Jewfish': {
    'north-coast': { minSize: '700mm total length', bagLimit: '2 fish', combinedLimit: '5 fish large estuarine species mixed bag', notes: 'Night fishing is the most productive approach.' },
    gascoyne:      { minSize: '700mm total length', bagLimit: '2 fish', combinedLimit: '5 fish large estuarine species mixed bag' },
    'west-coast':  { minSize: '700mm total length', bagLimit: '2 fish', combinedLimit: '5 fish large estuarine species mixed bag' },
    'south-coast': { minSize: '700mm total length', bagLimit: '2 fish', combinedLimit: '5 fish large estuarine species mixed bag' },
  },
  'King Threadfin': {
    'north-coast': { minSize: '600mm total length', bagLimit: '5 fish', notes: 'Primarily found in tropical estuaries. Size limit is total length including threadlets.' },
    gascoyne:      { minSize: '600mm total length', bagLimit: '5 fish' },
    'west-coast':  { minSize: '600mm total length', bagLimit: '5 fish', notes: 'Very rare in West Coast Bioregion.' },
    'south-coast': { minSize: '600mm total length', bagLimit: '5 fish', notes: 'Very rare in South Coast Bioregion.' },
  },
  'Garfish': {
    'north-coast': { bagLimit: '30 fish', combinedLimit: '30 fish garfish/needlefish mixed bag', notes: 'No minimum size for garfish in WA.' },
    gascoyne:      { bagLimit: '30 fish', combinedLimit: '30 fish garfish/needlefish mixed bag' },
    'west-coast':  { bagLimit: '30 fish', combinedLimit: '30 fish garfish/needlefish mixed bag' },
    'south-coast': { bagLimit: '30 fish', combinedLimit: '30 fish garfish/needlefish mixed bag' },
  },
  'Silver Bream': {
    'north-coast': { minSize: '250mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '250mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '250mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '250mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'King George Whiting': {
    'north-coast': { minSize: '280mm total length', bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    gascoyne:      { minSize: '280mm total length', bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    'west-coast':  { minSize: '280mm total length', bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag', notes: 'Cockburn Sound and Warnbro Sound: no specific KGW closure. Bag limit applies.' },
    'south-coast': { minSize: '280mm total length', bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
  },
  'Mangrove Jack': {
    'north-coast': { minSize: '350mm total length', bagLimit: '5 fish', combinedLimit: '5 fish estuary mixed bag', notes: 'Catch-and-release of large specimens recommended. Excellent table fish but slow growing.' },
    gascoyne:      { minSize: '350mm total length', bagLimit: '5 fish', combinedLimit: '5 fish estuary mixed bag' },
    'west-coast':  { minSize: '350mm total length', bagLimit: '5 fish', notes: 'Very rare in West Coast Bioregion.' },
    'south-coast': { minSize: '350mm total length', bagLimit: '5 fish', notes: 'Very rare in South Coast Bioregion.' },
  },
  'Dhufish': {
    'north-coast': { bagLimit: '2 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Abrolhos Islands: 1 fish daily limit. Release weight required for barotrauma.' },
    gascoyne:      { bagLimit: '2 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Release weight required for barotrauma.' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.', notes: 'No spearfishing for dhufish. Release weight required.' },
    'south-coast': { bagLimit: '2 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Release weight required for barotrauma.' },
  },
  'Pink Snapper': {
    'north-coast': { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal mixed bag', notes: 'Check DPIRD for specific area rules.' },
    gascoyne:      { minSize: '410mm total length (500mm in Shark Bay inner gulfs)', bagLimit: '3 fish (2 fish in Shark Bay)', combinedLimit: '5 fish demersal mixed bag (2 pink snapper + 1 rankin cod + 1 red emperor + 1 goldband snapper)', seasonalClosures: 'Eastern Gulf closed 1 May–31 Jul; Freycinet Estuary closed 15 Aug–30 Sep; Northern Bernier Island closed 1 Jun–31 Aug (all methods)', notes: 'Shark Bay inner gulfs (Denham Sound, Freycinet Estuary, Eastern Gulf): isolated stocks that do not interbreed — particularly vulnerable to overfishing. Freycinet Estuary Management Zone: max 5 kg of fillets or one day\'s bag limit of whole fish. No tagging required.' },
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
  'Grass Emperor': {
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
  'Australian Salmon': {
    'north-coast': { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Blue Morwong': {
    'north-coast': { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { minSize: '410mm total length', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Goldspotted Rockcod': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Totally protected in Rowley Shoals Marine Park — no take.' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Blackspotted Rockcod': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Totally protected in Rowley Shoals Marine Park — no take.' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Western Wirrah': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Harlequin': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Chinaman Rockcod': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Totally protected in Rowley Shoals Marine Park — no take.' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Rankin Cod': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag (counts toward Pink Snapper combined limit — verify at fish.wa.gov.au)', notes: 'Rankin Cod counts in the Shark Bay combined demersal bag — check DPIRD for current area rules.' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Coronation Trout': {
    'north-coast': { bagLimit: '1 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Totally protected in Rowley Shoals Marine Park — no take. Offshore reef species; handle carefully for release.' },
    gascoyne:      { bagLimit: '1 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '1 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '1 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  "Robinson's Sea Bream": {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Foxfish': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Pigfish': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Hapuku': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Deep water species (80–400m); release weight essential for barotrauma.' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Release weight required for barotrauma.' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.', notes: 'Release weight required.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Release weight required for barotrauma. Deep water species — most common south coast.' },
  },
  'Bass Groper': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Release weight required for barotrauma. Deep water species.' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Release weight required.' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Release weight required. Most common in deeper south coast waters.' },
  },
  'John Dory': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Mirror Dory': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Boarfish': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Barramundi Cod': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Fish over 1m total length are protected — must be released. Totally protected in Rowley Shoals Marine Park.' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Fish over 1m protected — must be released.' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.', notes: 'Fish over 1m protected.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Fish over 1m protected — must be released.' },
  },
  'Blue-eye Trevalla': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Deep water species (100–600m); release weight essential for barotrauma.' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Release weight required for barotrauma.' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.', notes: 'Release weight required.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Release weight required for barotrauma.' },
  },
  'Pearl Perch': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Crimson Snapper': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Saddletail Snapper': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Jobfish': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Totally protected in Rowley Shoals Marine Park — no take.' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Ruby Snapper': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Deep water species (100–400m); release weight essential for barotrauma.' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Release weight required.' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Goldband Snapper': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag (counts in Shark Bay Pink Snapper combined demersal limit — verify at fish.wa.gov.au)', notes: 'Check DPIRD for Shark Bay combined bag rules.' },
    'west-coast':  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Golden Snapper': {
    'north-coast': { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag', notes: 'Also known as Fingermark or Golden Snapper. Tropical estuarine species.' },
    gascoyne:      { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag', notes: 'Rare in West Coast Bioregion.' },
    'south-coast': { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag', notes: 'Rare in South Coast Bioregion.' },
  },
  'Stripey Snapper': {
    'north-coast': { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Western Blue Groper': {
    'north-coast': { minSize: '500mm total length', bagLimit: '1 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Highly valued endemic species. Catch-and-release of large specimens strongly recommended.' },
    gascoyne:      { minSize: '500mm total length', bagLimit: '1 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { minSize: '500mm total length', bagLimit: '1 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.', notes: 'Highly protected; consider catch-and-release.' },
    'south-coast': { minSize: '500mm total length', bagLimit: '1 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'WA endemic species. Release large fish for conservation.' },
  },
  'Sweetlip': {
    'north-coast': { minSize: '300mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag', notes: 'Multiple sweetlip species in WA — Painted, Slatey, Trout sweetlip. Check DPIRD for current listings.' },
    gascoyne:      { minSize: '300mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    'west-coast':  { minSize: '300mm total length', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.' },
    'south-coast': { minSize: '300mm total length', bagLimit: '3 fish', combinedLimit: '4 fish demersal scalefish mixed bag' },
  },
  'Cobia': {
    'north-coast': { minSize: '750mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    gascoyne:      { minSize: '750mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { minSize: '750mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { minSize: '750mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Golden Trevally': {
    'north-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    gascoyne:      { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'west-coast':  { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    'south-coast': { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Black Bream': {
    'north-coast': { minSize: '250mm total length', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '250mm total length', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '250mm total length', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag', notes: 'Swan and Canning rivers: max 2 black bream over 400mm. Peel Inlet and Mandurah Estuary: premier locations.' },
    'south-coast': { minSize: '250mm total length', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Yellowtail Bream': {
    'north-coast': { minSize: '300mm total length', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '300mm total length', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '300mm total length', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '300mm total length', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Tarwhine': {
    'north-coast': { minSize: '250mm total length', bagLimit: '16 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '250mm total length', bagLimit: '16 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '250mm total length', bagLimit: '16 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '250mm total length', bagLimit: '16 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Bonito': {
    'north-coast': { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Tripletail': {
    'north-coast': { minSize: '300mm total length', bagLimit: '2 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    gascoyne:      { minSize: '300mm total length', bagLimit: '2 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'west-coast':  { minSize: '300mm total length', bagLimit: '2 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    'south-coast': { minSize: '300mm total length', bagLimit: '2 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
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

/** Common alternate/colloquial names → canonical REGULATIONS key.
 *  All keys are lowercase; lookup is case-insensitive.
 */
const SPECIES_ALIASES: Record<string, string> = {
  // Mahi-Mahi
  'dorado': 'Mahi-Mahi',
  'dolphinfish': 'Mahi-Mahi',
  'dolphin fish': 'Mahi-Mahi',

  // Spanish Mackerel
  'spaniard': 'Spanish Mackerel',
  'narrow-barred spanish mackerel': 'Spanish Mackerel',
  'narrow barred spanish mackerel': 'Spanish Mackerel',
  'narrowbar mackerel': 'Spanish Mackerel',
  'king mackerel': 'Spanish Mackerel',

  // Wahoo
  'ono': 'Wahoo',
  'wahu': 'Wahoo',

  // Yellowfin Tuna
  'yellowfin': 'Yellowfin Tuna',

  // Albacore Tuna
  'albacore': 'Albacore Tuna',
  'longfin tuna': 'Albacore Tuna',
  'longfin albacore': 'Albacore Tuna',

  // Longtail Tuna
  'longtail': 'Longtail Tuna',
  'northern bluefin tuna': 'Longtail Tuna',

  // Southern Bluefin Tuna
  'southern bluefin': 'Southern Bluefin Tuna',
  'sbt': 'Southern Bluefin Tuna',

  // Skipjack Tuna
  'skipjack': 'Skipjack Tuna',
  'wavyback skipjack': 'Skipjack Tuna',
  'mackerel tuna': 'Skipjack Tuna',

  // Dogtooth Tuna
  'dogtooth': 'Dogtooth Tuna',
  'white tuna': 'Dogtooth Tuna',

  // Giant Trevally
  'gt': 'Giant Trevally',
  'ulua': 'Giant Trevally',

  // Yellowtail Kingfish
  'kingfish': 'Yellowtail Kingfish',
  'kingie': 'Yellowtail Kingfish',
  'yellowtail': 'Yellowtail Kingfish',

  // Samson Fish
  'samsonfish': 'Samson Fish',

  // Amberjack
  'greater amberjack': 'Amberjack',
  'amber jack': 'Amberjack',

  // Dhufish
  'wa dhufish': 'Dhufish',
  'western dhufish': 'Dhufish',
  'western australian dhufish': 'Dhufish',
  'west australian dhufish': 'Dhufish',

  // Pink Snapper
  'snapper': 'Pink Snapper',
  'australasian snapper': 'Pink Snapper',

  // Baldchin Groper
  'baldchin': 'Baldchin Groper',
  'baldchin grouper': 'Baldchin Groper',
  'baldchin wrasse': 'Baldchin Groper',

  // Coral Trout
  'coral cod': 'Coral Trout',
  'coral grouper': 'Coral Trout',
  'leopard coral grouper': 'Coral Trout',
  'coral trout grouper': 'Coral Trout',

  // Red Emperor
  'red snapper': 'Red Emperor',
  'large-mouth nannygai': 'Red Emperor',
  'large mouth nannygai': 'Red Emperor',

  // Australian Salmon
  'west australian salmon': 'Australian Salmon',
  'western australian salmon': 'Australian Salmon',
  'wa salmon': 'Australian Salmon',
  'kahawai': 'Australian Salmon',

  // Tailor
  'bluefish': 'Tailor',
  'elf': 'Tailor',
  'chopper': 'Tailor',
  'tailor fish': 'Tailor',

  // Herring (Australian Herring)
  'australian herring': 'Herring',
  'tommy ruff': 'Herring',
  'tommy rough': 'Herring',
  'ruff': 'Herring',

  // Mulloway
  'jewfish': 'Mulloway',
  'jewie': 'Mulloway',
  'jewies': 'Mulloway',
  'silver jew': 'Mulloway',
  'silver jewfish': 'Mulloway',
  'mulloway (jewfish)': 'Mulloway',

  // Black Jewfish
  'black jew': 'Black Jewfish',
  'black jewie': 'Black Jewfish',

  // Cobia
  'black kingfish': 'Cobia',
  'lemonfish': 'Cobia',
  'black king': 'Cobia',
  'crabeater': 'Cobia',
  'sergeant fish': 'Cobia',

  // Barramundi Cod
  'potato cod': 'Barramundi Cod',
  'potato grouper': 'Barramundi Cod',
  'potato bass': 'Barramundi Cod',

  // Mangrove Jack
  'mangrove red snapper': 'Mangrove Jack',
  'jack': 'Mangrove Jack',

  // Tuskfish
  'bluebone': 'Tuskfish',
  'venus tuskfish': 'Tuskfish',
  'cheeky': 'Tuskfish',

  // Blue-eye Trevalla
  'blue eye': 'Blue-eye Trevalla',
  'blue-eye': 'Blue-eye Trevalla',
  'blueye': 'Blue-eye Trevalla',
  'blue eye trevalla': 'Blue-eye Trevalla',
  'deep-sea trevalla': 'Blue-eye Trevalla',
  'deep sea trevalla': 'Blue-eye Trevalla',

  // Western Blue Groper
  'blue groper': 'Western Blue Groper',
  'wa blue groper': 'Western Blue Groper',

  // King Threadfin
  'king threadfin salmon': 'King Threadfin',
  'blue salmon': 'King Threadfin',

  // Rankin Cod
  'rankin': 'Rankin Cod',
  "rankin's cod": 'Rankin Cod',

  // Coronation Trout
  'coronation': 'Coronation Trout',
  'coronation grouper': 'Coronation Trout',
  'coronation fish': 'Coronation Trout',

  // Harlequin
  'harlequin fish': 'Harlequin',

  // Sweetlip
  'sweetlips': 'Sweetlip',

  // Golden Trevally
  'goldies': 'Golden Trevally',
  'golden jack': 'Golden Trevally',

  // John Dory
  "st peter's fish": 'John Dory',
  'st peters fish': 'John Dory',

  // Goldspotted Rockcod
  'goldspotted cod': 'Goldspotted Rockcod',

  // Blackspotted Rockcod
  'blackspot rockcod': 'Blackspotted Rockcod',
  'black-spot rockcod': 'Blackspotted Rockcod',
  'black spotted rockcod': 'Blackspotted Rockcod',

  // Flathead
  'dusky flathead': 'Flathead',
  'tiger flathead': 'Flathead',
  'sand flathead': 'Flathead',

  // Bonito
  'australian bonito': 'Bonito',
  "watson's leaping bonito": 'Bonito',

  // School Mackerel
  'queensland mackerel': 'School Mackerel',
  'schoolie mackerel': 'School Mackerel',

  // Grass Emperor
  'black snapper': 'Grass Emperor',

  // Bight Redfish
  'nannygai': 'Bight Redfish',

  // Redthroat Emperor
  'redthroat': 'Redthroat Emperor',

  // Tarwhine
  'yellow-finned bream': 'Tarwhine',
  'yellowfinned bream': 'Tarwhine',
}

/** Resolve an AI-returned species name to the canonical key used in REGULATIONS.
 *  Handles parentheticals, case differences, and common alternate/colloquial names.
 */
export function normalizeSpeciesName(species: string): string {
  // 1. Exact match
  if (REGULATIONS[species]) return species

  // 2. Alias map lookup (case-insensitive)
  const alias = SPECIES_ALIASES[species.toLowerCase()]
  if (alias) return alias

  // 3. Strip parenthetical from AI name and try exact match
  const stripped = species.replace(/\s*\(.*\)\s*$/, '').trim()
  if (stripped !== species && REGULATIONS[stripped]) return stripped

  // 4. Compare base names (strip parentheticals from both sides)
  const base = (stripped || species).toLowerCase()
  for (const canonical of Object.keys(REGULATIONS)) {
    const canonicalBase = canonical.replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase()
    if (canonicalBase === base) return canonical
  }

  // 5. Case-insensitive full match
  const lc = species.toLowerCase()
  for (const canonical of Object.keys(REGULATIONS)) {
    if (canonical.toLowerCase() === lc) return canonical
  }

  return species
}

export function getRegulations(species: string, lat: number, lng: number): SpeciesRegulation | null {
  const canonical = normalizeSpeciesName(species)
  const bioregion = getBioregion(lat, lng)
  return REGULATIONS[canonical]?.[bioregion] ?? null
}
