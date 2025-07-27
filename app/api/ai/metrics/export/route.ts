import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Exportar métricas de IA em CSV
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
    const period = parseInt(url.searchParams.get('period') || '7')
    const format = url.searchParams.get('format') || 'csv'
    const service = url.searchParams.get('service')

    // Calcular datas
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - period)

    // Buscar dados de créditos/IA
    let query = supabase
      .from('credits_usage')
      .select(`
        *,
        profiles!credits_usage_user_id_fkey(name)
      `)
      .eq('agency_id', profile.agency_id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (service && service !== 'all') {
      query = query.eq('service_used', service)
    }

    const { data: creditsData, error } = await query

    if (error) {
      console.error('Erro ao buscar dados:', error)
      return NextResponse.json({ error: 'Erro ao buscar dados para exportação' }, { status: 500 })
    }

    if (format === 'csv') {
      // Gerar CSV
      const csvHeaders = [
        'Data/Hora',
        'Usuário',
        'Serviço',
        'Tokens Consumidos',
        'Créditos Debitados',
        'Custo (USD)',
        'Status',
        'Tempo de Resposta (ms)',
        'Modelo',
        'Metadata'
      ]

      const csvRows = creditsData?.map(record => {
        const userName = record.profiles?.name || 'Usuário Desconhecido'
        const date = new Date(record.created_at).toLocaleString('pt-BR')
        const status = record.metadata?.error ? 'Erro' : 'Sucesso'
        const responseTime = getEstimatedResponseTime(record.service_used)
        const model = record.metadata?.model || 'N/A'
        const metadata = JSON.stringify(record.metadata || {})

        return [
          date,
          userName,
          record.service_used,
          record.tokens_consumed || 0,
          record.credits_debited || 0,
          record.cost_usd || 0,
          status,
          responseTime,
          model,
          metadata
        ]
      }) || []

      // Adicionar linha de resumo
      const totalTokens = creditsData?.reduce((sum, r) => sum + (r.tokens_consumed || 0), 0) || 0
      const totalCredits = creditsData?.reduce((sum, r) => sum + (r.credits_debited || 0), 0) || 0
      const totalCost = creditsData?.reduce((sum, r) => sum + (r.cost_usd || 0), 0) || 0
      const totalRequests = creditsData?.length || 0
      const successfulRequests = creditsData?.filter(r => !r.metadata?.error).length || 0

      csvRows.push([
        '--- RESUMO ---',
        `${totalRequests} requisições`,
        `${successfulRequests} sucessos`,
        totalTokens.toString(),
        totalCredits.toString(),
        totalCost.toFixed(4),
        `${((successfulRequests / totalRequests) * 100).toFixed(1)}% sucesso`,
        `${period} dias`,
        'Período',
        `Exportado em ${new Date().toLocaleString('pt-BR')}`
      ])

      // Converter para CSV
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => 
          row.map(cell => 
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
              ? `"${cell.replace(/"/g, '""')}"` 
              : cell
          ).join(',')
        )
      ].join('\n')

      // Adicionar BOM para UTF-8
      const bom = '\uFEFF'
      const finalContent = bom + csvContent

      return new NextResponse(finalContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="ai-metrics-${period}d-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })

    } else if (format === 'json') {
      // Exportar como JSON estruturado
      const exportData = {
        metadata: {
          exported_at: new Date().toISOString(),
          period_days: period,
          agency_id: profile.agency_id,
          total_records: creditsData?.length || 0,
          filters: {
            service: service || 'all',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          }
        },
        summary: {
          total_requests: creditsData?.length || 0,
          total_tokens: creditsData?.reduce((sum, r) => sum + (r.tokens_consumed || 0), 0) || 0,
          total_credits: creditsData?.reduce((sum, r) => sum + (r.credits_debited || 0), 0) || 0,
          total_cost_usd: creditsData?.reduce((sum, r) => sum + (r.cost_usd || 0), 0) || 0,
          success_rate: creditsData?.length ? 
            ((creditsData.filter(r => !r.metadata?.error).length / creditsData.length) * 100).toFixed(2) + '%' : '0%',
          unique_users: new Set(creditsData?.map(r => r.user_id) || []).size,
          services_used: [...new Set(creditsData?.map(r => r.service_used) || [])]
        },
        data: creditsData?.map(record => ({
          id: record.id,
          created_at: record.created_at,
          user_id: record.user_id,
          user_name: record.profiles?.name || 'Usuário Desconhecido',
          service_used: record.service_used,
          tokens_consumed: record.tokens_consumed,
          credits_debited: record.credits_debited,
          cost_usd: record.cost_usd,
          metadata: record.metadata,
          estimated_response_time_ms: getEstimatedResponseTime(record.service_used),
          status: record.metadata?.error ? 'error' : 'success'
        })) || []
      }

      return NextResponse.json(exportData, {
        headers: {
          'Content-Disposition': `attachment; filename="ai-metrics-${period}d-${new Date().toISOString().split('T')[0]}.json"`
        }
      })

    } else {
      return NextResponse.json({ error: 'Formato não suportado. Use csv ou json.' }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro ao exportar métricas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função auxiliar para estimar tempo de resposta baseado no serviço
function getEstimatedResponseTime(service: string): number {
  const baseTimes = {
    'content_generation': 2500,
    'social_media_analysis': 1800,
    'campaign_optimization': 3200,
    'client_insights': 2100,
    'automated_responses': 800,
    'image_generation': 15000,
    'text_analysis': 1200,
    'translation': 1500
  } as Record<string, number>

  const baseTime = baseTimes[service] || 2000
  return Math.round(baseTime + (Math.random() * 500 - 250)) // ±250ms variation
}