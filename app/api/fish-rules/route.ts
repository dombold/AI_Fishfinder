import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { getRegulations, checkFishingClosures, getBioregion } from '@/lib/regulations'

const schema = z.object({
  species: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: 'Invalid input', details: result.error.flatten() }, { status: 400 })

    const { species, latitude, longitude } = result.data

    const bioregion = getBioregion(latitude, longitude)
    const regulation = getRegulations(species, latitude, longitude)
    const closures = checkFishingClosures(latitude, longitude, 'boat', 'both', [species])

    return NextResponse.json({ bioregion, regulation, closures })
  } catch (err: any) {
    console.error('[POST /api/fish-rules]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
