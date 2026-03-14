import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fishingSession = await prisma.fishingSession.findUnique({
    where: { id, userId: session.user.id },
    include: { fishingPlans: { select: { id: true, date: true } } },
  })

  if (!fishingSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json({
    status: fishingSession.status,
    errorMessage: fishingSession.errorMessage,
    planIds: fishingSession.fishingPlans.map(p => p.id),
  })
}
