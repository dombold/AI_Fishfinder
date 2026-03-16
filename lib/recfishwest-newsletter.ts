/**
 * RecFishWest Weekly Statewide Fishing Report — newsletter parser.
 *
 * Fetches the Mailchimp campaign archive, identifies unprocessed newsletters,
 * uses Claude to extract structured catch observations from each, then bulk-inserts
 * them as CatchLog rows (source='recfishwest-newsletter') for the weekly aggregator.
 *
 * Archive: https://us3.campaign-archive.com/home/?u=77a1cc2ef5b08dfe3cb33b3ce&id=d8755dad3e
 */

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { getBioregion } from '@/lib/regulations'
import { batchDepths } from '@/lib/seafloor'

const ARCHIVE_URL =
  'https://us3.campaign-archive.com/home/?u=77a1cc2ef5b08dfe3cb33b3ce&id=d8755dad3e'

const SYSTEM_USER_EMAIL = 'recfishwest-newsletter@system.local'
const SYSTEM_USER_ID = 'system-recfishwest-newsletter'
const SOURCE_TAG = 'recfishwest-newsletter'

// Full species list from lib/species.ts — used in Claude prompt for normalisation
const KNOWN_SPECIES = [
  // boat pelagic
  'Spanish Mackerel', 'Spotted Mackerel', 'Grey Mackerel', 'School Mackerel', 'Shark Mackerel',
  'Wahoo', 'Mahi-Mahi',
  'Yellowfin Tuna', 'Bigeye Tuna', 'Longtail Tuna', 'Albacore Tuna', 'Southern Bluefin Tuna',
  'Skipjack Tuna', 'Dogtooth Tuna',
  'Striped Marlin', 'Blue Marlin', 'Sailfish',
  'Queenfish', 'Giant Trevally', 'Yellowtail Kingfish', 'Samson Fish', 'Squid',
  // boat demersal
  'Dhufish', 'Pink Snapper', 'Baldchin Groper', 'Breaksea Cod',
  'Redthroat Emperor', 'Spangled Emperor', 'Red Emperor',
  'Coral Trout', 'Amberjack', 'Tuskfish',
  'Black Snapper (Grass Emperor)', 'Bight Redfish (Nannygai)',
  'Barramundi', 'Black Jewfish', 'King Threadfin (Giant Threadfin)',
  // beach pelagic
  'Tailor', 'Australian Salmon (Western Australian Salmon)',
  'Yellowfin Whiting', 'Trevally', 'Australian Herring', 'Garfish (Southern Garfish)',
  // beach demersal
  'Bream', 'Silver Bream', 'King George Whiting', 'Whiting',
  'Flathead', 'Mulloway', 'Flounder', 'Mangrove Jack',
]

export interface ParsedObservation {
  species: string
  locationName: string
  approxLat: number
  approxLng: number
  quantity: number
  notes: string
}

interface NewsletterEntry {
  url: string
  publishedDate: string // YYYY-MM-DD
}

// ─── System user ──────────────────────────────────────────────────────────────

export async function getOrCreateSystemUser(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: SYSTEM_USER_EMAIL },
    update: {},
    create: {
      id: SYSTEM_USER_ID,
      username: 'recfishwest-newsletter',
      email: SYSTEM_USER_EMAIL,
      passwordHash: 'SYSTEM_ACCOUNT_NOT_FOR_LOGIN',
    },
    select: { id: true },
  })
  return user.id
}

// ─── Archive fetching ──────────────────────────────────────────────────────────

/**
 * Fetches the Mailchimp archive listing and extracts campaign URLs + dates.
 * Returns entries not yet present in NewsletterFetch, most-recent-first, max 3.
 */
export async function fetchUnprocessedNewsletters(): Promise<NewsletterEntry[]> {
  const res = await fetch(ARCHIVE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-Fishfinder-Bot/1.0)' },
  })
  if (!res.ok) throw new Error(`Archive fetch failed: ${res.status}`)
  const html = await res.text()

  // Extract campaign entries from the archive listing HTML.
  // Mailchimp archive pages render campaign entries as:
  //   <li class="campaign">MM/DD/YYYY - <a href="http://eepurl.com/XXXXX" ...>Title</a></li>
  const entries: NewsletterEntry[] = []

  // Match only <li class="campaign"> entries — avoids picking up unrelated links
  const campaignPattern = /<li class="campaign">(\d{2})\/(\d{2})\/(\d{4}) - <a href="([^"]+)"/gi
  let m: RegExpExecArray | null

  while ((m = campaignPattern.exec(html)) !== null) {
    const [, month, day, year, url] = m
    entries.push({
      url,
      publishedDate: `${year}-${month}-${day}`,
    })
  }

  if (entries.length === 0) return []

  // Filter out already-processed URLs
  const processed = await prisma.newsletterFetch.findMany({
    where: { url: { in: entries.map(e => e.url) } },
    select: { url: true },
  })
  const processedUrls = new Set(processed.map(p => p.url))

  return entries
    .filter(e => !processedUrls.has(e.url))
    .slice(0, 3) // process at most 3 new newsletters per run
}

// ─── Newsletter HTML fetching ──────────────────────────────────────────────────

export async function fetchNewsletterHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-Fishfinder-Bot/1.0)' },
  })
  if (!res.ok) throw new Error(`Newsletter fetch failed (${url}): ${res.status}`)
  return res.text()
}

// ─── Claude parsing ────────────────────────────────────────────────────────────

/**
 * Sends newsletter HTML to Claude Haiku to extract structured fishing observations.
 * Returns one entry per species-per-location mention with approximate WA coordinates.
 */
export async function parseNewsletterWithClaude(
  html: string,
  publishedDate: string,
): Promise<ParsedObservation[]> {
  const client = new Anthropic()

  // Strip HTML to plain text
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')  // strip HTML entities
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 30000) // newsletter text is dense; 30k covers all regions

  const speciesList = KNOWN_SPECIES.join(', ')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8096,
    system: `You are a data extraction assistant. Extract structured fishing catch observations from Western Australian fishing report text. Return ONLY a valid JSON array, no other text.

Known species list (use EXACT names from this list when matching):
${speciesList}

Rules:
- Create one observation entry per species-per-distinct-location mentioned
- Normalize all species names to match the known species list exactly (e.g. "soapy mulloway" → "Mulloway", "big herring" → "Australian Herring", "kingfish" → "Yellowtail Kingfish", "samsonfish" → "Samson Fish", "nannygai" → "Bight Redfish (Nannygai)", "dolph" or "dolphinfish" → "Mahi-Mahi", "tailor" → "Tailor", "KGW" → "King George Whiting")
- For locations, provide approximate WA lat/lng coordinates (WA bounding box: lat -13 to -35, lng 113 to 129)
- Skip any mention with no identifiable WA location
- Skip species not in the known list
- quantity: number of fish mentioned, default 1
- notes: brief (max 100 chars) summary of size, depth, technique
- Limit to at most 50 most significant observations (prefer named locations over vague ones)

Return format:
[
  {
    "species": "Spanish Mackerel",
    "locationName": "Helby Bank",
    "approxLat": -21.9,
    "approxLng": 114.1,
    "quantity": 1,
    "notes": "Active at reef, trolling lures"
  }
]`,
    messages: [
      {
        role: 'user',
        content: `Extract fishing observations from this ${publishedDate} Western Australian fishing report:\n\n${text}`,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') return []

  try {
    // Extract JSON array from response (handle any surrounding text)
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    const raw = JSON.parse(jsonMatch[0]) as unknown[]
    return raw.filter(isValidObservation)
  } catch {
    console.error('[recfishwest-newsletter] Failed to parse Claude response:', content.text.slice(0, 200))
    return []
  }
}

function isValidObservation(o: unknown): o is ParsedObservation {
  if (typeof o !== 'object' || o === null) return false
  const obs = o as Record<string, unknown>
  return (
    typeof obs.species === 'string' &&
    typeof obs.locationName === 'string' &&
    typeof obs.approxLat === 'number' &&
    typeof obs.approxLng === 'number' &&
    obs.approxLat >= -35 && obs.approxLat <= -13 &&
    obs.approxLng >= 113 && obs.approxLng <= 129
  )
}

/**
 * Removes observations whose coordinates fall on land (GEBCO elevation >= 0).
 * On API error (null elevation) the observation is kept — fail open.
 */
async function filterLandObservations(
  observations: ParsedObservation[],
): Promise<ParsedObservation[]> {
  if (!observations.length) return []
  const depths = await batchDepths(
    observations.map(o => ({ lat: o.approxLat, lng: o.approxLng })),
  )
  const filtered = observations.filter((_, i) => depths[i] === null || depths[i]! < 0)
  const removed = observations.length - filtered.length
  if (removed > 0) {
    console.log(`[recfishwest-newsletter] Removed ${removed} land-based observation(s)`)
  }
  return filtered
}

// ─── Database insertion ────────────────────────────────────────────────────────

/**
 * Bulk-inserts parsed observations as CatchLog rows with source='recfishwest-newsletter'.
 * Derives bioregion from coordinates. Uses the system user for the userId FK.
 */
export async function insertNewsletterObservations(
  observations: ParsedObservation[],
  publishedDate: string,
  systemUserId: string,
): Promise<number> {
  if (observations.length === 0) return 0

  const seaObservations = await filterLandObservations(observations)
  if (seaObservations.length === 0) return 0

  const rows = seaObservations.map(obs => ({
    userId: systemUserId,
    date: publishedDate,
    latitude: obs.approxLat,
    longitude: obs.approxLng,
    species: obs.species,
    quantity: Math.max(1, obs.quantity ?? 1),
    notes: obs.notes || null,
    bioregion: getBioregion(obs.approxLat, obs.approxLng),
    source: SOURCE_TAG,
  }))

  await prisma.catchLog.createMany({ data: rows })
  return rows.length
}

/**
 * Records a processed newsletter URL to prevent re-processing on future cron runs.
 */
export async function recordNewsletterFetch(
  url: string,
  publishedDate: string,
  observationCount: number,
): Promise<void> {
  await prisma.newsletterFetch.create({
    data: {
      source: 'recfishwest',
      url,
      publishedDate,
      observationCount,
    },
  })
}
