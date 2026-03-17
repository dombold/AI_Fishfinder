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

    const existing = await prisma.catchLog.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true, latitude: true, longitude: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const result = patchSchema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: 'Invalid input', details: result.error.flatten() }, { status: 400 })

    const updates: Record<string, unknown> = { ...result.data }

    if (result.data.latitude != null || result.data.longitude != null) {
      const lat = result.data.latitude ?? existing.latitude
      const lng = result.data.longitude ?? existing.longitude
      updates.bioregion = getBioregion(lat, lng)
    }

    const updated = await prisma.catchLog.update({ where: { id }, data: updates })
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
