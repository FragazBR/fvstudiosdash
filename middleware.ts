
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { type Database } from './lib/supabase.types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Busca perfil do usuário
  const {
    data: profile,
    error: profileError,
  }: { data: { id: string; role: string; agency_id?: string } | null; error: any } = await supabase
    .from('profiles')
    .select('id, role, agency_id')
    .eq('id', session.user.id)
    .single();

  if (!profile || profileError) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const { role, id } = profile;
  const path = req.nextUrl.pathname

  // Redirecionamento pós-login
  if (path === '/login') {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    if (role === 'agency') return NextResponse.redirect(new URL('/dashboard', req.url))
    if (role === 'client') return NextResponse.redirect(new URL(`/client/${id}`, req.url))
    if (role === 'personal') return NextResponse.redirect(new URL('/personal/dashboard', req.url))
  }

  // Proteção de rotas
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
  if (path.startsWith('/dashboard') && role !== 'agency') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
  if (path.startsWith('/client') && role !== 'client') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
  if (path.startsWith('/personal') && role !== 'personal') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
