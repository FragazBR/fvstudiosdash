import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('model_id')
    const predictionType = searchParams.get('prediction_type')
    const riskLevel = searchParams.get('risk_level')
    const isActive = searchParams.get('is_active')
    const agencyId = searchParams.get('agency_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('ml_predictions')
      .select(`
        *,
        ml_models (
          name,
          model_type,
          prediction_type
        )
      `)
      .order('prediction_date', { ascending: false })

    if (modelId) {
      query = query.eq('model_id', modelId)
    }

    if (predictionType) {
      query = query.eq('prediction_type', predictionType)
    }

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (agencyId) {
      query = query.eq('agency_id', agencyId)
    }

    if (startDate) {
      query = query.gte('prediction_date', startDate)
    }

    if (endDate) {
      query = query.lte('prediction_date', endDate)
    }

    if (limit) {
      query = query.limit(limit)
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: predictions, error } = await query

    if (error) {
      console.error('Erro ao buscar predições:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar predições' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: predictions
    })

  } catch (error) {
    console.error('Erro ao listar predições:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      prediction_id,
      actual_value,
      feedback_score,
      feedback_comments,
      is_validated = true
    } = body

    if (!prediction_id) {
      return NextResponse.json(
        { error: 'prediction_id é obrigatório' },
        { status: 400 }
      )
    }

    // Calcular acurácia se valor real foi fornecido
    let predictionAccuracy: number | undefined

    if (actual_value !== undefined) {
      // Buscar predição original para comparar
      const { data: originalPrediction } = await supabase
        .from('ml_predictions')
        .select('predicted_value, prediction_type')
        .eq('id', prediction_id)
        .single()

      if (originalPrediction) {
        predictionAccuracy = calculateAccuracy(
          originalPrediction.predicted_value,
          actual_value,
          originalPrediction.prediction_type
        )
      }
    }

    const { error } = await supabase
      .from('ml_predictions')
      .update({
        actual_value,
        prediction_accuracy: predictionAccuracy,
        feedback_score,
        feedback_comments,
        is_validated,
        validation_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', prediction_id)

    if (error) {
      console.error('Erro ao atualizar predição:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar predição' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Predição atualizada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar predição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function calculateAccuracy(predicted: any, actual: any, predictionType: string): number {
  switch (predictionType) {
    case 'client_churn':
    case 'conversion_prediction':
      // Binary classification
      return predicted === actual ? 1.0 : 0.0

    case 'revenue_forecast':
    case 'project_completion':
      // Regression - calculate MAPE (Mean Absolute Percentage Error)
      const predictedNum = Number(predicted)
      const actualNum = Number(actual)
      
      if (actualNum === 0) return predictedNum === 0 ? 1.0 : 0.0
      
      const mape = Math.abs((actualNum - predictedNum) / actualNum)
      return Math.max(0, 1 - mape) // Convert to accuracy

    case 'sentiment_analysis':
      // Sentiment comparison (assuming -1 to 1 scale)
      const diff = Math.abs(Number(predicted) - Number(actual))
      return Math.max(0, 1 - diff / 2) // Normalize to 0-1

    default:
      return 0.5 // Default neutral accuracy
  }
}