'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { TideEvent, WindHourlyPoint } from '@/lib/marine-api'

export type { WindHourlyPoint }

interface ForecastGraphsProps {
  windHourly: WindHourlyPoint[]
  tideData: TideEvent[]
}

const BRAND = {
  teal:     '#3DB8C8',
  blue:     '#1A4B72',
  mist:     '#8CA8BB',
  foam:     '#E8F0F5',
  grid:     'rgba(107,143,163,0.18)',
  tooltip:  'rgba(11,25,41,0.92)',
  midnight: 'rgba(107,143,163,0.40)',
}

const axisStyle = { fill: BRAND.mist, fontSize: 11 }

const tooltipStyle = {
  background: BRAND.tooltip,
  border: '1px solid rgba(61,184,200,0.3)',
  borderRadius: '0.5rem',
  color: BRAND.foam,
  fontSize: 12,
}

function fmtTime(iso: string, multiDay: boolean): string {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes()
  if (multiDay && h === 0 && m === 0) {
    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' })
  }
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// Cosine interpolation between tide events — spans all days in the event set
function interpolateTidesMultiDay(events: TideEvent[]): Array<{ time: string; height: number; isEvent: false }> {
  if (events.length < 2) return []

  const sorted = [...events].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  // Anchor from midnight of first event's day to midnight after last event's day
  const dayStart = new Date(sorted[0].time)
  dayStart.setHours(0, 0, 0, 0)

  const dayEnd = new Date(sorted[sorted.length - 1].time)
  dayEnd.setHours(0, 0, 0, 0)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const totalHours = Math.round((dayEnd.getTime() - dayStart.getTime()) / 3_600_000)
  const points: Array<{ time: string; height: number; isEvent: false }> = []

  for (let h = 0; h <= totalHours; h++) {
    const t = new Date(dayStart)
    t.setHours(h)
    const tMs = t.getTime()

    // Find the two surrounding events (clamp to first/last if outside range)
    let before = sorted[0]
    let after  = sorted[sorted.length - 1]
    for (let i = 0; i < sorted.length - 1; i++) {
      const t1 = new Date(sorted[i].time).getTime()
      const t2 = new Date(sorted[i + 1].time).getTime()
      if (tMs >= t1 && tMs <= t2) {
        before = sorted[i]
        after  = sorted[i + 1]
        break
      }
    }

    const t1Ms   = new Date(before.time).getTime()
    const t2Ms   = new Date(after.time).getTime()
    const frac   = t2Ms === t1Ms ? 0 : Math.max(0, Math.min(1, (tMs - t1Ms) / (t2Ms - t1Ms)))
    const mu     = (1 - Math.cos(frac * Math.PI)) / 2
    const height = parseFloat((before.height * (1 - mu) + after.height * mu).toFixed(3))

    points.push({ time: t.toISOString(), height, isEvent: false })
  }
  return points
}

export default function ForecastGraphs({ windHourly, tideData }: ForecastGraphsProps) {
  const hasWind = windHourly.length > 0
  const hasTides = tideData.length > 0

  if (!hasWind && !hasTides) return null

  const multiDay =
    new Set(windHourly.map(p => p.time.slice(0, 10))).size > 1 ||
    new Set(tideData.map(e => e.time.slice(0, 10))).size > 1

  // Tick every 3 hours on wind chart for full 24-hour coverage
  const windTicks = windHourly
    .filter(p => new Date(p.time).getHours() % 3 === 0)
    .map(p => p.time)

  // Day-boundary reference lines (all midnights except first point if it's midnight)
  const midnights = windHourly
    .filter((p, i) => i > 0 && new Date(p.time).getHours() === 0 && new Date(p.time).getMinutes() === 0)
    .map(p => p.time)

  // Multi-day interpolated tide curve using ISO time keys
  const tideCurve = interpolateTidesMultiDay(tideData)

  // Tick every 3 hours on tide chart
  const tideTicks = tideCurve
    .filter(p => new Date(p.time).getHours() % 3 === 0)
    .map(p => p.time)

  // Day-boundary reference lines for tide chart
  const tideMidnights = tideCurve
    .filter((p, i) => i > 0 && new Date(p.time).getHours() === 0 && new Date(p.time).getMinutes() === 0)
    .map(p => p.time)

  // Original events rounded to nearest hour so x values match interpolated data points
  const tideEventMarkers = tideData.map(e => {
    const d = new Date(e.time)
    d.setMinutes(0, 0, 0)
    return { ...e, timeKey: d.toISOString() }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Wind Speed – line chart ──────────────────────────── */}
      {hasWind && (
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: BRAND.mist, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Wind Speed (kts)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={windHourly} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="windFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND.teal} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={BRAND.teal} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={BRAND.grid} />
              <XAxis
                dataKey="time"
                ticks={windTicks}
                tickFormatter={t => fmtTime(String(t), multiDay)}
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={t => fmtTime(String(t), multiDay)}
                formatter={(v, _, props) => [`${v} kts ${props.payload.directionText}`, 'Wind']}
              />
              {midnights.map(t => (
                <ReferenceLine key={t} x={t} stroke={BRAND.midnight} strokeDasharray="4 2"
                  label={{ value: fmtTime(t, true), position: 'insideTopRight', fill: BRAND.mist, fontSize: 10 }}
                />
              ))}
              <Area
                type="monotone"
                dataKey="speedKts"
                stroke={BRAND.teal}
                strokeWidth={2}
                fill="url(#windFill)"
                dot={false}
                activeDot={{ r: 4, fill: BRAND.teal, stroke: BRAND.foam, strokeWidth: 1.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Tide Height — 24-hour sinusoidal curve ────────────── */}
      {hasTides && tideCurve.length > 0 && (
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: BRAND.mist, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Tides (m)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tideCurve} margin={{ top: 18, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND.teal} stopOpacity={0.40} />
                  <stop offset="95%" stopColor={BRAND.teal} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={BRAND.grid} />
              <XAxis
                dataKey="time"
                ticks={tideTicks}
                tickFormatter={t => fmtTime(String(t), multiDay)}
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={t => fmtTime(String(t), multiDay)}
                formatter={(v: unknown) => [`${Number(v).toFixed(2)}m`, 'Tide height']}
              />
              {tideMidnights.map(t => (
                <ReferenceLine key={t} x={t} stroke={BRAND.midnight} strokeDasharray="4 2"
                  label={{ value: fmtTime(t, true), position: 'insideTopRight', fill: BRAND.mist, fontSize: 10 }}
                />
              ))}
              <Area
                type="monotone"
                dataKey="height"
                stroke={BRAND.teal}
                strokeWidth={2}
                fill="url(#tideFill)"
                dot={false}
                activeDot={{ r: 3, fill: BRAND.teal, stroke: BRAND.foam, strokeWidth: 1.5 }}
              />
              {/* High/low event markers */}
              {tideEventMarkers.map((e, i) => (
                <ReferenceLine
                  key={i}
                  x={e.timeKey}
                  stroke={e.type === 'HIGH' ? BRAND.teal : BRAND.mist}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{
                    value: `${e.type === 'HIGH' ? '▲' : '▼'} ${e.height.toFixed(2)}m`,
                    position: 'insideTopRight',
                    fill: e.type === 'HIGH' ? BRAND.teal : BRAND.mist,
                    fontSize: 10,
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
