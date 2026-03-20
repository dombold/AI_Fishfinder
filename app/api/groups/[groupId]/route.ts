import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const updates: { name?: string; avatar?: string | null } = {}

    if ('name' in body) {
      const trimmed = typeof body.name === 'string' ? body.name.trim() : ''
      if (!trimmed || trimmed.length > 60) {
        return NextResponse.json({ error: 'Group name must be 1–60 characters' }, { status: 400 })
      }
      updates.name = trimmed
    }

    if ('avatar' in body) {
      updates.avatar = typeof body.avatar === 'string' ? body.avatar : null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (group.ownerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const updated = await prisma.group.update({ where: { id: groupId }, data: updates })
    return NextResponse.json({ group: { id: updated.id, name: updated.name, avatar: updated.avatar } })
  } catch (err: any) {
    console.error('[PATCH /api/groups/[groupId]]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

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
