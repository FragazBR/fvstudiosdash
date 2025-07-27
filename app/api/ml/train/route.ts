import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getMLEngine, trainModel } from '@/lib/ml-prediction-engine'

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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'agency_owner', 'agency_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const {
      model_id,
      job_type = 'retraining',
      training_config = {},
      trigger_type = 'manual'
    } = body

    if (!model_id) {
      return NextResponse.json(
        { error: 'model_id é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o modelo existe
    const mlEngine = getMLEngine()
    const model = await mlEngine.getModel(model_id)
    
    if (!model) {
      return NextResponse.json(
        { error: 'Modelo não encontrado' },
        { status: 404 }
      )
    }

    // Iniciar treinamento
    const trainingResult = await trainModel({
      model_id,
      job_type,
      training_config,
      trigger_type,
      started_by: user.id
    })

    return NextResponse.json({
      success: trainingResult.success,
      data: trainingResult.success ? {
        job_id: trainingResult.job_id,
        message: 'Treinamento iniciado com sucesso'
      } : null,
      error: trainingResult.error
    })

  } catch (error) {
    console.error('Erro ao iniciar treinamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('model_id')
    const status = searchParams.get('status')
    const jobType = searchParams.get('job_type')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('ml_training_jobs')
      .select(`
        *,
        ml_models (
          name,
          model_type
        ),
        user_profiles!started_by (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (modelId) {
      query = query.eq('model_id', modelId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (jobType) {
      query = query.eq('job_type', jobType)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data: trainingJobs, error } = await query

    if (error) {
      console.error('Erro ao buscar jobs de treinamento:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar jobs de treinamento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: trainingJobs
    })

  } catch (error) {
    console.error('Erro ao listar jobs de treinamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}