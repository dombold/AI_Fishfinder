import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSchema } from '../route'
import { getBioregion } from '@/lib/regulations'

const patchSchema = createSchema.partial()

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const existing = await prisma.catchLog.findUnique({
      where: { id, userId },
      select: { id: true, latitude: true, longitude: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const result = patchSchema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: 'Invalid input', details: result.error.flatten() }, { status: 400 })

    const { sharedGroupIds, ...catchFields } = result.data
    const updates: Record<string, unknown> = { ...catchFields }

    if (result.data.latitude != null || result.data.longitude != null) {
      const lat = result.data.latitude ?? existing.latitude
      const lng = result.data.longitude ?? existing.longitude
      updates.bioregion = getBioregion(lat, lng)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.catchLog.update({ where: { id }, data: updates })

      const sharedValue = result.data.shared ?? record.shared

      // Clear junction rows when explicitly switching to shared=true (cleanup)
      if (result.data.shared === true) {
        await tx.catchLogSharedGroup.deleteMany({ where: { catchLogId: id } })
      }

      // Replace junction rows when sharedGroupIds was explicitly sent
      if (sharedGroupIds !== undefined && sharedValue === false) {
        await tx.catchLogSharedGroup.deleteMany({ where: { catchLogId: id } })
        if (sharedGroupIds.length > 0) {
          const memberships = await tx.groupMembership.findMany({
            where: { userId, groupId: { in: sharedGroupIds }, status: 'ACTIVE' },
            select: { groupId: true },
          })
          const validIds = memberships.map(m => m.groupId)
          if (validIds.length > 0) {
            await tx.catchLogSharedGroup.createMany({
              data: validIds.map(groupId => ({ catchLogId: id, groupId })),
              skipDuplicates: true,
            })
          }
        }
      }

      return record
    })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('[PATCH /api/catch-log/[id]]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const entry = await prisma.catchLog.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true },
    })
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.catchLog.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error('[DELETE /api/catch-log/[id]]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
