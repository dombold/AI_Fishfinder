export type FishingType = 'beach' | 'boat'
export type TargetType = 'pelagic' | 'demersal' | 'both'

export const SOUNDER_BRANDS = ['NONE', 'GARMIN', 'SIMRAD', 'LOWRANCE', 'HUMMINBIRD', 'RAYMARINE', 'FURUNO', 'B&G'] as const
export type SounderType = typeof SOUNDER_BRANDS[number]

const SPECIES_LIST: Record<FishingType, Record<'pelagic' | 'demersal', string[]>> = {
  boat: {
    pelagic: [
      'Spanish Mackerel', 'Spotted Mackerel', 'Grey Mackerel', 'School Mackerel', 'Shark Mackerel',
      'Wahoo', 'Mahi-Mahi',
      'Yellowfin Tuna', 'Bigeye Tuna', 'Longtail Tuna', 'Albacore Tuna', 'Southern Bluefin Tuna',
      'Skipjack Tuna', 'Dogtooth Tuna',
      'Striped Marlin', 'Blue Marlin', 'Sailfish',
      'Queenfish', 'Giant Trevally', 'Yellowtail Kingfish', 'Samson Fish',
      'Squid',
    ],
    demersal: [
      'Dhufish', 'Pink Snapper', 'Baldchin Groper', 'Breaksea Cod',
      'Redthroat Emperor', 'Spangled Emperor', 'Red Emperor',
      'Coral Trout', 'Amberjack', 'Tuskfish',
      'Black Snapper (Grass Emperor)', 'Bight Redfish (Nannygai)',
      'Barramundi', 'Black Jewfish', 'King Threadfin (Giant Threadfin)',
    ],
  },
  beach: {
    pelagic: [
      'Tailor', 'Australian Salmon (Western Australian Salmon)',
      'Yellowfin Whiting', 'Trevally', 'Giant Trevally', 'Queenfish',
      'Australian Herring', 'Garfish (Southern Garfish)', 'Squid',
    ],
    demersal: [
      'Bream', 'Silver Bream', 'King George Whiting', 'Whiting',
      'Flathead', 'Mulloway', 'Black Jewfish', 'Flounder',
      'Barramundi', 'Mangrove Jack',
    ],
  },
}

export function getAvailableSpecies(
  fishingType: FishingType,
  targetType: TargetType,
  lat?: number
): string[] {
  const byType = SPECIES_LIST[fishingType]
  const full = targetType === 'both'
    ? [...byType.pelagic, ...byType.demersal]
    : byType[targetType] ?? []

  if (lat == null) return full

  return full.filter(name => {
    const k = SPECIES_KNOWLEDGE[name]
    if (!k) return true
    return lat >= k.latRange[0] && lat <= k.latRange[1]
  })
}

// Detailed knowledge per species for Claude prompt
export interface SpeciesKnowledge {
  feedingBehaviour: string
  preferredConditions: string
  depth: string
  techniques: string
  sounderSignatures: string
  // Geographic range within WA: [southernmost lat, northernmost lat]
  // All negative (southern hemisphere). e.g. [-35, -13] = all WA; [-24, -13] = tropical north only
  latRange: [number, number]
}

export const SPECIES_KNOWLEDGE: Record<string, SpeciesKnowledge> = {
  'Spanish Mackerel': {
    feedingBehaviour: 'Aggressive surface and mid-water predator. Most active at dawn and dusk, peaks at tide changes. Responds to fast-moving lures and baitfish schools.',
    preferredConditions: 'SST 22–28°C, light to moderate chop (0.5–1.5m swell), incoming tide. Active year-round in tropical WA, seasonal in southern waters.',
    depth: '5–40m, often surface to 20m when actively feeding',
    techniques: 'High-speed trolling 8–12 kts with skirted lures; casting poppers and stickbaits over bait schools; live bait rigged under a float',
    sounderSignatures: 'Baitfish arches at 10–25m; temperature breaks on SST overlay; current edges; birds diving indicate surface school',
    latRange: [-33, -13],
  },
  'Spotted Mackerel': {
    feedingBehaviour: 'Schooling surface predator, smaller than Spanish Mackerel. Feeds aggressively on baitfish, especially whitebait and anchovies. Most active at dawn and around tide changes.',
    preferredConditions: 'SST 20–27°C, inshore and nearshore coastal waters. Common along the WA north and mid-west coast. Year-round in tropical north, summer–autumn further south.',
    depth: 'Surface to 25m; often in top 10m when feeding',
    techniques: 'Trolling small lures and baitfish at 6–9 kts; casting metal slugs and small stickbaits; jigging through feeding schools',
    sounderSignatures: 'Dense baitfish balls near surface 5–15m; birds working; colour lines on SST chart',
    latRange: [-30, -13],
  },
  'Grey Mackerel': {
    feedingBehaviour: 'Schooling pelagic, often found in large aggregations in coastal and offshore waters. Feeds on small fish and squid. Responds quickly to lures passed through the school.',
    preferredConditions: 'SST 22–30°C, tropical to subtropical WA. Common from Gascoyne to Kimberley. Tidal channels and reef edges.',
    depth: 'Surface to 30m',
    techniques: 'Trolling small-medium lures; casting metal slugs; light jigging through schools',
    sounderSignatures: 'School arches mid-water 5–20m; bait balls near surface; reef edges and channel drop-offs',
    latRange: [-26, -13],
  },
  'School Mackerel': {
    feedingBehaviour: 'Schooling pelagic, forms large tight schools in coastal waters. Aggressive feeder on small baitfish. Active across all tidal phases.',
    preferredConditions: 'SST 22–29°C, coastal and inshore WA. Often found over reefs and sandy patches in northern and mid-west WA.',
    depth: 'Surface to 20m',
    techniques: 'Casting metal slugs and lures into schools; light trolling; jigging',
    sounderSignatures: 'Dense mid-water schools clearly visible; reef and rubble substrate nearby',
    latRange: [-26, -13],
  },
  'Shark Mackerel': {
    feedingBehaviour: 'Solitary or small group pelagic predator, similar in appearance to Spanish Mackerel. Feeds on large baitfish and smaller fish. Less common than other mackerel species.',
    preferredConditions: 'SST 22–30°C, northern WA offshore and nearshore waters. Exmouth to Broome region.',
    depth: '10–50m',
    techniques: 'Trolling medium-large lures; live bait; wire trace essential',
    sounderSignatures: 'SST breaks and colour-change lines; deep bait schools; offshore reef structure',
    latRange: [-24, -13],
  },
  'Wahoo': {
    feedingBehaviour: 'Fast pelagic predator, often solitary or in small groups. Strikes quickly and disappears. Most active around floating debris, FADs, and current lines.',
    preferredConditions: 'SST 24–29°C, blue offshore water, moderate swell. Leeuwin Current edges in WA.',
    depth: 'Surface to 40m, follows baitfish',
    techniques: 'High-speed trolling 12–15 kts; heavy lures and konaheads; wire trace essential',
    sounderSignatures: 'Deep bait schools; colour-change lines on SST chart; floating debris nearby',
    latRange: [-30, -13],
  },
  'Mahi-Mahi': {
    feedingBehaviour: 'Highly active surface predator. Associates strongly with floating objects, weed lines, FADs. Travels in schools when small, solitary when large.',
    preferredConditions: 'SST 22–28°C, blue water, weed lines, Leeuwin Current. Best in summer/autumn off WA.',
    depth: 'Surface to 20m',
    techniques: 'Trolling skirted lures near weed lines; fly fishing; spinning; live bait',
    sounderSignatures: 'Look for weed lines and floating debris on chart plotter; bait schools near surface',
    latRange: [-35, -13],
  },
  'Yellowfin Tuna': {
    feedingBehaviour: 'Schooling pelagic, feeds aggressively on baitfish. Responds to chum and berley. Best on moon phase changes and tide turns.',
    preferredConditions: 'SST 20–28°C, blue offshore water, current edges, temperature breaks',
    depth: 'Surface to 100m; often feeds in top 50m',
    techniques: 'Trolling; popper fishing over breaking schools; jigging; live bait; cube fishing with berley trail',
    sounderSignatures: 'Arching bait schools 20–60m; porpoising tuna visible; birds working',
    latRange: [-35, -13],
  },
  'Bigeye Tuna': {
    feedingBehaviour: 'Deep-water schooling tuna, feeds day and night. Deeper than yellowfin in daylight hours.',
    preferredConditions: 'SST 18–26°C, deep blue water, canyon edges, seamounts',
    depth: '50–300m; shallower at night',
    techniques: 'Deep jigging; deep trolling; live bait at depth',
    sounderSignatures: 'Deep arches 50–150m on sounder; canyon edges on chart',
    latRange: [-35, -13],
  },
  'Longtail Tuna': {
    feedingBehaviour: 'Fast-moving schooling tuna (also called Northern Bluefin Tuna). Feeds aggressively on surface baitfish. Frequently busts up on surface schools. Highly responsive to lures and poppers.',
    preferredConditions: 'SST 20–28°C, nearshore to offshore WA. Excellent in summer and autumn. Common along the entire WA coast near bait schools.',
    depth: 'Surface to 40m; most feeding in top 20m',
    techniques: 'Casting poppers and stickbaits into busting schools; metal jigs; trolling small skirted lures',
    sounderSignatures: 'Busting surface schools visible; bait arches 10–30m; birds working over water',
    latRange: [-30, -13],
  },
  'Albacore Tuna': {
    feedingBehaviour: 'Deep-ranging schooling tuna. Responds to trolled lures and feathers. Less surface-active than yellowfin but feeds aggressively when located.',
    preferredConditions: 'SST 15–22°C, offshore southern and south-west WA. Found along the continental shelf edge.',
    depth: '30–150m; deeper during the day',
    techniques: 'Trolling feather lures and skirted lures; deep jigging; live bait at depth',
    sounderSignatures: 'Deep arching schools 40–100m; temperature breaks on SST; continental shelf edge',
    latRange: [-35, -28],
  },
  'Southern Bluefin Tuna': {
    feedingBehaviour: 'Large powerful schooling tuna. Aggressive feeder on baitfish, squid and crustaceans. Travels in large schools particularly in southern WA waters.',
    preferredConditions: 'SST 12–20°C, southern WA offshore. Albany and Esperance region. Winter–spring season peak.',
    depth: '20–200m; feeding schools often 20–60m',
    techniques: 'Trolling large lures; heavy jigging; cube fishing with berley; live bait',
    sounderSignatures: 'Large dense schools on sounder 20–100m; temperature breaks; offshore continental shelf',
    latRange: [-35, -30],
  },
  'Skipjack Tuna': {
    feedingBehaviour: 'Fast-swimming schooling tuna, highly aggressive surface feeder. Often mixed with other tuna species. Responds to almost any moving lure or bait. Frequently used as live bait for larger pelagics.',
    preferredConditions: 'SST 20–30°C, widespread WA coastal and offshore waters. Year-round in north, summer in south.',
    depth: 'Surface to 30m; actively feeds in top 20m',
    techniques: 'Casting metal jigs into schools; trolling small lures; catching as live bait for larger species',
    sounderSignatures: 'Dense surface busting schools; baitfish arches 5–20m; birds diving',
    latRange: [-30, -13],
  },
  'Dogtooth Tuna': {
    feedingBehaviour: 'Powerful solitary reef-associated tuna. Hunts large baitfish around reef structure and drop-offs. Extremely fast and strong — one of the most powerful reef pelagics in WA.',
    preferredConditions: 'SST 24–30°C, northern WA tropical offshore reefs. Exmouth to Broome, Rowley Shoals, Scott Reef.',
    depth: '10–80m around reef structure',
    techniques: 'Heavy popping and jigging over deep tropical reefs; large metal jigs; large poppers',
    sounderSignatures: 'Deep tropical reef pinnacles and walls; bait schools over reef; ledge drop-offs',
    latRange: [-22, -13],
  },
  'Striped Marlin': {
    feedingBehaviour: 'Highly mobile billfish, follows bait migrations. Peaks near full and new moon. Active at dawn and dusk.',
    preferredConditions: 'SST 20–25°C, temperature breaks, current edges, blue water. WA season peaks Feb–May.',
    depth: 'Surface to 100m; trolled in top 30m',
    techniques: 'Shotgun trolling spread with skirted lures and naturals; rigged bait; pitch baiting',
    sounderSignatures: 'Large bait schools 20–50m; SST breaks; chlorophyll fronts on satellite chart',
    latRange: [-35, -13],
  },
  'Blue Marlin': {
    feedingBehaviour: 'Largest billfish, aggressive feeder. Follows warm current edges. Less abundant than striped in WA.',
    preferredConditions: 'SST 24–30°C, warm blue water, oceanic habitat. Exmouth Gulf and Abrolhos area.',
    depth: 'Surface to 200m; actively trolled in top 50m',
    techniques: 'Heavy tackle trolling; large skirted lures; live bait',
    sounderSignatures: 'Deep warm blue water; strong SST features; canyon edges',
    latRange: [-28, -13],
  },
  'Sailfish': {
    feedingBehaviour: 'Fast billfish, often uses dorsal fin to herd baitfish. Common off WA north coast.',
    preferredConditions: 'SST 24–30°C, warm northern WA waters. Exmouth to Broome. Summer peak.',
    depth: 'Surface to 50m',
    techniques: 'Light tackle trolling; live bait; pitch bait to finning fish',
    sounderSignatures: 'Bait schools surface to 20m; finning fish visible; warm blue water',
    latRange: [-24, -13],
  },
  'Queenfish': {
    feedingBehaviour: 'Aggressive surface feeder, follows baitfish schools. Leaps acrobatically. Responds to poppers.',
    preferredConditions: 'SST 24–32°C, northern WA tropical waters. Tidal channels, creek mouths, open water.',
    depth: 'Surface to 10m',
    techniques: 'Casting surface poppers and stickbaits; trolling small lures; live bait',
    sounderSignatures: 'Surface bait activity; birds diving; shallow reef structure on chart',
    latRange: [-26, -13],
  },
  'Giant Trevally': {
    feedingBehaviour: 'Apex reef predator. Hunts on current-washed points and outgoing tides. Dawn/dusk peak. Highly territorial.',
    preferredConditions: 'SST 22–30°C, reef edges, current channels, outgoing tide. Widespread WA.',
    depth: '2–50m; often in 5–15m',
    techniques: 'Casting large poppers and stickbaits; jigging deep reefs; live bait near structure',
    sounderSignatures: 'Reef structure and drop-offs on chart; bait schools on reef edge; current-swept points',
    latRange: [-30, -13],
  },
  'Yellowtail Kingfish': {
    feedingBehaviour: 'Highly active schooling predator. Responds to jigs and live bait. Anchoring and berleying effective.',
    preferredConditions: 'SST 18–24°C, reef structure, shallow bombies, kelp beds in southern WA',
    depth: '10–80m; commonly 20–50m',
    techniques: 'Metal jigging; live bait; casting lures near structure; knife jigs',
    sounderSignatures: 'Arching schools 15–50m near reef; baitfish at mid-water; reef structure clearly shown on quality sounder',
    latRange: [-35, -26],
  },
  'Samson Fish': {
    feedingBehaviour: 'Powerful schooling predator, related to yellowtail kingfish. Responds to slow jigs and live bait.',
    preferredConditions: 'SST 16–24°C, reef structure 30–100m. Southern and West Coast WA.',
    depth: '30–120m',
    techniques: 'Metal jigging; live bait; trolling near structure',
    sounderSignatures: 'Deep reef structure 30–80m; arching schools near pinnacles',
    latRange: [-35, -26],
  },
  'Squid': {
    feedingBehaviour: 'Nocturnal and crepuscular hunter. Ambushes small fish and crustaceans near reef and weed. Most active on dark nights with strong moon phases. Responds to EGI (egi) lures jigged rhythmically.',
    preferredConditions: 'SST 14–24°C, seagrass beds, reef edges, jetties and structures. Widespread WA coast. Best autumn–winter in southern WA.',
    depth: '1–20m; most productive 3–8m over seagrass and reef',
    techniques: 'Egi (squid jig) fishing with slow sink-and-jerk retrieve; light rod with fluorocarbon leader; fishing under lights at night from jetties',
    sounderSignatures: 'Seagrass and reef patches on chart; shallow structure near drop-offs; night fishing with lights attracts squid',
    latRange: [-35, -13],
  },
  'Dhufish': {
    feedingBehaviour: 'Iconic WA demersal. Feeds on the bottom, prefers rocky outcrops and ledges. Responds to fresh cut bait and slow-moving soft plastics. Active at tide changes.',
    preferredConditions: 'SST 16–24°C, rocky reef 20–100m, moderate tidal flow. West Coast and South Coast WA.',
    depth: '20–100m; typically 30–60m',
    techniques: 'Bottom fishing with cut fish/squid bait; slow jig with soft plastics; paternoster rigs. Release weight required for barotrauma.',
    sounderSignatures: 'Rocky bottom structure clearly visible on quality sounder (Simrad/Garmin recommended); fish arches tight to bottom; thermocline visible',
    latRange: [-35, -24],
  },
  'Pink Snapper': {
    feedingBehaviour: 'Aggressive demersal-pelagic predator, spawns in aggregations. Feeds on current change. Most active at night but catchable all day.',
    preferredConditions: 'SST 16–24°C, reef and sandy bottom structure, moderate depth. Responds to berley.',
    depth: '15–80m; spawning aggregations often at 25–50m',
    techniques: 'Berley trail with whole fish; paternoster and running sinker rigs; soft plastics; jigs. Use release weight.',
    sounderSignatures: 'Dense schools visible mid-water above reef; reef ledges and pinnacles on chart; berley trail draws fish up',
    latRange: [-35, -24],
  },
  'Baldchin Groper': {
    feedingBehaviour: 'Reef-associated demersal, hard-biting. Feeds on crustaceans and invertebrates. Active across tidal phases.',
    preferredConditions: 'SST 16–22°C, rocky reef habitat 20–60m. Mostly West Coast WA.',
    depth: '20–60m',
    techniques: 'Bottom bait fishing with prawn, crab or fish; soft plastics near reef. Use release weight.',
    sounderSignatures: 'Rocky pinnacles and ledge structure on high-frequency sounder; fish holding tight to reef',
    latRange: [-35, -24],
  },
  'Breaksea Cod': {
    feedingBehaviour: 'Territorial reef-dwelling demersal. Ambush predator that holds tight to rocky structure. Feeds on small fish, crustaceans and invertebrates. Active across tidal phases.',
    preferredConditions: 'SST 14–22°C, rocky reef and kelp habitat 10–60m. South and west coast WA; common around Albany, Esperance, and Rottnest Island.',
    depth: '10–60m; commonly 15–40m',
    techniques: 'Bottom bait fishing with fish flesh, prawn or squid; soft plastics jigged near structure. Use release weight at depth.',
    sounderSignatures: 'Rocky reef pinnacles and ledge structure; fish arches tight to bottom on quality sounder',
    latRange: [-35, -26],
  },
  'Redthroat Emperor': {
    feedingBehaviour: 'Sandy-bottom demersal, feeds on invertebrates and small fish. Active feeder, especially on incoming tide.',
    preferredConditions: 'SST 20–28°C, sandy bottom near reef, tropical and subtropical WA.',
    depth: '15–60m',
    techniques: 'Light tackle bottom fishing; soft plastics; small cut bait. Use release weight.',
    sounderSignatures: 'Sandy bottom adjacent to reef structure; fish arches low to bottom',
    latRange: [-33, -13],
  },
  'Spangled Emperor': {
    feedingBehaviour: 'Reef and rubble-dwelling demersal. Feeds on crustaceans. Most active near tide changes.',
    preferredConditions: 'SST 22–30°C, tropical and Gascoyne WA. Reef and rubble substrate.',
    depth: '10–50m',
    techniques: 'Bait fishing with prawn or fish; slow jig. Use release weight.',
    sounderSignatures: 'Reef and rubble patches on chart; fish holding near bottom',
    latRange: [-30, -13],
  },
  'Red Emperor': {
    feedingBehaviour: 'Large reef-dwelling demersal, highly prized table fish. Feeds on fish, squid and crustaceans on or near rocky reef and rubble. More active at dawn, dusk and tide changes.',
    preferredConditions: 'SST 22–30°C, tropical reef and rubble habitat. Northern and Gascoyne WA — Exmouth, Pilbara, Kimberley region. Minimum size 410mm.',
    depth: '20–80m; commonly 30–60m around reef structure',
    techniques: 'Bottom bait fishing with fish flesh, squid or prawn; slow jig; paternoster rig near reef. Use release weight.',
    sounderSignatures: 'Reef and rubble substrate on chart; fish arches holding tight to bottom; rocky bottom transitions clearly visible',
    latRange: [-26, -13],
  },
  'Coral Trout': {
    feedingBehaviour: 'Ambush predator on coral reef. Feeds on small fish. Most active at dawn.',
    preferredConditions: 'SST 22–30°C, coral reef habitat. North Coast WA — Coral Bay, Ningaloo, Rowley Shoals (protected).',
    depth: '5–30m on healthy coral reef',
    techniques: 'Live bait; hard body lures; diving lures worked through gutters. NOTE: Totally protected at Rowley Shoals.',
    sounderSignatures: 'Shallow reef structure; coral bommies visible on chart at low speeds',
    latRange: [-24, -13],
  },
  'Amberjack': {
    feedingBehaviour: 'Deep-water schooling predator. Responds to jigs and live bait. Often found with yellowtail kingfish.',
    preferredConditions: 'SST 16–24°C, offshore reef and deep structure.',
    depth: '40–120m',
    techniques: 'Heavy jigging; deep live bait; large soft plastics',
    sounderSignatures: 'Deep reef pinnacles and walls; mid-water schools on sounder',
    latRange: [-35, -24],
  },
  'Tuskfish': {
    feedingBehaviour: 'Hard-biting demersal, feeds on crustaceans. Reef-associated.',
    preferredConditions: 'SST 18–26°C, reef and rubble habitat. West and North Coast WA.',
    depth: '10–50m',
    techniques: 'Bait fishing with prawn, crab, squid; soft plastics',
    sounderSignatures: 'Reef and rubble substrate; fish tight to bottom on sounder',
    latRange: [-35, -13],
  },
  'Black Snapper (Grass Emperor)': {
    feedingBehaviour: 'Active reef and sandy-bottom feeder, hunts crustaceans and small fish. Most active on tide changes and morning/evening periods.',
    preferredConditions: 'SST 20–28°C, reef edges, rubble, and sandy patches. Common across all WA bioregions; more abundant in northern waters.',
    depth: '10–60m on reef and rubble substrate',
    techniques: 'Bottom bait fishing with prawn, fish flesh or squid; soft plastics near reef edge. Use release weight.',
    sounderSignatures: 'Reef and rubble substrate transitions; fish arches holding tight to bottom',
    latRange: [-30, -13],
  },
  'Bight Redfish (Nannygai)': {
    feedingBehaviour: 'Schooling demersal, forms dense vertical schools near the seafloor at dawn and dusk then scatters to feed individually at night. Feeds on molluscs, crustaceans and small fish. Readily takes baited rigs and jigs.',
    preferredConditions: 'Temperate southern WA and Great Australian Bight. Rocky reefs, pinnacles and continental shelf edge. Found south of Lancelin through to the South Coast and Bight.',
    depth: '10–500m; most commonly 120–200m on the continental shelf',
    techniques: 'Drift fishing over rocky outcrops and pinnacles; deep paternoster rigs with octopus, squid or fresh fish bait; jigs. Release weight essential for barotrauma management.',
    sounderSignatures: 'Dense vertical school arches 50–200m; tight to bottom or mid-water over rocky reef and pinnacles; continental shelf structure on chart',
    latRange: [-35, -31],
  },
  'Barramundi': {
    feedingBehaviour: 'Powerful ambush predator. Lies in wait behind structure (snags, mangrove roots, rock bars) and strikes hard on baitfish. Most active at tide changes — best on run-out tide through creek mouths.',
    preferredConditions: 'SST 24–32°C, tropical WA — Exmouth to Broome, Kimberley rivers and estuaries. Wet season (Oct–Apr) peak activity. Size limit 550–800mm applies.',
    depth: '0.5–8m in estuaries, creeks and tidal rivers; nearshore 10–20m by boat',
    techniques: 'Casting surface lures and subsurface jerkbaits to structure; live bait; soft plastics near snags. Shore fishing: casting into tidal creek systems.',
    sounderSignatures: 'Submerged snags and creek channel edges visible on sounder; thermoclines in tidal rivers; bait schools at creek mouths',
    latRange: [-24, -13],
  },
  'Black Jewfish': {
    feedingBehaviour: 'Large nocturnal predator. Feeds on baitfish and crustaceans in tidal channels and estuaries at night. Prefers slow rolling baits near the bottom. Minimum size 700mm.',
    preferredConditions: 'SST 22–30°C, northern WA — Exmouth, Shark Bay, Pilbara and Kimberley coast. Tidal creek mouths, estuaries and nearshore reefs.',
    depth: '1–20m in estuaries; to 40m offshore',
    techniques: 'Live bait (mullet, herring) rigged near bottom at night; large soft plastics; bait on running sinker rig through tidal channels',
    sounderSignatures: 'Deep holes in tidal channels; bait schools at estuary edges; creek mouths and snag structure at night',
    latRange: [-27, -13],
  },
  'King Threadfin (Giant Threadfin)': {
    feedingBehaviour: 'Powerful estuary predator with long pectoral fin threadlets for sensing bottom-dwelling prey. Feeds on prawns, crabs and small fish. Most active on run-in tide over tidal flats.',
    preferredConditions: 'SST 24–32°C, tropical WA estuaries and tidal rivers — Exmouth to Broome, Kimberley. Sandy and muddy estuary systems.',
    depth: '1–10m in tidal systems; nearshore to 20m by boat',
    techniques: 'Bait fishing with fresh prawn or fish at estuary mouths; soft plastics worked slowly along sandy bottom; live bait by boat',
    sounderSignatures: 'Sandy and muddy bottom transitions in tidal estuaries; shallow channel edges; incoming tide over tidal flats',
    latRange: [-24, -13],
  },
  'Tailor': {
    feedingBehaviour: 'Aggressive schooling predator, feeds on baitfish near surface. Best feeding on dusk and night tides. Responds to berley.',
    preferredConditions: 'SST 14–22°C, surf beaches, gutters and channels. WA south and west coast. Peak winter–spring.',
    depth: 'Surf zone to 10m',
    techniques: 'Casting metal slugs and lures into gutters; berley trail with pilchards; surf rigs with whole pilchard',
    sounderSignatures: 'Not typically used for beach tailor; look for gutters, rips and current lines visually',
    latRange: [-35, -13],
  },
  'Australian Salmon (Western Australian Salmon)': {
    feedingBehaviour: 'Hard-fighting schooling predator. Attacks baitfish and lures aggressively in surf gutters and rocky headlands. Best on active swell and strong tidal push.',
    preferredConditions: 'SST 12–20°C, surf beaches, rocky headlands and bays. South-west WA peak season autumn–winter (May–August). Follows bait migrations.',
    depth: 'Surf zone to 10m; commonly in gutters and wash zones',
    techniques: 'Casting metal slugs and hard-body lures into gutters; bait fishing with pilchards; rock fishing',
    sounderSignatures: 'Visual identification of gutters, rips and current lines from shore; not typically sounder-targeted',
    latRange: [-35, -28],
  },
  'Yellowfin Whiting': {
    feedingBehaviour: 'Bottom feeder on sandy flats, feeds on worms and crustaceans. Active on warm incoming tides over shallow sand.',
    preferredConditions: 'SST 16–24°C, shallow sandy beaches and estuaries. Estuary and beach environments.',
    depth: '0.5–4m on sandy substrate',
    techniques: 'Running sinker rig with small hook and worm/prawn; ultra-light gear',
    sounderSignatures: 'Sandy flats clearly visible in shallow water; incoming tide over warm sand',
    latRange: [-35, -13],
  },
  'Trevally': {
    feedingBehaviour: 'Schooling predator, feeds on baitfish in currents and gutters. Active on tidal changes.',
    preferredConditions: 'SST 16–26°C, rocky shores, beaches, estuaries. Widespread WA.',
    depth: '0–20m in surf zone or estuaries',
    techniques: 'Casting lures and soft plastics; bait fishing with pilchards',
    sounderSignatures: 'Visual reading of gutters and current channels from shore',
    latRange: [-35, -13],
  },
  'Australian Herring': {
    feedingBehaviour: 'Small schooling fish, feeds on plankton and small crustaceans. Best on shallow reefs and beaches. Commonly used as live bait for larger species like Mulloway and Tailor.',
    preferredConditions: 'SST 14–22°C, shallow reefs, beaches and estuaries. Perth metro beaches and south-west WA. Year-round.',
    depth: '1–5m',
    techniques: 'Small hooks with dough bait or worm under a float; light berley; sabiki rigs for bait collection',
    sounderSignatures: 'Visual observation; shallow beach and reef environments',
    latRange: [-35, -26],
  },
  'Garfish (Southern Garfish)': {
    feedingBehaviour: 'Surface-swimming schooling fish feeding on algae, plankton and small invertebrates. Feeds actively near the water surface. Best in calm conditions on incoming tide.',
    preferredConditions: 'SST 14–22°C, sheltered bays, estuaries, jetties and beaches. Southern and south-west WA. Year-round with peak in spring–summer.',
    depth: 'Surface to 3m',
    techniques: 'Light berley trail with bread or pilchard; small hook with bread dough or prawn under a float; sabiki rigs',
    sounderSignatures: 'Schooling fish clearly visible near the surface in calm water; best fished visually from jetties and beaches',
    latRange: [-35, -26],
  },
  'Bream': {
    feedingBehaviour: 'Versatile demersal, feeds on worms, crustaceans and small fish. Active on incoming night tide in estuaries.',
    preferredConditions: 'SST 14–24°C, estuaries, rivers, nearshore reefs. Widespread WA.',
    depth: '0–15m in estuaries and nearshore',
    techniques: 'Soft plastics; bait on light tackle; lures near structure at night',
    sounderSignatures: 'Structure and drop-offs in estuaries; rock bars and weed beds visible on sounder in clearer water',
    latRange: [-35, -13],
  },
  'Silver Bream': {
    feedingBehaviour: 'Schooling estuarine bream, feeds on worms, crustaceans and algae on sandy and weedy substrate. Active feeder across all tidal phases.',
    preferredConditions: 'SST 14–24°C, sandy estuaries, nearshore beaches and shallow coastal bays. South and west coast WA.',
    depth: '0.5–8m on sandy and weedy bottom',
    techniques: 'Light paternoster or running sinker rig with small hook; worm, prawn or dough bait; ultra-light lures',
    sounderSignatures: 'Sandy and weedy bottom in shallow estuaries; visual spotting of schooling fish over sand',
    latRange: [-35, -26],
  },
  'King George Whiting': {
    feedingBehaviour: 'Sandy-bottom feeder, hunts worms, pipis and small crustaceans on clean sandy substrate. Most active on warming incoming tides. A prized southern WA table fish.',
    preferredConditions: 'SST 14–22°C, clean sandy beaches, bays and estuaries. South and south-west WA — from Shark Bay to Great Australian Bight. Minimum size 280mm.',
    depth: '1–10m on clean sand; occasionally to 20m',
    techniques: 'Running sinker or paternoster rig with size 4–6 hook; pipi, worm or prawn bait; ultra-light gear for best sport',
    sounderSignatures: 'Clean sandy bottom; incoming tide over warm shallow sand; featureless sandy flats on chart',
    latRange: [-35, -26],
  },
  'Whiting': {
    feedingBehaviour: 'Sandy-bottom feeder. Feeds on worms and small crustaceans on warm tidal flats.',
    preferredConditions: 'SST 14–24°C, shallow sandy beaches and bays. Perth and south coast.',
    depth: '0.5–6m on clean sand',
    techniques: 'Running sinker or paternoster with small hooks and worm or prawn',
    sounderSignatures: 'Clean sandy flats; warm water over sand visible with temperature overlay',
    latRange: [-35, -13],
  },
  'Flathead': {
    feedingBehaviour: 'Ambush predator lying on sandy bottom. Most active at night and low light. Feeds on incoming tide in estuaries.',
    preferredConditions: 'SST 12–22°C, sandy and muddy estuaries, nearshore beaches.',
    depth: '0.5–10m in sandy areas',
    techniques: 'Soft plastics worked slowly along bottom; bait rigs with fish or prawn',
    sounderSignatures: 'Sandy bottom transitions near structure; estuary drop-offs',
    latRange: [-35, -13],
  },
  'Mulloway': {
    feedingBehaviour: 'Nocturnal predator, highly active on first two hours of the run-out tide. Responds to berley in rivers.',
    preferredConditions: 'SST 14–22°C, river mouths, estuaries, nearshore reefs. South and west coast WA.',
    depth: '1–20m; river mouths and surf gutters',
    techniques: 'Live bait (herring/mullet); large soft plastics; bait at night on outgoing tide',
    sounderSignatures: 'Deep river holes and channel edges; bait schools in estuaries at dusk',
    latRange: [-35, -26],
  },
  'Flounder': {
    feedingBehaviour: 'Flat ambush predator buried in sand. Most active at night. Feeds on incoming tide.',
    preferredConditions: 'SST 12–20°C, shallow sandy bays and estuaries. Southern WA.',
    depth: '0.5–5m on sandy substrate',
    techniques: 'Bait on running sinker along sandy bottom; slow-retrieve soft plastics',
    sounderSignatures: 'Flat sandy bottom transitions; shallow bay areas at night',
    latRange: [-35, -26],
  },
  'Mangrove Jack': {
    feedingBehaviour: 'Aggressive ambush predator found in mangrove-lined estuaries and tidal creeks. Strikes hard and immediately retreats to structure. Most active at dusk and through the night on outgoing tides.',
    preferredConditions: 'SST 24–32°C, tropical WA estuaries — Exmouth to Broome and Kimberley. Mangrove-lined creeks, tidal rivers and nearby inshore reefs.',
    depth: '0.5–10m; prefers structure in 1–5m of water',
    techniques: 'Casting lures and soft plastics tight to mangrove roots; live bait (herring, mullet) at structure; heavier gear needed to turn fish from snags',
    sounderSignatures: 'Shallow tidal creek channels on chart; submerged root systems; visual reading of mangrove edges at low tide',
    latRange: [-24, -13],
  },
}
