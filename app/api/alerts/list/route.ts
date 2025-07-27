import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { alertSystem } from '@/lib/alert-system'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Listar alertas ativos
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

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any
    const severity = searchParams.get('severity') as any
    const type = searchParams.get('type') as any
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Buscar alertas
    const alerts = await alertSystem.getAlerts({
      status,
      severity,
      type,
      agency_id: profile.role !== 'admin' ? profile.agency_id : undefined,
      limit,
      offset
    })

    // Formatar alertas
    const formattedAlerts = alerts.map((alert: any) => ({
      id: alert.id,
      rule_id: alert.rule_id,
      rule_name: alert.rule_name,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      status: alert.status,
      triggered_at: alert.triggered_at,
      acknowledged_at: alert.acknowledged_at,
      acknowledged_by: alert.acknowledged_by ? {
        id: alert.acknowledged_by,
        email: alert.profiles?.email,
        name: alert.profiles?.full_name
      } : null,
      resolved_at: alert.resolved_at,
      resolved_by: alert.resolved_by ? {
        id: alert.resolved_by,
        email: alert.profiles?.email,
        name: alert.profiles?.full_name
      } : null,
      duration_minutes: alert.resolved_at 
        ? Math.round((new Date(alert.resolved_at).getTime() - new Date(alert.triggered_at).getTime()) / (1000 * 60))
        : Math.round((Date.now() - new Date(alert.triggered_at).getTime()) / (1000 * 60)),
      details: alert.details
    }))

    // Buscar estatísticas
    const statistics = await alertSystem.getAlertStatistics(
      profile.role !== 'admin' ? profile.agency_id : undefined
    )

    return NextResponse.json({
      success: true,
      alerts: formattedAlerts,
      statistics,
      pagination: {
        limit,
        offset,
        total: formattedAlerts.length,
        has_more: formattedAlerts.length === limit
      }
    })

  } catch (error) {
    console.error('Erro ao listar alertas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}