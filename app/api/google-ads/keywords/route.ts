import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleAdsAPI } from '@/lib/google-ads-api'

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
    const adGroupId = url.searchParams.get('adGroupId')

    // Buscar palavras-chave
    const keywords = await googleAdsAPI.getKeywords(adGroupId || undefined)
    
    // Analisar palavras-chave com IA
    const keywordAnalysis = await analyzeKeywordsWithAI(keywords, profile.agency_id)

    return NextResponse.json({
      success: true,
      keywords,
      analysis: keywordAnalysis,
      total: keywords.length
    })

  } catch (error) {
    console.error('Erro ao buscar palavras-chave Google Ads:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Análise de palavras-chave com IA
async function analyzeKeywordsWithAI(keywords: any[], agencyId: string) {
  const analysis = {
    totalKeywords: keywords.length,
    topPerforming: [] as any[],
    underperforming: [] as any[],
    opportunities: [] as string[],
    insights: [] as any[]
  }

  try {
    // Classificar palavras-chave por performance
    const keywordsWithMetrics = keywords.filter(k => k.metrics)
    
    // Top performing (CTR > 2% e conversões > 0)
    analysis.topPerforming = keywordsWithMetrics
      .filter(k => k.metrics.ctr > 2.0 && parseFloat(k.metrics.conversions) > 0)
      .sort((a, b) => parseFloat(b.metrics.conversions) - parseFloat(a.metrics.conversions))
      .slice(0, 10)
      .map(k => ({
        keyword: k.criterion.keyword,
        ctr: k.metrics.ctr,
        conversions: k.metrics.conversions,
        cost: (parseInt(k.metrics.cost) / 1000000).toFixed(2),
        quality_score: k.qualityScore || 'N/A'
      }))

    // Underperforming (CTR < 1% ou custo alto sem conversões)
    analysis.underperforming = keywordsWithMetrics
      .filter(k => {
        const cost = parseInt(k.metrics.cost) / 1000000
        const conversions = parseFloat(k.metrics.conversions)
        return k.metrics.ctr < 1.0 || (cost > 50 && conversions === 0)
      })
      .sort((a, b) => parseInt(b.metrics.cost) - parseInt(a.metrics.cost))
      .slice(0, 10)
      .map(k => ({
        keyword: k.criterion.keyword,
        ctr: k.metrics.ctr,
        conversions: k.metrics.conversions,
        cost: (parseInt(k.metrics.cost) / 1000000).toFixed(2),
        quality_score: k.qualityScore || 'N/A',
        issue: k.metrics.ctr < 1.0 ? 'CTR baixo' : 'Alto custo sem conversões'
      }))

    // Identificar oportunidades
    const totalCost = keywordsWithMetrics.reduce((sum, k) => sum + (parseInt(k.metrics.cost) / 1000000), 0)
    const totalConversions = keywordsWithMetrics.reduce((sum, k) => sum + parseFloat(k.metrics.conversions), 0)
    const avgCTR = keywordsWithMetrics.reduce((sum, k) => sum + k.metrics.ctr, 0) / keywordsWithMetrics.length

    if (analysis.underperforming.length > 0) {
      analysis.opportunities.push(`${analysis.underperforming.length} palavras-chave com baixa performance detectadas`)
    }

    if (avgCTR < 2.0) {
      analysis.opportunities.push('CTR médio abaixo de 2% - otimizar anúncios e relevância')
    }

    if (totalCost > 1000 && totalConversions < 10) {
      analysis.opportunities.push('Alto investimento com poucas conversões - revisar estratégia')
    }

    // Gerar insights de IA
    const insights = []

    if (analysis.topPerforming.length > 0) {
      insights.push({
        type: 'success',
        title: 'Palavras-chave de Alta Performance',
        description: `${analysis.topPerforming.length} palavras-chave com excelente CTR e conversões`,
        action: 'Considere aumentar lances e expandir para termos similares',
        keywords: analysis.topPerforming.slice(0, 3).map(k => k.keyword)
      })
    }

    if (analysis.underperforming.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Palavras-chave com Baixa Performance',
        description: `${analysis.underperforming.length} palavras-chave desperdiçando orçamento`,
        action: 'Pause palavras-chave com Quality Score < 5 ou CTR < 1%',
        keywords: analysis.underperforming.slice(0, 3).map(k => k.keyword)
      })
    }

    // Análise de match types
    const matchTypes = keywordsWithMetrics.reduce((acc, k) => {
      const matchType = k.criterion.keywordMatchType
      acc[matchType] = (acc[matchType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    if (matchTypes.BROAD && matchTypes.BROAD > keywordsWithMetrics.length * 0.5) {
      insights.push({
        type: 'recommendation',
        title: 'Muitas Palavras-chave Broad Match',
        description: 'Mais de 50% das palavras são broad match, pode gerar tráfego irrelevante',
        action: 'Considere usar mais exact match e phrase match para melhor controle'
      })
    }

    analysis.insights = insights

    // Salvar insights no banco
    if (insights.length > 0) {
      const insightsData = insights.map(insight => ({
        agency_id: agencyId,
        insight_type: 'keyword_analysis',
        title: insight.title,
        description: insight.description,
        impact_level: insight.type === 'warning' ? 'high' : insight.type === 'success' ? 'medium' : 'low',
        category: 'keyword_optimization',
        confidence_score: 85,
        suggested_actions: [insight.action],
        data_source: 'Google Ads API + AI Analysis',
        created_at: new Date().toISOString()
      }))

      await supabase
        .from('ai_insights')
        .insert(insightsData)
    }

    return analysis

  } catch (error) {
    console.error('Erro na análise de palavras-chave:', error)
    return analysis
  }
}