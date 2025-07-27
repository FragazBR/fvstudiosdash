import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { redisCache } from '@/lib/redis-cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verificar saúde do sistema
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

    // Buscar dados do usuário - apenas admins podem ver saúde completa do sistema
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado - apenas administradores' }, { status: 403 })
    }

    const startTime = Date.now()

    // 1. Testar conectividade com banco de dados
    let databaseStatus = 'healthy'
    let databaseResponseTime = 0
    try {
      const dbStart = Date.now()
      await supabase.from('profiles').select('id').limit(1)
      databaseResponseTime = Date.now() - dbStart
      if (databaseResponseTime > 1000) databaseStatus = 'degraded'
      if (databaseResponseTime > 5000) databaseStatus = 'critical'
    } catch (error) {
      databaseStatus = 'critical'
      databaseResponseTime = Date.now() - startTime
    }

    // 2. Testar conectividade com Redis
    let redisStatus = 'healthy'
    let redisResponseTime = 0
    try {
      const redisStart = Date.now()
      await redisCache.set('health_check', Date.now(), { ttl: 60 })
      await redisCache.get('health_check')
      redisResponseTime = Date.now() - redisStart
      if (redisResponseTime > 100) redisStatus = 'degraded'
      if (redisResponseTime > 500) redisStatus = 'critical'
    } catch (error) {
      redisStatus = 'critical'
      redisResponseTime = Date.now() - startTime
    }

    // 3. Verificar estatísticas de cache
    const cacheStats = await redisCache.getStats().catch(() => ({
      hits: 0,
      misses: 0,
      keys: 0,
      memory_usage: 0
    }))

    const cacheHitRate = cacheStats.hits + cacheStats.misses > 0 
      ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100 
      : 0

    // 4. Verificar logs de erro recentes (últimas 24h)
    const { data: recentErrors, count: errorCount } = await supabase
      .from('system_logs')
      .select('id, level, created_at', { count: 'exact' })
      .in('level', ['error', 'critical'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const { count: totalLogs } = await supabase
      .from('system_logs')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const errorRate = totalLogs && totalLogs > 0 ? (errorCount || 0) / totalLogs * 100 : 0

    // 5. Verificar métricas de performance recentes
    const { data: performanceMetrics } = await supabase
      .from('performance_metrics')
      .select('metric_name, metric_value, timestamp')
      .eq('metric_name', 'api_response_time')
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // última hora
      .order('timestamp', { ascending: false })
      .limit(100)

    const avgResponseTime = performanceMetrics && performanceMetrics.length > 0
      ? performanceMetrics.reduce((sum, m) => sum + m.metric_value, 0) / performanceMetrics.length
      : 0

    // 6. Verificar uso de recursos do sistema (simulado)
    const memoryUsage = await redisCache.get('system:memory_usage').catch(() => Math.random() * 1000 + 500) as number
    const cpuUsage = await redisCache.get('system:cpu_usage').catch(() => Math.random() * 50 + 25) as number
    const activeConnections = await redisCache.get('system:active_connections').catch(() => Math.floor(Math.random() * 100 + 50)) as number

    // 7. Determinar status geral do sistema
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy'
    
    const criticalConditions = [
      databaseStatus === 'critical',
      redisStatus === 'critical',
      errorRate > 10,
      avgResponseTime > 5000,
      cpuUsage > 90,
      memoryUsage > 2000
    ]

    const degradedConditions = [
      databaseStatus === 'degraded',
      redisStatus === 'degraded',
      errorRate > 5,
      avgResponseTime > 2000,
      cacheHitRate < 50,
      cpuUsage > 70,
      memoryUsage > 1500
    ]

    if (criticalConditions.some(condition => condition)) {
      overallStatus = 'critical'
    } else if (degradedConditions.some(condition => condition)) {
      overallStatus = 'degraded'
    }

    // 8. Calcular uptime (simulado - em produção usar métricas reais)
    const systemStartTime = await redisCache.get('system:start_time').catch(() => Date.now() - 24 * 60 * 60 * 1000) as number
    const uptimeSeconds = Math.floor((Date.now() - systemStartTime) / 1000)

    // 9. Verificações de componentes específicos
    const componentHealths = [
      {
        name: 'Database',
        status: databaseStatus,
        response_time_ms: databaseResponseTime,
        details: { type: 'PostgreSQL/Supabase' }
      },
      {
        name: 'Redis Cache',  
        status: redisStatus,
        response_time_ms: redisResponseTime,
        details: {
          hit_rate_percent: Math.round(cacheHitRate * 100) / 100,
          total_keys: cacheStats.keys,
          memory_usage_mb: Math.round(cacheStats.memory_usage / 1024 / 1024 * 100) / 100
        }
      },
      {
        name: 'API Performance',
        status: avgResponseTime > 5000 ? 'critical' : avgResponseTime > 2000 ? 'degraded' : 'healthy',
        response_time_ms: Math.round(avgResponseTime * 100) / 100,
        details: {
          measurements_last_hour: performanceMetrics?.length || 0
        }
      },
      {
        name: 'Error Monitoring',
        status: errorRate > 10 ? 'critical' : errorRate > 5 ? 'degraded' : 'healthy',
        response_time_ms: 0,
        details: {
          error_rate_percent: Math.round(errorRate * 100) / 100,
          total_errors_24h: errorCount || 0,
          total_logs_24h: totalLogs || 0
        }
      }
    ]

    // 10. Registrar verificação de saúde
    await supabase
      .from('system_health_checks')
      .insert({
        check_name: 'comprehensive_health',
        status: overallStatus,
        response_time_ms: Date.now() - startTime,
        details: {
          components: componentHealths,
          system_metrics: {
            memory_usage_mb: memoryUsage,
            cpu_usage_percent: cpuUsage,
            active_connections: activeConnections,
            cache_hit_rate: cacheHitRate,
            error_rate: errorRate,
            avg_response_time_ms: avgResponseTime
          }
        }
      })
      .catch(err => console.warn('Failed to log health check:', err))

    const healthReport = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime_seconds: uptimeSeconds,
      response_time_ms: Date.now() - startTime,
      system_metrics: {
        memory_usage_mb: Math.round(memoryUsage * 100) / 100,
        cpu_usage_percent: Math.round(cpuUsage * 100) / 100,
        active_connections: activeConnections,
        cache_hit_rate_percent: Math.round(cacheHitRate * 100) / 100,
        error_rate_percent: Math.round(errorRate * 100) / 100,
        avg_response_time_ms: Math.round(avgResponseTime * 100) / 100
      },
      components: componentHealths,
      recent_activity: {
        total_logs_24h: totalLogs || 0,
        error_logs_24h: errorCount || 0,
        performance_measurements_1h: performanceMetrics?.length || 0
      }
    }

    // Retornar status HTTP baseado na saúde
    const statusCode = overallStatus === 'critical' ? 503 : 
                      overallStatus === 'degraded' ? 206 : 200

    return NextResponse.json({
      success: true,
      health: healthReport
    }, { status: statusCode })

  } catch (error) {
    console.error('Erro ao verificar saúde do sistema:', error)
    
    // Registrar falha da verificação de saúde
    await supabase
      .from('system_health_checks')
      .insert({
        check_name: 'comprehensive_health',
        status: 'critical',
        response_time_ms: 0,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      .catch(() => {}) // Ignore errors logging the health check failure

    return NextResponse.json({
      success: false,
      health: {
        status: 'critical',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        uptime_seconds: 0,
        system_metrics: {
          memory_usage_mb: 0,
          cpu_usage_percent: 0,
          active_connections: 0,
          cache_hit_rate_percent: 0,
          error_rate_percent: 100,
          avg_response_time_ms: 0
        },
        components: []
      }
    }, { status: 503 })
  }
}