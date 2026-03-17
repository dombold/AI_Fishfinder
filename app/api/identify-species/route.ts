import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { identifySpecies } from '@/lib/claude-api'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AllowedMime = typeof ALLOWED_MIME_TYPES[number]

const bodySchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { imageBase64: string; mimeType: AllowedMime }
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Reject images that are too large (> ~4 MB decoded = ~5.5 MB base64)
  if (body.imageBase64.length > 5_500_000) {
    return NextResponse.json({ error: 'Image too large — please use a smaller photo' }, { status: 413 })
  }

  try {
    const result = await identifySpecies(body.imageBase64, body.mimeType)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Species identification error:', err)
    return NextResponse.json({ error: 'Identification failed' }, { status: 500 })
  }
}
