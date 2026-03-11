import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  saved: z.boolean(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const fishingSession = await prisma.fishingSession.findUnique({
      where: { id: params.id, userId: session.user.id },
      select: { id: true },
    })

    if (!fishingSession) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.fishingSession.update({
      where: { id: params.id },
      data: { saved: parsed.data.saved },
    })

    return NextResponse.json({ saved: parsed.data.saved })
  } catch (err: any) {
    console.error('[PATCH /api/sessions/[id]]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const fishingSession = await prisma.fishingSession.findUnique({
      where: { id: params.id, userId: session.user.id },
      select: { id: true },
    })
    if (!fishingSession) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.fishingSession.delete({ where: { id: params.id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error('[DELETE /api/sessions/[id]]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
