/**
 * Weekly cron endpoint: aggregates crowd-sourced fishing data per WA bioregion
 * from user catch logs, and writes summaries to CrowdSourceSummary.
 *
 * Trigger via system cron (see deployment docs):
 *   0 3 * * 5  curl -s -X POST http://localhost:3000/api/cron/update-crowd-data \
 *     -H "x-cron-secret: $CRON_SECRET" >> /var/log/ai-fishfinder-crowd.log 2>&1
 *
 * Also callable manually for initial DB seeding.
 */

import { NextRequest, NextResponse } from 'next/server'
import { aggregateCrowdData, writeCrowdSummary } from '@/lib/crowd-source-aggregator'
import type { Bioregion } from '@/lib/regulations'

const BIOREGIONS: Bioregion[] = ['north-coast', 'gascoyne', 'west-coast', 'south-coast']

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const startedAt = new Date().toISOString()
  const results: Record<string, { status: 'ok' | 'error'; detail: unknown }> = {}

  for (const bioregion of BIOREGIONS) {
    try {
      const summary = await aggregateCrowdData(bioregion)
      await writeCrowdSummary(summary)

      results[bioregion] = {
        status: 'ok',
        detail: {
          topSpeciesCount: summary.topSpecies.length,
          hotspotCount: summary.hotspots.length,
          catchLogTotal: summary.catchLogCount,
        },
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[cron/update-crowd-data] ${bioregion} failed:`, err)
      results[bioregion] = { status: 'error', detail: message }
    }
  }

  return NextResponse.json({
    startedAt,
    completedAt: new Date().toISOString(),
    results,
  })
}
