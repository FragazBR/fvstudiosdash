import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter aprovações da instância
    const { data: approvals, error } = await supabase
      .from('workflow_approvals')
      .select(`
        id,
        action,
        decision,
        comments,
        action_data,
        delegated_to,
        delegation_reason,
        action_taken_at,
        response_time_hours,
        approver_id,
        workflow_steps(
          id,
          step_number,
          name,
          step_type
        )
      `)
      .eq('workflow_instance_id', params.id)
      .order('action_taken_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar aprovações:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Buscar informações dos aprovadores
    const approverIds = approvals?.map(a => a.approver_id).filter(Boolean) || [];
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, name, email, avatar_url')
      .in('id', approverIds);

    // Mapear aprovações com dados dos usuários
    const approvalsWithUsers = approvals?.map(approval => ({
      ...approval,
      approver: users?.find(u => u.id === approval.approver_id)
    }));

    return NextResponse.json({
      success: true,
      data: approvalsWithUsers
    });

  } catch (error) {
    console.error('Erro na API de aprovações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      step_id,
      action,
      decision,
      comments,
      action_data = {}
    } = body;

    // Validações básicas
    if (!step_id || !action || !decision) {
      return NextResponse.json({ 
        error: 'ID da etapa, ação e decisão são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se usuário pode aprovar esta instância
    const { data: instance } = await supabase
      .from('workflow_instances')
      .select('id, current_approvers, status')
      .eq('id', params.id)
      .single();

    if (!instance) {
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 });
    }

    if (!instance.current_approvers.includes(session.user.id)) {
      return NextResponse.json({ 
        error: 'Você não está autorizado a aprovar esta etapa' 
      }, { status: 403 });
    }

    if (!['pending', 'in_progress'].includes(instance.status)) {
      return NextResponse.json({ 
        error: 'Esta instância não está mais ativa para aprovação' 
      }, { status: 400 });
    }

    // Usar função do banco para processar aprovação
    const { data: success, error } = await supabase
      .rpc('process_workflow_approval', {
        p_instance_id: params.id,
        p_step_id: step_id,
        p_action: action,
        p_decision: decision,
        p_comments: comments,
        p_action_data: action_data
      });

    if (error) {
      console.error('Erro ao processar aprovação:', error);
      return NextResponse.json({ 
        error: error.message || 'Erro ao processar aprovação' 
      }, { status: 500 });
    }

    // Buscar instância atualizada
    const { data: updatedInstance } = await supabase
      .from('workflow_instances')
      .select(`
        id,
        title,
        status,
        current_step,
        total_steps,
        progress_percentage,
        current_approvers,
        completed_at,
        final_decision
      `)
      .eq('id', params.id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Aprovação processada com sucesso',
      data: {
        approval_processed: true,
        instance: updatedInstance
      }
    });

  } catch (error) {
    console.error('Erro na API de aprovações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}