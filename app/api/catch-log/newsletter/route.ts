import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const catches = await prisma.catchLog.findMany({
      where: { source: 'recfishwest-newsletter' },
      select: { latitude: true, longitude: true, species: true, date: true, quantity: true, notes: true },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ catches })
  } catch (err: any) {
    console.error('[GET /api/catch-log/newsletter]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
