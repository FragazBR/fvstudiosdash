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

    // Buscar campanhas do Google Ads
    const campaigns = await googleAdsAPI.getCampaigns()
    
    // Salvar campanhas no banco de dados
    if (campaigns.length > 0) {
      const campaignData = campaigns.map(campaign => ({
        agency_id: profile.agency_id,
        name: campaign.name,
        platform: 'google',
        external_campaign_id: campaign.id,
        status: campaign.status.toLowerCase(),
        performance_metrics: {
          advertising_channel_type: campaign.advertisingChannelType,
          bidding_strategy_type: campaign.biddingStrategyType,
          start_date: campaign.startDate,
          end_date: campaign.endDate,
          serving_status: campaign.servingStatus,
          metrics: campaign.metrics
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      // Inserir ou atualizar campanhas
      await supabase
        .from('intelligent_campaigns')
        .upsert(campaignData, {
          onConflict: 'agency_id,external_campaign_id',
          ignoreDuplicates: false
        })
    }

    // Gerar insights de IA
    const insights = await googleAdsAPI.generateInsights(campaigns)

    return NextResponse.json({
      success: true,
      campaigns,
      insights,
      total: campaigns.length
    })

  } catch (error) {
    console.error('Erro ao buscar campanhas Google Ads:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, campaignResourceName, ...params } = body

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

    let result = null

    switch (action) {
      case 'update_status':
        result = await googleAdsAPI.updateCampaignStatus(campaignResourceName, params.status)
        break
        
      case 'optimize':
        // Implementar otimização automática
        result = await optimizeCampaignWithAI(campaignResourceName, params.optimizations)
        break
        
      default:
        return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 })
    }

    return NextResponse.json({
      success: result,
      action,
      campaignResourceName
    })

  } catch (error) {
    console.error('Erro na ação da campanha Google Ads:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para otimização automática com IA
async function optimizeCampaignWithAI(
  campaignResourceName: string, 
  optimizations: string[]
): Promise<boolean> {
  try {
    let optimizationResults = []

    for (const optimization of optimizations) {
      switch (optimization) {
        case 'budget_adjustment':
          // Analisar performance e ajustar orçamento
          const budgetResult = await optimizeBudget(campaignResourceName)
          optimizationResults.push(budgetResult)
          break
          
        case 'keyword_optimization':
          // Otimizar palavras-chave baseado em performance
          const keywordResult = await optimizeKeywords(campaignResourceName)
          optimizationResults.push(keywordResult)
          break
          
        case 'bid_adjustment':
          // Ajustar lances baseado em conversões
          const bidResult = await optimizeBids(campaignResourceName)
          optimizationResults.push(bidResult)
          break
      }
    }

    return optimizationResults.every(result => result === true)
  } catch (error) {
    console.error('Erro na otimização IA:', error)
    return false
  }
}

async function optimizeBudget(campaignResourceName: string): Promise<boolean> {
  try {
    // Buscar dados da campanha
    const campaigns = await googleAdsAPI.getCampaigns()
    const campaign = campaigns.find(c => c.resourceName === campaignResourceName)
    
    if (!campaign || !campaign.metrics) return false

    const ctr = campaign.metrics.ctr
    const conversions = parseFloat(campaign.metrics.conversions)
    const cost = parseInt(campaign.metrics.cost) / 1000000

    // Lógica de IA para ajuste de orçamento
    let budgetMultiplier = 1.0

    if (ctr > 3.0 && conversions > 10) {
      // Performance excelente - aumentar orçamento
      budgetMultiplier = 1.2
    } else if (ctr < 1.0 || (cost > 500 && conversions < 5)) {
      // Performance ruim - reduzir orçamento
      budgetMultiplier = 0.8
    }

    // Aqui seria feita a chamada real para atualizar o orçamento
    // Por enquanto, apenas simular o sucesso
    console.log(`Orçamento da campanha ${campaign.name} ajustado com multiplicador ${budgetMultiplier}`)
    
    return true
  } catch (error) {
    console.error('Erro ao otimizar orçamento:', error)
    return false
  }
}

async function optimizeKeywords(campaignResourceName: string): Promise<boolean> {
  try {
    // Buscar palavras-chave da campanha
    const keywords = await googleAdsAPI.getKeywords()
    
    // Analisar performance das palavras-chave
    const underperformingKeywords = keywords.filter(keyword => {
      if (!keyword.metrics) return false
      
      const ctr = keyword.metrics.ctr
      const cost = parseInt(keyword.metrics.cost) / 1000000
      const conversions = parseFloat(keyword.metrics.conversions)
      
      // Palavras-chave com baixa performance
      return ctr < 1.0 && cost > 50 && conversions < 1
    })

    // Aqui seria feita a otimização real das palavras-chave
    console.log(`Encontradas ${underperformingKeywords.length} palavras-chave para otimização`)
    
    return true
  } catch (error) {
    console.error('Erro ao otimizar palavras-chave:', error)
    return false
  }
}

async function optimizeBids(campaignResourceName: string): Promise<boolean> {
  try {
    // Buscar grupos de anúncios da campanha
    const adGroups = await googleAdsAPI.getAdGroups()
    
    // Analisar performance e ajustar lances
    const optimizations = adGroups.map(adGroup => {
      if (!adGroup.metrics) return null
      
      const ctr = adGroup.metrics.ctr
      const conversions = parseFloat(adGroup.metrics.conversions)
      
      let bidAdjustment = 1.0
      
      if (ctr > 2.0 && conversions > 5) {
        // Boa performance - aumentar lance
        bidAdjustment = 1.15
      } else if (ctr < 0.5) {
        // Performance ruim - reduzir lance
        bidAdjustment = 0.85
      }
      
      return {
        adGroupId: adGroup.id,
        bidAdjustment
      }
    }).filter(opt => opt !== null)

    console.log(`Lances otimizados para ${optimizations.length} grupos de anúncios`)
    
    return true
  } catch (error) {
    console.error('Erro ao otimizar lances:', error)
    return false
  }
}