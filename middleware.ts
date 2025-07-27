

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { type Database } from './types/supabase-simple'
import { createClient } from '@supabase/supabase-js'
import { redisCache } from './lib/redis-cache'

// Rate limiting configurations
const rateLimitConfigs: Record<string, { requests: number; windowMs: number }> = {
  '/api/ai/': { requests: 30, windowMs: 60000 }, // 30 req/min
  '/api/openai/': { requests: 20, windowMs: 60000 }, // 20 req/min
  '/api/whatsapp/': { requests: 100, windowMs: 60000 }, // 100 req/min
  '/api/realtime-notifications': { requests: 200, windowMs: 60000 }, // 200 req/min
  '/api/auth/': { requests: 20, windowMs: 60000 }, // 20 req/min
  default: { requests: 100, windowMs: 60000 } // 100 req/min
}

async function applyRateLimit(req: NextRequest): Promise<NextResponse | null> {
  if (!req.nextUrl.pathname.startsWith('/api/')) return null
  
  try {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'anonymous'
    const pathname = req.nextUrl.pathname
    
    // Find applicable config
    let config = rateLimitConfigs.default
    for (const [route, routeConfig] of Object.entries(rateLimitConfigs)) {
      if (route !== 'default' && pathname.startsWith(route)) {
        config = routeConfig
        break
      }
    }
    
    const key = `rate_limit:${ip}:${pathname}`
    const window = Math.floor(Date.now() / config.windowMs)
    const windowKey = `${key}:${window}`
    
    const current = await redisCache.get(windowKey) as number || 0
    
    if (current >= config.requests) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          limit: config.requests,
          window: config.windowMs,
          retryAfter: config.windowMs / 1000
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': (config.windowMs / 1000).toString()
          }
        }
      )
    }
    
    await redisCache.set(windowKey, current + 1, { ttl: Math.ceil(config.windowMs / 1000) })
    return null
  } catch (error) {
    console.warn('Rate limiting failed:', error)
    return null
  }
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  const headers = new Headers(response.headers)
  
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss: ws:",
    "media-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
  
  headers.set('Content-Security-Policy', csp)
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

export async function middleware(req: NextRequest) {
  const start = Date.now()
  
  // Apply rate limiting first
  const rateLimitResponse = await applyRateLimit(req)
  if (rateLimitResponse) {
    return addSecurityHeaders(rateLimitResponse)
  }
  
  let res = NextResponse.next()
  const path = req.nextUrl.pathname

  // Public routes
  const skipRoutes = [
    '/login', '/signup', '/', '/clear-cookies', '/favicon.ico', '/_next', '/images', '/api', '/unauthorized'
  ]
  if (skipRoutes.some(route => path.startsWith(route))) {
    res.headers.set('X-Response-Time', `${Date.now() - start}ms`)
    return addSecurityHeaders(res)
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

    res.headers.set('X-Response-Time', `${Date.now() - start}ms`)
    return addSecurityHeaders(res)
  } catch (error) {
    console.error('Middleware error:', error)
    res.headers.set('X-Response-Time', `${Date.now() - start}ms`)
    return addSecurityHeaders(res)
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
}
