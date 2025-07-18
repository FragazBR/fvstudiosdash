
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { type Database } from './lib/supabase.types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Verificar se há cookies corrompidos e limpá-los
  const cookieString = req.headers.get('cookie') || ''
  if (cookieString.includes('base64-eyJ') || cookieString.includes('"base64-')) {
    const response = NextResponse.redirect(new URL('/login', req.url))
    
    // Limpar todos os cookies relacionados ao Supabase
    const cookieNames = [
      'supabase-auth-token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token'
    ]
    
    cookieNames.forEach(name => {
      response.cookies.delete(name)
    })
    
    return response
  }

  const supabase = createMiddlewareClient<Database>({ req, res })

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      // Se há erro na sessão, limpar cookies e redirecionar para login
      const response = NextResponse.redirect(new URL('/login', req.url))
      response.cookies.delete('supabase-auth-token')
      response.cookies.delete('sb-auth-token')
      return response
    }

    const path = req.nextUrl.pathname

    // Rotas públicas que não requerem autenticação
    const publicRoutes = ['/login', '/signup', '/']
    
    if (publicRoutes.includes(path)) {
      // Se o usuário está autenticado e tenta acessar página de login, busca o perfil para redirecionar corretamente
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          const { role, id } = profile
          let redirectPath = '/dashboard' // default
          
          if (role === 'admin') {
            redirectPath = '/admin'
          } else if (role === 'agency') {
            redirectPath = '/dashboard'
          } else if (role === 'user') {
            redirectPath = '/user/dashboard'
          } else if (role === 'client') {
            redirectPath = `/client/${id}`
          } else if (role === 'personal') {
            redirectPath = '/personal/dashboard'
          }
          
          return NextResponse.redirect(new URL(redirectPath, req.url))
        } else {
          // Se não tem perfil, redireciona para dashboard genérico
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
      return res
    }

    // Se não há sessão e está tentando acessar rota protegida, redireciona para login
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Buscar perfil do usuário para verificar role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, agency_id')
      .eq('id', session.user.id)
      .single()

    let userProfile = profile

    if (!profile || profileError) {
      // Se não tem perfil, cria um básico para usuário personal
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          email: session.user.email,
          role: 'personal',
        })
        .select('id, role, agency_id')
        .single()

      if (!newProfile) {
        // Se falhou em criar perfil, permite acesso limitado
        return res
      }

      userProfile = newProfile
    }

    if (!userProfile) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { role, id } = userProfile

    // Verificações de role para rotas específicas
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    
    // /dashboard: agency e user
    if (path.startsWith('/dashboard') && !['agency', 'user'].includes(role || '')) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    
    // /user: apenas user
    if (path.startsWith('/user') && role !== 'user') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    
    // /client/[id]: apenas o próprio client
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
    // Em caso de erro, limpar cookies e redirecionar para login
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.delete('supabase-auth-token')
    response.cookies.delete('sb-auth-token')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
