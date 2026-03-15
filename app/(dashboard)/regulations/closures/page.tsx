import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardNav from '@/components/DashboardNav'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Closures — AI Fishfinder' }

interface Closure {
  name: string
  area: string
  species: string
  dates: string
  type: 'ongoing' | 'seasonal'
  /** For ongoing: ISO start date. For seasonal: null */
  ongoingStart?: string
  /** For ongoing: ISO end date (approximate). For seasonal: null */
  ongoingEnd?: string
  /** For seasonal: [startMonth (1-12), startDay, endMonth, endDay] */
  seasonalRange?: [number, number, number, number]
  notes: string
  source: string
}

const CLOSURES: Closure[] = [
  {
    name: 'West Coast Bioregion — Boat Demersal Scalefish',
    area: 'Kalbarri to Augusta (West Coast Bioregion)',
    species: 'Pink Snapper, Dhufish, Baldchin Groper, Breaksea Cod, Red Emperor, Redthroat Emperor, Spangled Emperor, Coral Trout, Tuskfish, Black Snapper',
    dates: '16 December 2025 – approximately September 2027',
    type: 'ongoing',
    ongoingStart: '2025-12-16',
    ongoingEnd: '2027-09-30',
    notes: 'Boat fishing for demersal scalefish is CLOSED. Land-based (beach/rock) fishing is permitted with reduced bag limits. Release weight recommended for deep-water catch-and-release.',
    source: 'https://fish.wa.gov.au',
  },
  {
    name: 'Cockburn Sound & Warnbro Sound — Pink Snapper',
    area: 'Cockburn Sound & Warnbro Sound (Metro/South-West)',
    species: 'Pink Snapper',
    dates: '1 August – 31 January (annual, all methods)',
    type: 'seasonal',
    seasonalRange: [8, 1, 1, 31],
    notes: 'Annual spawning closure. No take of pink snapper by any method within Cockburn Sound and Warnbro Sound during the closure period.',
    source: 'https://fish.wa.gov.au',
  },
  {
    name: 'Shark Bay — Eastern Gulf',
    area: 'Shark Bay, Eastern Gulf (Gascoyne Bioregion)',
    species: 'Pink Snapper',
    dates: '1 May – 31 July (annual)',
    type: 'seasonal',
    seasonalRange: [5, 1, 7, 31],
    notes: 'Protects pink snapper during peak spawning aggregations in the Eastern Gulf.',
    source: 'https://fish.wa.gov.au',
  },
  {
    name: 'Shark Bay — Freycinet Estuary',
    area: 'Shark Bay, Freycinet Estuary (Gascoyne Bioregion)',
    species: 'All finfish',
    dates: '15 August – 30 September (annual)',
    type: 'seasonal',
    seasonalRange: [8, 15, 9, 30],
    notes: 'Protects fish using the estuary as a spawning and nursery habitat.',
    source: 'https://fish.wa.gov.au',
  },
  {
    name: 'Shark Bay — Northern Bernier Island',
    area: 'Shark Bay, Northern Bernier Island (Gascoyne Bioregion)',
    species: 'All finfish',
    dates: '1 June – 31 August (annual, all methods)',
    type: 'seasonal',
    seasonalRange: [6, 1, 8, 31],
    notes: 'Closed to all fishing activity during this period to protect important aggregation areas.',
    source: 'https://fish.wa.gov.au',
  },
  {
    name: 'Abrolhos Islands — Coral Trout Spawning',
    area: 'Houtman Abrolhos Islands (Mid-West/North Coast)',
    species: 'Coral Trout',
    dates: '1 October – 31 December (annual)',
    type: 'seasonal',
    seasonalRange: [10, 1, 12, 31],
    notes: 'Protects coral trout during spawning season. Bag limit is 1 fish per person in the Abrolhos Islands year-round.',
    source: 'https://fish.wa.gov.au',
  },
]

function isClosureActive(closure: Closure, now: Date): boolean {
  if (closure.type === 'ongoing') {
    const start = new Date(closure.ongoingStart!)
    const end   = new Date(closure.ongoingEnd!)
    return now >= start && now <= end
  }
  // Seasonal: compare month/day
  const [sm, sd, em, ed] = closure.seasonalRange!
  const month = now.getMonth() + 1
  const day   = now.getDate()
  const nowVal   = month * 100 + day
  const startVal = sm * 100 + sd
  const endVal   = em * 100 + ed

  if (startVal <= endVal) {
    // Same-year range e.g. May–Jul
    return nowVal >= startVal && nowVal <= endVal
  } else {
    // Wraps year-end e.g. Aug–Jan
    return nowVal >= startVal || nowVal <= endVal
  }
}

export default async function ClosuresPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const now = new Date()
  const active   = CLOSURES.filter(c => isClosureActive(c, now))
  const inactive = CLOSURES.filter(c => !isClosureActive(c, now))

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0E2A45 0%, #0B1929 60%, #061018 100%)' }}>

      <DashboardNav />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '2rem' }}>
          <span className="section-label" style={{ margin: '0 0 0.75rem', display: 'inline-block' }}>WA DPIRD 2026</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-foam)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Fishing Closures
          </h1>
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Active and seasonal fishing closures for Western Australian recreational fishing. Highlighted closures are currently in effect.
          </p>
        </div>

        {/* Active closures */}
        {active.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--color-warning)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              ⚠ Currently Active
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {active.map(c => (
                <div
                  key={c.name}
                  style={{ padding: '1.25rem 1.5rem', background: 'rgba(224,92,42,0.08)', border: '1px solid rgba(224,92,42,0.35)', borderLeft: '4px solid var(--color-warning)', borderRadius: '0.75rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 700, color: 'var(--color-foam)', fontSize: '0.9375rem', margin: 0 }}>{c.name}</p>
                    <span style={{ flexShrink: 0, fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: 'rgba(224,92,42,0.25)', color: 'var(--color-warning)', border: '1px solid rgba(224,92,42,0.4)', borderRadius: '0.25rem', padding: '0.2rem 0.5rem' }}>
                      ACTIVE
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.375rem 1.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(107,143,163,0.7)' }}>Area</span>
                      <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', margin: '0.15rem 0 0' }}>{c.area}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(107,143,163,0.7)' }}>Dates</span>
                      <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', margin: '0.15rem 0 0' }}>{c.dates}</p>
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(107,143,163,0.7)' }}>Affected Species</span>
                    <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', margin: '0.15rem 0 0', lineHeight: 1.5 }}>{c.species}</p>
                  </div>
                  <p style={{ color: 'rgba(201,168,76,0.9)', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>{c.notes}</p>
                  <p style={{ marginTop: '0.625rem', fontSize: '0.75rem', color: 'rgba(107,143,163,0.5)', margin: '0.625rem 0 0' }}>
                    Source: <a href={c.source} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(107,143,163,0.75)', textDecoration: 'underline' }}>DPIRD WA</a>
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Inactive / upcoming closures */}
        {inactive.length > 0 && (
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', color: 'var(--color-foam)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              Seasonal Closures
            </h2>
            <p style={{ color: 'var(--color-mist)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              These closures recur annually. They are not currently in effect but will apply during the dates shown each year.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {inactive.map(c => (
                <div
                  key={c.name}
                  style={{ padding: '1.125rem 1.375rem', background: 'rgba(107,143,163,0.05)', border: '1px solid rgba(107,143,163,0.15)', borderRadius: '0.625rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 700, color: 'var(--color-foam)', fontSize: '0.9rem', margin: 0 }}>{c.name}</p>
                    <span style={{ flexShrink: 0, fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(107,143,163,0.6)', border: '1px solid rgba(107,143,163,0.2)', borderRadius: '0.25rem', padding: '0.2rem 0.5rem' }}>
                      SEASONAL
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.375rem 1.5rem', marginBottom: '0.625rem' }}>
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(107,143,163,0.6)' }}>Area</span>
                      <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', margin: '0.15rem 0 0' }}>{c.area}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(107,143,163,0.6)' }}>Closed Period</span>
                      <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', margin: '0.15rem 0 0' }}>{c.dates}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(107,143,163,0.6)' }}>Species</span>
                      <p style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', margin: '0.15rem 0 0' }}>{c.species}</p>
                    </div>
                  </div>
                  <p style={{ color: 'rgba(107,143,163,0.8)', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>{c.notes}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'rgba(107,143,163,0.45)', lineHeight: 1.6 }}>
          Always verify current closures at{' '}
          <a href="https://fish.wa.gov.au" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(107,143,163,0.7)', textDecoration: 'underline' }}>fish.wa.gov.au</a>{' '}
          before your trip. Emergency closures may be declared with short notice.
        </p>

      </div>
    </div>
  )
}
