import { NextRequest, NextResponse } from 'next/server'
import { N8nIntegrationManager } from '@/lib/n8n-integration'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { executionId } = params

    if (!executionId) {
      return NextResponse.json(
        { error: 'executionId é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar autenticação
    const supabase = supabaseServer()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter status da execução
    const n8nManager = new N8nIntegrationManager()
    const execution = await n8nManager.getExecutionStatus(executionId)

    if (!execution) {
      return NextResponse.json(
        { error: 'Execução não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissões - buscar workflow e verificar acesso
    const { data: workflow } = await supabase
      .from('n8n_workflows')
      .select('agency_id')
      .eq('id', execution.workflow_id)
      .single()

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, agency_id')
      .eq('id', session.user.id)
      .single()

    if (userProfile?.role !== 'admin' && userProfile?.agency_id !== workflow?.agency_id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      execution_id: execution.execution_id,
      status: execution.status,
      started_at: execution.started_at,
      completed_at: execution.completed_at,
      error_message: execution.error_message,
      results: execution.results,
      progress: calculateProgress(execution)
    })

  } catch (error) {
    console.error('Erro ao obter status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function calculateProgress(execution: any): number {
  if (execution.status === 'success') return 100
  if (execution.status === 'error') return 0
  if (execution.status === 'running') {
    // Calcular progresso baseado no tempo decorrido
    const startTime = new Date(execution.started_at).getTime()
    const now = Date.now()
    const elapsed = now - startTime
    
    // Estimar progresso baseado no tipo de workflow
    const estimatedDuration = getEstimatedDuration(execution.workflow_type)
    const progress = Math.min((elapsed / estimatedDuration) * 100, 90)
    
    return Math.round(progress)
  }
  return 0
}

function getEstimatedDuration(workflowType: string): number {
  const durations: { [key: string]: number } = {
    'briefing': 30000,     // 30 segundos
    'analysis': 60000,     // 1 minuto
    'planning': 90000,     // 1.5 minutos
    'production': 180000,  // 3 minutos
    'approval': 5000,      // 5 segundos
    'campaign': 120000,    // 2 minutos
    'reporting': 150000    // 2.5 minutos
  }
  
  return durations[workflowType] || 60000
}