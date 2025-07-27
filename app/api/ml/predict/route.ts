import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getMLEngine, makePrediction } from '@/lib/ml-prediction-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      model_id,
      input_features,
      prediction_key,
      prediction_horizon_days,
      return_explanation = true,
      return_confidence = true,
      agency_id
    } = body

    if (!model_id || !input_features) {
      return NextResponse.json(
        { error: 'model_id e input_features são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o modelo existe e o usuário tem acesso
    const mlEngine = getMLEngine()
    const model = await mlEngine.getModel(model_id)
    
    if (!model) {
      return NextResponse.json(
        { error: 'Modelo não encontrado' },
        { status: 404 }
      )
    }

    if (model.status !== 'active') {
      return NextResponse.json(
        { error: 'Modelo não está ativo' },
        { status: 400 }
      )
    }

    // Fazer predição
    const predictionResult = await makePrediction({
      model_id,
      input_features,
      prediction_key,
      prediction_horizon_days,
      return_explanation,
      return_confidence,
      requested_by: user.id,
      agency_id: agency_id || undefined
    })

    return NextResponse.json({
      success: predictionResult.success,
      data: predictionResult.success ? predictionResult.prediction : null,
      error: predictionResult.error,
      error_details: predictionResult.error_details,
      processing_time_ms: predictionResult.processing_time_ms
    })

  } catch (error) {
    console.error('Erro ao fazer predição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}