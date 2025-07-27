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

    // Obter perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Buscar workflow com etapas
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select(`
        id,
        name,
        description,
        type,
        is_active,
        is_parallel,
        requires_all_approvers,
        auto_approve_threshold,
        auto_reject_threshold,
        default_timeout_hours,
        escalation_timeout_hours,
        business_hours_only,
        workflow_schema,
        notification_settings,
        webhook_url,
        integration_settings,
        total_instances,
        completed_instances,
        average_completion_time_hours,
        created_at,
        updated_at,
        workflow_steps(
          id,
          step_number,
          name,
          description,
          step_type,
          is_required,
          is_parallel,
          approver_users,
          approver_roles,
          required_approvals,
          conditions,
          actions,
          timeout_hours,
          escalation_rules,
          notification_settings
        )
      `)
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (error || !workflow) {
      return NextResponse.json({ error: 'Workflow não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('Erro na API de workflow:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
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

    // Obter perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin', 'agency_owner', 'agency_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Verificar se workflow existe
    const { data: existingWorkflow } = await supabase
      .from('workflows')
      .select('id, name')
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      is_active,
      is_parallel,
      requires_all_approvers,
      auto_approve_threshold,
      auto_reject_threshold,
      default_timeout_hours,
      escalation_timeout_hours,
      business_hours_only,
      workflow_schema,
      notification_settings,
      webhook_url,
      integration_settings
    } = body;

    // Verificar se novo nome já existe (se foi alterado)
    if (name && name !== existingWorkflow.name) {
      const { data: nameExists } = await supabase
        .from('workflows')
        .select('id')
        .eq('agency_id', profile.agency_id)
        .eq('name', name)
        .neq('id', params.id)
        .single();

      if (nameExists) {
        return NextResponse.json({ 
          error: 'Já existe um workflow com este nome' 
        }, { status: 409 });
      }
    }

    // Atualizar workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .update({
        name,
        description,
        type,
        is_active,
        is_parallel,
        requires_all_approvers,
        auto_approve_threshold,
        auto_reject_threshold,
        default_timeout_hours,
        escalation_timeout_hours,
        business_hours_only,
        workflow_schema,
        notification_settings,
        webhook_url,
        integration_settings
      })
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar workflow:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Atualizar etapas se workflow_schema foi fornecido
    if (workflow_schema) {
      // Remover etapas existentes
      await supabase
        .from('workflow_steps')
        .delete()
        .eq('workflow_id', params.id);

      // Criar novas etapas
      const steps = workflow_schema.map((step: any, index: number) => ({
        workflow_id: params.id,
        step_number: index + 1,
        name: step.name,
        description: step.description,
        step_type: step.type || 'approval',
        is_required: step.is_required !== false,
        is_parallel: step.is_parallel || false,
        approver_users: step.approver_users || [],
        approver_roles: step.approver_roles || [],
        required_approvals: step.required_approvals || 1,
        conditions: step.conditions || [],
        actions: step.actions || [],
        timeout_hours: step.timeout_hours,
        escalation_rules: step.escalation_rules || {},
        notification_settings: step.notification_settings || {}
      }));

      if (steps.length > 0) {
        const { error: stepsError } = await supabase
          .from('workflow_steps')
          .insert(steps);

        if (stepsError) {
          console.error('Erro ao atualizar etapas do workflow:', stepsError);
          return NextResponse.json({ error: 'Erro ao atualizar etapas do workflow' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error('Erro na API de workflow:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Obter perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin', 'agency_owner', 'agency_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Verificar se workflow existe
    const { data: existingWorkflow } = await supabase
      .from('workflows')
      .select('id, total_instances')
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow não encontrado' }, { status: 404 });
    }

    // Verificar se há instâncias ativas
    const { data: activeInstances } = await supabase
      .from('workflow_instances')
      .select('id')
      .eq('workflow_id', params.id)
      .in('status', ['pending', 'in_progress'])
      .limit(1);

    if (activeInstances && activeInstances.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir um workflow com instâncias ativas' 
      }, { status: 409 });
    }

    // Excluir workflow (cascade deleta etapas automaticamente)
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id);

    if (error) {
      console.error('Erro ao excluir workflow:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de workflow:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}