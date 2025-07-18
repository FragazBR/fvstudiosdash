
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { type Database } from './lib/supabase.types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const path = req.nextUrl.pathname

  // Skip middleware para rotas específicas
  const skipRoutes = [
    '/login', 
    '/signup', 
    '/', 
    '/clear-cookies',
    '/favicon.ico',
    '/_next',
    '/images',
    '/api'
  ]
  
  if (skipRoutes.some(route => path.startsWith(route))) {
    return res
  }

  try {
    const supabase = createMiddlewareClient<Database>({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    // Se não há sessão, redireciona para login
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Se há sessão, permite acesso
    return res

  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
}
