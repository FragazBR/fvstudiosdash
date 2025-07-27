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

    // Buscar campanhas do Meta
    const campaigns = await metaAPI.getCampaigns()
    
    // Salvar campanhas no banco de dados
    if (campaigns.length > 0) {
      const campaignData = campaigns.map(campaign => ({
        agency_id: profile.agency_id,
        name: campaign.name,
        platform: 'facebook',
        external_campaign_id: campaign.id,
        status: campaign.status.toLowerCase(),
        performance_metrics: {
          objective: campaign.objective,
          buying_type: campaign.buying_type,
          created_time: campaign.created_time,
          updated_time: campaign.updated_time,
          insights: campaign.insights
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

    return NextResponse.json({
      success: true,
      campaigns,
      total: campaigns.length
    })

  } catch (error) {
    console.error('Erro ao buscar campanhas Meta:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, campaignId, ...params } = body

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
        result = await metaAPI.updateCampaignStatus(campaignId, params.status)
        break
        
      case 'update_budget':
        result = await metaAPI.updateCampaignBudget(
          campaignId, 
          params.budgetType, 
          params.amount
        )
        break
        
      default:
        return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 })
    }

    return NextResponse.json({
      success: result,
      action,
      campaignId
    })

  } catch (error) {
    console.error('Erro na ação da campanha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}