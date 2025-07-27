import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'
import { getMLEngine } from '@/lib/ml-prediction-engine'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const insightType = searchParams.get('insight_type')
    const priority = searchParams.get('priority')
    const isActive = searchParams.get('is_active')
    const isFeatured = searchParams.get('is_featured')
    const agencyId = searchParams.get('agency_id')
    const minImportance = parseFloat(searchParams.get('min_importance') || '0')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('ml_insights')
      .select(`
        *,
        ml_models!related_model_id (
          name,
          model_type
        )
      `)
      .order('importance_score', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (insightType) {
      query = query.eq('insight_type', insightType)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (isFeatured !== null) {
      query = query.eq('is_featured', isFeatured === 'true')
    }

    if (agencyId) {
      query = query.eq('agency_id', agencyId)
    }

    if (minImportance > 0) {
      query = query.gte('importance_score', minImportance)
    }

    if (limit) {
      query = query.limit(limit)
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: insights, error } = await query

    if (error) {
      console.error('Erro ao buscar insights:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar insights' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: insights
    })

  } catch (error) {
    console.error('Erro ao listar insights:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, agency_id, model_ids, categories, min_importance_score, time_range_days, max_insights } = body

    if (action === 'generate') {
      // Gerar insights automaticamente
      const mlEngine = getMLEngine()
      const insights = await mlEngine.generateInsights({
        agency_id,
        model_ids,
        categories,
        min_importance_score,
        time_range_days,
        max_insights
      })

      return NextResponse.json({
        success: true,
        data: {
          generated_insights: insights.length,
          insights: insights
        }
      })
    }

    // Criar insight manual
    const {
      insight_type,
      category,
      title,
      description,
      insight_data,
      visualization_config,
      importance_score,
      priority = 'medium',
      confidence_level,
      recommended_actions,
      potential_impact,
      valid_until,
      related_model_id,
      related_entity_type,
      related_entity_id
    } = body

    if (!insight_type || !title || !description || !insight_data) {
      return NextResponse.json(
        { error: 'insight_type, title, description e insight_data são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: insight, error } = await supabase
      .from('ml_insights')
      .insert({
        insight_type,
        category,
        title,
        description,
        insight_data,
        visualization_config,
        importance_score: importance_score || 50,
        priority,
        confidence_level,
        recommended_actions,
        potential_impact,
        valid_until,
        related_model_id,
        related_entity_type,
        related_entity_id,
        agency_id: agency_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar insight:', error)
      return NextResponse.json(
        { error: 'Erro ao criar insight' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: insight
    })

  } catch (error) {
    console.error('Erro ao processar insights:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}