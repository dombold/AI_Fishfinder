export type FishingType = 'beach' | 'boat'
export type TargetType = 'pelagic' | 'demersal' | 'both'

export const SOUNDER_BRANDS = ['GARMIN', 'SIMRAD', 'LOWRANCE', 'HUMMINBIRD', 'RAYMARINE'] as const
export type SounderType = typeof SOUNDER_BRANDS[number]

const SPECIES_LIST: Record<FishingType, Record<'pelagic' | 'demersal', string[]>> = {
  boat: {
    pelagic: [
      'Spanish Mackerel', 'Wahoo', 'Mahi-Mahi', 'Yellowfin Tuna', 'Bigeye Tuna',
      'Striped Marlin', 'Blue Marlin', 'Sailfish', 'Queenfish', 'Giant Trevally', 'Yellowtail Kingfish',
    ],
    demersal: [
      'Dhufish', 'Pink Snapper', 'Baldchin Groper', 'Redthroat Emperor', 'Spangled Emperor',
      'Coral Trout', 'Samson Fish', 'Amberjack', 'Tuskfish', 'Black Snapper (Grass Emperor)',
    ],
  },
  beach: {
    pelagic: ['Tailor', 'Australian Salmon (Western Australian Salmon)', 'Yellowfin Whiting', 'Trevally', 'Queenfish', 'Herring'],
    demersal: ['Bream', 'Whiting', 'Flathead', 'Mulloway', 'Flounder'],
  },
}

export function getAvailableSpecies(fishingType: FishingType, targetType: TargetType): string[] {
  const byType = SPECIES_LIST[fishingType]
  if (targetType === 'both') return [...byType.pelagic, ...byType.demersal]
  return byType[targetType] ?? []
}

// Detailed knowledge per species for Claude prompt
export interface SpeciesKnowledge {
  feedingBehaviour: string
  preferredConditions: string
  depth: string
  techniques: string
  sounderSignatures: string
}

export const SPECIES_KNOWLEDGE: Record<string, SpeciesKnowledge> = {
  'Spanish Mackerel': {
    feedingBehaviour: 'Aggressive surface and mid-water predator. Most active at dawn and dusk, peaks at tide changes. Responds to fast-moving lures and baitfish schools.',
    preferredConditions: 'SST 22–28°C, light to moderate chop (0.5–1.5m swell), incoming tide. Active year-round in tropical WA, seasonal in southern waters.',
    depth: '5–40m, often surface to 20m when actively feeding',
    techniques: 'High-speed trolling 8–12 kts with skirted lures; casting poppers and stickbaits over bait schools; live bait rigged under a float',
    sounderSignatures: 'Baitfish arches at 10–25m; temperature breaks on SST overlay; current edges; birds diving indicate surface school',
  },
  'Wahoo': {
    feedingBehaviour: 'Fast pelagic predator, often solitary or in small groups. Strikes quickly and disappears. Most active around floating debris, FADs, and current lines.',
    preferredConditions: 'SST 24–29°C, blue offshore water, moderate swell. Leeuwin Current edges in WA.',
    depth: 'Surface to 40m, follows baitfish',
    techniques: 'High-speed trolling 12–15 kts; heavy lures and konaheads; wire trace essential',
    sounderSignatures: 'Deep bait schools; colour-change lines on SST chart; floating debris nearby',
  },
  'Mahi-Mahi': {
    feedingBehaviour: 'Highly active surface predator. Associates strongly with floating objects, weed lines, FADs. Travels in schools when small, solitary when large.',
    preferredConditions: 'SST 22–28°C, blue water, weed lines, Leeuwin Current. Best in summer/autumn off WA.',
    depth: 'Surface to 20m',
    techniques: 'Trolling skirted lures near weed lines; fly fishing; spinning; live bait',
    sounderSignatures: 'Look for weed lines and floating debris on chart plotter; bait schools near surface',
  },
  'Yellowfin Tuna': {
    feedingBehaviour: 'Schooling pelagic, feeds aggressively on baitfish. Responds to chum and berley. Best on moon phase changes and tide turns.',
    preferredConditions: 'SST 20–28°C, blue offshore water, current edges, temperature breaks',
    depth: 'Surface to 100m; often feeds in top 50m',
    techniques: 'Trolling; popper fishing over breaking schools; jigging; live bait; cube fishing with berley trail',
    sounderSignatures: 'Arching bait schools 20–60m; porpoising tuna visible; birds working',
  },
  'Bigeye Tuna': {
    feedingBehaviour: 'Deep-water schooling tuna, feeds day and night. Deeper than yellowfin in daylight hours.',
    preferredConditions: 'SST 18–26°C, deep blue water, canyon edges, seamounts',
    depth: '50–300m; shallower at night',
    techniques: 'Deep jigging; deep trolling; live bait at depth',
    sounderSignatures: 'Deep arches 50–150m on sounder; canyon edges on chart',
  },
  'Striped Marlin': {
    feedingBehaviour: 'Highly mobile billfish, follows bait migrations. Peaks near full and new moon. Active at dawn and dusk.',
    preferredConditions: 'SST 20–25°C, temperature breaks, current edges, blue water. WA season peaks Feb–May.',
    depth: 'Surface to 100m; trolled in top 30m',
    techniques: 'Shotgun trolling spread with skirted lures and naturals; rigged bait; pitch baiting',
    sounderSignatures: 'Large bait schools 20–50m; SST breaks; chlorophyll fronts on satellite chart',
  },
  'Blue Marlin': {
    feedingBehaviour: 'Largest billfish, aggressive feeder. Follows warm current edges. Less abundant than striped in WA.',
    preferredConditions: 'SST 24–30°C, warm blue water, oceanic habitat. Exmouth Gulf and Abrolhos area.',
    depth: 'Surface to 200m; actively trolled in top 50m',
    techniques: 'Heavy tackle trolling; large skirted lures; live bait',
    sounderSignatures: 'Deep warm blue water; strong SST features; canyon edges',
  },
  'Sailfish': {
    feedingBehaviour: 'Fast billfish, often uses dorsal fin to herd baitfish. Common off WA north coast.',
    preferredConditions: 'SST 24–30°C, warm northern WA waters. Exmouth to Broome. Summer peak.',
    depth: 'Surface to 50m',
    techniques: 'Light tackle trolling; live bait; pitch bait to finning fish',
    sounderSignatures: 'Bait schools surface to 20m; finning fish visible; warm blue water',
  },
  'Queenfish': {
    feedingBehaviour: 'Aggressive surface feeder, follows baitfish schools. Leaps acrobatically. Responds to poppers.',
    preferredConditions: 'SST 24–32°C, northern WA tropical waters. Tidal channels, creek mouths, open water.',
    depth: 'Surface to 10m',
    techniques: 'Casting surface poppers and stickbaits; trolling small lures; live bait',
    sounderSignatures: 'Surface bait activity; birds diving; shallow reef structure on chart',
  },
  'Giant Trevally': {
    feedingBehaviour: 'Apex reef predator. Hunts on current-washed points and outgoing tides. Dawn/dusk peak. Highly territorial.',
    preferredConditions: 'SST 22–30°C, reef edges, current channels, outgoing tide. Widespread WA.',
    depth: '2–50m; often in 5–15m',
    techniques: 'Casting large poppers and stickbaits; jigging deep reefs; live bait near structure',
    sounderSignatures: 'Reef structure and drop-offs on chart; bait schools on reef edge; current-swept points',
  },
  'Yellowtail Kingfish': {
    feedingBehaviour: 'Highly active schooling predator. Responds to jigs and live bait. Anchoring and berleying effective.',
    preferredConditions: 'SST 18–24°C, reef structure, shallow bombies, kelp beds in southern WA',
    depth: '10–80m; commonly 20–50m',
    techniques: 'Metal jigging; live bait; casting lures near structure; knife jigs',
    sounderSignatures: 'Arching schools 15–50m near reef; baitfish at mid-water; reef structure clearly shown on quality sounder',
  },
  'Dhufish': {
    feedingBehaviour: 'Iconic WA demersal. Feeds on the bottom, prefers rocky outcrops and ledges. Responds to fresh cut bait and slow-moving soft plastics. Active at tide changes.',
    preferredConditions: 'SST 16–24°C, rocky reef 20–100m, moderate tidal flow. West Coast and South Coast WA.',
    depth: '20–100m; typically 30–60m',
    techniques: 'Bottom fishing with cut fish/squid bait; slow jig with soft plastics; paternoster rigs. Release weight required for barotrauma.',
    sounderSignatures: 'Rocky bottom structure clearly visible on quality sounder (Simrad/Garmin recommended); fish arches tight to bottom; thermocline visible',
  },
  'Pink Snapper': {
    feedingBehaviour: 'Aggressive demersal-pelagic predator, spawns in aggregations. Feeds on current change. Most active at night but catchable all day.',
    preferredConditions: 'SST 16–24°C, reef and sandy bottom structure, moderate depth. Responds to berley.',
    depth: '15–80m; spawning aggregations often at 25–50m',
    techniques: 'Berley trail with whole fish; paternoster and running sinker rigs; soft plastics; jigs. Use release weight.',
    sounderSignatures: 'Dense schools visible mid-water above reef; reef ledges and pinnacles on chart; berley trail draws fish up',
  },
  'Baldchin Groper': {
    feedingBehaviour: 'Reef-associated demersal, hard-biting. Feeds on crustaceans and invertebrates. Active across tidal phases.',
    preferredConditions: 'SST 16–22°C, rocky reef habitat 20–60m. Mostly West Coast WA.',
    depth: '20–60m',
    techniques: 'Bottom bait fishing with prawn, crab or fish; soft plastics near reef. Use release weight.',
    sounderSignatures: 'Rocky pinnacles and ledge structure on high-frequency sounder; fish holding tight to reef',
  },
  'Redthroat Emperor': {
    feedingBehaviour: 'Sandy-bottom demersal, feeds on invertebrates and small fish. Active feeder, especially on incoming tide.',
    preferredConditions: 'SST 20–28°C, sandy bottom near reef, tropical and subtropical WA.',
    depth: '15–60m',
    techniques: 'Light tackle bottom fishing; soft plastics; small cut bait. Use release weight.',
    sounderSignatures: 'Sandy bottom adjacent to reef structure; fish arches low to bottom',
  },
  'Spangled Emperor': {
    feedingBehaviour: 'Reef and rubble-dwelling demersal. Feeds on crustaceans. Most active near tide changes.',
    preferredConditions: 'SST 22–30°C, tropical and Gascoyne WA. Reef and rubble substrate.',
    depth: '10–50m',
    techniques: 'Bait fishing with prawn or fish; slow jig. Use release weight.',
    sounderSignatures: 'Reef and rubble patches on chart; fish holding near bottom',
  },
  'Coral Trout': {
    feedingBehaviour: 'Ambush predator on coral reef. Feeds on small fish. Most active at dawn.',
    preferredConditions: 'SST 22–30°C, coral reef habitat. North Coast WA — Coral Bay, Ningaloo, Rowley Shoals (protected).',
    depth: '5–30m on healthy coral reef',
    techniques: 'Live bait; hard body lures; diving lures worked through gutters. NOTE: Totally protected at Rowley Shoals.',
    sounderSignatures: 'Shallow reef structure; coral bommies visible on chart at low speeds',
  },
  'Samson Fish': {
    feedingBehaviour: 'Powerful schooling predator, related to yellowtail kingfish. Responds to slow jigs and live bait.',
    preferredConditions: 'SST 16–24°C, reef structure 30–100m. Southern and West Coast WA.',
    depth: '30–120m',
    techniques: 'Metal jigging; live bait; trolling near structure',
    sounderSignatures: 'Deep reef structure 30–80m; arching schools near pinnacles',
  },
  'Amberjack': {
    feedingBehaviour: 'Deep-water schooling predator. Responds to jigs and live bait. Often found with yellowtail kingfish.',
    preferredConditions: 'SST 16–24°C, offshore reef and deep structure.',
    depth: '40–120m',
    techniques: 'Heavy jigging; deep live bait; large soft plastics',
    sounderSignatures: 'Deep reef pinnacles and walls; mid-water schools on sounder',
  },
  'Tuskfish': {
    feedingBehaviour: 'Hard-biting demersal, feeds on crustaceans. Reef-associated.',
    preferredConditions: 'SST 18–26°C, reef and rubble habitat. West and North Coast WA.',
    depth: '10–50m',
    techniques: 'Bait fishing with prawn, crab, squid; soft plastics',
    sounderSignatures: 'Reef and rubble substrate; fish tight to bottom on sounder',
  },
  'Black Snapper (Grass Emperor)': {
    feedingBehaviour: 'Active reef and sandy-bottom feeder, hunts crustaceans and small fish. Most active on tide changes and morning/evening periods.',
    preferredConditions: 'SST 20–28°C, reef edges, rubble, and sandy patches. Common across all WA bioregions; more abundant in northern waters.',
    depth: '10–60m on reef and rubble substrate',
    techniques: 'Bottom bait fishing with prawn, fish flesh or squid; soft plastics near reef edge. Use release weight.',
    sounderSignatures: 'Reef and rubble substrate transitions; fish arches holding tight to bottom',
  },
  'Tailor': {
    feedingBehaviour: 'Aggressive schooling predator, feeds on baitfish near surface. Best feeding on dusk and night tides. Responds to berley.',
    preferredConditions: 'SST 14–22°C, surf beaches, gutters and channels. WA south and west coast. Peak winter–spring.',
    depth: 'Surf zone to 10m',
    techniques: 'Casting metal slugs and lures into gutters; berley trail with pilchards; surf rigs with whole pilchard',
    sounderSignatures: 'Not typically used for beach tailor; look for gutters, rips and current lines visually',
  },
  'Australian Salmon (Western Australian Salmon)': {
    feedingBehaviour: 'Hard-fighting schooling predator. Attacks baitfish and lures aggressively in surf gutters and rocky headlands. Best on active swell and strong tidal push.',
    preferredConditions: 'SST 12–20°C, surf beaches, rocky headlands and bays. South-west WA peak season autumn–winter (May–August). Follows bait migrations.',
    depth: 'Surf zone to 10m; commonly in gutters and wash zones',
    techniques: 'Casting metal slugs and hard-body lures into gutters; bait fishing with pilchards; rock fishing',
    sounderSignatures: 'Visual identification of gutters, rips and current lines from shore; not typically sounder-targeted',
  },
  'Yellowfin Whiting': {
    feedingBehaviour: 'Bottom feeder on sandy flats, feeds on worms and crustaceans. Active on warm incoming tides over shallow sand.',
    preferredConditions: 'SST 16–24°C, shallow sandy beaches and estuaries. Estuary and beach environments.',
    depth: '0.5–4m on sandy substrate',
    techniques: 'Running sinker rig with small hook and worm/prawn; ultra-light gear',
    sounderSignatures: 'Sandy flats clearly visible in shallow water; incoming tide over warm sand',
  },
  'Trevally': {
    feedingBehaviour: 'Schooling predator, feeds on baitfish in currents and gutters. Active on tidal changes.',
    preferredConditions: 'SST 16–26°C, rocky shores, beaches, estuaries. Widespread WA.',
    depth: '0–20m in surf zone or estuaries',
    techniques: 'Casting lures and soft plastics; bait fishing with pilchards',
    sounderSignatures: 'Visual reading of gutters and current channels from shore',
  },
  'Herring': {
    feedingBehaviour: 'Small schooling fish, feeds on plankton and small crustaceans. Best on shallow reefs and beaches.',
    preferredConditions: 'SST 14–22°C, shallow reefs and beaches. Perth metro beaches. Year-round.',
    depth: '1–5m',
    techniques: 'Small hooks with dough bait or worm under a float; light berley',
    sounderSignatures: 'Visual observation; shallow beach and reef environments',
  },
  'Bream': {
    feedingBehaviour: 'Versatile demersal, feeds on worms, crustaceans and small fish. Active on incoming night tide in estuaries.',
    preferredConditions: 'SST 14–24°C, estuaries, rivers, nearshore reefs. Widespread WA.',
    depth: '0–15m in estuaries and nearshore',
    techniques: 'Soft plastics; bait on light tackle; lures near structure at night',
    sounderSignatures: 'Structure and drop-offs in estuaries; rock bars and weed beds visible on sounder in clearer water',
  },
  'Whiting': {
    feedingBehaviour: 'Sandy-bottom feeder. Feeds on worms and small crustaceans on warm tidal flats.',
    preferredConditions: 'SST 14–24°C, shallow sandy beaches and bays. Perth and south coast.',
    depth: '0.5–6m on clean sand',
    techniques: 'Running sinker or paternoster with small hooks and worm or prawn',
    sounderSignatures: 'Clean sandy flats; warm water over sand visible with temperature overlay',
  },
  'Flathead': {
    feedingBehaviour: 'Ambush predator lying on sandy bottom. Most active at night and low light. Feeds on incoming tide in estuaries.',
    preferredConditions: 'SST 12–22°C, sandy and muddy estuaries, nearshore beaches.',
    depth: '0.5–10m in sandy areas',
    techniques: 'Soft plastics worked slowly along bottom; bait rigs with fish or prawn',
    sounderSignatures: 'Sandy bottom transitions near structure; estuary drop-offs',
  },
  'Mulloway': {
    feedingBehaviour: 'Nocturnal predator, highly active on first two hours of the run-out tide. Responds to berley in rivers.',
    preferredConditions: 'SST 14–22°C, river mouths, estuaries, nearshore reefs. South and west coast WA.',
    depth: '1–20m; river mouths and surf gutters',
    techniques: 'Live bait (herring/mullet); large soft plastics; bait at night on outgoing tide',
    sounderSignatures: 'Deep river holes and channel edges; bait schools in estuaries at dusk',
  },
  'Flounder': {
    feedingBehaviour: 'Flat ambush predator buried in sand. Most active at night. Feeds on incoming tide.',
    preferredConditions: 'SST 12–20°C, shallow sandy bays and estuaries. Southern WA.',
    depth: '0.5–5m on sandy substrate',
    techniques: 'Bait on running sinker along sandy bottom; slow-retrieve soft plastics',
    sounderSignatures: 'Flat sandy bottom transitions; shallow bay areas at night',
  },
}
