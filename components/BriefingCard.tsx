import type { DailyPlan } from '@/lib/claude-api'
import { getRegulations, getBioregion } from '@/lib/regulations'
import WaypointMap from '@/components/WaypointMap'
import ForecastGraphs from '@/components/ForecastGraphs'
import type { TideEvent, PeriodSummary, WindHourlyPoint, PressureHourlyPoint } from '@/lib/marine-api'
import { calculateSolunarWindows } from '@/lib/solunar'

// Period label → hour range mapping (matches PERIODS in marine-api.ts)
const PERIOD_HOURS: { prefix: string; start: number; end: number }[] = [
  { prefix: 'Pre-dawn',  start: 0,  end: 6  },
  { prefix: 'Morning',   start: 6,  end: 10 },
  { prefix: 'Midday',    start: 10, end: 14 },
  { prefix: 'Afternoon', start: 14, end: 18 },
  { prefix: 'Evening',   start: 18, end: 24 },
]

function periodsToWindHourly(periods: PeriodSummary[], date: string): WindHourlyPoint[] {
  const result: WindHourlyPoint[] = []
  for (const ph of PERIOD_HOURS) {
    const p = periods.find(x => x.label.startsWith(ph.prefix))
    const speedKts = p ? (parseFloat(p.windSpeed) || 0) : 0
    const dir = p?.windDirection ?? 'N/A'
    for (let h = ph.start; h < ph.end; h++) {
      result.push({ time: `${date}T${h.toString().padStart(2, '0')}:00:00`, speedKts, directionText: dir })
    }
  }
  return result
}

const RATING_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  'BEST WINDOW':   { bg: 'rgba(46,204,138,0.15)',  color: '#2ECC8A', border: 'rgba(46,204,138,0.4)' },
  'GOOD':          { bg: 'rgba(59,191,174,0.15)',   color: '#3CBFAE', border: 'rgba(59,191,174,0.4)' },
  'IMPROVING':     { bg: 'rgba(59,191,174,0.10)',   color: '#3CBFAE', border: 'rgba(59,191,174,0.3)' },
  'AVERAGE':       { bg: 'rgba(201,168,76,0.15)',   color: '#C9A84C', border: 'rgba(201,168,76,0.4)' },
  'FISHABLE':      { bg: 'rgba(201,168,76,0.10)',   color: '#C9A84C', border: 'rgba(201,168,76,0.3)' },
  'DETERIORATING': { bg: 'rgba(224,92,42,0.15)',    color: '#E05C2A', border: 'rgba(224,92,42,0.4)' },
}

const PHASE_COLORS: Record<string, string> = {
  'Start':    '#3CBFAE',
  'Run':      '#0A7EA4',
  'Repeat':   '#0A7EA4',
  'Prime':    '#2ECC8A',
  'Late':     '#C9A84C',
  'Adapt':    '#C9A84C',
  'Pack Up':  '#6B8FA3',
}

interface Props {
  plan: DailyPlan
  selectedSpecies: string[]
  latitude: number
  longitude: number
  fishingType: string
  tides?: TideEvent[]
  periods?: PeriodSummary[]
  windHourly?: WindHourlyPoint[]
  pressureHourly?: PressureHourlyPoint[]
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="section-label" style={{ marginBottom: '0' }}>
      {title}
    </div>
  )
}

const SOLUNAR_QUALITY_COLOR = { PEAK: '#2ECC8A', STRONG: '#3CBFAE', MODERATE: '#C9A84C' } as const

export default function BriefingCard({ plan, selectedSpecies, latitude, longitude, fishingType, tides, periods, windHourly, pressureHourly }: Props) {
  const date = new Date(plan.date + 'T12:00:00')
  const dateLabel = date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const solunarWindows = calculateSolunarWindows(
    plan.header.moonrise,
    plan.header.moonset,
    plan.header.moonIllumination
  )

  return (
    <article className="card" style={{ overflow: 'hidden', marginBottom: '2rem' }}>

      {/* ── Header ───────────────────────────────────────── */}
      <header style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, rgba(10,126,164,0.15) 0%, rgba(59,191,174,0.08) 100%)', borderBottom: '1px solid rgba(107,143,163,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-foam)', marginBottom: '0.125rem' }}>
              {dateLabel}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-mist)' }}>
              {plan.header.bioregion} · {fishingType.charAt(0).toUpperCase() + fishingType.slice(1)} fishing
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--color-sand)', fontWeight: 600 }}>🌙 {plan.header.moonPhase} {plan.header.moonIllumination}%</span>
            <span style={{ color: 'var(--color-mist)' }}>
              Sunrise {plan.header.sunrise} · Sunset {plan.header.sunset}
            </span>
            <span style={{ color: 'var(--color-mist)' }}>
              Pressure {plan.header.pressureTrend}
            </span>
          </div>
        </div>
        {plan.header.dataSources?.length > 0 && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: 'rgba(107,143,163,0.6)', letterSpacing: '0.04em' }}>
            DATA: {plan.header.dataSources.join(' · ')}
          </p>
        )}
      </header>

      {/* ── 1. Wind & Swell Table ────────────────────────── */}
      <SectionHeader title="1. WIND & SWELL" />
      <div style={{ overflowX: 'auto' }}>
        <table className="briefing-table" aria-label="Wind and swell conditions">
          <thead>
            <tr>
              <th>Time Period</th>
              <th>Wind</th>
              <th>Speed</th>
              <th>Swell Ht</th>
              <th>Period</th>
              <th>Swell Dir</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {plan.windTable?.map((row, i) => {
              const rs = RATING_STYLE[row.rating] ?? RATING_STYLE['AVERAGE']
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(107,143,163,0.03)' }}>
                  <td style={{ fontWeight: 500, color: 'var(--color-foam)', whiteSpace: 'nowrap' }}>{row.timePeriod}</td>
                  <td>{row.windDirection}</td>
                  <td>{row.windSpeed}</td>
                  <td>{row.swellHeight}</td>
                  <td>{row.swellPeriod}</td>
                  <td>{row.swellDirection}</td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '3rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, whiteSpace: 'nowrap' }}>
                      {row.rating}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Wind & Tide Forecast Charts ─────────────────── */}
      {((tides && tides.length > 0) || (periods && periods.length > 0)) && (
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <SectionHeader title="WIND & TIDE FORECAST" />
          <div style={{ marginTop: '0.75rem' }}>
            <ForecastGraphs
              windHourly={
                (windHourly && windHourly.length > 0)
                  ? windHourly
                  : periodsToWindHourly(periods ?? [], plan.date)
              }
              tideData={tides ?? []}
              pressureHourly={pressureHourly}
            />
          </div>
        </div>
      )}

      {/* ── 2. Ocean Conditions ──────────────────────────── */}
      <SectionHeader title="2. OCEAN CONDITIONS" />
      <div style={{ overflowX: 'auto' }}>
        <table className="briefing-table" aria-label="Ocean conditions">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>Parameter</th>
              <th style={{ width: '180px' }}>Reading</th>
              <th>Assessment</th>
            </tr>
          </thead>
          <tbody>
            {plan.oceanConditions?.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: 'var(--color-sand)', whiteSpace: 'nowrap' }}>{row.parameter}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-seafoam)' }}>{row.reading}</td>
                <td style={{ color: 'var(--color-foam)', lineHeight: 1.5 }}>{row.assessment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Waypoint Map ─────────────────────────────────── */}
      {plan.waypoints?.length > 0 && (
        <>
          <SectionHeader title="WAYPOINTS MAP" />
          <div className="waypoint-map" style={{ padding: '1rem' }}>
            <WaypointMap waypoints={plan.waypoints} />
          </div>
        </>
      )}

      {/* ── 3. Daily Fishing Plan ───────────────────────── */}
      <SectionHeader title="3. DAILY FISHING PLAN" />
      <div style={{ overflowX: 'auto' }}>
        <table className="briefing-table" aria-label="Daily fishing plan">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Phase</th>
              <th style={{ width: '65px' }}>Time</th>
              <th>Action</th>
              <th style={{ width: '80px' }}>Speed</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {plan.fishingPlan?.map((row, i) => {
              const phaseColor = PHASE_COLORS[row.phase] ?? 'var(--color-mist)'
              return (
                <tr key={i}>
                  <td>
                    <span style={{ fontWeight: 700, color: phaseColor, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {row.phase}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--color-seafoam)', fontWeight: 600 }}>{row.time}</td>
                  <td style={{ color: 'var(--color-foam)' }}>{row.action}</td>
                  <td style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>{row.speed}</td>
                  <td style={{ color: 'var(--color-mist)', fontSize: '0.8125rem', lineHeight: 1.5 }}>{row.notes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Key Waypoints ────────────────────────────────── */}
      {plan.waypoints?.length > 0 && (
        <>
          <SectionHeader title="KEY WAYPOINTS" />
          <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {plan.waypoints.map((wp, i) => (
              <div key={i} style={{ background: 'rgba(10,126,164,0.08)', border: '1px solid rgba(10,126,164,0.2)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ background: 'var(--color-current)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{i+1}</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-foam)', fontSize: '0.875rem' }}>{wp.name}</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-seafoam)', marginBottom: '0.25rem' }}>
                  {wp.latitude.toFixed(4)}°S · {wp.longitude.toFixed(4)}°E
                </div>
                {wp.depth && <div style={{ fontSize: '0.75rem', color: 'var(--color-sand)' }}>Depth: {wp.depth}</div>}
                <div style={{ fontSize: '0.75rem', color: 'var(--color-mist)', marginTop: '0.25rem' }}>{wp.notes}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Regulations ──────────────────────────────────── */}
      <SectionHeader title="FISHING REGULATIONS — WA DPIRD 2026" />
      <div style={{ overflowX: 'auto' }}>
        <table className="briefing-table" aria-label="Fishing regulations">
          <thead>
            <tr>
              <th>Species</th>
              <th>Min Size</th>
              <th>Bag Limit</th>
              <th>Combined Limit</th>
              <th>Notes / Closures</th>
            </tr>
          </thead>
          <tbody>
            {selectedSpecies.map((sp, i) => {
              const reg = getRegulations(sp, latitude, longitude)
              const effectiveClosure = reg?.closureActive && fishingType === 'boat'
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--color-foam)', whiteSpace: 'nowrap' }}>{sp}</td>
                  <td style={{ color: 'var(--color-seafoam)', fontSize: '0.8125rem' }}>{reg?.minSize ?? 'None'}</td>
                  <td style={{ fontWeight: 600, color: effectiveClosure ? '#DC2626' : 'var(--color-sand)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    {effectiveClosure && <span style={{ marginRight: '4px' }}>⛔</span>}
                    {reg?.bagLimit ?? '—'}
                  </td>
                  <td style={{ color: 'var(--color-mist)', fontSize: '0.8125rem' }}>{reg?.combinedLimit ?? '—'}</td>
                  <td style={{ color: effectiveClosure ? '#DC2626' : 'var(--color-mist)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                    {reg?.closureReason || reg?.seasonalClosures || reg?.notes || '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p style={{ padding: '0.5rem 0.875rem', fontSize: '0.7rem', color: 'rgba(107,143,163,0.5)' }}>
          Always verify current regulations at fish.wa.gov.au before fishing. Rules subject to change.
        </p>
      </div>

      {/* ── Bite Timing Notes ────────────────────────────── */}
      <SectionHeader title="BITE TIMING & TACTICAL NOTES" />
      <div style={{ padding: '1rem 1.25rem' }}>
        <p style={{ color: 'var(--color-foam)', fontSize: '0.9rem', lineHeight: 1.7 }}>{plan.biteTimingNotes}</p>
      </div>

      {/* ── Solunar Windows ──────────────────────────────── */}
      {solunarWindows.length > 0 && (
        <>
          <SectionHeader title="SOLUNAR WINDOWS" />
          <div style={{ padding: '0.75rem 1.25rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
            {solunarWindows.map((w, i) => {
              const isMajor = w.type === 'MAJOR'
              const qualColor = SOLUNAR_QUALITY_COLOR[w.quality]
              return (
                <div key={i} style={{
                  background: isMajor ? 'rgba(61,184,200,0.08)' : 'rgba(201,168,76,0.08)',
                  border: `1px solid ${isMajor ? 'rgba(61,184,200,0.25)' : 'rgba(201,168,76,0.25)'}`,
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: isMajor ? 'var(--color-seafoam)' : 'var(--color-sand)',
                      background: isMajor ? 'rgba(61,184,200,0.15)' : 'rgba(201,168,76,0.15)',
                      padding: '0.1rem 0.4rem', borderRadius: '2rem',
                    }}>
                      {w.type}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: qualColor, letterSpacing: '0.04em' }}>
                      {w.quality}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-foam)' }}>
                    {w.startTime} – {w.endTime}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

    </article>
  )
}
