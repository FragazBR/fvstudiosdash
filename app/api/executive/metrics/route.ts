import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { executiveAnalytics } from '@/lib/executive-analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Verificar permissões para analytics executivo
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Sem permissão para acessar analytics executivo' 
      }, { status: 403 })
    }

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'agency' // 'agency' ou 'global'

    // Determinar se deve filtrar por agência
    const agencyId = profile.role === 'admin' && scope === 'global' ? 
      undefined : profile.agency_id

    // Buscar métricas executivas
    const metrics = await executiveAnalytics.getExecutiveMetrics(agencyId)

    return NextResponse.json({
      success: true,
      metrics,
      scope: agencyId ? 'agency' : 'global',
      agency_id: agencyId,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar métricas executivas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}