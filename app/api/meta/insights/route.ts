import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { metaAPI } from '@/lib/meta-marketing-api'

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
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Parâmetros da URL
    const url = new URL(request.url)
    const campaignId = url.searchParams.get('campaignId')
    const dateStart = url.searchParams.get('dateStart')
    const dateEnd = url.searchParams.get('dateEnd')

    let insights = null
    let recommendations: any[] = []

    if (campaignId) {
      // Insights de uma campanha específica
      const dateRange = dateStart && dateEnd ? { start: dateStart, end: dateEnd } : undefined
      insights = await metaAPI.getCampaignInsights(campaignId, dateRange)
    } else {
      // Insights da conta completa + recomendações
      const dateRange = dateStart && dateEnd ? { start: dateStart, end: dateEnd } : undefined
      const [accountInsights, metaRecommendations] = await Promise.all([
        metaAPI.getAccountInsights(undefined, dateRange),
        metaAPI.getRecommendations()
      ])
      
      insights = accountInsights
      recommendations = metaRecommendations
    }

    // Gerar insights de IA baseados nos dados
    const aiInsights = await generateAIInsights(insights, recommendations, profile.agency_id)

    return NextResponse.json({
      success: true,
      insights,
      recommendations,
      aiInsights,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar insights Meta:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para gerar insights de IA baseados nos dados do Meta
async function generateAIInsights(insights: any, recommendations: any[], agencyId: string) {
  if (!insights) return []

  const aiInsights = []
  
  try {
    // Análise de CTR
    const ctr = parseFloat(insights.ctr || '0')
    if (ctr < 1.0) {
      aiInsights.push({
        title: 'CTR Baixo Detectado',
        description: `CTR de ${ctr.toFixed(2)}% está abaixo da média. Considere otimizar criativos e copy.`,
        impact_level: 'high',
        category: 'performance',
        confidence_score: 85,
        suggested_actions: [
          'Testar novos criativos visuais',
          'Otimizar headlines e descrições',
          'Refinar segmentação de público',
          'A/B test diferentes formatos de anúncio'
        ],
        priority_score: 90
      })
    } else if (ctr > 2.0) {
      aiInsights.push({
        title: 'Excelente Performance de CTR',
        description: `CTR de ${ctr.toFixed(2)}% está acima da média. Considere aumentar o orçamento.`,
        impact_level: 'high',
        category: 'opportunity',
        confidence_score: 92,
        suggested_actions: [
          'Aumentar orçamento da campanha',
          'Expandir para públicos similares',
          'Criar campanhas com copy similar'
        ],
        priority_score: 95
      })
    }

    // Análise de CPC
    const cpc = parseFloat(insights.cpc || '0')
    const spend = parseFloat(insights.spend || '0')
    
    if (cpc > 5.0 && spend > 100) {
      aiInsights.push({
        title: 'CPC Alto Detectado',
        description: `CPC de R$ ${cpc.toFixed(2)} pode estar impactando o ROI. Investimento: R$ ${spend.toFixed(2)}`,
        impact_level: 'medium',
        category: 'cost_optimization',
        confidence_score: 78,
        suggested_actions: [
          'Otimizar targeting para público mais qualificado',
          'Testar lances automáticos',
          'Revisar relevância dos anúncios',
          'Pausar keywords de baixa performance'
        ],
        priority_score: 75
      })
    }

    // Análise de Frequência
    const frequency = parseFloat(insights.frequency || '0')
    if (frequency > 3.0) {
      aiInsights.push({
        title: 'Frequência Alta - Risco de Fadiga',
        description: `Frequência de ${frequency.toFixed(1)} pode causar fadiga do público e aumentar custos.`,
        impact_level: 'medium',
        category: 'audience_optimization',
        confidence_score: 88,
        suggested_actions: [
          'Expandir público-alvo',
          'Criar novos criativos',
          'Implementar frequency capping',
          'Pausar temporariamente para refresh'
        ],
        priority_score: 80
      })
    }

    // Análise de Alcance vs Investimento
    const reach = parseInt(insights.reach || '0')
    if (reach > 0 && spend > 0) {
      const costPerReach = spend / reach
      if (costPerReach > 0.10) {
        aiInsights.push({
          title: 'Custo por Alcance Elevado',
          description: `Custo de R$ ${costPerReach.toFixed(3)} por pessoa alcançada está alto.`,
          impact_level: 'medium',
          category: 'budget_optimization',
          confidence_score: 72,
          suggested_actions: [
            'Refinar segmentação demográfica',
            'Testar horários de menor concorrência',
            'Otimizar para conversões ao invés de alcance'
          ],
          priority_score: 65
        })
      }
    }

    // Integrar recomendações do Meta
    recommendations.forEach(rec => {
      aiInsights.push({
        title: `Meta Recomenda: ${rec.title}`,
        description: rec.description,
        impact_level: rec.confidence === 'HIGH' ? 'high' : rec.confidence === 'MEDIUM' ? 'medium' : 'low',
        category: 'meta_recommendation',
        confidence_score: rec.confidence === 'HIGH' ? 90 : rec.confidence === 'MEDIUM' ? 70 : 50,
        suggested_actions: [rec.description],
        priority_score: rec.confidence === 'HIGH' ? 85 : rec.confidence === 'MEDIUM' ? 65 : 45,
        external_source: 'Meta Marketing API'
      })
    })

    // Salvar insights no banco
    if (aiInsights.length > 0) {
      const insightsData = aiInsights.map(insight => ({
        agency_id: agencyId,
        insight_type: 'campaign',
        title: insight.title,
        description: insight.description,
        impact_level: insight.impact_level,
        category: insight.category,
        confidence_score: insight.confidence_score,
        suggested_actions: insight.suggested_actions,
        priority_score: insight.priority_score,
        data_source: insight.external_source || 'Meta Marketing API + AI Analysis',
        created_at: new Date().toISOString()
      }))

      await supabase
        .from('ai_insights')
        .insert(insightsData)
    }

    return aiInsights

  } catch (error) {
    console.error('Erro ao gerar insights de IA:', error)
    return []
  }
}