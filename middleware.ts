import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isAuthenticated = !!req.auth
  const { pathname } = req.nextUrl

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isApiAuth = pathname.startsWith('/api/auth')
  const isApiPublic = pathname === '/api/register'
  const isPublic = isAuthPage || isApiAuth || isApiPublic

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
