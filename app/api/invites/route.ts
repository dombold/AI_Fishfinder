import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const invites = await prisma.groupMembership.findMany({
      where: { userId: session.user.id, status: 'PENDING' },
      include: {
        group: {
          include: {
            owner: { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invites })
  } catch (err: any) {
    console.error('[GET /api/invites]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
