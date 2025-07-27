import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Obter métricas agregadas e estatísticas de logs
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
    const timeRange = searchParams.get('time_range') || '24h' // 1h, 24h, 7d, 30d
    const includeDetails = searchParams.get('include_details') === 'true'

    // Calcular timestamps
    const now = new Date()
    const startTime = new Date()
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1)
        break
      case '24h':
        startTime.setDate(now.getDate() - 1)
        break
      case '7d':
        startTime.setDate(now.getDate() - 7)
        break
      case '30d':
        startTime.setDate(now.getDate() - 30)
        break
      default:
        startTime.setDate(now.getDate() - 1)
    }

    // Query base com filtros de segurança
    const baseWhere = profile.role === 'admin' 
      ? `created_at >= '${startTime.toISOString()}'`
      : `created_at >= '${startTime.toISOString()}' AND agency_id = '${profile.agency_id}'`

    // 1. Contagem total de logs por nível
    const { data: logCounts } = await supabase
      .from('system_logs')
      .select('level')
      .gte('created_at', startTime.toISOString())
      .eq(profile.role !== 'admin' ? 'agency_id' : 'id', profile.role !== 'admin' ? profile.agency_id : 'id')

    const logLevelCounts = logCounts?.reduce((acc: any, log: any) => {
      acc[log.level] = (acc[log.level] || 0) + 1
      return acc
    }, {}) || {}

    // 2. Contagem por categoria
    const { data: categoryCounts } = await supabase
      .from('system_logs')
      .select('category')
      .gte('created_at', startTime.toISOString())
      .eq(profile.role !== 'admin' ? 'agency_id' : 'id', profile.role !== 'admin' ? profile.agency_id : 'id')

    const categoryStats = categoryCounts?.reduce((acc: any, log: any) => {
      acc[log.category] = (acc[log.category] || 0) + 1
      return acc
    }, {}) || {}

    // 3. Estatísticas de performance (duração)
    const { data: performanceStats } = await supabase
      .from('system_logs')
      .select('duration_ms')
      .gte('created_at', startTime.toISOString())
      .not('duration_ms', 'is', null)
      .eq(profile.role !== 'admin' ? 'agency_id' : 'id', profile.role !== 'admin' ? profile.agency_id : 'id')

    const durations = performanceStats?.map(p => p.duration_ms).filter(d => d !== null) || []
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0

    // 4. Top usuários por atividade (se incluir detalhes)
    let topUsers: any[] = []
    if (includeDetails) {
      const { data: userActivity } = await supabase
        .from('system_logs')
        .select(`
          user_id,
          profiles!user_id(email, full_name)
        `)
        .gte('created_at', startTime.toISOString())
        .not('user_id', 'is', null)
        .eq(profile.role !== 'admin' ? 'agency_id' : 'id', profile.role !== 'admin' ? profile.agency_id : 'id')

      const userStats = userActivity?.reduce((acc: any, log: any) => {
        if (log.user_id) {
          acc[log.user_id] = acc[log.user_id] || {
            user_id: log.user_id,
            email: log.profiles?.email,
            name: log.profiles?.full_name,
            count: 0
          }
          acc[log.user_id].count++
        }
        return acc
      }, {}) || {}

      topUsers = Object.values(userStats)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10)
    }

    // 5. Tendência temporal (logs por hora)
    const { data: hourlyTrends } = await supabase
      .from('log_summary')
      .select('*')
      .gte('hour', startTime.toISOString())
      .eq(profile.role !== 'admin' ? 'agency_id' : 'id', profile.role !== 'admin' ? profile.agency_id : 'id')
      .order('hour', { ascending: true })

    // 6. Top erros mais frequentes
    const { data: errorLogs } = await supabase
      .from('system_logs')
      .select('message, details')
      .in('level', ['error', 'critical'])
      .gte('created_at', startTime.toISOString())
      .eq(profile.role !== 'admin' ? 'agency_id' : 'id', profile.role !== 'admin' ? profile.agency_id : 'id')
      .limit(100)

    const errorFrequency = errorLogs?.reduce((acc: any, log: any) => {
      const key = log.message
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}) || {}

    const topErrors = Object.entries(errorFrequency)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }))

    // 7. Rate de erro
    const totalLogs = Object.values(logLevelCounts).reduce((a: any, b: any) => a + b, 0)
    const errorLogs_count = (logLevelCounts.error || 0) + (logLevelCounts.critical || 0)
    const errorRate = totalLogs > 0 ? (errorLogs_count / totalLogs) * 100 : 0

    // 8. Sessões ativas
    const { data: activeSessions } = await supabase
      .from('system_logs')
      .select('session_id')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // última hora
      .not('session_id', 'is', null)
      .eq(profile.role !== 'admin' ? 'agency_id' : 'id', profile.role !== 'admin' ? profile.agency_id : 'id')

    const uniqueSessions = new Set(activeSessions?.map(s => s.session_id)).size

    const response = {
      success: true,
      time_range: timeRange,
      period: {
        start: startTime.toISOString(),
        end: now.toISOString()
      },
      summary: {
        total_logs: totalLogs,
        error_rate_percent: Math.round(errorRate * 100) / 100,
        unique_sessions: uniqueSessions,
        avg_response_time_ms: Math.round(avgDuration * 100) / 100
      },
      log_levels: logLevelCounts,
      categories: categoryStats,
      performance: {
        avg_duration_ms: Math.round(avgDuration * 100) / 100,
        max_duration_ms: maxDuration,
        min_duration_ms: minDuration,
        total_requests_with_duration: durations.length
      },
      trends: {
        hourly: hourlyTrends || []
      },
      top_errors: topErrors,
      ...(includeDetails && {
        top_users: topUsers
      })
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro ao buscar métricas de logs:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}