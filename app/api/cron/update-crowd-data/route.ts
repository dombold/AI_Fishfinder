/**
 * Weekly cron endpoint: fetches iNaturalist observations and aggregates
 * crowd-sourced fishing data per WA bioregion.
 *
 * Trigger via system cron (see deployment docs):
 *   0 3 * * 0  curl -s -X POST http://localhost:3000/api/cron/update-crowd-data \
 *     -H "x-cron-secret: $CRON_SECRET" >> /var/log/ai-fishfinder-crowd.log 2>&1
 *
 * Also callable manually for initial DB seeding.
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchInatObservations } from '@/lib/inaturalist-api'
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

  // Process bioregions sequentially to stay well within iNaturalist's 100 req/min limit
  for (const bioregion of BIOREGIONS) {
    try {
      const fetchResult = await fetchInatObservations(bioregion)
      const summary = await aggregateCrowdData(bioregion)
      await writeCrowdSummary(summary)

      results[bioregion] = {
        status: 'ok',
        detail: {
          inatInserted: fetchResult.inserted,
          inatSkipped: fetchResult.skipped,
          topSpeciesCount: summary.topSpecies.length,
          hotspotCount: summary.hotspots.length,
          inatTotal: summary.inatCount,
          catchLogTotal: summary.catchLogCount,
        },
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[cron/update-crowd-data] ${bioregion} failed:`, err)
      results[bioregion] = { status: 'error', detail: message }
      // Continue to next bioregion — one failure does not abort the job
    }
  }

  return NextResponse.json({
    startedAt,
    completedAt: new Date().toISOString(),
    results,
  })
}
