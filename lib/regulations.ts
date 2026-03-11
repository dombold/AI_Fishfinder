// WA fishing regulations — sourced from DPIRD Recreational Fishing Guide 2026
// and rules.fish.wa.gov.au
// IMPORTANT: Regulations change — always verify at fish.wa.gov.au before fishing

export type Bioregion = 'north' | 'west' | 'south'

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

/** Determine WA bioregion from latitude */
export function getBioregion(lat: number): Bioregion {
  if (lat > -26) return 'north'
  if (lat < -34) return 'south'
  return 'west'
}

const DEMERSAL_SPECIES = new Set([
  'Dhufish', 'Pink Snapper', 'Baldchin Groper', 'Redthroat Emperor',
  'Spangled Emperor', 'Coral Trout', 'Tuskfish', 'Black Snapper (Grass Emperor)',
])

// Approximate bounding box for Cockburn Sound + Warnbro Sound
const COCKBURN_WARNBRO_BOUNDS = { minLat: -32.45, maxLat: -32.05, minLng: 115.62, maxLng: 115.82 }

/** Check for active fishery closures based on location, fishing setup, and selected species */
export function checkFishingClosures(
  lat: number,
  lng: number,
  fishingType: string,
  targetType: string,
  selectedSpecies: string[] = [],
): ClosureWarning[] {
  const warnings: ClosureWarning[] = []
  const bioregion = getBioregion(lat)

  // West Coast Boat Demersal Closure: Dec 16 2025 – Spring 2027
  // Only warn if targetType includes demersal AND at least one demersal species is selected
  const targetsDemersals =
    (targetType === 'demersal' || targetType === 'both') &&
    selectedSpecies.some(s => DEMERSAL_SPECIES.has(s))
  if (bioregion === 'west' && fishingType === 'boat' && targetsDemersals) {
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

  if (bioregion === 'west' && (targetType === 'demersal' || targetType === 'both') && selectedSpecies.includes('Pink Snapper') && inCockburnWarnbro) {
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

  return warnings
}

type BioregionRules = {
  north: SpeciesRegulation
  west: SpeciesRegulation
  south: SpeciesRegulation
}

// Full regulations map — keyed by species name
export const REGULATIONS: Record<string, BioregionRules> = {
  'Spanish Mackerel': {
    north: { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Wire trace prohibited near Esperance Jetty' },
    west:  { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Wire trace banned Perth metro, Busselton and Esperance jetties' },
    south: { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag', notes: 'Wire trace prohibited near Esperance Jetty' },
  },
  'Wahoo': {
    north: { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    west:  { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    south: { minSize: '900mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Mahi-Mahi': {
    north: { minSize: '500mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    west:  { minSize: '500mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    south: { minSize: '500mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Yellowfin Tuna': {
    north: { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    west:  { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    south: { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Bigeye Tuna': {
    north: { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    west:  { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    south: { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Striped Marlin': {
    north: { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    west:  { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    south: { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Blue Marlin': {
    north: { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    west:  { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    south: { bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Sailfish': {
    north: { bagLimit: '1 fish', combinedLimit: 'Counts within 3 fish large pelagic mixed bag', notes: 'Catch-and-release strongly recommended' },
    west:  { bagLimit: '1 fish', combinedLimit: 'Counts within 3 fish large pelagic mixed bag', notes: 'Catch-and-release strongly recommended' },
    south: { bagLimit: '1 fish', combinedLimit: 'Counts within 3 fish large pelagic mixed bag', notes: 'Catch-and-release strongly recommended' },
  },
  'Queenfish': {
    north: { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    west:  { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    south: { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Giant Trevally': {
    north: { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    west:  { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    south: { bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Yellowtail Kingfish': {
    north: { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    west:  { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    south: { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Samson Fish': {
    north: { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    west:  { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    south: { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Amberjack': {
    north: { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    west:  { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
    south: { minSize: '600mm total length', bagLimit: '3 fish', combinedLimit: '3 fish large pelagic mixed bag' },
  },
  'Dhufish': {
    north: { bagLimit: '2 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Abrolhos Islands: 1 fish daily limit. Release weight required for barotrauma.' },
    west:  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based fishing permitted.', notes: 'No spearfishing for dhufish. Release weight required.' },
    south: { bagLimit: '2 fish', combinedLimit: '4 fish demersal scalefish mixed bag', notes: 'Release weight required for barotrauma.' },
  },
  'Pink Snapper': {
    north: { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal mixed bag', notes: 'Shark Bay seasonal closures apply. Check DPIRD for specific area rules.' },
    west:  { minSize: '500mm total length (south of 31°S) / 410mm (north of 31°S)', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.', seasonalClosures: 'Cockburn Sound & Warnbro Sound closed Aug 1 – Jan 31 for pink snapper (all methods)', notes: 'Release weight required.' },
    south: { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag', notes: 'Release weight required.' },
  },
  'Baldchin Groper': {
    north: { bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag', seasonalClosures: 'Abrolhos Islands: closed Oct 1 – Dec 31 (spawning)', notes: 'Abrolhos Islands: 1 fish limit.' },
    west:  { bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.', notes: 'Release weight required.' },
    south: { bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag', notes: 'Release weight required.' },
  },
  'Redthroat Emperor': {
    north: { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag' },
    west:  { minSize: '410mm total length', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.' },
    south: { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag' },
  },
  'Spangled Emperor': {
    north: { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '5 fish demersal mixed bag' },
    west:  { minSize: '410mm total length', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.' },
    south: { minSize: '410mm total length', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag' },
  },
  'Coral Trout': {
    north: { minSize: '450mm total length', bagLimit: '1 fish', notes: 'Totally protected in Rowley Shoals Marine Park — no take.' },
    west:  { minSize: '450mm total length', bagLimit: '1 fish (land-based only)', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.' },
    south: { minSize: '450mm total length', bagLimit: '1 fish' },
  },
  'Tuskfish': {
    north: { minSize: 'None (blackspot/blue tuskfish: 400mm)', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag' },
    west:  { minSize: 'None (blackspot/blue tuskfish: 400mm)', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027.' },
    south: { minSize: 'None (blackspot/blue tuskfish: 400mm)', bagLimit: '3 fish', combinedLimit: '4 fish demersal mixed bag' },
  },
  'Black Snapper (Grass Emperor)': {
    north: { minSize: '320mm total length', bagLimit: '5 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
    west:  { minSize: '320mm total length', bagLimit: '2 fish (land-based only)', combinedLimit: '4 fish demersal mixed bag', closureActive: true, closureReason: 'BOAT FISHING CLOSED — West Coast Bioregion boat demersal closure until approx Sept 2027. Land-based permitted.' },
    south: { minSize: '320mm total length', bagLimit: '5 fish', combinedLimit: '5 fish demersal scalefish mixed bag' },
  },
  'Tailor': {
    north: { minSize: '300mm total length', bagLimit: '8 fish (max 2 over 500mm)', notes: 'Wire trace prohibited near Esperance Jetty' },
    west:  { minSize: '300mm total length', bagLimit: '8 fish (max 2 over 500mm)', notes: 'Wire trace prohibited near Perth metro, Busselton and Esperance jetties' },
    south: { minSize: '300mm total length', bagLimit: '8 fish (max 2 over 500mm)', notes: 'Wire trace prohibited near Esperance Jetty' },
  },
  'Australian Salmon (Western Australian Salmon)': {
    north: { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    west:  { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    south: { minSize: '300mm total length', bagLimit: '4 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Yellowfin Whiting': {
    north: { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    west:  { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    south: { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
  },
  'Trevally': {
    north: { minSize: 'None (silver trevally: 250mm)', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    west:  { minSize: 'None (silver trevally: 250mm)', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    south: { minSize: 'None (silver trevally: 250mm)', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Herring': {
    north: { bagLimit: '20 fish per 24 hours' },
    west:  { bagLimit: '20 fish per 24 hours' },
    south: { bagLimit: '20 fish per 24 hours' },
  },
  'Bream': {
    north: { minSize: '250mm (yellowfin bream: 300mm)', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    west:  { minSize: '250mm (yellowfin bream: 300mm)', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag', notes: 'Max 2 black bream over 400mm in Swan and Canning rivers' },
    south: { minSize: '250mm (yellowfin bream: 300mm)', bagLimit: '6 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Whiting': {
    north: { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    west:  { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
    south: { bagLimit: '30 fish', combinedLimit: '30 fish whiting mixed bag' },
  },
  'Flathead': {
    north: { minSize: '300mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    west:  { minSize: '300mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    south: { minSize: '300mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Mulloway': {
    north: { minSize: '500mm total length', bagLimit: '2 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    west:  { minSize: '500mm total length', bagLimit: '2 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    south: { minSize: '500mm total length', bagLimit: '2 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
  'Flounder': {
    north: { minSize: '250mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    west:  { minSize: '250mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
    south: { minSize: '250mm total length', bagLimit: '8 fish', combinedLimit: '16 fish nearshore/estuarine mixed bag' },
  },
}

export function getRegulations(species: string, lat: number): SpeciesRegulation | null {
  const bioregion = getBioregion(lat)
  return REGULATIONS[species]?.[bioregion] ?? null
}
