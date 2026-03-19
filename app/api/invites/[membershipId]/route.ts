import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  action: z.enum(['accept', 'decline']),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const { membershipId } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const membership = await prisma.groupMembership.findUnique({ where: { id: membershipId } })
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (membership.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (membership.status !== 'PENDING') return NextResponse.json({ error: 'Invite already resolved' }, { status: 400 })

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

    if (parsed.data.action === 'accept') {
      const updated = await prisma.groupMembership.update({
        where: { id: membershipId },
        data: { status: 'ACTIVE' },
      })
      return NextResponse.json(updated)
    } else {
      await prisma.groupMembership.delete({ where: { id: membershipId } })
      return new NextResponse(null, { status: 204 })
    }
  } catch (err: any) {
    console.error('[PATCH /api/invites/[membershipId]]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
