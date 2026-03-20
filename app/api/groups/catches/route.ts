import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id

    // Get all groups where caller is an ACTIVE member
    const memberships = await prisma.groupMembership.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { group: { select: { id: true, name: true } } },
    })

    if (memberships.length === 0) {
      return NextResponse.json({ catches: [], groups: [] })
    }

    const groupIds = memberships.map(m => m.groupId)
    const groups = memberships.map(m => ({ id: m.group.id, name: m.group.name }))

    // Fetch shared catches from OTHER members across all those groups (exclude own)
    const catches = await prisma.catchLog.findMany({
      where: {
        shared: true,
        userId: { not: userId },
        user: {
          memberships: {
            some: { groupId: { in: groupIds }, status: 'ACTIVE' },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            memberships: {
              where: { groupId: { in: groupIds }, status: 'ACTIVE' },
              select: { groupId: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Attach a groupId to each catch (use the first matching group for that user)
    const catchesWithGroup = catches.map(c => {
      const membership = c.user.memberships[0]
      return {
        id: c.id,
        date: c.date,
        latitude: c.latitude,
        longitude: c.longitude,
        species: c.species,
        quantity: c.quantity,
        groupId: membership?.groupId ?? groupIds[0],
        user: { id: c.user.id, username: c.user.username },
      }
    })

    return NextResponse.json({ catches: catchesWithGroup, groups })
  } catch (err: any) {
    console.error('[GET /api/groups/catches]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
