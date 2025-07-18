
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { type Database } from './lib/supabase.types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const path = req.nextUrl.pathname

  // Rotas que não precisam de middleware
  const publicRoutes = ['/login', '/signup', '/', '/clear-cookies']
  const staticRoutes = ['/favicon.ico', '/_next', '/images', '/api']
  
  // Skip middleware para rotas estáticas e públicas
  if (staticRoutes.some(route => path.startsWith(route)) || publicRoutes.includes(path)) {
    return res
  }

  const supabase = createMiddlewareClient<Database>({ req, res })

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Se não há sessão e está tentando acessar rota protegida
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    // Se não tem perfil, permitir acesso (será criado no login)
    if (!profile) {
      return res
    }

    const { role, id } = profile

    // Verificações básicas de autorização
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    
    if (path.startsWith('/user') && role !== 'user') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    
    if (path.startsWith('/client')) {
      const clientId = path.split('/')[2]
      if (role !== 'client' || clientId !== id) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
    
    if (path.startsWith('/personal') && role !== 'personal') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    return res

  } catch (error) {
    console.error('Middleware error:', error)
    return res // Em caso de erro, permitir acesso
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
}
