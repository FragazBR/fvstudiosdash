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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const scope = searchParams.get('scope') || 'agency'

    // Determinar se deve filtrar por agência
    const agencyId = profile.role === 'admin' && scope === 'global' ? 
      undefined : profile.agency_id

    // Buscar alertas críticos
    const criticalAlerts = await executiveAnalytics.getCriticalAlerts(agencyId, limit)

    // Buscar resumo de alertas por tipo e severidade
    let alertSummaryQuery = supabase
      .from('alerts')
      .select('type, severity, status')
      .eq('status', 'active')

    if (agencyId) {
      alertSummaryQuery = alertSummaryQuery.eq('agency_id', agencyId)
    }

    const { data: alertSummaryData } = await alertSummaryQuery

    // Agrupar alertas por tipo e severidade
    const summary: Record<string, Record<string, number>> = {}
    alertSummaryData?.forEach(alert => {
      if (!summary[alert.type]) summary[alert.type] = {}
      if (!summary[alert.type][alert.severity]) summary[alert.type][alert.severity] = 0
      summary[alert.type][alert.severity]++
    })

    // Calcular estatísticas gerais
    const totalAlerts = alertSummaryData?.length || 0
    const criticalCount = alertSummaryData?.filter(a => a.severity === 'critical').length || 0
    const errorCount = alertSummaryData?.filter(a => a.severity === 'error').length || 0
    const warningCount = alertSummaryData?.filter(a => a.severity === 'warning').length || 0

    // Buscar tendência de alertas dos últimos 7 dias
    const alertTrend = await executiveAnalytics.getTrendData('alerts', 7, agencyId)

    return NextResponse.json({
      success: true,
      critical_alerts: criticalAlerts,
      summary,
      statistics: {
        total: totalAlerts,
        critical: criticalCount,
        error: errorCount,
        warning: warningCount,
        info: totalAlerts - criticalCount - errorCount - warningCount
      },
      trend: alertTrend,
      scope: agencyId ? 'agency' : 'global',
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar alertas executivos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}