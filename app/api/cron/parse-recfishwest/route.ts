/**
 * Weekly cron endpoint: fetches the RecFishWest Statewide Fishing Report newsletter,
 * uses Claude to extract structured catch observations, and inserts them as CatchLog
 * rows for the crowd-source aggregator to pick up on Sunday.
 *
 * Trigger via system cron (runs Friday 2 AM, before Sunday aggregation):
 *   0 2 * * 5  curl -s -X POST http://localhost:3000/api/cron/parse-recfishwest \
 *     -H "x-cron-secret: $CRON_SECRET" >> /var/log/ai-fishfinder-newsletter.log 2>&1
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrCreateSystemUser,
  fetchUnprocessedNewsletters,
  fetchNewsletterHtml,
  parseNewsletterWithClaude,
  insertNewsletterObservations,
  recordNewsletterFetch,
} from '@/lib/recfishwest-newsletter'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const startedAt = new Date().toISOString()
  const systemUserId = await getOrCreateSystemUser()

  let unprocessed: Awaited<ReturnType<typeof fetchUnprocessedNewsletters>>
  try {
    unprocessed = await fetchUnprocessedNewsletters()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[cron/parse-recfishwest] Archive fetch failed:', err)
    return NextResponse.json({ error: `Archive fetch failed: ${message}` }, { status: 502 })
  }

  if (unprocessed.length === 0) {
    return NextResponse.json({
      startedAt,
      completedAt: new Date().toISOString(),
      processed: 0,
      totalObservations: 0,
      message: 'No new newsletters found',
    })
  }

  const results: Array<{
    url: string
    publishedDate: string
    status: 'ok' | 'error'
    observationCount?: number
    error?: string
  }> = []

  let totalObservations = 0

  for (const newsletter of unprocessed) {
    try {
      const html = await fetchNewsletterHtml(newsletter.url)
      const observations = await parseNewsletterWithClaude(html, newsletter.publishedDate)
      const inserted = await insertNewsletterObservations(observations, newsletter.publishedDate, systemUserId)
      await recordNewsletterFetch(newsletter.url, newsletter.publishedDate, inserted)

      totalObservations += inserted
      results.push({
        url: newsletter.url,
        publishedDate: newsletter.publishedDate,
        status: 'ok',
        observationCount: inserted,
      })

      console.log(`[cron/parse-recfishwest] ${newsletter.publishedDate}: ${inserted} observations inserted`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[cron/parse-recfishwest] Failed for ${newsletter.url}:`, err)
      results.push({
        url: newsletter.url,
        publishedDate: newsletter.publishedDate,
        status: 'error',
        error: message,
      })
    }
  }

  return NextResponse.json({
    startedAt,
    completedAt: new Date().toISOString(),
    processed: results.filter(r => r.status === 'ok').length,
    totalObservations,
    newsletters: results,
  })
}
