import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' as const, maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/' },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.username = user.name
        token.sounderType = (user as any).sounderType
        token.seasicknessTolerance = (user as any).seasicknessTolerance
        token.avatar = (user as any).avatar ?? null
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.name = token.username as string
      ;(session.user as any).sounderType = token.sounderType
      ;(session.user as any).seasicknessTolerance = token.seasicknessTolerance
      ;(session.user as any).avatar = token.avatar ?? null
      return session
    },
  },
} satisfies NextAuthConfig
