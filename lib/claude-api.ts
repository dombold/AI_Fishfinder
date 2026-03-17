import Anthropic from '@anthropic-ai/sdk'
import { SPECIES_KNOWLEDGE } from '@/lib/species'
import { getRegulations, getBioregion } from '@/lib/regulations'
import type { DayMarineData, TideEvent, PeriodSummary } from '@/lib/marine-api'
import { validateWaypoints } from '@/lib/seafloor'
import type { CrowdSummary } from '@/lib/crowd-source-aggregator'

export interface WindPeriodRow {
  timePeriod: string
  windDirection: string
  windSpeed: string
  swellHeight: string
  swellPeriod: string
  swellDirection: string
  rating: 'BEST WINDOW' | 'GOOD' | 'IMPROVING' | 'AVERAGE' | 'FISHABLE' | 'DETERIORATING'
}

export interface OceanReading {
  parameter: string
  reading: string
  assessment: string
}

export interface FishingPhase {
  phase: 'Start' | 'Run' | 'Repeat' | 'Prime' | 'Late' | 'Adapt' | 'Pack Up'
  time: string
  action: string
  speed: string
  notes: string
}

export interface Waypoint {
  name: string
  latitude: number
  longitude: number
  depth?: string
  notes: string
}

export interface DailyPlan {
  date: string
  header: {
    dataSources: string[]
    moonPhase: string
    moonIllumination: number
    sunrise: string
    sunset: string
    moonrise: string
    moonset: string
    pressureTrend: string
    bioregion: string
  }
  windTable: WindPeriodRow[]
  oceanConditions: OceanReading[]
  fishingPlan: FishingPhase[]
  waypoints: Waypoint[]
  biteTimingNotes: string
}

function formatTides(tides: TideEvent[]): string {
  if (!tides.length) return 'Tide data unavailable'
  return tides.map(t => {
    const time = new Date(t.time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${t.type} ${t.height.toFixed(1)}m at ${time}`
  }).join(' | ')
}

function formatPeriods(periods: PeriodSummary[]): string {
  return periods.map(p =>
    `${p.label}: Wind ${p.windDirection} ${p.windSpeed} (gusts ${p.windGusts}), Swell ${p.swellHeight} @ ${p.swellPeriod} from ${p.swellDirection}, SST ${p.sst}, Pressure ${p.pressure}, Rain ${p.precipitation}`
  ).join('\n')
}

function buildSpeciesBlock(speciesNames: string[], lat: number, lng: number): string {
  return speciesNames.map(name => {
    const knowledge = SPECIES_KNOWLEDGE[name]
    const regs = getRegulations(name, lat, lng)
    if (!knowledge) return `### ${name}\n- Knowledge: Not available — use general WA fishing knowledge\n`

    const regBlock = regs
      ? `- Regulations: MLS ${regs.minSize ?? 'None'} | Bag limit: ${regs.bagLimit}${regs.combinedLimit ? ` | Combined: ${regs.combinedLimit}` : ''}${regs.closureActive ? `\n  ⛔ CLOSURE ACTIVE: ${regs.closureReason}` : ''}${regs.notes ? `\n  Note: ${regs.notes}` : ''}`
      : '- Regulations: Verify at fish.wa.gov.au'

    return `**${name}** | behaviour: ${knowledge.feedingBehaviour} | conditions: ${knowledge.preferredConditions} | depth: ${knowledge.depth} | season: ${knowledge.seasonality} | tides: ${knowledge.tidePhase} | bait: ${knowledge.baitPreferences} | techniques: ${knowledge.techniques} | sounder: ${knowledge.sounderSignatures}
${regBlock}`
  }).join('\n\n')
}

function buildCrowdBlock(summary: CrowdSummary): string {
  const trendIcon = { increasing: '↑', stable: '→', decreasing: '↓' }
  const speciesLines = summary.topSpecies.slice(0, 6).map(s =>
    `- ${s.species}: ${s.totalSightings} sightings | last 30d: ${s.last30Days} | trend: ${trendIcon[s.trend]} ${s.trend.toUpperCase()} | area centroid: ${Math.abs(s.avgLat).toFixed(2)}°S, ${s.avgLng.toFixed(2)}°E`
  ).join('\n')

  const hotspotLines = summary.hotspots.slice(0, 6).map((h, i) => {
    const userCount = h.userCount ?? h.count  // undefined = legacy summary, treat as all-user
    const isApprox = userCount < h.count * 0.5
    const label = isApprox ? ' ⚠ approx. area (newsletter)' : ''
    return `- Hotspot ${i + 1}: ${Math.abs(h.centerLat).toFixed(3)}°S, ${h.centerLng.toFixed(3)}°E — ${h.count} observations (${userCount} user GPS)${label} — species: ${h.species.slice(0, 3).join(', ')} — last seen: ${h.lastSeen}`
  }).join('\n')

  const updatedDate = summary.generatedAt.slice(0, 10)
  return `## Crowd-Sourced Fishing Intelligence (${summary.bioregion} Bioregion)
Source: ${summary.catchLogCount} verified angler reports (includes RecFishWest newsletter + user GPS logs). Data window: last 180 days. Updated: ${updatedDate}.

### Species Activity (ranked by recent sightings)
${speciesLines || '- No matched species observations in this bioregion yet.'}

### Hotspot Clusters
${hotspotLines || '- No hotspot clusters identified yet.'}

Use this crowd-sourced data to: (1) weight waypoint placement toward confirmed hotspot clusters — ONLY clusters without an "approx. area" warning have precise GPS coordinates suitable for waypoint placement; clusters marked "approx. area (newsletter)" indicate general fishing zones from area-level reports, not specific spots; (2) flag any "increasing" trend species as bonus targets; (3) reference hotspot coordinates in waypoint notes, noting approximate ones as general areas only.`
}

const DAILY_PLAN_SCHEMA = `DailyPlan {
  date: "YYYY-MM-DD",
  header: { dataSources: string[], moonPhase: string, moonIllumination: number, sunrise: "HH:MM", sunset: "HH:MM", moonrise: "HH:MM", moonset: "HH:MM", pressureTrend: "rising|falling|steady", bioregion: "North Coast|Gascoyne Coast|West Coast|South Coast" },
  windTable: [{ timePeriod: string, windDirection: string, windSpeed: string, swellHeight: string, swellPeriod: string, swellDirection: string, rating: "BEST WINDOW|GOOD|IMPROVING|AVERAGE|FISHABLE|DETERIORATING" }],
  oceanConditions: [{ parameter: string, reading: string, assessment: string }],
  fishingPlan: [{ phase: "Start|Run|Repeat|Prime|Late|Adapt|Pack Up", time: "HH:MM", action: string, speed: string, notes: string }],
  waypoints: [{ name: string, latitude: number, longitude: number, depth?: string, notes: string }],
  biteTimingNotes: string
}`

export async function generateFishingPlan(params: {
  latitude: number
  longitude: number
  startDate: string
  endDate: string
  fishingType: string
  targetType: string
  selectedSpecies: string[]
  sounderType: string
  seasicknessTolerance: number
  marineDataByDay: DayMarineData[]
  nearbyBoatRamps: Array<{ name: string; distanceKm: number; region?: string }>
  locationDepth: number | null
  nearbyReefs: Array<{ name: string; type: string; distanceKm: number; depth_min?: number; depth_max?: number; substrate?: string; features?: string[]; species?: string[]; notes?: string }>
  chlorophyll: number | null
  salinity: number | null
  crowdSummary: CrowdSummary | null
}): Promise<DailyPlan[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const bioregion = getBioregion(params.latitude, params.longitude)
  const bioregionName = { 'north-coast': 'North Coast', gascoyne: 'Gascoyne Coast', 'west-coast': 'West Coast', 'south-coast': 'South Coast' }[bioregion]

  const systemPrompt = `You are an expert Western Australia fishing guide, marine analyst and captain with 20+ years of experience fishing WA waters. You produce detailed, accurate daily fishing plans used by professional charter boat captains.

Your plans are data-driven: you interpret marine conditions (wind, swell, tides, SST, currents, pressure, moon phase) to produce actionable, time-specific guidance for each species selected.

Output ONLY a valid JSON array of DailyPlan objects — one per fishing day. No prose, no markdown, no explanation. Just the JSON array.

Key WA fishing knowledge:
- Pelagic fish respond to temperature breaks, current edges, and bait schools
- Demersal fish respond to tide phase, bottom structure, and moon phase
- Swell > 2m significantly impacts beach fishing; > 2.5m impacts small boat safety
- Wind > 20 kts deteriorates most fishing in WA
- Morning flood (incoming) tides are typically the prime window on the WA coast
- Falling pressure (> 2 hPa drop over 3 hrs) often triggers feeding frenzies before a front
- Always incorporate the WA fishing regulations provided into your plan narrative
- Flag any active closures prominently in the fishingPlan notes
- Waypoints must be realistic, within 60km of the session location, using accurate WA coordinates
- CRITICAL: ALL waypoints must be in open water (ocean, bay, sound, or estuary). Never place waypoints on land, beaches, islands, or reefs above the waterline
- Use the seafloor context provided to place waypoints at appropriate depths for each target species
- Demersal species require bottom structure — anchor waypoints to named reefs or banks when provided in context
- TECHNIQUE EXCLUSIVITY: Within any single fishingPlan phase, only ONE primary fishing method may be active. Trolling (moving at speed) is physically incompatible with stationary techniques (bait fishing, jigging, bottom fishing, anchoring, drifting) — never recommend both simultaneously within the same phase
- If the target species mix requires different techniques (e.g. trolling for pelagics + jigging for demersals), allocate them to SEPARATE phases with explicit transition instructions (e.g. "finish trolling run → cut engines → anchor → switch to bait rigs")
- Use chlorophyll-a level to assess bait concentrations: high (>1 mg/m³) = productive green water likely holding baitfish schools; moderate (0.3–1 mg/m³) = normal open-water conditions; low (<0.3 mg/m³) = clear bluewater requiring wider trolling patterns and attractors`

  const userPrompt = `Generate a complete daily fishing briefing card plan for this session. Return a JSON array of DailyPlan objects.

## Session Details
- Location: ${params.latitude}°S, ${params.longitude}°E — ${bioregionName} Bioregion
- Fishing Type: ${params.fishingType.toUpperCase()}
- Target Category: ${params.targetType.toUpperCase()}
- Target Species: ${params.selectedSpecies.join(', ')}
${params.sounderType === 'NONE' ? '- Sounder: None — the angler has no fish finder. Omit all sounder operation tips. Focus guidance on visual cues, chart reading, and anchor/berley techniques instead.' : `- Sounder: ${params.sounderType} (tailor sounder-specific recommendations to this brand)`}
- Seasickness Tolerance: ${params.seasicknessTolerance}/5 (${params.seasicknessTolerance <= 2 ? 'stay within 5km of shore, sheltered water only' : params.seasicknessTolerance === 3 ? 'moderate offshore capability, avoid 2.5m+ swell' : 'offshore capable, comfortable in up to 2m swell'})
- Date Range: ${params.startDate} to ${params.endDate}

## Launch Point
${params.nearbyBoatRamps.length > 0
  ? params.nearbyBoatRamps.map((r, i) => `${i + 1}. ${r.name} — ${r.distanceKm.toFixed(1)}km away`).join('\n') +
    '\nRecommend the most suitable ramp in the "Start" phase action and notes.'
  : 'No public boat ramps within 20km. Assume beach launch — include surf/sand launch advice in the Start phase notes.'}

## Ocean Context
- Depth at pinned location: ${params.locationDepth !== null ? `${Math.abs(params.locationDepth)}m` : 'Unknown'}
- Chlorophyll-a: ${params.chlorophyll !== null
  ? `${params.chlorophyll} mg/m³ — ${params.chlorophyll > 1.0 ? 'elevated (productive green water, active food chain, likely baitfish aggregations)' : params.chlorophyll > 0.3 ? 'moderate (normal open-water conditions)' : 'low (clear bluewater — use wider trolling patterns and attractors)'}`
  : 'Unavailable'}
- Surface Salinity: ${params.salinity !== null ? `${params.salinity} PSU` : 'Unavailable (nearshore or no data)'}
${params.nearbyReefs.length > 0
  ? '- Nearby reefs/structures:\n' + params.nearbyReefs.map(r => {
      const depth = r.depth_min != null ? `, ${r.depth_min}–${r.depth_max}m` : ''
      const spp = r.species?.length ? ` — targets: ${r.species.slice(0, 3).join(', ')}` : ''
      const note = r.notes ? ` — ${r.notes}` : ''
      return `  • ${r.name} (${r.type}${depth}, ${r.distanceKm.toFixed(1)}km away${spp}${note})`
    }).join('\n')
  : '- No named reef features within 20km — focus on depth contours and current edges.'}
Use this ocean context to place waypoints at realistic depths and advise on likely bait concentrations.

${params.crowdSummary ? buildCrowdBlock(params.crowdSummary) + '\n' : ''}
## Marine Conditions by Day
${params.marineDataByDay.map(day => `
### ${day.date}
**Moon:** ${day.moonPhase} (${day.moonIllumination}% illumination) | Rise: ${day.moonrise ? new Date(day.moonrise).toLocaleTimeString('en-AU', {hour:'2-digit',minute:'2-digit',hour12:false}) : 'N/A'} | Set: ${day.moonset ? new Date(day.moonset).toLocaleTimeString('en-AU', {hour:'2-digit',minute:'2-digit',hour12:false}) : 'N/A'}
**Sun:** Rise ${day.sunrise ? new Date(day.sunrise).toLocaleTimeString('en-AU', {hour:'2-digit',minute:'2-digit',hour12:false}) : 'N/A'} | Set ${day.sunset ? new Date(day.sunset).toLocaleTimeString('en-AU', {hour:'2-digit',minute:'2-digit',hour12:false}) : 'N/A'}
**Pressure Trend:** ${day.pressureTrend}
**Tides:** ${formatTides(day.tides)}
**Conditions by Period:**
${formatPeriods(day.periods)}
`).join('\n')}

## Target Species Knowledge & Regulations
${buildSpeciesBlock(params.selectedSpecies, params.latitude, params.longitude)}

## Output Schema:
${DAILY_PLAN_SCHEMA}

Rules:
- windTable must have exactly 5 entries (one per period: Pre-dawn, Morning, Midday, Afternoon, Evening)
- fishingPlan must have exactly 7 phases in order: Start, Run, Repeat, Prime, Late, Adapt, Pack Up
- All times use 24h format HH:MM
- Waypoints use realistic coordinates within 60km of ${params.latitude}, ${params.longitude}
- Rating values must be exactly one of: BEST WINDOW, GOOD, IMPROVING, AVERAGE, FISHABLE, DETERIORATING
- Include 2–4 waypoints per day
- oceanConditions must include SST, Current, Pressure, Moon (minimum 4 rows)
- Incorporate regulations into fishingPlan notes (bag limits, any closures)
- Each fishingPlan phase must specify ONE primary technique only — trolling and bait/jigging are mutually exclusive; if switching methods, write it as a phase transition`

  const message = await client.beta.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
    betas: ['output-128k-2025-02-19', 'prompt-caching-2024-07-31'],
  })

  if (message.stop_reason === 'max_tokens') {
    throw new Error('AI response was truncated — try a shorter date range or fewer species')
  }

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected AI response type')

  // Extract JSON from response (strip any accidental markdown)
  let jsonText = content.text.trim()
  const jsonMatch = jsonText.match(/\[[\s\S]*\]/)
  if (jsonMatch) jsonText = jsonMatch[0]

  const plans: DailyPlan[] = JSON.parse(jsonText)

  // Validate waypoints: remove land points, annotate with real GEBCO depth
  for (const plan of plans) {
    plan.waypoints = await validateWaypoints(plan.waypoints)
  }

  return plans
}
