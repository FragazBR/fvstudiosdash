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
    const metric = searchParams.get('metric') || 'projects'
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 365)
    const scope = searchParams.get('scope') || 'agency'

    // Validar métrica
    const validMetrics = ['projects', 'revenue', 'users', 'alerts', 'performance']
    if (!validMetrics.includes(metric)) {
      return NextResponse.json({ 
        error: 'Métrica inválida. Opções: ' + validMetrics.join(', ') 
      }, { status: 400 })
    }

    // Determinar se deve filtrar por agência
    const agencyId = profile.role === 'admin' && scope === 'global' ? 
      undefined : profile.agency_id

    // Buscar dados de tendência
    const trendData = await executiveAnalytics.getTrendData(metric, days, agencyId)

    // Calcular estatísticas
    const values = trendData.map(d => d.value)
    const total = values.reduce((acc, val) => acc + val, 0)
    const average = values.length > 0 ? total / values.length : 0
    const max = Math.max(...values)
    const min = Math.min(...values)

    // Calcular crescimento (comparar primeira e última semana)
    const firstWeek = trendData.slice(0, 7)
    const lastWeek = trendData.slice(-7)
    const firstWeekAvg = firstWeek.reduce((acc, d) => acc + d.value, 0) / firstWeek.length
    const lastWeekAvg = lastWeek.reduce((acc, d) => acc + d.value, 0) / lastWeek.length
    const growth = firstWeekAvg > 0 ? ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100 : 0

    return NextResponse.json({
      success: true,
      metric,
      days,
      scope: agencyId ? 'agency' : 'global',
      data: trendData,
      statistics: {
        total,
        average: Number(average.toFixed(2)),
        max,
        min,
        growth_percent: Number(growth.toFixed(2))
      },
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar dados de tendência:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}