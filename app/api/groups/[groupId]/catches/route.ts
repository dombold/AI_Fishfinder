import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Caller must be an ACTIVE member
    const caller = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })
    if (!caller || caller.status !== 'ACTIVE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const catches = await prisma.catchLog.findMany({
      where: {
        shared: true,
        user: {
          memberships: {
            some: { groupId, status: 'ACTIVE' },
          },
        },
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ catches })
  } catch (err: any) {
    console.error('[GET /api/groups/[groupId]/catches]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
