import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Buscar estatísticas de notificações em tempo real
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

    // Parâmetros da URL
    const url = new URL(request.url)
    const period = parseInt(url.searchParams.get('period') || '7') // dias
    const includePersonal = url.searchParams.get('include_personal') === 'true'

    // Usar função SQL customizada para estatísticas
    const { data: stats, error } = await supabase
      .rpc('get_notification_stats', {
        p_agency_id: profile.agency_id,
        p_days: period
      })

    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
    }

    const statsData = stats?.[0] || {
      total_count: 0,
      unread_count: 0,
      read_rate: 0,
      by_type: {},
      by_priority: {},
      daily_counts: {}
    }

    // Buscar dados adicionais se necessário
    const currentDate = new Date()
    const pastDate = new Date()
    pastDate.setDate(currentDate.getDate() - period)

    // Buscar notificações detalhadas para análises extras
    const { data: notifications } = await supabase
      .from('realtime_notifications')
      .select('type, priority, read, created_at, read_at, user_id')
      .eq('agency_id', profile.agency_id)
      .gte('created_at', pastDate.toISOString())
      .order('created_at', { ascending: false })

    // Calcular métricas adicionais
    const additionalStats = {
      // Tempo médio para leitura (em minutos)
      average_read_time: 0,
      
      // Distribuição por usuário
      by_user: {} as Record<string, number>,
      
      // Horários mais comuns (0-23)
      hourly_distribution: Array(24).fill(0),
      
      // Comparação com período anterior
      previous_period: {
        total_count: 0,
        unread_count: 0,
        read_rate: 0
      },
      
      // Top tipos mais comuns
      top_types: [] as Array<{ type: string, count: number, percentage: number }>,
      
      // Engagement rate (% de notificações que foram lidas)
      engagement_rate: 0
    }

    if (notifications && notifications.length > 0) {
      // Tempo médio de leitura
      const readNotifications = notifications.filter(n => n.read && n.read_at)
      if (readNotifications.length > 0) {
        const totalReadTime = readNotifications.reduce((sum, n) => {
          const created = new Date(n.created_at).getTime()
          const read = new Date(n.read_at!).getTime()
          return sum + (read - created)
        }, 0)
        additionalStats.average_read_time = Math.round(totalReadTime / readNotifications.length / 1000 / 60) // minutos
      }

      // Distribuição por usuário (apenas notificações pessoais)
      notifications
        .filter(n => n.user_id)
        .forEach(n => {
          additionalStats.by_user[n.user_id!] = (additionalStats.by_user[n.user_id!] || 0) + 1
        })

      // Distribuição por hora
      notifications.forEach(n => {
        const hour = new Date(n.created_at).getHours()
        additionalStats.hourly_distribution[hour]++
      })

      // Top tipos
      const typeCount = notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      additionalStats.top_types = Object.entries(typeCount)
        .map(([type, count]) => ({
          type,
          count,
          percentage: Math.round((count / notifications.length) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Engagement rate
      const readCount = notifications.filter(n => n.read).length
      additionalStats.engagement_rate = Math.round((readCount / notifications.length) * 100)
    }

    // Buscar dados do período anterior para comparação
    const previousPastDate = new Date()
    previousPastDate.setDate(pastDate.getDate() - period)

    const { data: previousStats } = await supabase
      .rpc('get_notification_stats', {
        p_agency_id: profile.agency_id,
        p_days: period,
        p_start_date: previousPastDate.toISOString(),
        p_end_date: pastDate.toISOString()
      })

    if (previousStats?.[0]) {
      additionalStats.previous_period = {
        total_count: previousStats[0].total_count || 0,
        unread_count: previousStats[0].unread_count || 0,
        read_rate: previousStats[0].read_rate || 0
      }
    }

    // Buscar nomes dos usuários para as estatísticas por usuário
    if (Object.keys(additionalStats.by_user).length > 0) {
      const userIds = Object.keys(additionalStats.by_user)
      const { data: users } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds)

      const userStats = {} as Record<string, { name: string, count: number }>
      users?.forEach(user => {
        userStats[user.id] = {
          name: user.name || 'Usuário',
          count: additionalStats.by_user[user.id] || 0
        }
      })
      additionalStats.by_user = userStats as any
    }

    // Calcular trends (crescimento/diminuição em relação ao período anterior)
    const trends = {
      total_change: 0,
      unread_change: 0,
      read_rate_change: 0
    }

    if (additionalStats.previous_period.total_count > 0) {
      trends.total_change = Math.round(
        ((statsData.total_count - additionalStats.previous_period.total_count) / 
         additionalStats.previous_period.total_count) * 100
      )
      
      trends.unread_change = Math.round(
        ((statsData.unread_count - additionalStats.previous_period.unread_count) / 
         additionalStats.previous_period.unread_count) * 100
      )
      
      trends.read_rate_change = Math.round(
        statsData.read_rate - additionalStats.previous_period.read_rate
      )
    }

    return NextResponse.json({
      success: true,
      stats: {
        // Estatísticas básicas
        total_count: parseInt(statsData.total_count || '0'),
        unread_count: parseInt(statsData.unread_count || '0'),
        read_count: parseInt(statsData.total_count || '0') - parseInt(statsData.unread_count || '0'),
        read_rate: parseFloat(statsData.read_rate || '0'),
        
        // Distribuições
        by_type: statsData.by_type || {},
        by_priority: statsData.by_priority || {},
        daily_counts: statsData.daily_counts || {},
        
        // Métricas adicionais
        ...additionalStats,
        
        // Trends
        trends
      },
      period_days: period,
      agency_id: profile.agency_id
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}