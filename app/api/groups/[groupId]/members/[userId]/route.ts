import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string; userId: string }> }) {
  try {
    const { groupId, userId } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isOwner = group.ownerId === session.user.id
    const isSelf = userId === session.user.id

    // Owner can remove any member; users can remove themselves (leave)
    if (!isOwner && !isSelf) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Owner cannot be removed
    if (userId === group.ownerId) return NextResponse.json({ error: 'Cannot remove the group owner' }, { status: 400 })

    await prisma.groupMembership.delete({
      where: { groupId_userId: { groupId, userId } },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error('[DELETE /api/groups/[groupId]/members/[userId]]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
