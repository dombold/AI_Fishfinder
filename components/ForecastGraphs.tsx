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

export default function ForecastGraphs({ windHourly, tideData }: ForecastGraphsProps) {
  const hasWind = windHourly.length > 0
  const hasTides = tideData.length > 0

  if (!hasWind && !hasTides) return null

  const multiDay = new Set(windHourly.map(p => p.time.slice(0, 10))).size > 1

  // Tick every 6 hours on wind chart
  const windTicks = windHourly
    .filter(p => new Date(p.time).getHours() % 6 === 0)
    .map(p => p.time)

  // Day-boundary reference lines (all midnights except first point if it's midnight)
  const midnights = windHourly
    .filter((p, i) => i > 0 && new Date(p.time).getHours() === 0 && new Date(p.time).getMinutes() === 0)
    .map(p => p.time)

  // Tide chart: enrich with formatted time labels
  const tideChartData = tideData.map(t => ({
    ...t,
    timeLabel: fmtTime(t.time, multiDay || tideData.some(x => x.time.slice(0, 10) !== tideData[0].time.slice(0, 10))),
  }))

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

      {/* ── Tide Height ──────────────────────────────────────── */}
      {hasTides && (
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: BRAND.mist, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Tides (m)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={tideChartData} margin={{ top: 18, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND.teal} stopOpacity={0.40} />
                  <stop offset="95%" stopColor={BRAND.teal} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={BRAND.grid} />
              <XAxis dataKey="timeLabel" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, _, p) => [
                  `${Number(v).toFixed(2)}m — ${p.payload.type === 'HIGH' ? '▲ High' : '▼ Low'}`,
                  'Tide',
                ]}
              />
              <Area
                type="monotone"
                dataKey="height"
                stroke={BRAND.teal}
                strokeWidth={2}
                fill="url(#tideFill)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  return (
                    <circle
                      key={`dot-${cx}-${cy}`}
                      cx={cx} cy={cy} r={4}
                      fill={payload.type === 'HIGH' ? BRAND.teal : BRAND.blue}
                      stroke={BRAND.foam}
                      strokeWidth={1.5}
                    />
                  )
                }}
              />
              {tideChartData.map((t, i) => (
                <ReferenceLine
                  key={i}
                  x={t.timeLabel}
                  stroke={t.type === 'HIGH' ? BRAND.teal : BRAND.mist}
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                  label={{
                    value: `${t.type === 'HIGH' ? '▲' : '▼'} ${t.height.toFixed(2)}m`,
                    position: 'insideTopRight',
                    fill: t.type === 'HIGH' ? BRAND.teal : BRAND.mist,
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
