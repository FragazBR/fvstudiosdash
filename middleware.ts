

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { type Database } from './types/supabase-simple'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const path = req.nextUrl.pathname

  // Rotas públicas
  const skipRoutes = [
    '/login', '/signup', '/', '/clear-cookies', '/favicon.ico', '/_next', '/images', '/api', '/unauthorized'
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

    let profile = null
    let profileError = null

    // Tentar buscar perfil com client normal primeiro
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role, agency_id, subscription_plan, subscription_status')
        .eq('id', session.user.id)
        .single()
      
      profile = data
      profileError = error
    } catch (err: any) {
      console.error('Profile query error:', err)
      profileError = err
    }

    if (profileError || !profile) {
      console.error('Profile error:', profileError?.message || 'No profile found')
      // Redirecionar para login para criar/recuperar perfil
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Redirecionamento por role
    const role = profile.role
    const roleRoutes = {
      admin: '/admin',
      agency_owner: '/agency',
      agency_manager: '/agency-manager',
      agency_staff: '/agency',
      agency_client: '/client',
      independent_producer: '/independent',
      independent_client: '/client',
      influencer: '/influencer',
      free_user: '/dashboard'
    }

    // Se o usuário tentar acessar rota de outro role, redireciona
    const allowedBase = roleRoutes[role as keyof typeof roleRoutes]
    console.log(`Middleware check: user role=${role}, path=${path}, allowedBase=${allowedBase}`)
    
    if (allowedBase && !path.startsWith(allowedBase)) {
      console.log(`Redirecting from ${path} to ${allowedBase} for role ${role}`)
      return NextResponse.redirect(new URL(allowedBase, req.url))
    }

    // (Opcional) Bloquear recursos premium se plano não estiver ativo
    if (['premium', 'enterprise', 'agency_pro'].includes(profile.subscription_plan)) {
      if (profile.subscription_status !== 'active') {
        // Redireciona para página de renovação/upgrade
        return NextResponse.redirect(new URL('/upgrade-plan', req.url))
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
