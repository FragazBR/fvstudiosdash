import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { redisCache } from '@/lib/redis-cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Buscar métricas de performance do cache
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

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Verificar permissões (apenas admins e managers)
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para acessar métricas do cache' }, { status: 403 })
    }

    // Parâmetros da URL
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '24h'

    // Obter estatísticas atuais do cache
    const currentStats = await redisCache.getStats()

    // Health check do Redis
    const healthCheck = await redisCache.healthCheck()
    
    // Determinar status geral
    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    if (healthCheck.status === 'unhealthy') {
      status = 'error'
    } else if (currentStats.hit_rate < 70 || healthCheck.latency > 100) {
      status = 'warning'
    }

    // Gerar dados históricos simulados (em produção, armazenar no banco)
    const historicalData = generateHistoricalData(period, currentStats)

    // Top keys simuladas (em produção, implementar tracking)
    const topKeys = [
      {
        key: `fvstudios:agency:${profile.agency_id}:projects`,
        hits: 1250,
        size_kb: 45.2,
        ttl: 1800,
        last_access: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        key: `fvstudios:user:${user.id}:dashboard`,
        hits: 890,
        size_kb: 23.1,
        ttl: 3600,
        last_access: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      {
        key: `fvstudios:api:whatsapp:templates`,
        hits: 567,
        size_kb: 12.8,
        ttl: 900,
        last_access: new Date(Date.now() - 1 * 60 * 1000).toISOString()
      },
      {
        key: `fvstudios:metrics:ai:${profile.agency_id}`,
        hits: 445,
        size_kb: 67.3,
        ttl: 300,
        last_access: new Date(Date.now() - 30 * 1000).toISOString()
      },
      {
        key: `fvstudios:external:meta_api:campaigns`,
        hits: 321,
        size_kb: 89.4,
        ttl: 600,
        last_access: new Date(Date.now() - 45 * 1000).toISOString()
      }
    ]

    // Insights de performance
    const performanceInsights = generatePerformanceInsights(currentStats, historicalData)

    const metrics = {
      current_stats: {
        ...currentStats,
        response_time: healthCheck.latency,
        status
      },
      historical_data: historicalData,
      top_keys: topKeys,
      performance_insights: performanceInsights
    }

    return NextResponse.json({
      success: true,
      metrics,
      period,
      last_updated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Gerar dados históricos simulados
function generateHistoricalData(period: string, currentStats: any) {
  const now = Date.now()
  const data = []
  
  let points: number
  let interval: number
  
  switch (period) {
    case '1h':
      points = 60
      interval = 60 * 1000 // 1 minuto
      break
    case '24h':
      points = 24
      interval = 60 * 60 * 1000 // 1 hora
      break
    case '7d':
      points = 7
      interval = 24 * 60 * 60 * 1000 // 1 dia
      break
    case '30d':
      points = 30
      interval = 24 * 60 * 60 * 1000 // 1 dia
      break
    default:
      points = 24
      interval = 60 * 60 * 1000
  }

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * interval))
    
    // Simular variações naturais nas métricas
    const baseHitRate = currentStats.hit_rate || 85
    const baseResponseTime = 15
    const baseMemoryMB = 128
    const baseKeysCount = currentStats.keys_count || 1000
    const baseRequestsPerMin = 50
    
    // Adicionar variação realística
    const variation = (Math.random() - 0.5) * 0.2 // ±10%
    const timeOfDay = timestamp.getHours()
    
    // Simular padrões de uso (mais ativo durante horário comercial)
    let activityMultiplier = 1
    if (timeOfDay >= 9 && timeOfDay <= 18) {
      activityMultiplier = 1.5
    } else if (timeOfDay >= 22 || timeOfDay <= 6) {
      activityMultiplier = 0.5
    }

    data.push({
      timestamp: period === '1h' ? 
        timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) :
        timestamp.toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' }),
      hit_rate: Math.max(60, Math.min(98, baseHitRate + (variation * 20))),
      response_time: Math.max(5, baseResponseTime + (variation * 10) + (activityMultiplier > 1 ? 5 : 0)),
      memory_usage_mb: Math.max(50, baseMemoryMB + (variation * 30)),
      keys_count: Math.max(500, Math.round(baseKeysCount + (variation * 200))),
      requests_per_minute: Math.max(10, Math.round(baseRequestsPerMin * activityMultiplier + (variation * 20)))
    })
  }

  return data
}

// Gerar insights de performance
function generatePerformanceInsights(stats: any, historicalData: any[]) {
  const bottlenecks: string[] = []
  const recommendations: string[] = []
  
  // Analisar hit rate
  if (stats.hit_rate < 70) {
    bottlenecks.push('Hit rate baixo - muitas requisições não encontram dados no cache')
    recommendations.push('Revisar estratégias de TTL e preload de dados frequentes')
  }
  
  // Analisar uso de memória
  const memoryUsageMB = parseFloat(stats.memory_usage.replace(/[^\d.]/g, ''))
  if (memoryUsageMB > 500) {
    bottlenecks.push('Alto uso de memória Redis')
    recommendations.push('Implementar limpeza automática de dados antigos')
  }
  
  // Analisar número de chaves
  if (stats.keys_count > 10000) {
    bottlenecks.push('Muitas chaves armazenadas - possível fragmentação')
    recommendations.push('Consolidar chaves relacionadas e otimizar estruturas de dados')
  }
  
  // Analisar tendências
  if (historicalData.length >= 5) {
    const recentData = historicalData.slice(-5)
    const avgHitRate = recentData.reduce((sum, d) => sum + d.hit_rate, 0) / recentData.length
    const avgResponseTime = recentData.reduce((sum, d) => sum + d.response_time, 0) / recentData.length
    
    if (avgHitRate < stats.hit_rate - 10) {
      bottlenecks.push('Hit rate em declínio nas últimas medições')
    }
    
    if (avgResponseTime > 50) {
      bottlenecks.push('Tempo de resposta alto consistente')
      recommendations.push('Verificar latência de rede e otimizar consultas')
    }
  }
  
  // Recomendações gerais
  if (bottlenecks.length === 0) {
    recommendations.push('Cache funcionando eficientemente')
    recommendations.push('Continuar monitorando métricas de performance')
  } else {
    recommendations.push('Implementar alertas automáticos para métricas críticas')
  }
  
  if (stats.hit_rate > 90) {
    recommendations.push('Excelente hit rate - considere aumentar TTL de dados estáveis')
  }
  
  // Calcular score de eficiência
  let efficiencyScore = 0
  efficiencyScore += Math.min(40, (stats.hit_rate / 100) * 40) // 40% baseado no hit rate
  efficiencyScore += stats.total_requests > 0 ? 20 : 0 // 20% se tem requisições
  efficiencyScore += memoryUsageMB < 300 ? 20 : 10 // 20% se memória ok
  efficiencyScore += stats.keys_count < 5000 ? 20 : 10 // 20% se número de chaves ok
  
  return {
    bottlenecks,
    recommendations,
    efficiency_score: Math.round(efficiencyScore)
  }
}