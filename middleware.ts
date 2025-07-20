

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { type Database } from './lib/supabase.types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const path = req.nextUrl.pathname

  // Rotas públicas
  const skipRoutes = [
    '/login', '/signup', '/', '/clear-cookies', '/favicon.ico', '/_next', '/images', '/api'
  ]
  if (skipRoutes.some(route => path.startsWith(route))) {
    return res
  }

  try {
    const supabase = createMiddlewareClient<Database>({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Buscar perfil do usuário autenticado
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, agency_id, producer_id, subscription_plan, subscription_status')
      .eq('id', session.user.id)
      .single()

    if (error || !profile) {
      // Se não encontrar perfil, força logout
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Redirecionamento por role
    const role = profile.role
    const roleRoutes = {
      admin: '/admin',
      agency_owner: '/agency',
      agency_staff: '/agency',
      agency_client: '/client',
      independent_producer: '/producer',
      independent_client: '/client',
      influencer: '/influencer',
      free_user: '/free'
    }

    // Se o usuário tentar acessar rota de outro role, redireciona
    const allowedBase = roleRoutes[role]
    if (allowedBase && !path.startsWith(allowedBase)) {
      return NextResponse.redirect(new URL(allowedBase, req.url))
    }

    // (Opcional) Bloquear recursos premium se plano não estiver ativo
    if (['premium', 'enterprise', 'agency_pro'].includes(profile.subscription_plan)) {
      if (profile.subscription_status !== 'active') {
        // Redireciona para página de renovação/upgrade
        return NextResponse.redirect(new URL('/upgrade', req.url))
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
}
