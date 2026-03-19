import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(1).max(60),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const memberships = await prisma.groupMembership.findMany({
      where: { userId: session.user.id, status: 'ACTIVE' },
      include: {
        group: {
          include: {
            owner: { select: { id: true, username: true } },
            _count: { select: { memberships: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const groups = memberships.map(m => ({
      ...m.group,
      memberCount: m.group._count.memberships,
    }))

    return NextResponse.json({ groups })
  } catch (err: any) {
    console.error('[GET /api/groups]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = createGroupSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

    const userId = session.user.id
    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: { name: parsed.data.name, ownerId: userId },
      })
      await tx.groupMembership.create({
        data: { groupId: g.id, userId, status: 'ACTIVE' },
      })
      return g
    })

    return NextResponse.json(group, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/groups]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
