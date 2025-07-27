import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { projectTriggers } from '@/lib/project-notification-triggers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Disparar notificações de projeto
export async function POST(request: NextRequest) {
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
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    const body = await request.json()
    const { action, project_id, event_data } = body

    if (!project_id) {
      return NextResponse.json({ error: 'ID do projeto é obrigatório' }, { status: 400 })
    }

    // Verificar se o projeto pertence à agência
    const { data: project } = await supabase
      .from('projects')
      .select('id, agency_id')
      .eq('id', project_id)
      .eq('agency_id', profile.agency_id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    let result = false
    let message = ''

    switch (action) {
      case 'project_created':
        await projectTriggers.triggerProjectCreated(project_id, event_data || {})
        result = true
        message = 'Notificação de projeto criado enviada'
        break

      case 'stage_changed':
        if (!event_data?.new_stage || !event_data?.total_stages) {
          return NextResponse.json({ 
            error: 'Dados da etapa são obrigatórios (new_stage, total_stages)' 
          }, { status: 400 })
        }
        await projectTriggers.triggerStageChanged(project_id, event_data)
        result = true
        message = 'Notificação de mudança de etapa enviada'
        break

      case 'task_completed':
        if (!event_data?.task_name) {
          return NextResponse.json({ 
            error: 'Nome da tarefa é obrigatório' 
          }, { status: 400 })
        }
        await projectTriggers.triggerTaskCompleted(project_id, event_data)
        result = true
        message = 'Notificação de tarefa concluída enviada'
        break

      case 'payment_due':
        if (!event_data?.amount || !event_data?.due_date) {
          return NextResponse.json({ 
            error: 'Valor e data de vencimento são obrigatórios' 
          }, { status: 400 })
        }
        await projectTriggers.triggerPaymentDue(project_id, event_data)
        result = true
        message = 'Lembrete de pagamento enviado'
        break

      case 'feedback_required':
        if (!event_data?.subject || !event_data?.feedback_link) {
          return NextResponse.json({ 
            error: 'Assunto e link de feedback são obrigatórios' 
          }, { status: 400 })
        }
        await projectTriggers.triggerFeedbackRequired(project_id, event_data)
        result = true
        message = 'Solicitação de feedback enviada'
        break

      case 'project_completed':
        await projectTriggers.triggerProjectCompleted(project_id, event_data || {})
        result = true
        message = 'Notificação de projeto concluído enviada'
        break

      default:
        return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 })
    }

    return NextResponse.json({
      success: result,
      message,
      project_id,
      action
    })

  } catch (error) {
    console.error('Erro ao processar trigger de notificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Buscar eventos de projeto
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

    // Parâmetros da URL
    const url = new URL(request.url)
    const projectId = url.searchParams.get('project_id')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    if (projectId) {
      // Buscar eventos de um projeto específico
      const events = await projectTriggers.getProjectEvents(projectId, limit)
      return NextResponse.json({
        success: true,
        events,
        total: events.length
      })
    } else {
      // Buscar estatísticas gerais da agência
      const stats = await projectTriggers.getEventStats(profile.agency_id, 'month')
      return NextResponse.json({
        success: true,
        stats
      })
    }

  } catch (error) {
    console.error('Erro ao buscar eventos do projeto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}