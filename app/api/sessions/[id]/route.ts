import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const fishingSession = await prisma.fishingSession.findUnique({
      where: { id, userId: session.user.id },
      include: {
        selectedSpecies: true,
        fishingPlans: true,
        marineData: true,
      },
    })

    if (!fishingSession) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(fishingSession)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error'
    console.error('[GET /api/sessions/[id]]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

const patchSchema = z.object({
  saved: z.boolean(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const fishingSession = await prisma.fishingSession.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true },
    })

    if (!fishingSession) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.fishingSession.update({
      where: { id },
      data: { saved: parsed.data.saved },
    })

    return NextResponse.json({ saved: parsed.data.saved })
  } catch (err: any) {
    console.error('[PATCH /api/sessions/[id]]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const fishingSession = await prisma.fishingSession.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true },
    })
    if (!fishingSession) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.fishingSession.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error('[DELETE /api/sessions/[id]]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
