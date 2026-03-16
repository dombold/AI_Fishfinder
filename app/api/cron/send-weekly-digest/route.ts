/**
 * Weekly digest cron — sends a crowd-sourced fishing intelligence email to all users.
 *
 * Trigger via system cron (Friday 4 AM, after parse-recfishwest at 2 AM and update-crowd-data at 3 AM):
 *   0 4 * * 5  curl -s -X POST http://localhost:3000/api/cron/send-weekly-digest \
 *     -H "x-cron-secret: $CRON_SECRET" >> /var/log/ai-fishfinder-digest.log 2>&1
 * Security: requires x-cron-secret header matching CRON_SECRET env var.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWeeklyDigest } from '@/lib/email'
import type { CrowdSummary } from '@/lib/crowd-source-aggregator'

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all crowd summaries
    const summaryRows = await prisma.crowdSourceSummary.findMany()
    if (summaryRows.length === 0) {
      return NextResponse.json({
        ok: false,
        message: 'No crowd summaries found — run the update-crowd-data cron first.',
      })
    }

    const summaries: CrowdSummary[] = []
    for (const row of summaryRows) {
      try {
        summaries.push(JSON.parse(row.summaryJson) as CrowdSummary)
      } catch {
        console.error(`[digest] Failed to parse summary for bioregion ${row.bioregion}`)
      }
    }

    // Fetch only users who have opted in to the weekly digest
    const users = await prisma.user.findMany({
      where: { weeklyDigestOptIn: true },
      select: { username: true, email: true },
    })

    if (users.length === 0) {
      return NextResponse.json({ ok: true, message: 'No users to email.', sent: 0, failed: 0 })
    }

    const { sent, failed } = await sendWeeklyDigest(users, summaries)

    console.log(`[digest] Weekly digest complete — sent: ${sent}, failed: ${failed}`)

    return NextResponse.json({
      ok: true,
      bioregions: summaries.length,
      users: users.length,
      sent,
      failed,
    })
  } catch (err) {
    console.error('[digest] Cron error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
