import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { pushNotificationManager } from '@/lib/realtime-notifications'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')
    const daysBack = parseInt(searchParams.get('days_back') || '30')

    // Verificar se o usuário tem permissão para ver estatísticas da agência
    if (agencyId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, agency_id')
        .eq('id', user.id)
        .single()

      if (!profile || (profile.agency_id !== agencyId && !['admin', 'agency_owner', 'agency_manager'].includes(profile.role))) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
    }

    // Obter estatísticas de push notifications
    const pushStats = await pushNotificationManager.getPushNotificationStats(agencyId || undefined, daysBack)

    // Obter estatísticas adicionais
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // Estatísticas de eventos de notificação
    const { data: eventStats, error: eventError } = await supabase
      .from('realtime_notification_events')
      .select('event_type, priority, processed, created_at')
      .gte('created_at', startDate.toISOString())
      .eq('agency_id', agencyId || null)

    if (eventError) {
      console.error('Erro ao buscar estatísticas de eventos:', eventError)
    }

    // Processar estatísticas de eventos
    const events = eventStats || []
    const eventStatsProcessed = {
      total: events.length,
      processed: events.filter(e => e.processed).length,
      by_type: events.reduce((acc: any, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1
        return acc
      }, {}),
      by_priority: events.reduce((acc: any, event) => {
        acc[event.priority] = (acc[event.priority] || 0) + 1
        return acc
      }, {}),
      processing_rate: events.length > 0 ? 
        Math.round((events.filter(e => e.processed).length / events.length) * 100) : 0
    }

    // Estatísticas de preferências dos usuários
    const { data: preferencesStats, error: prefError } = await supabase
      .from('user_notification_preferences')
      .select('enabled, push_notifications, email_notifications, quiet_hours_enabled')
      .eq('agency_id', agencyId || null)

    if (prefError) {
      console.error('Erro ao buscar estatísticas de preferências:', prefError)
    }

    const preferences = preferencesStats || []
    const preferenceStatsProcessed = {
      total_users: preferences.length,
      notifications_enabled: preferences.filter(p => p.enabled).length,
      push_enabled: preferences.filter(p => p.push_notifications).length,
      email_enabled: preferences.filter(p => p.email_notifications).length,
      quiet_hours_enabled: preferences.filter(p => p.quiet_hours_enabled).length,
      push_adoption_rate: preferences.length > 0 ? 
        Math.round((preferences.filter(p => p.push_notifications).length / preferences.length) * 100) : 0
    }

    // Tendência diária de eventos
    const dailyTrend = []
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStr = date.toISOString().split('T')[0]
      
      const dayEvents = events.filter(e => e.created_at.startsWith(dayStr))
      
      dailyTrend.push({
        date: dayStr,
        total_events: dayEvents.length,
        processed_events: dayEvents.filter(e => e.processed).length,
        high_priority: dayEvents.filter(e => e.priority === 'high').length,
        urgent_priority: dayEvents.filter(e => e.priority === 'urgent').length,
        critical_priority: dayEvents.filter(e => e.priority === 'critical').length
      })
    }

    const stats = {
      period: `${daysBack} dias`,
      generated_at: new Date().toISOString(),
      push_notifications: pushStats || {
        total_subscriptions: 0,
        active_subscriptions: 0,
        total_sent: 0,
        total_delivered: 0,
        total_clicked: 0,
        delivery_rate: 0,
        click_rate: 0,
        daily_stats: []
      },
      notification_events: eventStatsProcessed,
      user_preferences: preferenceStatsProcessed,
      daily_trend: dailyTrend,
      summary: {
        total_events: eventStatsProcessed.total,
        total_push_sent: pushStats?.total_sent || 0,
        avg_delivery_rate: pushStats?.delivery_rate || 0,
        avg_click_rate: pushStats?.click_rate || 0,
        user_engagement: preferenceStatsProcessed.push_adoption_rate
      }
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Erro ao gerar estatísticas de notificações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}