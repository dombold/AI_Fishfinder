import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendGroupInviteEmail } from '@/lib/email'

const inviteSchema = z.object({
  username: z.string().min(1).max(30),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Caller must be an ACTIVE member
    const caller = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })
    if (!caller || caller.status !== 'ACTIVE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const memberships = await prisma.groupMembership.findMany({
      where: { groupId, status: 'ACTIVE' },
      include: { user: { select: { id: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ members: memberships.map(m => ({ ...m.user, joinedAt: m.createdAt })) })
  } catch (err: any) {
    console.error('[GET /api/groups/[groupId]/members]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only owner can invite
    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (group.ownerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

    const target = await prisma.user.findUnique({ where: { username: parsed.data.username } })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (target.id === session.user.id) return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 })

    // Check for existing membership
    const existing = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId: target.id } },
    })
    if (existing) return NextResponse.json({ error: existing.status === 'ACTIVE' ? 'Already a member' : 'Invite already pending' }, { status: 409 })

    const membership = await prisma.groupMembership.create({
      data: { groupId, userId: target.id, status: 'PENDING' },
    })

    // Fire-and-forget — don't block the response if email fails
    sendGroupInviteEmail(target.email, group.name, session.user.name ?? session.user.id)
      .catch(err => console.error('[email] Group invite email failed:', err))

    return NextResponse.json(membership, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/groups/[groupId]/members]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
