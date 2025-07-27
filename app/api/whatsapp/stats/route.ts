import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Buscar estatísticas de notificações WhatsApp
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
    const period = url.searchParams.get('period') || '7' // 7 dias por padrão
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')

    // Calcular período
    let dateFilter = ''
    if (startDate && endDate) {
      dateFilter = `AND created_at BETWEEN '${startDate}' AND '${endDate}'`
    } else {
      const days = parseInt(period)
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - days)
      dateFilter = `AND created_at >= '${pastDate.toISOString()}'`
    }

    // Buscar estatísticas gerais
    const { data: notifications, error } = await supabase
      .from('client_notifications')
      .select('status, created_at, sent_at, read_at, failed_at, template_used')
      .eq('agency_id', profile.agency_id)
      .gte('created_at', new Date(Date.now() - (parseInt(period) * 24 * 60 * 60 * 1000)).toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar notificações:', error)
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
    }

    // Calcular estatísticas
    const stats = {
      total_sent: notifications?.length || 0,
      delivered: notifications?.filter(n => n.status === 'delivered' || n.status === 'read').length || 0,
      read: notifications?.filter(n => n.status === 'read').length || 0,
      failed: notifications?.filter(n => n.status === 'failed').length || 0,
      pending: notifications?.filter(n => n.status === 'pending' || n.status === 'sent').length || 0,
      delivery_rate: 0,
      read_rate: 0,
      average_response_time: 0,
      templates_usage: {} as Record<string, number>,
      daily_stats: [] as any[],
      hourly_distribution: Array(24).fill(0)
    }

    // Calcular taxas
    if (stats.total_sent > 0) {
      stats.delivery_rate = Math.round((stats.delivered / stats.total_sent) * 100)
      stats.read_rate = Math.round((stats.read / stats.total_sent) * 100)
    }

    // Calcular tempo médio de resposta (do envio até leitura)
    const readNotifications = notifications?.filter(n => n.sent_at && n.read_at) || []
    if (readNotifications.length > 0) {
      const totalResponseTime = readNotifications.reduce((sum, n) => {
        const sentTime = new Date(n.sent_at).getTime()
        const readTime = new Date(n.read_at).getTime()
        return sum + (readTime - sentTime)
      }, 0)
      stats.average_response_time = Math.round(totalResponseTime / readNotifications.length / 1000) // em segundos
    }

    // Uso por template
    notifications?.forEach(n => {
      if (n.template_used) {
        stats.templates_usage[n.template_used] = (stats.templates_usage[n.template_used] || 0) + 1
      }
    })

    // Estatísticas diárias (últimos N dias)
    const dailyMap = new Map()
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      dailyMap.set(dateKey, {
        date: dateKey,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0
      })
    }

    notifications?.forEach(n => {
      const dateKey = n.created_at.split('T')[0]
      if (dailyMap.has(dateKey)) {
        const dayStats = dailyMap.get(dateKey)
        dayStats.sent++
        if (n.status === 'delivered' || n.status === 'read') dayStats.delivered++
        if (n.status === 'read') dayStats.read++
        if (n.status === 'failed') dayStats.failed++
      }
    })

    stats.daily_stats = Array.from(dailyMap.values())

    // Distribuição por hora do dia
    notifications?.forEach(n => {
      const hour = new Date(n.created_at).getHours()
      stats.hourly_distribution[hour]++
    })

    // Buscar estatísticas dos últimos templates
    const { data: topTemplates } = await supabase
      .from('notification_templates')
      .select('template_name, usage_count, notification_type')
      .eq('agency_id', profile.agency_id)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      stats,
      top_templates: topTemplates || [],
      period_days: parseInt(period)
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}