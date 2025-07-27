import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getMLEngine } from '@/lib/ml-prediction-engine'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const modelType = searchParams.get('model_type')
    const predictionType = searchParams.get('prediction_type')
    const status = searchParams.get('status')
    const agencyId = searchParams.get('agency_id')
    const isPublic = searchParams.get('is_public')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const mlEngine = getMLEngine()
    const models = await mlEngine.listModels({
      model_type: modelType as any,
      prediction_type: predictionType as any,
      status: status as any,
      agency_id: agencyId || undefined,
      is_public: isPublic !== null ? isPublic === 'true' : undefined,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: models
    })

  } catch (error) {
    console.error('Erro ao listar modelos ML:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin ou agency owner/manager
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'agency_owner', 'agency_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      model_type,
      prediction_type,
      algorithm,
      feature_columns,
      target_column,
      hyperparameters,
      validation_method,
      test_size,
      is_public = false,
      agency_id
    } = body

    if (!name || !model_type || !prediction_type || !algorithm) {
      return NextResponse.json(
        { error: 'Name, model_type, prediction_type e algorithm são obrigatórios' },
        { status: 400 }
      )
    }

    const mlEngine = getMLEngine()
    const modelId = await mlEngine.createModel({
      name,
      description,
      model_type,
      prediction_type,
      algorithm,
      feature_columns: feature_columns || [],
      target_column,
      hyperparameters: hyperparameters || {},
      validation_method: validation_method || 'train_test_split',
      test_size: test_size || 0.2,
      is_public,
      created_by: user.id,
      agency_id: agency_id || profile.agency_id
    })

    if (!modelId) {
      return NextResponse.json(
        { error: 'Erro ao criar modelo ML' },
        { status: 500 }
      )
    }

    const model = await mlEngine.getModel(modelId)

    return NextResponse.json({
      success: true,
      data: model
    })

  } catch (error) {
    console.error('Erro ao criar modelo ML:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}