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
      'Grass Emperor', 'Bight Redfish',
      'Barramundi', 'Black Jewfish', 'King Threadfin',
    ],
  },
  beach: {
    pelagic: [
      'Tailor', 'Australian Salmon (Western Australian Salmon)',
      'Yellowfin Whiting', 'Trevally', 'Giant Trevally', 'Queenfish',
      'Australian Herring', 'Garfish', 'Squid',
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
  // NEW: structured fields that pair directly with data already in the AI prompt
  seasonality: string       // Best months/season — AI has trip date context
  tidePhase: string         // Best tidal phase — AI has full tide tables
  baitPreferences: string   // Ranked bait/lure list — practical and specific
}

export const SPECIES_KNOWLEDGE: Record<string, SpeciesKnowledge> = {
  'Spanish Mackerel': {
    feedingBehaviour: 'Aggressive surface and mid-water predator with razor-sharp teeth. Most active at dawn and first two hours after sunrise; second peak at last light. Hunts baitfish schools along current edges, temperature breaks and reef drop-offs. Strikes fast and often drops the lure — maintain constant trolling speed through the strike zone. Solitary or in loose groups; large individuals (over 15kg) tend to be solitary. Wire trace essential to prevent bite-offs.',
    preferredConditions: 'SST 22–28°C; prefers cleaner blue or blue-green water over 15m depth. Light to moderate chop (0.5–1.5m swell) is ideal. Incoming tide concentrates them on reef points and channel entrances. Year-round in tropical WA; seasonal (Oct–Apr) in south.',
    depth: '5–40m; most active feeding in top 20m; will sound to 40m when spooked',
    techniques: 'High-speed trolling 8–12 kts with skirted lures (5–8 inch) or large deep-diving bibbed lures. At anchor: casting large poppers or stickbaits into current edges; live bait (yakka, herring, mullet) under a balloon or float. Use 80–100lb wire trace or heavy fluorocarbon.',
    sounderSignatures: 'Baitfish arches at 8–20m near reef or current edges; birds working the surface; SST colour breaks on chart plotter overlay; current seams visible on surface as colour change',
    latRange: [-33, -13],
    seasonality: 'Year-round north of Exmouth (peaking Sep–Mar); Oct–Apr in Gascoyne; Nov–Mar on the West Coast. Spring (Sep–Nov) is prime for schooling fish in mid-coast WA.',
    tidePhase: 'Incoming tide is best — fish push onto reef points and ledges as baitfish concentrate. Mid-tide run produces aggressive feeding. Slack water and outgoing tide are generally slower.',
    baitPreferences: '1. Live yakka or slimy mackerel — most effective when drifted or kite-fished; 2. Whole fresh garfish rigged on ganged hooks; 3. Skirted lures (purple/black or pink/white, 5–8 inch); 4. Large metal slices (40–80g) cast into surface schools; 5. Bibbed minnow lures (18–25cm) trolled at 6–8 kts.',
  },

  'Spotted Mackerel': {
    feedingBehaviour: 'Schooling surface predator, smaller and more numerous than Spanish Mackerel. Feeds aggressively on whitebait, anchovies and small herrings. Schools often busting on the surface at dawn. Less wary than Spanish — will hit almost any fast-moving lure when actively feeding. Usually in schools of 20–200 fish.',
    preferredConditions: 'SST 20–27°C; inshore and nearshore coastal waters within 20km of shore. Prefers slightly turbid green-blue water near bait schools. Common along the WA north and mid-west coast, year-round in the tropics, summer–autumn further south.',
    depth: 'Surface to 25m; often in top 10m when feeding',
    techniques: 'Trolling small skirted lures (3–4 inch) or bibbed minnows at 6–9 kts; casting metal slugs (20–40g) and small stickbaits into busting schools; jigging chrome slices through feeding balls. Use 30–50lb leader.',
    sounderSignatures: 'Dense baitfish balls near surface 5–15m; birds working hard; colour breaks on SST overlay; visible busting on surface',
    latRange: [-30, -13],
    seasonality: 'Year-round north of Shark Bay; peak Oct–Apr. Summer–autumn in the Gascoyne (Oct–Apr). Less reliable below 27°S.',
    tidePhase: 'Active across all tidal phases but peaks on the incoming tide when baitfish concentrate against structure. Early morning low-light window before full daylight is consistently best regardless of tide.',
    baitPreferences: '1. Small metal slices (20–40g chrome or gold); 2. Small skirted lures (3–4 inch pink or white); 3. Fresh garfish on ganged hooks; 4. Small diving bibbed minnow (10–14cm) trolled at 6–8 kts; 5. Live whitebait or small herring under float.',
  },

  'Grey Mackerel': {
    feedingBehaviour: 'Schooling pelagic found in large aggregations in coastal and offshore waters. Feeds on small fish and squid. Less selective than Spanish Mackerel — will attack a wide variety of lures. Schools tend to be spread over a wide area and move with baitfish. Often mixed with school mackerel in tropical WA.',
    preferredConditions: 'SST 22–30°C; tropical to subtropical WA. Common from Gascoyne to Kimberley. Tidal channels, reef edges and shallow offshore grounds. Tolerates slightly turbid water near estuaries.',
    depth: 'Surface to 30m; most feeding in top 15m',
    techniques: 'Trolling small-medium lures at 7–10 kts; casting metal slugs (20–60g); light jigging through schools; live small baitfish. 50–80lb wire or fluorocarbon leader.',
    sounderSignatures: 'School arches mid-water 5–20m; bait balls near surface; reef edges and channel drop-offs on chart',
    latRange: [-26, -13],
    seasonality: 'Year-round in tropical WA; most reliable Apr–Oct when schools move inshore. Less predictable in summer wet season when turbid water disperses schools.',
    tidePhase: 'Feeding peaks on the run-in tide at channel entrances and reef edges. Less active on slack and outgoing tide.',
    baitPreferences: '1. Metal slugs (30–60g, chrome or silver); 2. Skirted lures (3–5 inch); 3. Live or fresh garfish on ganged hooks; 4. Chrome bibbed minnows trolled at 7–9 kts; 5. Small soft plastic shads (3–4 inch) on 20–30g jig heads.',
  },

  'School Mackerel': {
    feedingBehaviour: 'Schooling pelagic forming large tight schools in coastal waters. Most aggressive feeder among the smaller mackerel species. Will strike freely into any lure passed through the school. Active across all tidal phases but feeding peaks at dawn. Often mixed with spotted and grey mackerel.',
    preferredConditions: 'SST 22–29°C; coastal and inshore WA, often over reefs, sandy patches and near FADs. Common northern and mid-west WA, year-round in the tropics.',
    depth: 'Surface to 20m; mostly top 10m when feeding',
    techniques: 'Casting metal slugs and small lures into schools; light trolling with small skirted lures; jigging; sabiki rigs through schools. Use 40–60lb fluorocarbon.',
    sounderSignatures: 'Dense mid-water schools clearly visible on sounder; reef and rubble substrate nearby; surface disturbance when actively feeding',
    latRange: [-26, -13],
    seasonality: 'Year-round in tropical WA; most productive dry season (May–Oct) when water clarity is better. Summer wet season can push schools offshore.',
    tidePhase: 'Active through all tides; feeding peaks at first light regardless of tide state. Mid-incoming tide particularly productive near reef edges.',
    baitPreferences: '1. Metal slugs (20–40g, chrome); 2. Small skirted lures (2–3 inch); 3. Sabiki rigs with small hooks for live bait use; 4. Small metal spoons; 5. Live herring or small pilchards.',
  },

  'Shark Mackerel': {
    feedingBehaviour: 'Solitary or small group pelagic predator, visually similar to Spanish Mackerel but with distinctive shark-like teeth. Hunts large baitfish and smaller pelagics. Less abundant than Spanish Mackerel but found in the same habitat. Slower moving and less wary than Spanish — often holds near FADs and offshore structure for extended periods.',
    preferredConditions: 'SST 22–30°C; northern WA offshore and nearshore waters. Exmouth to Broome region. Blue-green water over 20m depth. FADs, floating debris and offshore banks.',
    depth: '10–50m; regularly feeds in 15–30m',
    techniques: 'Trolling medium-large lures (6–10 inch) at 7–10 kts; live bait (large mullet, trevally) on heavy tackle; wire trace mandatory due to sharp dentition. 100–150lb wire trace.',
    sounderSignatures: 'SST breaks and colour-change lines on chart plotter; deep bait schools (20–40m); FAD structure; offshore reef and bank edges',
    latRange: [-24, -13],
    seasonality: 'Year-round north of Exmouth; peak Jul–Nov during dry season when baitfish are most concentrated. Less common in summer wet season.',
    tidePhase: 'Less tide-dependent than other mackerel species; tends to hold around offshore structure regardless of phase. Incoming tide activates feeding near reef edges.',
    baitPreferences: '1. Large live trevally or mullet (500–800g) — most effective; 2. Large skirted lures (7–10 inch); 3. Rigged whole garfish or scad on ganged hooks; 4. Large metal slices (80–120g); 5. Bibbed deep-diving minnows trolled at 7–9 kts.',
  },

  'Wahoo': {
    feedingBehaviour: 'Extremely fast solitary pelagic predator, often called the fastest fish in the ocean. Strikes instantaneously and slices bait cleanly with razor teeth — use wire trace. Associates with floating debris, FADs, temperature fronts and current edges. Most active at dawn and first hour of daylight. Usually solitary; occasionally in loose groups at FADs. Strikes and disappears rapidly — a brief, violent encounter.',
    preferredConditions: 'SST 24–29°C; blue offshore water beyond the shelf (>30m). Leeuwin Current warm-water eddies in WA. Calm to moderate swell. Floating debris, FADs and colour-change lines are key locators.',
    depth: 'Surface to 40m; follows baitfish vertically',
    techniques: 'High-speed trolling 12–16 kts with heavy skirted lures or konaheads (7–10 inch); heavy wire trace or 200lb hard monofilament essential. Downrigger at 20–30m with chrome lures also effective. Large metal jigs yo-yoed at FAD structure.',
    sounderSignatures: 'Deep bait schools (20–40m) near FAD or floating debris; SST colour breaks; warm eddy features on satellite overlay; rarely shows as individual arches',
    latRange: [-30, -13],
    seasonality: 'Most reliable Oct–Apr when water is warmest and Leeuwin Current eddies are strongest. May–Sep possible in the north. Rare south of Shark Bay outside of summer.',
    tidePhase: 'Largely tide-independent in offshore water; activity peaks at first light and dawn window. Current edges and FADs matter more than tidal phase.',
    baitPreferences: '1. Skirted lures (7–10 inch, bright/flashy colours) at 14–16 kts; 2. Konahead style lures; 3. Large chrome knife jigs (100–200g) at FAD structure; 4. Live large scad or trevally on wire trace; 5. Rigged ballyhoo or garfish at 10–12 kts.',
  },

  'Mahi-Mahi': {
    feedingBehaviour: 'Highly active, acrobatic surface predator with spectacular colouring. Associates strongly with floating objects, weed lines, FADs and current edges. Once located, keeps the school together — when one is hooked, others follow it to the boat. Travels in schools when small (under 3kg), solitary when large (bull mahi). Feeds frantically on small flying fish, squid and any surface baitfish. Has excellent eyesight — clear-water finesse presentations can be needed.',
    preferredConditions: 'SST 22–28°C; blue oceanic water, strong Leeuwin Current influence. Weed lines, floating debris and FADs are key. Best in summer and autumn off WA. Can appear far inshore when warm water pushes close.',
    depth: 'Surface to 20m; almost exclusively in top 10m',
    techniques: 'Trolling skirted lures or bibbed minnows near weed lines; fly fishing with large streamer patterns; spinning with small poppers or metal slices; live small baitfish under float. Keep one hooked on a long line to attract schoolmates to the boat.',
    sounderSignatures: 'Look for weed lines, floating debris and FADs on chart plotter; bait schools near surface 5–15m; SST fronts and current edges',
    latRange: [-35, -13],
    seasonality: 'Summer–autumn (Dec–May) in WA; peak Jan–Apr when Leeuwin Current is strongest and weed lines form. Occasional catches year-round in the north. Rare south of Augusta outside summer.',
    tidePhase: 'Tide-independent in offshore water; activity driven by wind and current patterns rather than tidal phase. Early morning and dusk are peak feeding windows.',
    baitPreferences: '1. Live small scad, yakka or pilchard under a balloon; 2. Small skirted lures (4–6 inch) trolled at 8–10 kts; 3. Poppers and stickbaits (40–70g) cast to visible fish; 4. Small metal slices (20–40g); 5. Fly: large bright streamer or popper pattern.',
  },

  'Yellowfin Tuna': {
    feedingBehaviour: 'Schooling pelagic that feeds aggressively on baitfish, squid and crustaceans. Best on moon phase changes and tide turns. When feeding, creates explosive surface busts that can be seen for kilometres. Responds to berley and chum. Larger fish (over 30kg) tend to be deeper and more solitary. Schools with other tuna species. Extremely strong and fast — fights hard on light tackle.',
    preferredConditions: 'SST 20–28°C; deep blue offshore water, current edges, temperature breaks and canyon walls (especially Perth Canyon and Bremer Bay Canyon). Chlorophyll fronts with green-blue colour changes are key locators.',
    depth: 'Surface to 100m; most active feeding in top 50m; deeper during the day',
    techniques: 'Trolling skirted lures and bibbed deep-divers at 8–10 kts; popper fishing over breaking schools (80–120g heavy surface lures); vertical jigging with butterfly or slow-pitch jigs (100–250g); berley cube fishing with live pilchards; kite fishing with live bait.',
    sounderSignatures: 'Arching bait schools 20–60m on sounder; porpoising fish visible on surface; birds working; SST fronts on satellite overlay; canyon wall or current edge on bathymetric chart',
    latRange: [-35, -13],
    seasonality: 'Year-round in northern WA; peak Feb–May off the West Coast (associated with autumn cooling and Leeuwin Current weakening). Bremer Bay Canyon produces Jan–Apr. Perth Canyon best Mar–Jun.',
    tidePhase: 'Offshore fish are largely tide-independent; surface activity peaks at dawn and dusk. Near-coastal fish become more active on strong tidal flows that concentrate bait.',
    baitPreferences: '1. Live pilchards or yakka (whole, bridled); 2. Popper lures (80–120g) cast into busting schools; 3. Skirted lures (5–7 inch) trolled at 8–10 kts; 4. Butterfly jigs (150–250g) vertical jigging; 5. Cubed fresh tuna berley trail with circle hooks.',
  },

  'Bigeye Tuna': {
    feedingBehaviour: 'Deep-water schooling tuna that feeds both day and night. Spends daylight hours deeper than yellowfin (often 100–250m), ascending to feed near the surface at night. Has large eyes adapted for low-light feeding. Responds to deep jigging and night fishing with lights. Less likely to bust on the surface than yellowfin but more accessible at depth during the day.',
    preferredConditions: 'SST 18–26°C; deep blue water, canyon edges and seamounts. Found offshore beyond the continental shelf. Night fishing near lights or floating objects can be productive.',
    depth: '50–300m during the day; 20–60m at night',
    techniques: 'Deep jigging with heavy slow-pitch jigs (200–400g); deep trolling with lures on wire line or downrigger; live bait at 50–100m depth; night fishing with lights to attract baitfish then using jigs or bait',
    sounderSignatures: 'Deep arches 50–150m on quality sounder; canyon walls and ledges on bathymetric chart; bait balls at depth; nil surface activity typical during the day',
    latRange: [-35, -13],
    seasonality: 'Most reliably caught Mar–Jul off southern WA; year-round offshore in the north. Best around the Perth Canyon and Bremer Bay Canyon in autumn.',
    tidePhase: 'Offshore species largely tide-independent; feeding windows at dawn and dusk are most reliable. Night tidal flow activates near-surface feeding near FADs and lights.',
    baitPreferences: '1. Slow-pitch jigs (200–400g, glow or pink/silver colours); 2. Live large pilchard or scad on circle hook at depth (50–100m); 3. Deep-running skirted lures on downrigger; 4. Natural rigged baits (mackerel, squid) at depth; 5. Glow-in-the-dark soft plastic baits at night.',
  },

  'Longtail Tuna': {
    feedingBehaviour: 'Fast-moving schooling tuna (also called Northern Bluefin Tuna). Feeds aggressively on surface baitfish with explosive busting behaviour that is visible from long distances. Highly responsive to surface lures and poppers. Schools of 50–500 fish are common. Very acrobatic — leaps repeatedly when hooked. Will follow and strike lures that other tuna species ignore. Tires relatively quickly for a tuna.',
    preferredConditions: 'SST 20–28°C; nearshore to 30km offshore along the entire WA coast near bait schools. Commonly found in green-blue water just inside the edge of clear blue water. Excellent in summer and autumn. Often mixes with skipjack in northern WA.',
    depth: 'Surface to 40m; most feeding in top 20m',
    techniques: 'Casting poppers and stickbaits into busting schools (40–80g, surface action); metal jigs (40–80g) cast and retrieved fast; trolling small skirted lures (3–5 inch) at 8–10 kts; sabiki rigs to catch live bait then flick-fishing',
    sounderSignatures: 'Busting surface schools visible to the naked eye; bait arches 10–30m; birds diving and working; surface rippling from fast-moving school',
    latRange: [-30, -13],
    seasonality: 'Year-round north of Exmouth; Dec–May peak on the West Coast following warm water south; Apr–Jun on the south coast. Often the first tuna species of the season in southern WA.',
    tidePhase: 'Active across all tides; peak feeding at first and last light. Surface feeding is best during periods of flat to light chop — swell over 1.5m suppresses surface activity.',
    baitPreferences: '1. Poppers (40–80g) — most exciting; 2. Metal jigs (40–80g) chrome or blue/white; 3. Stickbaits worked fast across the surface; 4. Small skirted lures trolled at 9–11 kts; 5. Live whole pilchard on unweighted hook cast to feeding school.',
  },

  'Albacore Tuna': {
    feedingBehaviour: 'Deep-ranging schooling tuna with the longest pectoral fins of any tuna species. Responds well to trolled lures and feathers. Less surface-active than yellowfin or longtail but feeds aggressively when located on deep current edges. Often found in mixed schools with southern bluefin off the south coast. Very strong for their size — typically 5–15kg but fight disproportionately hard.',
    preferredConditions: 'SST 15–22°C; offshore southern and south-west WA along the continental shelf edge. Strong southerly current edges. Cape Naturaliste to Albany region is prime. Best in cooler months when cold upwellings bring baitfish to the surface.',
    depth: '30–150m; often feeds in 30–60m; deeper during the day',
    techniques: 'Trolling feather lures and small skirted lures (4–6 inch) at 7–9 kts; high-speed metal jig retrieves; cube fishing with berley; slow-pitch jigging on the drop in 50–150m',
    sounderSignatures: 'Deep arching schools 40–100m on sounder; SST temperature breaks on satellite overlay; continental shelf edge; current seams visible on chart',
    latRange: [-35, -28],
    seasonality: 'May–Oct is prime off south-west WA (autumn to early spring); coincides with cooler SST and strong southerly current flow. Augusta Canyon approach is particularly reliable Jun–Aug.',
    tidePhase: 'Offshore species; tide phase matters less than current flow. Feeding peaks on active current edges and SST fronts, which are often enhanced by tidal interaction with the shelf.',
    baitPreferences: '1. Feather lures (white/red or all-white) trolled at 8–10 kts; 2. Small skirted lures (4–5 inch); 3. Whole fresh pilchards on ganged hooks trolled slowly (5–6 kts); 4. Metal jigs (60–100g) retrieved fast; 5. Squid strips on paternoster at 50–80m.',
  },

  'Southern Bluefin Tuna': {
    feedingBehaviour: 'Large, powerful schooling tuna (up to 200kg but typically 20–80kg in WA recreational catches). Travels in large schools particularly in southern WA winter. Highly migratory and follows the baitfish along the southern shelf edge. Very strong fighter — will repeatedly strip line and require heavy tackle. Best opportunity is often a short window when schools come within range of the coast.',
    preferredConditions: 'SST 12–20°C; southern WA offshore. Albany and Esperance region. Winter–spring season peak. Often associated with upwellings and current convergences that concentrate baitfish in the Great Australian Bight approaches.',
    depth: '20–200m; feeding schools often 20–60m',
    techniques: 'Trolling large lures (7–10 inch skirted) at 8–10 kts; heavy jigging (200–400g) through feeding schools; cube fishing with heavy berley; pitching live large pilchards or mackerel to breaking fish. Use 60–80kg class tackle for larger fish.',
    sounderSignatures: 'Large dense schools on sounder 20–100m; temperature breaks on satellite SST overlay; southern shelf edge; porpoising fish visible from distance when feeding heavily',
    latRange: [-35, -30],
    seasonality: 'Jun–Oct is prime for southern WA; schools follow winter currents along the south coast from Albany to Esperance. Some years produce exceptional fishing in May. Very seasonal — schools here for weeks then move on.',
    tidePhase: 'Offshore species; largely tide-independent. Feeding windows at dawn and dusk most reliable; strong current flow enhances bait concentrations and activates feeding.',
    baitPreferences: '1. Live large pilchards or mackerel (pitched to breaking fish); 2. Large skirted lures (7–10 inch) trolled at 8–10 kts; 3. Heavy slow-pitch jigs (200–400g) in silver/blue colours; 4. Whole fresh garfish on ganged hooks; 5. Cube fishing (small fresh tuna cubes) with berley trail.',
  },

  'Skipjack Tuna': {
    feedingBehaviour: 'Fast-swimming schooling tuna, highly aggressive surface feeder. Schools of 100–1000 fish common. Feeds continuously on small baitfish and squid. Will hit almost any moving lure or bait presented at the right speed. Frequently caught as live bait for larger pelagics (marlin, yellowfin). Stings when handled — wear gloves. Bleeds profusely when cut — excellent berley attractant.',
    preferredConditions: 'SST 20–30°C; widespread WA coastal and offshore waters. Most common in 10–50m of water. Year-round in north, November–April in south. Often the most abundant tuna near the coast.',
    depth: 'Surface to 30m; actively feeds in top 20m',
    techniques: 'Casting metal jigs (20–40g) into schools; trolling small skirted lures at 8–10 kts; catching as live bait for larger species using single hook ganged system; jigging chrome slices through busting schools',
    sounderSignatures: 'Dense surface busting schools visible — often creates "boiling" effect; bait arches 5–20m; birds diving in numbers; surface disturbance from fast-moving school',
    latRange: [-30, -13],
    seasonality: 'Year-round in tropical WA; Oct–Apr on the West Coast; Feb–May on the south coast. Can appear anywhere warm water is present and baitfish are concentrated.',
    tidePhase: 'Active across all tides; most visible feeding at dawn and last light. Surface busting behaviour correlates with current edges concentrating bait rather than specific tidal phase.',
    baitPreferences: '1. Any small metal jig (20–40g) — they hit everything; 2. Sabiki rigs used as live-bait catching tool; 3. Small skirted lures at 8–10 kts; 4. Whole pilchards on ganged hooks; 5. Soft plastic shads (2–3 inch) retrieved fast.',
  },

  'Dogtooth Tuna': {
    feedingBehaviour: 'Powerful, solitary reef-associated tuna — one of the most prized tropical gamefish in WA. Hunts large baitfish and reef fish around vertical reef structure, drop-offs and passes. Extremely fast and powerful with large canine teeth. Strikes hard on poppers and large jigs worked near the reef face. Often circles below a hooked fish to take it — keep gear under tension at all times. Runs hard for the reef after the strike — heavy, short drag pressure needed immediately.',
    preferredConditions: 'SST 24–30°C; northern WA tropical offshore reefs. Exmouth to Broome, Rowley Shoals, Scott Reef. Passes and channel drop-offs. Clean blue water essential.',
    depth: '10–80m around reef structure; commonly at the reef face in 20–50m',
    techniques: 'Heavy popping (large poppers 120–200g) worked over deep tropical reef passes; large metal jigs (150–300g) worked fast vertically with long sweeping jig strokes; live large baitfish on heavy tackle. Use 80–150lb braid with 150–200lb fluorocarbon leader. Strong, fast drag is essential.',
    sounderSignatures: 'Deep tropical reef pinnacles and walls clearly visible; bait schools concentrated over reef — often in large arches; ledge drop-offs and channel entries on chart',
    latRange: [-22, -13],
    seasonality: 'Year-round at Rowley Shoals and Scott Reef. Exmouth area: best Apr–Oct dry season. Passes and drop-offs at Ningaloo are productive year-round but remote shoals produce the largest fish.',
    tidePhase: 'Run-in tide through passes and channel entrances is the prime feeding window — fish ambush prey carried through on the current. Slack water and run-out tides see reduced activity at passes.',
    baitPreferences: '1. Large poppers (120–200g, noisy surface action); 2. Heavy metal jigs (150–300g, silver or blue/white); 3. Large stickbaits (180–220mm); 4. Live large baitfish (trevally, scad, big herring); 5. Large soft plastic swimbaits (8–12 inch) on heavy jig heads.',
  },

  'Striped Marlin': {
    feedingBehaviour: 'Highly mobile billfish that follows bait migrations and temperature fronts. Uses bill to stun baitfish schools before consuming them. Peaks near full and new moon. Finning on the surface after feeding is common — can be pitch-baited when sighted. Active at dawn and dusk; often in larger groups than other marlin. WA fish typically 80–150kg but can exceed 200kg.',
    preferredConditions: 'SST 20–25°C; temperature breaks and current edges in blue water. WA season peaks Feb–May (autumn) when the Leeuwin Current weakens and cooler upwellings meet warm offshore water. Perth Canyon and Bremer Bay Canyon are key locations.',
    depth: 'Surface to 100m; trolled in top 30m; sounding to 60m when inactive',
    techniques: 'Shotgun trolling spread with skirted lures and naturals (5–9 inch) at 7–9 kts; pitch baiting with live or dead rigged bait (whole garfish, mackerel) to sighted fish; teasers and daisy chains to raise fish behind the boat. Use 10–24kg class tackle for sport.',
    sounderSignatures: 'Large bait schools 20–50m on sounder; SST breaks clearly visible on satellite overlay; finning fish visible on surface; seabirds associated with feeding activity',
    latRange: [-35, -13],
    seasonality: 'Feb–May is prime for Perth and south-west WA (Bremer Bay peak Jan–Apr). Year-round possibility north of Exmouth. The autumn window (Mar–Apr) consistently produces numbers off the West Coast.',
    tidePhase: 'Offshore species; activity driven more by bait movements and current patterns than tidal phase. Dawn and dusk are peak bite windows. Strong current flows concentrate bait and elevate activity.',
    baitPreferences: '1. Rigged whole garfish (trolled or pitch-baited); 2. Skirted lures (5–9 inch, pink/black or purple/black); 3. Live large scad or mackerel pitched to sighted fish; 4. Natural rigged mackerel or mullet; 5. Teasers and daisy chains to raise fish then pitch bait.',
  },

  'Blue Marlin': {
    feedingBehaviour: 'Largest Indo-Pacific billfish, highly aggressive predator. Follows warm current edges and feeds on large tuna, dolphinfish and squid. Less abundant than striped marlin in WA but produces larger fish (100–400kg). Very powerful initial run — can spool a reel in seconds. Often singles or loose pairs. Strikes with enormous force.',
    preferredConditions: 'SST 24–30°C; warm blue water, deep oceanic habitat beyond the shelf. Exmouth Gulf approaches and Abrolhos Islands offshore during summer. Leeuwin Current warm-water eddies are key locators.',
    depth: 'Surface to 200m; most active trolling in top 50m',
    techniques: 'Heavy tackle trolling with large skirted lures (8–14 inch) and natural rigged baits; live large trevally or mackerel (500–1kg) on circle hook; daisy chain teasers to raise fish. Use 24–37kg class tackle minimum.',
    sounderSignatures: 'Deep warm blue water on SST overlay; large bait schools 20–60m deep; canyon edges; strong SST features and current convergences',
    latRange: [-28, -13],
    seasonality: 'Nov–Apr for WA; peak Dec–Mar when warm water pushes furthest south. Exmouth Gulf area and Abrolhos offshore grounds most productive. Rare south of Geraldton.',
    tidePhase: 'Offshore species; tide largely irrelevant. Dawn to mid-morning is prime. Current edges and bait concentrations matter far more than tidal phase.',
    baitPreferences: '1. Large skirted lures (8–14 inch) trolled at 8–10 kts; 2. Rigged whole mackerel or tuna (500g–1.5kg); 3. Live large trevally or mackerel; 4. Large bibbed minnow (25–30cm) deep trolled; 5. Natural rigged garfish at 7–8 kts (smaller blue marlin).',
  },

  'Sailfish': {
    feedingBehaviour: 'Fast, acrobatic billfish with large dorsal fin used to herd and stun baitfish. Spectacular aerial display when hooked. Common off WA north coast in schools of 2–10 fish — often feeds in coordinated packs. Frequently encountered while trolling for mackerel. Responds to teasers and pitch baits. Recommended for catch-and-release — fast fatigue from fighting and poor eating quality.',
    preferredConditions: 'SST 24–30°C; warm northern WA waters. Exmouth to Broome. Particularly common off the Montebello Islands and Mackerel Islands in summer. Inshore and nearshore reef edges.',
    depth: 'Surface to 50m; most activity in top 20m',
    techniques: 'Light tackle trolling (6–15kg class) with small skirted lures (4–6 inch); pitch rigged bait or live bait to sighted finning fish; fly fishing with large deceivers. Teasers work well to bring fish up from depth.',
    sounderSignatures: 'Finning fish visible on surface near current edges; bait schools surface to 20m; birds working; SST fronts and current lines',
    latRange: [-24, -13],
    seasonality: 'Year-round north of Exmouth; peak Jul–Oct dry season when water clarity is best and fish concentrate on bait schools. Can appear as far south as Shark Bay during summer.',
    tidePhase: 'Feeding activity peaks on tide changes — incoming to outgoing and vice versa. Dawn window is most consistent. Less active at dead slack water.',
    baitPreferences: '1. Live small trevally or herring pitched to sighted fish; 2. Rigged whole garfish on outrigger; 3. Small skirted lures (4–6 inch); 4. Teaser then switch-bait with live scad; 5. Fly: large streamer or popper (best on calm days).',
  },

  'Queenfish': {
    feedingBehaviour: 'Aggressive surface feeder that leaps acrobatically when hooked — one of the most exciting light-tackle sportfish in tropical WA. Hunts baitfish schools at the surface with explosive busting action. Often feeds in the white water of tidal creek mouths and rip lines on outgoing tides. Multiple strikes per cast are common when schooling over bait. Tapers off quickly once disturbed — change position if strikes stop.',
    preferredConditions: 'SST 24–32°C; northern WA tropical waters. Tidal channels, creek mouths, beach gutters, open sand flats and offshore bait schools. Tolerates turbid water near estuaries.',
    depth: 'Surface to 10m; most strikes in top 3m',
    techniques: 'Casting surface poppers (40–80g) over bait schools; small stickbaits worked fast across the surface; trolling small lures at the surface; live small herring or whitebait on light leader',
    sounderSignatures: 'Shallow surface bait activity — visible busting and jumping; birds diving near beach; shallow sand flat and channel structure on chart; near creek mouths on run-out tide',
    latRange: [-26, -13],
    seasonality: 'Year-round in tropical WA; most prolific Mar–Oct dry season. Summer wet season can push fish offshore and into estuaries. Predictable feeding sessions around tidal creek mouths.',
    tidePhase: 'Outgoing tide through creek mouths and channels is the prime feeding window — baitfish flush out with the tide and queenfish ambush them at the exits. Incoming tides on beach gutters also productive.',
    baitPreferences: '1. Small poppers (20–60g) — most exciting; 2. Small stickbaits retrieved fast; 3. Metal slices (15–30g) retrieved at speed; 4. Live small herring or whitebait; 5. Small skirted lures at 8–10 kts near surface.',
  },

  'Giant Trevally': {
    feedingBehaviour: 'Apex reef predator that hunts in areas of strong tidal flow. Territorial and aggressive, often singular large individuals. Feeds at current-washed points, channel entries and reef drop-offs on outgoing tides. Dawn and dusk are peak windows but a big GT can be ambushed any time on a fast current. Attacks surface lures violently — often airborne on the strike. Extremely powerful; immediately heads for the reef after being hooked.',
    preferredConditions: 'SST 22–30°C; reef edges, current channels and outgoing tides. Widespread from Geraldton to the Kimberley. Requires clear-ish water over hard substrate. Tolerates some turbidity near estuaries.',
    depth: '2–50m; most common on shallow reef in 5–15m when hunting surface prey',
    techniques: 'Casting large poppers (120–180g) over current-swept reef points; large stickbaits (180–200mm); slow-trolled or pitched live baitfish near reef structure; heavy jigging (150–250g). Use 80–150lb braid, short heavy fluorocarbon or wire leader. Lock the drag — GTs must be stopped immediately.',
    sounderSignatures: 'Reef structure and channel entries clearly on chart; bait schools concentrated over or near reef edge; current-swept points identifiable by water movement on surface',
    latRange: [-30, -13],
    seasonality: 'Year-round in tropical WA; best May–Oct dry season when water clarity is best. West Coast: Oct–Apr when water is warmer and fish push further south. Peak activity around full and new moon springs.',
    tidePhase: 'Outgoing tide through passes and reef channel entrances is the #1 feeding window — current carries baitfish and GTs ambush at the exit. First 2 hours of the run-out tide is the prime window. Dead slack is poor; incoming picks up again in the last hour.',
    baitPreferences: '1. Large poppers (120–180g, noisy cup face); 2. Large stickbaits (160–200mm); 3. Live trevally or herring (300–500g) bridled and drifted near reef; 4. Large metal jigs (120–200g) worked aggressively; 5. Large bibbed minnow lures trolled near reef face.',
  },

  'Yellowtail Kingfish': {
    feedingBehaviour: 'Highly active schooling predator that responds explosively to jigs and live bait. Found around rocky pinnacles, kelp beds and offshore structure. Hunts in fast-moving schools that ambush baitfish from below. Responds strongly to berley — anchoring over structure and berleying is very effective. Schools range from 5–50 fish. Young fish are more surface-active; large fish (10–20kg) hold deeper around pinnacle bases.',
    preferredConditions: 'SST 18–24°C; reef structure in southern WA, shallow bombies and kelp beds. Found from the Abrolhos Islands south to Albany. Offshore pinnacles and reefs 20–80m.',
    depth: '10–80m; commonly found in 20–50m around pinnacle bases',
    techniques: 'Metal jigging (80–150g blade/knife jigs worked fast with aggressive stroke); live bait (herring, salmon) on ganged hooks with a float; casting hard-body lures near reef surface; berley trail from anchored boat over pinnacle.',
    sounderSignatures: 'Arching schools at 15–50m near reef; baitfish at mid-water above reef clearly visible; reef pinnacles and ledges shown on quality sounder; fish arches often at specific depth band on the pinnacle',
    latRange: [-35, -26],
    seasonality: 'Year-round at the Abrolhos; best Oct–May on the West Coast as water warms. Autumn (Apr–Jun) is prime for large fish in southern WA. Winter fish tend to be deeper.',
    tidePhase: 'Active across all tides; most aggressive during tidal flow as current over the pinnacle activates feeding. Slack water often quietens them — restart berley or change depth. Best fishing is on a running tide.',
    baitPreferences: '1. Live herring or salmon (whole, ganged) — most effective; 2. Knife jigs (80–150g) worked fast with aggressive stroke; 3. Live pilchards pinned through the head; 4. Hard body lures (minnow style, 12–18cm) cast near reef surface; 5. Heavy popper (80–120g) during surface schools.',
  },

  'Samson Fish': {
    feedingBehaviour: 'Powerful solitary to small-group predator, related to Yellowtail Kingfish but generally deeper-dwelling. Found around offshore reef structure and deep pinnacles. Responds to slow jigs worked near the bottom and live bait. Not as aggressive on surface lures as kingfish. Fights very hard — long powerful runs. Individual fish often hold at a specific depth near structure.',
    preferredConditions: 'SST 16–24°C; offshore reef structure 30–100m. West Coast and South Coast WA. Cocos Ledge, Rottnest deep ledges and offshore pinnacles are key spots.',
    depth: '30–120m; typically 40–80m around deeper reef and ledge structure',
    techniques: 'Metal jigging (100–200g slow-pitch or knife jigs worked slow and erratic); live bait (herring, pink snapper, slimy mackerel) drifted near deep structure; trolling near reef structure at 4–6 kts. Use heavy gear — 80–150lb braid.',
    sounderSignatures: 'Deep reef structure 30–80m on quality sounder; arching schools or individuals near pinnacles 40–70m; thermocline layer visible; structure detail on bathymetric chart',
    latRange: [-35, -26],
    seasonality: 'Year-round on the West Coast; best Apr–Sep (autumn–winter) when fish are most active and accessible in shallower depths. Summer fish tend to hold deeper (60–100m).',
    tidePhase: 'Tide changes trigger feeding — particularly the first 2 hours of the run-in tide over deep reef. Slack water is generally the worst time. Running tides also improve conditions for slow-pitch jigging.',
    baitPreferences: '1. Live slimy mackerel or herring on deep paternoster; 2. Slow-pitch jigs (100–200g, natural coloured — pink/white or silver/blue); 3. Large live herring pinned through the nose; 4. Fresh whole squid on a running sinker at depth; 5. Heavy metal blade jigs (150–250g) worked at the bottom.',
  },

  'Squid': {
    feedingBehaviour: 'Nocturnal and crepuscular ambush predator with excellent vision and camouflage. Hunts small fish, shrimp and crustaceans near reef edges, seagrass and jetty pilings. Most active during the two hours after sunset and before dawn. Responds to rhythmic egi (jig) presentations — sink, snap and pause allows the squid time to strike. Schools of calamari gather at lit jetties at night. In autumn–winter, large schools arrive inshore to spawn in shallow seagrass.',
    preferredConditions: 'SST 14–24°C; seagrass beds, reef edges and artificial structure (jetties, FADs). Widespread WA coast. Best in autumn–winter (Apr–Aug) in southern WA when spawning aggregations form.',
    depth: '1–20m; most productive 3–8m over seagrass and around jetty pilings',
    techniques: 'Egi (squid jig) fishing on light rod (8–10ft, light to medium action) with 0.6–0.8mm PE braid and 4–6lb fluorocarbon leader. Size 2.0–3.5 egi. Slow sink-and-jerk retrieve — let jig fully sink before snapping up. Fish under lights at jetties at night.',
    sounderSignatures: 'Seagrass and reef patches visible on chart; shallow 3–10m structure near drop-offs; night fishing: lights attract baitfish which in turn attract squid; look for ink stains on jetty decks as evidence of recent activity',
    latRange: [-35, -13],
    seasonality: 'Year-round in WA; peak Apr–Aug in southern WA when large spawning aggregations gather in seagrass. Perth metro jetties (Fremantle, Rockingham, Mandurah) are reliable May–Sep. North: year-round.',
    tidePhase: 'Incoming tide pushes squid onto seagrass beds and reef edges — most productive on the first 2–3 hours of the run-in. High tide over the grass is excellent. Outgoing tide: fish the weed edges as squid retreat.',
    baitPreferences: '1. Egi jigs — Size 2.5 (most versatile); natural prawns/shrimp colours for clear water; pink/orange for dirty water; 2. Small soft plastic shads on 5g jig head (budget option); 3. Small whole fresh prawn on chemically sharpened hook; 4. Live or fresh pilchard on small hook under float (night jetty fishing).',
  },

  'Dhufish': {
    feedingBehaviour: 'Iconic WA endemic demersal with aggressive feeding behaviour when active. Feeds primarily on the bottom — targets small fish, squid and cephalopods around rocky ledges and cave entrances. Most active at tide changes, particularly the first 2 hours of a new tidal cycle. Holds tight to structure during slack water. Rises slightly off the bottom in a berley trail. Prone to barotrauma — a release weight (descender device) is mandatory by regulation.',
    preferredConditions: 'SST 16–24°C; rocky reef 20–100m with moderate tidal flow. West Coast and South Coast WA only — does not occur north of the Abrolhos Islands. Limestone ledges, cave systems and drop-off walls are prime habitat.',
    depth: '20–100m; most productive fishing at 30–60m; large fish often 50–80m',
    techniques: 'Bottom fishing with whole fresh pilchards, cut snook, slimy mackerel or squid on paternoster or running sinker rig (size 4–6 circle hooks); slow-pitch jigging with soft plastics or micro-jigs (60–120g); berley with mashed pilchards draws them off the bottom. Release weight (descender device) mandatory for catch and release.',
    sounderSignatures: 'Rocky bottom structure with ledge and cave detail visible on quality sounder (Simrad or Garmin recommended for WA reef fishing); fish arches tight to the bottom or at thermocline level; thermocline visible at 20–40m in summer',
    latRange: [-35, -24],
    seasonality: 'Year-round on West and South coasts; peak autumn–winter (Apr–Sep) when fish are most active and water temperature is in the ideal range. West Coast boat demersal closure in effect — land-based only until approximately Sept 2027.',
    tidePhase: 'Tide changes trigger feeding — first 2 hours of run-in or run-out tide are the prime windows. Dead slack water significantly reduces activity. Running tide also improves sounder detection as fish rise slightly off the bottom.',
    baitPreferences: '1. Whole fresh pilchard on ganged hooks (most widely used); 2. Cut slimy mackerel (belly strip or whole); 3. Fresh squid — whole or in strips; 4. Live herring (most effective in deeper water); 5. Soft plastic paddle-tails (4–6 inch, natural or white colours) on 60–100g jig heads.',
  },

  'Pink Snapper': {
    feedingBehaviour: 'Aggressive demersal-pelagic predator that forms large spawning aggregations (especially in Cockburn and Warnbro Sounds). Responds extremely well to berley — a sustained berley trail with mashed pilchards draws fish up off the bottom to mid-water. Feeds on crabs, small fish, squid and baitfish. Most active at night but catchable throughout the day. Spawning aggregations (Aug–Dec) produce exceptional fishing around Perth reefs at specific depth bands.',
    preferredConditions: 'SST 16–24°C; wide-ranging habitat from seagrass/sandy patches to rocky reef. West and South coasts, Abrolhos Islands, Gascoyne. Responds to berley in any habitat. Night fishing provides a significant edge.',
    depth: '15–80m; spawning aggregations in 25–50m; Cockburn Sound juveniles in 5–15m',
    techniques: 'Berley trail with mashed pilchards, then whole pilchard/fresh fish on running sinker or paternoster; soft plastics and jigs drifted on berley; night fishing significantly increases catch rates. Use release weight for deep fish.',
    sounderSignatures: 'Dense schools visible mid-water above reef in berley trail on quality sounder; reef ledges and pinnacles on chart; berley trail draws fish up from bottom and makes them visible; look for fish at the top of the berley column',
    latRange: [-35, -24],
    seasonality: 'Year-round; peak spawning aggregation season Aug–Dec around Perth reefs (Cockburn Sound closed Aug–Jan by regulation). Gascoyne autumn run (Apr–Jul) produces excellent fishing on the 50m line.',
    tidePhase: 'Active day and night; incoming tide best for shallow reef snapper. Night high tide is a classic Perth pink snapper setup — fish the incoming tide until past high, then berley hard.',
    baitPreferences: '1. Whole fresh pilchard on ganged hooks in berley trail; 2. Live herring — most effective for large fish; 3. Fresh squid tentacles; 4. Whitebait and small whole garfish on ganged hooks; 5. Soft plastic paddle-tails (4–6 inch, white or pink) in berley. Berley is near-essential — use mashed pilchards or commercial berley cage.',
  },

  'Baldchin Groper': {
    feedingBehaviour: 'Reef-associated demersal with powerful jaws adapted for crushing hard-shelled prey. Targets crabs, squid, octopus and reef invertebrates on and around rocky substrate. Feeds actively across tidal phases but peaks in the first 2 hours of each new tidal movement. Will investigate and strike large soft plastics worked slowly through rubble. Spawning aggregations form Oct–Dec on the Abrolhos Islands and mid-coast reefs — fish are catchable but subject to closure.',
    preferredConditions: 'SST 16–22°C; rocky reef habitat with rubble and ledges, 20–60m. Mostly West Coast WA from Abrolhos south to Augusta. Mixed rock/sand interface is prime habitat. Present at the Abrolhos Islands but seasonally protected.',
    depth: '20–60m; most productive at 25–45m on mixed rocky/rubble ground',
    techniques: 'Bottom bait fishing on paternoster rig with whole fresh squid (hooked through the mantle — most effective), unpeeled prawn or crab; slow-pitch soft plastics (4–6 inch creature baits or paddle-tails) worked along rubble edges. Release weight required at depth.',
    sounderSignatures: 'Rocky pinnacles and ledge structure on high-frequency sounder; fish arches holding tight to reef transitions; rubble and broken ground visible as high-frequency bottom return',
    latRange: [-35, -24],
    seasonality: 'Year-round on the West Coast; peak May–Sep (autumn–winter). Abrolhos Islands: closed Oct 1 – Dec 31 for spawning. West Coast boat demersal closure active — land-based only until approximately Sept 2027.',
    tidePhase: 'Active through all tidal phases; most aggressive feeding in first 1–2 hours of each new tidal movement (either direction). Less active on dead slack water. Tide change is the most reliable trigger.',
    baitPreferences: '1. Whole fresh squid hooked through mantle — most effective; 2. Live or fresh unpeeled prawn; 3. Fresh octopus tentacle; 4. Crab flesh; 5. Soft plastics: creature baits or paddle-tails (4–5 inch) in natural sand/brown colours on 30–60g jig heads.',
  },

  'Breaksea Cod': {
    feedingBehaviour: 'Territorial ambush predator that holds tight to rocky structure in kelp forest and reef habitats. Feeds on small fish, crustaceans and invertebrates. Active across tidal phases but feeding peaks at dawn and dusk. Responds to slow presentations worked near structure rather than fast retrieves. Will take lures and bait placed in close proximity to ledge edges and crevices.',
    preferredConditions: 'SST 14–22°C; rocky reef and kelp habitat 10–60m on the West and South coasts. Common from Albany to Rottnest Island. Particularly abundant in deep kelp forests off the south coast near Albany and Esperance.',
    depth: '10–60m; most common at 15–40m in kelp and rocky habitat',
    techniques: 'Bottom bait fishing with fish flesh, prawn or squid on paternoster; slow-pitch soft plastics and micro-jigs worked tight to reef; rock fishing with bait rigs along ledge edges. Release weight recommended at depth.',
    sounderSignatures: 'Rocky reef pinnacles and kelp canopy return on sounder; fish arches tight to the bottom in kelp structure; complex bottom return typical of kelp forest habitat',
    latRange: [-35, -26],
    seasonality: 'Year-round in southern WA; most productive Mar–Sep (autumn–winter) when fish are most active in cooler water. Albany and Esperance produce the best catches from June–August.',
    tidePhase: 'Dawn and dusk are most productive regardless of tide phase. Active tidal flow slightly improves results by pushing bait near structure. Slack water reduces activity.',
    baitPreferences: '1. Fresh fish flesh (snook, tailor or herring strips) on paternoster; 2. Fresh prawn (whole or peeled); 3. Small soft plastic paddle-tails (3–4 inch) on 20–40g jig heads; 4. Fresh squid strips; 5. Whole small fish (herring or whitebait) on circle hook near reef.',
  },

  'Redthroat Emperor': {
    feedingBehaviour: 'Sandy-bottom demersal with red-orange throat markings. Feeds on worms, crustaceans and small invertebrates in sandy substrate adjacent to reef. Active across tidal phases; most responsive on incoming tide. Light-biting species — use small hooks and light leaders for best results. Schools of 10–50 fish common. Good table fish. Often caught while targeting other reef species on sandy patches.',
    preferredConditions: 'SST 20–28°C; sandy bottom adjacent to reef, tropical and subtropical WA. Widely distributed from the Abrolhos north to the Kimberley. Common in the Gascoyne at 20–40m on sandy rubble.',
    depth: '15–60m; commonly 20–40m on sandy/rubble substrate',
    techniques: 'Light tackle bottom fishing on paternoster rig with size 2–4 hooks; small fresh prawn, squid or pilchard bait; slow-pitch soft plastics (2–3 inch shads) on light jig heads (15–25g). Release weight at depth.',
    sounderSignatures: 'Sandy bottom adjacent to reef structure; fish arches low to bottom; reef edge transitions visible — fish tend to hold on the sand just clear of the reef',
    latRange: [-33, -13],
    seasonality: 'Year-round in tropical WA; most abundant and active in the Gascoyne Apr–Oct. Often encountered opportunistically while targeting other species.',
    tidePhase: 'Incoming tide activates feeding on the sandy flats and reef margins. Active feeder on the run-in with reduced activity on outgoing. Slack water is poorest.',
    baitPreferences: '1. Fresh small prawn (half or whole); 2. Small pieces of fresh squid; 3. Pilchard strips on size 4–2 hook; 4. Small soft plastic shads (2–3 inch, natural prawn colours); 5. Small pieces of crab flesh.',
  },

  'Spangled Emperor': {
    feedingBehaviour: 'Reef and rubble-dwelling demersal with distinctive blue spots. Feeds on crustaceans, worms and small fish on and around hard substrate. Most active near tide changes. Can be curious and will inspect lures before striking. Schools of 5–20 fish common on reefs. Excellent table fish; a key target at the Abrolhos Islands and in tropical WA.',
    preferredConditions: 'SST 22–30°C; tropical and subtropical WA north of Shark Bay. Reef and rubble substrate in clear water. Abrolhos Islands, Ningaloo, Dampier and Kimberley are prime areas.',
    depth: '10–50m; commonly 15–35m on reef and rubble',
    techniques: 'Bait fishing on paternoster with whole prawn, small fresh fish or squid; slow-pitch soft plastics (3–4 inch); small hard-body lures worked through reef gutters. Release weight at depth.',
    sounderSignatures: 'Reef and rubble patches on chart; fish arches holding near bottom in clusters; reef transitions and gutter formations visible on sounder',
    latRange: [-30, -13],
    seasonality: 'Year-round in tropical WA; peak May–Oct dry season at the Abrolhos and northward. Summer wet season disperses schools temporarily.',
    tidePhase: 'Most active on tide changes; run-in tide brings fish up on the rubble. Dead slack water sees reduced activity. First hour after each tide change is most productive.',
    baitPreferences: '1. Whole fresh prawn (live or fresh-dead); 2. Fresh squid (whole small or strips); 3. Live small herring — very effective; 4. Small soft plastic paddle-tails (3–4 inch) on 20–30g jig heads; 5. Fresh pilchard pieces on size 2–4 hook.',
  },

  'Red Emperor': {
    feedingBehaviour: 'Large and highly prized table fish of tropical WA. Feeds on fish, squid and crustaceans on or near rocky reef and rubble. More active at dawn, dusk and tide changes than during the middle of the day. Holds in groups of 3–10 fish at specific depth ranges on reef edges. Very strong fighter for size — powerful initial dives when hooked near reef.',
    preferredConditions: 'SST 22–30°C; tropical reef and rubble habitat in northern and Gascoyne WA. Exmouth, Pilbara, Kimberley region. Rocky reef structure in 20–80m of clear water.',
    depth: '20–80m; most commonly 30–60m around reef structure',
    techniques: 'Bottom bait fishing with fish flesh (fresh mullet, herring or pilchard), whole squid or large prawn on paternoster rig (size 2–4 circle hooks); slow-pitch jigging near reef base. Use release weight.',
    sounderSignatures: 'Reef and rubble substrate on chart; fish arches holding tight to bottom or at reef base; rocky bottom transitions clearly defined; groups of arches at 30–60m at reef edge',
    latRange: [-26, -13],
    seasonality: 'Year-round in tropical WA; best Apr–Oct dry season when water clarity is best and fish are most active. Exmouth area peaks May–Sep. Pilbara offshore reefs excellent Jun–Aug.',
    tidePhase: 'Dawn and first 2 hours of run-in tide are the prime feeding windows. Dead slack and midday are slowest. Tide change activates fish that have been holding deep in the reef.',
    baitPreferences: '1. Fresh whole squid — most consistent; 2. Fresh mullet or mackerel strips; 3. Live or fresh herring on circle hook; 4. Fresh prawn (whole, large); 5. Slow-pitch jigs (80–150g, red/orange or natural colours).',
  },

  'Coral Trout': {
    feedingBehaviour: 'Ambush predator that lies motionless in coral crevices and bommies waiting for small reef fish to pass within striking distance. Most active at dawn — feeding activity drops significantly after 08:00. Hunts by sight and strikes with explosive speed from a resting position. Responds to fast-moving lures passed through gutters and over bommies. Solitary and territorial — each fish holds a defined patch of reef.',
    preferredConditions: 'SST 22–30°C; healthy coral reef habitat in tropical WA. Ningaloo Reef, Rowley Shoals (totally protected — no take), Abrolhos edges, Mackerel Islands. Crystal-clear water essential. Depths of 5–30m on living coral.',
    depth: '5–30m on healthy coral reef; most productive in 8–20m',
    techniques: 'Live bait (small herring or whitebait bridled at the mouth) drifted over bommies; hard-body diving lures (8–12cm bibbed minnow) worked through gutters with erratic action; popping and stickbait with lighter gear in the shallows. NOTE: Totally protected at Rowley Shoals Marine Park — no take.',
    sounderSignatures: 'Shallow reef structure and coral bommies visible on chart at low trolling speed; coral heads creating irregular hard bottom return; water clarity allows visual location from the boat',
    latRange: [-24, -13],
    seasonality: 'Year-round at tropical WA reefs; best Jun–Oct dry season when water clarity is best and fish are most active and visible. Ningaloo peaks Apr–Oct. Abrolhos islands year-round.',
    tidePhase: 'Dawn to two hours after sunrise is the critical feeding window — do not miss this. Incoming tide activates fish on the reef face. After mid-morning, fish retreat deeper into structure and become much less catchable.',
    baitPreferences: '1. Live small herring or whitebait bridled through upper jaw — most effective at dawn; 2. Hard-body bibbed minnow (8–12cm) worked through gutters fast; 3. Live shrimp near bommie base; 4. Small diving popper (30–50g) over shallow coral; 5. Small stickbait retrieved with walk-the-dog action.',
  },

  'Amberjack': {
    feedingBehaviour: 'Deep-water schooling predator closely related to yellowtail kingfish. Found around offshore pinnacles and deep reef edges, often at the base of vertical structure. Feeds aggressively on baitfish and squid at depth. Responds well to slow-pitch jigs and live bait dropped to the bottom. Often found mixed with or in the same depth band as samson fish and yellowtail kingfish. Very powerful first run when hooked — needs heavy drag.',
    preferredConditions: 'SST 16–24°C; deep offshore reef and pinnacle structure 40–120m. West Coast and South Coast WA. Less commonly found inshore. Offshore ledges, canyon edges and deep pinnacles.',
    depth: '40–120m; most common at 50–90m near the base of vertical structure',
    techniques: 'Heavy slow-pitch jigging (100–200g) worked at the bottom near pinnacle base; live bait on deep paternoster dropped to 50–90m; large soft plastics on heavy jig heads worked slow. Use 80–150lb braid.',
    sounderSignatures: 'Deep reef pinnacles and walls; mid-water arching schools above base of structure 50–80m; thermocline layer visible on quality sounder; schools often at a specific depth band just above the bottom',
    latRange: [-35, -24],
    seasonality: 'Year-round on the West and South coasts; peak autumn–winter (Apr–Aug) when fish are shallower and most active. Winter fish in southern WA can be found at 40–60m, closer to the surface than summer.',
    tidePhase: 'Feeding peaks at tide changes — incoming and outgoing equally productive. Running tidal flow over deep structure activates the school. Slack water significantly reduces jigging success.',
    baitPreferences: '1. Slow-pitch jigs (100–200g, silver/blue or natural colours) at pinnacle base; 2. Live large herring or pilchard on deep paternoster; 3. Live slimy mackerel on ganged hooks at depth; 4. Large soft plastic paddle-tails (5–6 inch) on 80–100g jig heads; 5. Deep trolling with large bibbed minnow lures.',
  },

  'Tuskfish': {
    feedingBehaviour: 'Hard-biting demersal with prominent teeth adapted for crushing crustaceans, molluscs and other hard-shelled prey. Reef-associated across its wide WA range — from tropical coral to temperate rocky reef. Feeds actively across tidal phases. Solitary or small groups. Responds to bait more readily than lures. Will take soft plastics worked slowly along rubble ground. A quality table fish and a welcome bycatch while targeting other species.',
    preferredConditions: 'SST 18–26°C; reef and rubble habitat. West Coast from Abrolhos to Perth; also found through north coast. Broken reef, coral rubble and sand/rock interface are preferred habitat.',
    depth: '10–50m; commonly 15–35m on mixed reef and rubble',
    techniques: 'Bait fishing with fresh prawn (whole or half), crab flesh, or fresh squid on paternoster; soft plastics (3–5 inch creature baits) worked slowly along rubble transitions. Light-medium tackle.',
    sounderSignatures: 'Reef and rubble substrate transitions; fish arches tight to bottom on sounder; rubble zones visible as irregular bottom return between clean sand and hard reef',
    latRange: [-35, -13],
    seasonality: 'Year-round across its range; most active in warmer months (Oct–Apr) in southern WA. North Coast: year-round with dry-season peak (Apr–Oct).',
    tidePhase: 'Active through all tidal phases; feeding peaks at tide changes when current increases invertebrate activity. Dead slack water reduces feeding. Morning incoming tide is generally most reliable.',
    baitPreferences: '1. Fresh whole prawn (unpeeled, most effective); 2. Fresh crab flesh or whole small crab; 3. Fresh squid (small pieces or whole small squid); 4. Creature baits and crab-imitating soft plastics (3–5 inch) on 20–40g jig heads; 5. Fresh octopus tentacle.',
  },

  'Grass Emperor': {
    feedingBehaviour: 'Active reef and sandy-bottom feeder, hunts crustaceans and small fish on and around reef edges and rubble zones. Feeds across all tidal phases with peaks at tide changes and morning/evening. Less wary than other emperor species — will take lures and bait readily. Good table fish. School sizes vary from 5–30 fish. More abundant in northern waters but present throughout tropical and subtropical WA.',
    preferredConditions: 'SST 20–28°C; reef edges, rubble and sandy patches in tropical to subtropical WA. Common north of Shark Bay but present on the West Coast. Distributed across all WA bioregions north of 30°S.',
    depth: '10–60m on reef and rubble substrate; commonly 15–40m',
    techniques: 'Bottom bait fishing with prawn, fish flesh or squid on paternoster; soft plastics near reef edge. Use release weight at depth.',
    sounderSignatures: 'Reef and rubble substrate transitions on sounder; fish arches holding tight to bottom; reef edges visible on chart; often mixed with other emperor species',
    latRange: [-30, -13],
    seasonality: 'Year-round in tropical WA; best Apr–Oct dry season. More seasonal in south of range (Gascoyne); mainly Oct–Apr.',
    tidePhase: 'Feeding peaks at tide changes. Run-in tide is most productive — fish move onto rubble and reef edges to feed. Dead slack water is slowest.',
    baitPreferences: '1. Fresh prawn (whole small or half large); 2. Squid strips; 3. Fresh pilchard pieces; 4. Small soft plastic paddle-tails (3–4 inch) on 20–30g jig heads; 5. Small chunks of fresh fish (mullet or herring).',
  },

  'Bight Redfish': {
    feedingBehaviour: 'Schooling deep-water demersal that forms dense vertical schools near the seafloor at dawn and dusk, then scatters to feed individually at night. Feeds on molluscs, crustaceans and small fish. Readily takes baited rigs and jigs. Often found in very large aggregations at the continental shelf edge. Excellent table fish — commercially valued. Responds well to berley in deep water.',
    preferredConditions: 'Temperate southern WA and Great Australian Bight. Rocky reefs, pinnacles and the continental shelf edge. Found south of Lancelin through to the South Coast and Bight. Requires deeper, cooler water than most WA species.',
    depth: '10–500m; most commonly 120–200m on the continental shelf; can be found shallower (40–80m) in southern WA',
    techniques: 'Drift fishing over rocky outcrops and pinnacles in 80–200m; deep paternoster rigs with multiple octopus, squid or fresh fish baits; heavy slow-pitch jigging (200–400g). Release weight essential for barotrauma management at depth.',
    sounderSignatures: 'Dense vertical school arches 50–200m; tight to bottom or mid-water over rocky reef and pinnacles; continental shelf structure on bathymetric chart; school can fill 50–100m of water column',
    latRange: [-35, -31],
    seasonality: 'Year-round off south coast WA; most productive May–Sep (winter) when fish are more active and accessible in shallower depths. Some years produce exceptional fishing in 80–120m.',
    tidePhase: 'Schools form and ascend off the bottom at dawn and dusk — time anchoring to coincide with these movement periods for best results. Slack water tends to produce fish tighter to the bottom.',
    baitPreferences: '1. Whole fresh squid on large ganged hooks at depth; 2. Fresh octopus pieces; 3. Fresh whole pilchard or mullet strip at 100–200m; 4. Heavy slow-pitch jigs (200–400g, red/orange or silver colours); 5. Deep paternoster with multiple baited hooks.',
  },

  'Barramundi': {
    feedingBehaviour: 'Powerful ambush predator that lies behind structure (submerged logs, rocks, mangrove roots, rock bars) and strikes with explosive force. Most active at tide changes — best on the run-out tide through creek mouths as baitfish flush out. Activity peaks in early wet season (Oct–Dec) when water is warm and fish are spawning. Loud surface strikes are characteristic. Returns immediately to structure after striking — apply strong pressure.',
    preferredConditions: 'SST 24–32°C; tropical WA estuaries, rivers and tidal systems. Exmouth to Broome and Kimberley coast. Wet season (Oct–Apr) peaks activity. Clear to moderately turbid water in tidal systems. Rock bars, snag-filled pools and mangrove creek systems.',
    depth: '0.5–8m in estuaries, creeks and tidal rivers; nearshore reef to 20m by boat',
    techniques: 'Casting surface lures (poppers, walk-the-dog style) and subsurface jerkbaits tight to mangrove structure at dusk or first light; live mullet or herring on ganged hooks; slow-roll soft plastics along rock bars and snag edges. Use 40–80lb braid with heavy fluorocarbon leader.',
    sounderSignatures: 'Submerged snags and creek channel edges visible on sounder; thermoclines in tidal rivers after rain; bait schools at creek mouths on outgoing tide; rock bars show as hard bottom peaks on sounder',
    latRange: [-24, -13],
    seasonality: 'Year-round in tropical WA; peak Oct–Mar (wet season and post-wet) when water temperature is highest and barra are most aggressive. Sep–Oct pre-wet season produces large spawning fish. Dry season (Apr–Sep) sees fish congregating in deep holes.',
    tidePhase: 'Run-out tide through creek mouths and channel exits is THE prime feeding window — baitfish flush out on the outgoing current and barra ambush at the exit. Last 2 hours of the outgoing and first hour after low water. Incoming tide also produces fish on beach gutters and sand flats.',
    baitPreferences: '1. Live mullet (whole, 150–300g) on ganged hooks — most effective; 2. Surface poppers (50–100g) worked over structure at dusk; 3. Suspending jerkbaits (12–16cm) worked around snags with erratic pause action; 4. Live herring; 5. Large paddle-tail soft plastics (5–7 inch) on 20–40g jig heads near rock bars.',
  },

  'Black Jewfish': {
    feedingBehaviour: 'Large nocturnal predator also known as Mulloway or Mulloway-like jewfish in tropical WA. Feeds on baitfish, prawns and crustaceans in tidal channels and estuary edges at night. Responds to slow-rolling baits near the bottom. Solitary or small groups. Large fish (over 10kg) are mainly nocturnal. Makes a distinctive "drumming" sound. Size limit of 700mm TL makes this a size-selective fishery.',
    preferredConditions: 'SST 22–30°C; northern WA — Exmouth, Shark Bay, Pilbara and Kimberley coast. Tidal creek mouths, deep estuary holes and nearshore reefs. Tolerates brackish to full-marine salinity.',
    depth: '1–20m in estuaries; to 40m offshore at night',
    techniques: 'Live bait (whole mullet or herring, 200–400g) rigged nose-hooked and fished near bottom at night on running sinker; large soft plastics (5–8 inch paddle-tails) worked slowly along deep tidal channels; bait on running sinker through creek channels at night',
    sounderSignatures: 'Deep holes in tidal channels (4–8m is prime); bait schools at estuary edges at dusk; creek mouths and snag structure; fish often directly above deepest point of creek bend',
    latRange: [-27, -13],
    seasonality: 'Year-round in tropical WA; most accessible Apr–Oct (dry season) when water clarity improves. Spawning run during the wet season brings large fish into estuaries. Night tides in autumn are consistently best.',
    tidePhase: 'Night incoming tide through estuary channels is most productive — fish move in with the tide to feed. First 2 hours of the run-in is the prime window. Deep holes on the run-out also produce fish as baitfish are swept past.',
    baitPreferences: '1. Live whole mullet (200–400g) nose-hooked on running sinker — most effective; 2. Live herring on running sinker; 3. Large whole squid on heavy paternoster at night; 4. Large paddle-tail soft plastics (5–8 inch, white or natural); 5. Fresh prawn (whole, large) on size 3/0–5/0 circle hook.',
  },

  'King Threadfin': {
    feedingBehaviour: 'Powerful estuary predator with distinctive long pectoral fin threadlets used to sense bottom-dwelling prey (prawns, crabs, small fish). Most active on run-in tides over tidal flats and in shallow estuary channels. Strikes hard and runs powerfully. Feeds in turbid water more effectively than most species — the threadlets compensate for poor visibility. Schools of 5–20 fish common over sandy flats.',
    preferredConditions: 'SST 24–32°C; tropical WA estuaries and tidal rivers from Exmouth to Broome and Kimberley. Sandy and muddy estuary systems and tidal creek mouths. Tolerates very turbid water after rain.',
    depth: '1–10m in tidal systems; nearshore to 20m by boat',
    techniques: 'Bait fishing with fresh whole prawn (most reliable) or small whole fish on ganged hooks at estuary mouths; slow-pitch soft plastics (3–5 inch prawn-imitation) worked slowly along sandy bottom on incoming tide; live bait drifted across tidal flats by boat',
    sounderSignatures: 'Sandy and muddy bottom transitions in tidal estuaries; shallow channel edges 1–6m; incoming tide over tidal flats; creeks with sandy bottoms visible on chart; fish often over featureless sandy flats',
    latRange: [-24, -13],
    seasonality: 'Year-round in tropical WA; peak Oct–Mar (wet season) when fish spread onto flooded tidal flats. Dry season (Apr–Sep) concentrates fish in deeper estuary channels and creek bends.',
    tidePhase: 'Run-in tide over tidal flats is the prime feeding window — fish spread and feed as the water floods the flats. Mid to high incoming tide is most productive. Outgoing tide concentrates fish in creek channels.',
    baitPreferences: '1. Fresh whole large prawn — most consistent across all conditions; 2. Live small mullet or bream (100–200g); 3. Prawn-imitating soft plastics (3–4 inch) on 5–15g jig heads; 4. Fresh whole herring; 5. Mud crab pieces or whole small crab.',
  },

  'Tailor': {
    feedingBehaviour: 'Aggressive schooling predator with razor teeth that feeds on baitfish near the surface. Best feeding on dusk and night tides when schools push into gutters and channels. Responds strongly to berley with mashed pilchards. Can be heard splashing and "blitzing" baitfish in gutters. Will clean-cut through lighter leaders — use wire or heavy fluorocarbon. Schools of 10–200 fish common during peak runs.',
    preferredConditions: 'SST 14–22°C; surf beaches with gutters and sandbars, rocky headlands and channels. West Coast and South Coast WA. Peak winter–spring (May–Oct). Follows pilchard and whitebait migrations south in autumn.',
    depth: 'Surf zone to 10m; commonly in 0.5–3m in gutters',
    techniques: 'Casting metal slugs and hard-body lures into gutters; berley trail with mashed pilchards then whole pilchard on ganged hooks; surf rigs with whole pilchard. Use 30–60lb wire trace or heavy fluorocarbon — tailor bite through regular monofilament easily.',
    sounderSignatures: 'Visual identification of gutters, rips and current lines from shore; birds diving over surf zones indicate surface feeding; berley trail on surface with feeding tailor visible from the bank',
    latRange: [-35, -13],
    seasonality: 'Year-round on the West Coast; peak Jun–Oct (winter–spring) when large schools migrate south. South Coast: May–Sep. Summer fish smaller and in lighter numbers. The big winter run often starts at Two Rocks in June and moves south.',
    tidePhase: 'Last 2 hours before high tide to the first 2 hours of the run-out is the prime beach tailor window. Fish gutters on the run-out as water drains and concentrates bait. Night high tides in winter are classic big tailor conditions.',
    baitPreferences: '1. Whole fresh pilchard on ganged hooks in berley — most consistent; 2. Metal slug (30–60g, chrome) cast into gutters; 3. Hard-body minnow (8–14cm) retrieved through gutters fast; 4. Whole whitebait on ganged hooks; 5. Cut mullet strip on running sinker in a berley trail.',
  },

  'Australian Salmon (Western Australian Salmon)': {
    feedingBehaviour: 'Hard-fighting schooling predator that attacks baitfish aggressively in surf gutters and rocky headlands. Feeds during periods of active swell and strong tidal push. Schools of 50–500 fish common during the autumn–winter migration from the south. Surface feeding with splashing and jumping. Not highly regarded as table fish but an exceptional sportfish on light tackle.',
    preferredConditions: 'SST 12–20°C; surf beaches with strong gutters, rocky headlands and exposed bays. South-west WA peak season autumn–winter (May–Aug). Follows bait migrations along the south and south-west coast. Favours rough surf conditions.',
    depth: 'Surf zone to 10m; commonly in 1–5m in gutters and wash zones',
    techniques: 'Casting metal slugs (25–60g) and hard-body lures into gutters; fresh pilchard on paternoster or running sinker rig; rock fishing on exposed headlands during swell. 20–30lb monofilament or fluorocarbon.',
    sounderSignatures: 'Visual identification of gutters, rips and current lines from shore; not typically sounder-targeted; surface schools visible from headlands; birds diving in surf indicate bait and salmon activity',
    latRange: [-35, -28],
    seasonality: 'Autumn–winter (Apr–Aug) on the West and South coasts; peak May–Jul for large school run. Schools arrive at Albany area in late March–April, moving north along the coast through winter. Offshore fish year-round.',
    tidePhase: 'Active on any swell-driven swell and surf conditions; feeding is best on the incoming tide in surf zones when bait is pushed into gutters. Strong southerly swells often activate schools on exposed beaches.',
    baitPreferences: '1. Whole fresh pilchard on ganged hooks — most reliable bait; 2. Metal slugs (30–60g, chrome or silver); 3. Hard-body lures (10–14cm) retrieved through gutters; 4. Fresh herring or whitebait on ganged hooks; 5. Small cut mullet strip on circle hook.',
  },

  'Yellowfin Whiting': {
    feedingBehaviour: 'Bottom feeder on sandy flats that hunts worms, pipis, small crustaceans and tiny invertebrates on warm sandy substrate. Feeds by pushing through the sand with its snout. Active on warm incoming tides over shallow sand flats — follows the tide edge as it floods over sand. Schools of 10–50 fish common. Small hooks and light line essential for best results.',
    preferredConditions: 'SST 16–24°C; shallow sandy beaches, estuaries and tidal flats in southern and western WA. Widespread from Shark Bay to south coast. Best in warm, calm conditions.',
    depth: '0.5–4m on sandy substrate; often very shallow (less than 1m)',
    techniques: 'Running sinker or paternoster rig with size 6–8 long-shank hook and worm, pipi or fresh prawn bait; ultra-light 2–4lb gear for best sport and sensitivity. Cast into very shallow water near the tide line.',
    sounderSignatures: 'Sandy flats clearly visible in shallow water (often visual identification from the boat); incoming tide flooding over warm sand; featureless beach terrain often most productive',
    latRange: [-35, -13],
    seasonality: 'Year-round; best Nov–Apr (summer) when water is warmest over the shallow sandy flats. South coast: Dec–Mar is prime. Perth metro beaches: Oct–Apr.',
    tidePhase: 'Incoming tide over warm sandy flats is the prime fishing window — fish the tide edge as it floods the sand. High tide on sunny afternoons when sand has warmed through the day is consistently excellent.',
    baitPreferences: '1. Whole beach worm or bloodworm — best bait for large fish; 2. Pipi (beach cockle) extracted and halved; 3. Small fresh prawn (whole or half peeled); 4. Sand yabby (nipper) on size 8 long-shank; 5. Very small soft plastic (2 inch shad) on 5–8g jig head.',
  },

  'Trevally': {
    feedingBehaviour: 'Schooling predator feeding on baitfish, squid and crustaceans in currents and gutters. Active on tidal changes. "Trevally" in WA primarily refers to silver trevally (Pseudocaranx georgianus) — a common inshore schooling species. Feeds across the water column but most responsive near the surface in gutters and around structure.',
    preferredConditions: 'SST 16–26°C; rocky shores, beach gutters, estuaries and nearshore reef. Widespread along the WA coast. Particularly common around rocky headlands and reef edges.',
    depth: '0–20m in surf zone or estuaries; 5–30m offshore',
    techniques: 'Casting lures (10–20g metals, small hard bodies) near rocky structure; bait fishing with prawn or pilchard on light tackle; soft plastics on light jig heads. 6–15lb leader.',
    sounderSignatures: 'Visual reading of gutters and current channels from shore; reef and rocky structure on chart; bait schools near structure on sounder; current lines visible on water surface',
    latRange: [-35, -13],
    seasonality: 'Year-round; most accessible Nov–Apr when schools push closer inshore in warm water. Winter fish are present but more scattered.',
    tidePhase: 'Incoming tide through gutters and reef channels is most productive. Running tide concentrates bait and activates trevally. Slack water is poor.',
    baitPreferences: '1. Small metal slices (10–20g, chrome or silver); 2. Small whole prawn on size 4–6 hook; 3. Pilchard pieces in a light berley; 4. Small soft plastic paddle-tails (2–3 inch); 5. Small whole herring on running sinker.',
  },

  'Australian Herring': {
    feedingBehaviour: 'Small, scrappy schooling fish also known as "Tommy Ruff" in WA. Feeds on plankton, small crustaceans and invertebrates in shallow reef and beach environments. Forms dense schools that can be seen from shore. Highly responsive to berley. Commonly caught as live bait for larger species (Mulloway, Tailor, Dhufish). One of the most common fish caught from Perth beaches and jetties.',
    preferredConditions: 'SST 14–22°C; shallow reefs, beaches, estuaries and jetties. Perth metro beaches and south-west WA. Year-round with peak in autumn–winter.',
    depth: '1–5m; most caught in very shallow water',
    techniques: 'Small hooks (size 10–12) with dough bait or piece of prawn under a small float; light berley with bread or commercial pellets; sabiki rigs for fast bait collection; 2–4lb light line',
    sounderSignatures: 'Visual observation from shore or jetty; schooling fish visible in clear water; berley trail on surface attracts fish',
    latRange: [-35, -26],
    seasonality: 'Year-round on the West Coast; peak Apr–Aug (autumn–winter) when large schools are most accessible from shore. Perth jetties (Fremantle Fishing Boat Harbour, Bicton baths) are reliable.',
    tidePhase: 'Active across all tides; most catchable on the incoming tide when schools push onto shallow reef and jetty structures. Berley works in any tidal state.',
    baitPreferences: '1. Dough bait (bread dough ball on size 12 hook); 2. Tiny prawn pieces; 3. Pilchard flesh (very small pieces); 4. Commercial herring pellets; 5. Sabiki rig — most efficient for catching live bait quickly.',
  },

  'Garfish': {
    feedingBehaviour: 'Surface-swimming schooling fish with a long lower jaw. Feeds on algae, plankton and small invertebrates near the water surface. Schools gather in sheltered bays, estuaries and at jetties particularly in spring–summer. Responds very quickly to bread-based berley — schools appear at the berley trail within minutes. Delicate, fine-boned table fish highly prized for eating.',
    preferredConditions: 'SST 14–22°C; sheltered bays, estuaries, jetties and beaches. Southern and south-west WA. Estuarine and nearshore environments in sheltered water.',
    depth: 'Surface to 3m; almost exclusively near the surface',
    techniques: 'Light berley trail with bread or pilchard oil; tiny size 12–14 long-shank hook baited with bread dough or small prawn under a small float; sabiki rigs with tiny hooks. Requires patience and very light gear (1–3lb line).',
    sounderSignatures: 'Schooling fish clearly visible near the surface in calm water from boats; best identified visually — finning and schooling near the surface; berley trail on the surface attracting fish',
    latRange: [-35, -26],
    seasonality: 'Year-round in southern WA; peak spring–summer (Sep–Feb) when large schools form in sheltered bays. Rottnest Island bays, Cockburn Sound and Mandurah estuaries are reliable in spring.',
    tidePhase: 'Incoming tide on calm days is most productive for jetty and beach fishing. Schools are most accessible during calm, clear conditions — wind and chop disperse them.',
    baitPreferences: '1. Bread dough (plain white bread compressed onto tiny hook); 2. Tiny pieces of raw prawn; 3. Small pilchard flesh (1cm squares); 4. Sabiki rig with tiny hooks baited with bread; 5. Tiny soft plastic shads (1–2 inch) retrieved very slowly at the surface.',
  },

  'Bream': {
    feedingBehaviour: 'Versatile demersal feeder that hunts worms, crustaceans, molluscs and small fish in estuaries, rivers and nearshore reef. Active on incoming night tides in estuaries, particularly during warm months. Most responsive to slow, natural presentations. Wary and selective — lighter leaders and small hooks improve strike rate significantly. Targets include black bream (Acanthopagrus butcheri) and yellowfin bream (A. australis).',
    preferredConditions: 'SST 14–24°C; estuaries, tidal rivers, nearshore reefs and rocky headlands. Widespread across coastal WA. Swan and Canning Rivers produce large black bream. Peel Inlet and Mandurah Estuary are premier locations.',
    depth: '0–15m in estuaries and nearshore; most productive in 1–6m',
    techniques: 'Soft plastics (2–4 inch worm or shad) on light jig heads (5–10g) near structure; bait on paternoster or running sinker (prawns, worms, pilchard); lures near structure at night. Use 6–15lb fluorocarbon leader.',
    sounderSignatures: 'Structure and drop-offs in estuaries; rock bars, weed beds and jetty pylons visible; fish arches near bottom around structure; night fishing shows fish higher in the water column',
    latRange: [-35, -13],
    seasonality: 'Year-round; peak spawning and feeding activity Oct–Dec (spring) in estuaries. Night tides in Oct–Jan are particularly productive in estuarine environments. Winter: fish concentrate in deeper channels.',
    tidePhase: 'Incoming night tide is the prime bream fishing window — fish move up from deep channels onto flats and structure to feed. High water at night is the peak. Outgoing late in the session also good. Slack water during the day is least productive.',
    baitPreferences: '1. Live or fresh prawn (half or whole, most consistent); 2. Worms (bloodworm, beach worm); 3. Small soft plastic worms and shads (2–4 inch); 4. Small whole herring or whitebait; 5. Pilchard flesh on small hook in berley.',
  },

  'Silver Bream': {
    feedingBehaviour: 'Schooling estuarine bream (also called pikey bream in WA) that feeds on worms, crustaceans, algae and small invertebrates on sandy and weedy substrate. Very active and aggressive feeder — easier to catch than black or yellowfin bream. Forms large schools in sheltered bays and estuaries. Good table fish, particularly when smoked.',
    preferredConditions: 'SST 14–24°C; sandy estuaries, nearshore beaches and shallow coastal bays. South and west coast WA, particularly inside Cockburn Sound, Peel Inlet and estuaries.',
    depth: '0.5–8m on sandy and weedy bottom; most caught in 1–4m',
    techniques: 'Light paternoster or running sinker rig with size 6–8 hook; worm, prawn or dough bait; ultra-light lures. 3–6lb monofilament or fluorocarbon. Simple and accessible from beach and jetty.',
    sounderSignatures: 'Sandy and weedy bottom in shallow estuaries; visual spotting of schooling fish over sand in clear water; schools often visible near the surface',
    latRange: [-35, -26],
    seasonality: 'Year-round in sheltered estuaries; most accessible Oct–Apr (spring–summer) when schools move into very shallow water. Peel Inlet and Mandurah Estuary peak Oct–Dec.',
    tidePhase: 'Incoming tide is most productive — schools push onto sandy flats with rising water. High water at mid-tide is a reliable feeding window for shore-based anglers.',
    baitPreferences: '1. Small prawn (half, peeled or unpeeled); 2. Beach worm or bloodworm; 3. Bread dough on size 8–10 hook with berley; 4. Pipi (halved) on size 6 hook; 5. Small soft plastic shad (1.5–2.5 inch) on 5g jig head.',
  },

  'King George Whiting': {
    feedingBehaviour: 'Highly regarded table fish in southern WA. Sandy-bottom feeder that hunts worms, pipis, small crabs and shrimp on clean sandy substrate. Feeds by pushing its snout into the sand to dislodge invertebrates. Active feeder on warm incoming tides over shallow sand. Schools of 5–50 fish common. A finicky biter that requires small hooks and light lines for best results. The most prized recreational catch in southern WA.',
    preferredConditions: 'SST 14–22°C; clean sandy beaches, bays, estuaries and nearshore sand flats. South and south-west WA from Shark Bay to the Great Australian Bight. Geographe Bay, Cockburn Sound, Esperance and Lucky Bay are prime areas.',
    depth: '1–10m on clean sand; occasionally to 20m over offshore sand patches',
    techniques: 'Running sinker or paternoster rig with size 4–8 long-shank hook; pipi (most effective), bloodworm or fresh prawn bait. Presentation is key — use minimum weight to present bait naturally on the sand. Light 4–8lb monofilament.',
    sounderSignatures: 'Clean sandy bottom (featureless sand signals KGW habitat); incoming tide over warm shallow sand visible on temperature overlay; drift over large sandy flats and move when no activity',
    latRange: [-35, -26],
    seasonality: 'Year-round in southern WA; peak Nov–Apr (spring–summer) when water temperature is in the ideal range over shallow sand. Geographe Bay peak is Dec–Mar. Peel Inlet and Mandurah excellent Nov–Feb.',
    tidePhase: 'Incoming tide flooding warm sand flats is the classic KGW setup. As the tide comes in over sand that has been warmed by the sun, KGW move in behind it to feed. High incoming tide mid-afternoon on sunny days is consistently the best window.',
    baitPreferences: '1. Pipi (beach cockle, halved) — the #1 bait for KGW; thread onto size 6–8 long-shank hook; 2. Whole live beach or bloodworm on size 6–8 long-shank; 3. Fresh prawn (peeled, half-sized pieces) on size 6 hook; 4. Sand yabby (nipper) on size 8 long-shank; 5. Very small soft plastic nymph or shrimp (2 inch) on 5g jig head.',
  },

  'Whiting': {
    feedingBehaviour: 'Sandy-bottom feeder hunting worms, small crustaceans and invertebrates on warm tidal flats. "Whiting" in WA generally refers to sand or summer whiting (Sillago species). Feeds by probing the sand with its snout on incoming tides. Schools of 10–100 fish common over sandy beaches. Good table fish and fun on light gear.',
    preferredConditions: 'SST 14–24°C; shallow sandy beaches and bay estuaries. Widespread along WA coast, particularly from Perth north. Beach and estuary environments.',
    depth: '0.5–6m on clean sand; usually in very shallow water',
    techniques: 'Running sinker or paternoster with size 6–8 long-shank hooks and worm or prawn bait; ultra-light 3–6lb gear.',
    sounderSignatures: 'Clean sandy flats; warm water over sand visible with temperature overlay on chart plotter; featureless beach terrain near gutters and sand banks',
    latRange: [-35, -13],
    seasonality: 'Year-round; best Oct–Mar (summer) over warm shallow sand. Tropical WA: year-round. Southern WA: spring–summer is prime.',
    tidePhase: 'Incoming tide over warm sandy flats is the prime window. Fish follow the tide in to feed on the sand — the tide edge is where they concentrate.',
    baitPreferences: '1. Bloodworm or beach worm (whole or half); 2. Small pieces of fresh prawn; 3. Pipi (halved); 4. Sand yabby; 5. Very small soft plastic (1.5–2 inch) on 3–5g jig head.',
  },

  'Flathead': {
    feedingBehaviour: 'Ambush predator that lies flat and camouflaged on sandy and muddy bottom. Attacks passing fish and crustaceans from its hiding position. Most active at night and during low-light conditions (dawn/dusk). Feeds on the incoming tide in estuaries, particularly when baitfish are pushed over the sand. Solitary. Size varies significantly — dusky flathead (Platycephalus fuscus) in northern WA reach 1m; southern flathead species are smaller.',
    preferredConditions: 'SST 12–22°C; sandy and muddy estuaries, nearshore beaches and tidal channels. Widespread from Kimberley to the south coast. Most common in Perth metro estuaries (Swan River, Peel Inlet, Harvey Estuary).',
    depth: '0.5–10m in sandy areas; most caught in 1–4m',
    techniques: 'Soft plastics (3–5 inch paddle-tails or grub tails) worked slowly along bottom with intermittent pauses; bait rigs (prawn or fish strip) on paternoster near bottom; light jig heads (7–15g). Retrieve must be slow and ground-hugging — flathead hit on the pause.',
    sounderSignatures: 'Sandy bottom transitions near structure and weed edges; estuary drop-offs where sand meets weed or mud; tidal channels where flathead ambush bait on the current',
    latRange: [-35, -13],
    seasonality: 'Year-round; peak Oct–Mar (summer) in Perth estuaries when flathead are most active in warm water. Night sessions Dec–Feb with warm water are most productive. Winter fish are present but slower.',
    tidePhase: 'Incoming tide over sandy flats is most productive — flathead move up from deeper water to ambush baitfish pushed over the sand. Last 2 hours of the incoming and first hour after high tide are peak periods.',
    baitPreferences: '1. Live medium prawn (50–80mm, whole) — most natural and effective; 2. Paddle-tail soft plastic (3–5 inch) in natural colours (motor oil, sand) on 10–20g jig head; 3. Fresh fish strip (herring or tailor belly) on paternoster near bottom; 4. Small live herring; 5. Grub tail soft plastic on 7–10g jig head worked slowly.',
  },

  'Mulloway': {
    feedingBehaviour: 'Large nocturnal predator (also known as Jewfish) that peaks in activity during the first two hours of the run-out tide. Responds to berley in rivers and responds to the vibrations of live bait. Very sensitive to angler noise and boat movement — use stealth. Feeds on live herring, mullet and large soft plastics that produce vibration. Large fish (over 10kg) are predominantly nocturnal and feed in deep river holes and surf gutters.',
    preferredConditions: 'SST 14–22°C; river mouths, estuaries, harbour structures and nearshore reefs. South and west coast WA. Swan River, Peel Inlet, Mandurah estuary, beaches south of Perth. Night fishing is most productive.',
    depth: '1–20m; river mouths 3–10m; surf gutters 1–4m',
    techniques: 'Live bait (herring or mullet, whole, 150–300g) on running sinker at night with light berley; large soft plastics (5–8 inch paddle-tails) worked slowly at depth; large hard-body minnows near structure. Use 40–80lb fluorocarbon leader.',
    sounderSignatures: 'Deep river holes and channel edges on sounder (4–10m pockets under berley); bait schools in estuaries at dusk visible; creek mouth structure; fish arches near bottom in channels at night',
    latRange: [-35, -26],
    seasonality: 'Year-round on the West Coast; peak spawning and feeding Nov–Feb (summer) when schools enter estuaries. Night tides in Dec–Mar are most productive for large fish. Winter fish retreat to offshore reefs.',
    tidePhase: 'First 2 hours of run-out tide is the classic mulloway setup — fish at the drop on a running berley. Deep holes in river bends are prime as bait flushes past. Night incoming tide also produces well, particularly in the surf zone.',
    baitPreferences: '1. Live whole herring (150–200g) on running sinker at night — most effective; 2. Live whole mullet (200–350g) nose-hooked; 3. Large paddle-tail soft plastic (5–8 inch, white or natural) on 40–60g jig head; 4. Large hard-body minnow (14–18cm) retrieved slowly near bottom; 5. Fresh whitebait on ganged hooks with berley at river mouth.',
  },

  'Flounder': {
    feedingBehaviour: 'Flat ambush predator that buries itself in sand with only eyes exposed. Attacks small fish and crustaceans that come within range. Most active at night and during the two hours before and after dawn. Feeds on incoming tides over sandy and weedy bottoms. Can change colour to match substrate perfectly. Very localised — moves little once settled on a sand patch.',
    preferredConditions: 'SST 12–20°C; shallow sandy bays, estuaries and tidal flats in southern and south-west WA. Perth metro beaches (Cockburn Sound, Warnbro Sound). Best in clear, shallow water.',
    depth: '0.5–5m on sandy substrate; most caught in 1–2m at night',
    techniques: 'Bait on running sinker dragged slowly along sandy bottom (prawn or fish strip); slow-retrieve soft plastics along sand; night spotting with headlamp in shallow clear water (then spearing or dipping with net where legal). Dragging a prawn bait behind an extremely slow boat in 1–2m is very effective.',
    sounderSignatures: 'Flat sandy bottom transitions; shallow bay areas at night; visual spotting in clear water from boat with torch',
    latRange: [-35, -26],
    seasonality: 'Year-round; most accessible Nov–Mar (summer) when large populations move into shallow bays at night. Night high tides from Oct–Mar over Cockburn Sound sand flats are prime.',
    tidePhase: 'Night incoming tide is the prime window — flounder follow the tide edge over warm sandy flats to feed. High water at night in summer over shallow sand is consistently excellent.',
    baitPreferences: '1. Fresh whole prawn (medium) dragged slowly along sand bottom; 2. Prawn-imitating soft plastic (3 inch) dragged or hopped on sand; 3. Fresh fish strip (herring belly) on size 4–6 hook dragged along bottom; 4. Small whole herring on running sinker; 5. Sand yabby (nipper) on size 6 hook.',
  },

  'Mangrove Jack': {
    feedingBehaviour: 'Aggressive ambush predator found in mangrove-lined estuaries and tidal creeks. Strikes with explosive force from a hiding position and immediately bolts back into structure — the angler must stop the fish with strong drag pressure in the first second or the line is cut. Most active at dusk and through the night on outgoing tides. Territorial — one or two fish per snag. Will re-use the same ambush location day after day.',
    preferredConditions: 'SST 24–32°C; tropical WA estuaries — Exmouth to Broome and Kimberley. Mangrove-lined creeks, tidal rivers and associated nearshore reef. Needs water temperature above 24°C to be active.',
    depth: '0.5–10m; prefers 1–4m of water over submerged roots and structure',
    techniques: 'Cast lures and soft plastics (2–4 inch paddle-tails on 10–20g jig heads) tight to mangrove roots — within 10–30cm. Hard-body diving minnow (8–12cm) cast to roots and retrieved with pause action. Live bait (herring, mullet 100–200g) drifted close to structure. Use 30–60lb braid with 40–60lb fluorocarbon leader and lock the drag tight.',
    sounderSignatures: 'Shallow tidal creek channels on chart (1–5m); submerged root systems visible on sounder in clear water; visual reading of mangrove edges at low tide; look for undercut banks and log jams',
    latRange: [-24, -13],
    seasonality: 'Year-round in tropical WA; peak Oct–Mar (wet season and post-wet) when water temperature is highest and fish are most aggressive. Sep–Oct pre-wet season produces large fish patrolling tidal systems. Dry season fish are catchable but less aggressive.',
    tidePhase: 'Outgoing tide is the #1 mangrove jack window — fish station at the exit of tidal creeks as baitfish flush out with the falling water. Last 2 hours of the run-out and the hour around low tide are prime. Night outgoing tides are the most reliable combination.',
    baitPreferences: '1. Live small herring or mullet (100–200g) on running sinker near roots — most effective for big fish; 2. Paddle-tail soft plastic (3–4 inch, dark colours: brown, black, motor oil) on 15–20g jig head cast tight to roots; 3. Bibbed minnow (8–12cm, natural baitfish colours) worked near structure; 4. Live prawn near mangrove roots at night; 5. Small whole fresh crab or piece of crab on size 3/0 circle hook.',
  },
}
