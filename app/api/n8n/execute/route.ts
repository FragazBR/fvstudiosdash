import { NextRequest, NextResponse } from 'next/server'
import { N8nIntegrationManager } from '@/lib/n8n-integration'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { workflowId, data, userId } = await request.json()
    
    if (!workflowId || !data) {
      return NextResponse.json(
        { error: 'workflowId e data são obrigatórios' },
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

    // Verificar se o usuário tem acesso ao workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('n8n_workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões (usuário deve ser da mesma agência ou admin)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, agency_id')
      .eq('id', session.user.id)
      .single()

    if (userProfile?.role !== 'admin' && userProfile?.agency_id !== workflow.agency_id) {
      return NextResponse.json(
        { error: 'Acesso negado ao workflow' },
        { status: 403 }
      )
    }

    // Executar workflow
    const n8nManager = new N8nIntegrationManager()
    const execution = await n8nManager.executeWorkflow(workflowId, {
      ...data,
      user_id: session.user.id,
      agency_id: userProfile?.agency_id
    })

    return NextResponse.json({
      success: true,
      execution_id: execution.execution_id,
      status: execution.status,
      message: 'Workflow executado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao executar workflow n8n:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}