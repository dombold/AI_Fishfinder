import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { authConfig } from './auth.config'

const LoginSchema = z.object({
  username: z.string().min(1).max(30),
  password: z.string().min(8).max(128),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { username, password } = parsed.data

        const user = await prisma.user.findUnique({ where: { username } })
        if (!user) return null

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatch) return null

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          sounderType: user.sounderType,
          seasicknessTolerance: user.seasicknessTolerance,
        }
      },
    }),
  ],
})
