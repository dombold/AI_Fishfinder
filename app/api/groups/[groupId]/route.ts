import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (group.ownerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.group.delete({ where: { id: groupId } })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error('[DELETE /api/groups/[groupId]]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
