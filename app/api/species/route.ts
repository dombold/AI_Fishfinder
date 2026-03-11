import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAvailableSpecies, type FishingType, type TargetType } from '@/lib/species'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const fishingType = searchParams.get('fishingType') as FishingType
  const targetType = searchParams.get('targetType') as TargetType

  if (!fishingType || !targetType) {
    return NextResponse.json({ error: 'fishingType and targetType required' }, { status: 400 })
  }

  const species = getAvailableSpecies(fishingType, targetType)
  return NextResponse.json({ species })
}
