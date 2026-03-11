import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const entry = await prisma.catchLog.findUnique({
      where: { id: params.id, userId: session.user.id },
      select: { id: true },
    })
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.catchLog.delete({ where: { id: params.id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error('[DELETE /api/catch-log/[id]]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
