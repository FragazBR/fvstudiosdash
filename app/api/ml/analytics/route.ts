import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')
    const timeRange = searchParams.get('time_range') || '30'

    // Calcular datas
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeRange))

    // Buscar estatísticas gerais
    const [modelsResult, predictionsResult, insightsResult, trainingJobsResult] = await Promise.all([
      // Modelos por status
      supabase
        .from('ml_models')
        .select('status, model_type, prediction_type')
        .eq('agency_id', agencyId || '')
        .gte('created_at', startDate.toISOString()),

      // Predições recentes
      supabase
        .from('ml_predictions')
        .select('prediction_type, risk_level, prediction_accuracy, created_at')
        .eq('agency_id', agencyId || '')
        .gte('prediction_date', startDate.toISOString()),

      // Insights por categoria
      supabase
        .from('ml_insights')
        .select('category, priority, importance_score, is_active')
        .eq('agency_id', agencyId || '')
        .gte('insight_date', startDate.toISOString()),

      // Jobs de treinamento
      supabase
        .from('ml_training_jobs')
        .select('status, job_type, training_duration_seconds, created_at')
        .gte('created_at', startDate.toISOString())
    ])

    // Processar estatísticas de modelos
    const models = modelsResult.data || []
    const modelStats = {
      total: models.length,
      active: models.filter(m => m.status === 'active').length,
      training: models.filter(m => m.status === 'training').length,
      inactive: models.filter(m => m.status === 'inactive').length,
      by_type: models.reduce((acc: any, model) => {
        acc[model.model_type] = (acc[model.model_type] || 0) + 1
        return acc
      }, {}),
      by_prediction_type: models.reduce((acc: any, model) => {
        acc[model.prediction_type] = (acc[model.prediction_type] || 0) + 1
        return acc
      }, {})
    }

    // Processar estatísticas de predições
    const predictions = predictionsResult.data || []
    const predictionStats = {
      total: predictions.length,
      high_risk: predictions.filter(p => p.risk_level === 'high').length,
      medium_risk: predictions.filter(p => p.risk_level === 'medium').length,
      low_risk: predictions.filter(p => p.risk_level === 'low').length,
      avg_accuracy: predictions.length > 0 ? 
        predictions
          .filter(p => p.prediction_accuracy !== null)
          .reduce((sum, p) => sum + (p.prediction_accuracy || 0), 0) / 
        predictions.filter(p => p.prediction_accuracy !== null).length : 0,
      by_type: predictions.reduce((acc: any, prediction) => {
        acc[prediction.prediction_type] = (acc[prediction.prediction_type] || 0) + 1
        return acc
      }, {}),
      daily_trend: generateDailyTrend(predictions, startDate, endDate)
    }

    // Processar estatísticas de insights
    const insights = insightsResult.data || []
    const insightStats = {
      total: insights.length,
      active: insights.filter(i => i.is_active).length,
      high_priority: insights.filter(i => i.priority === 'high').length,
      critical_priority: insights.filter(i => i.priority === 'critical').length,
      avg_importance: insights.length > 0 ? 
        insights.reduce((sum, i) => sum + i.importance_score, 0) / insights.length : 0,
      by_category: insights.reduce((acc: any, insight) => {
        const category = insight.category || 'other'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {})
    }

    // Processar estatísticas de treinamento
    const trainingJobs = trainingJobsResult.data || []
    const trainingStats = {
      total: trainingJobs.length,
      running: trainingJobs.filter(j => j.status === 'running').length,
      completed: trainingJobs.filter(j => j.status === 'completed').length,
      failed: trainingJobs.filter(j => j.status === 'failed').length,
      avg_duration: trainingJobs
        .filter(j => j.training_duration_seconds)
        .reduce((sum, j) => sum + (j.training_duration_seconds || 0), 0) / 
        trainingJobs.filter(j => j.training_duration_seconds).length || 0,
      by_type: trainingJobs.reduce((acc: any, job) => {
        acc[job.job_type] = (acc[job.job_type] || 0) + 1
        return acc
      }, {})
    }

    // Buscar top insights
    const { data: topInsights } = await supabase
      .from('ml_insights')
      .select('id, title, importance_score, priority, category')
      .eq('agency_id', agencyId || '')
      .eq('is_active', true)
      .order('importance_score', { ascending: false })
      .limit(5)

    // Buscar modelos com melhor performance
    const { data: topModels } = await supabase
      .from('ml_models')
      .select('id, name, model_type, accuracy, last_prediction_at')
      .eq('agency_id', agencyId || '')
      .eq('status', 'active')
      .order('accuracy', { ascending: false })
      .limit(5)

    const analytics = {
      time_range: `${timeRange} dias`,
      generated_at: new Date().toISOString(),
      models: modelStats,
      predictions: predictionStats,
      insights: insightStats,
      training: trainingStats,
      top_insights: topInsights || [],
      top_models: topModels || []
    }

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Erro ao gerar analytics ML:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function generateDailyTrend(predictions: any[], startDate: Date, endDate: Date): any[] {
  const trend: any[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayStr = currentDate.toISOString().split('T')[0]
    const dayPredictions = predictions.filter(p => 
      p.created_at.startsWith(dayStr)
    )

    trend.push({
      date: dayStr,
      count: dayPredictions.length,
      high_risk: dayPredictions.filter(p => p.risk_level === 'high').length,
      medium_risk: dayPredictions.filter(p => p.risk_level === 'medium').length,
      low_risk: dayPredictions.filter(p => p.risk_level === 'low').length
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return trend
}