import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
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

    // Parâmetros de consulta
    const type = searchParams.get('type');
    const isActive = searchParams.get('is_active');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construir query
    let query = supabase
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
        total_instances,
        completed_instances,
        average_completion_time_hours,
        created_at,
        updated_at
      `)
      .eq('agency_id', profile.agency_id);

    // Aplicar filtros
    if (type) {
      query = query.eq('type', type);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: workflows, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar workflows:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: workflows
    });

  } catch (error) {
    console.error('Erro na API de workflows:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      description,
      type,
      is_parallel = false,
      requires_all_approvers = true,
      auto_approve_threshold,
      auto_reject_threshold,
      default_timeout_hours = 72,
      escalation_timeout_hours = 168,
      business_hours_only = false,
      workflow_schema = [],
      notification_settings = {},
      webhook_url,
      integration_settings = {}
    } = body;

    // Validações básicas
    if (!name || !type || !workflow_schema.length) {
      return NextResponse.json({ 
        error: 'Nome, tipo e schema do workflow são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se nome já existe
    const { data: existingWorkflow } = await supabase
      .from('workflows')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('name', name)
      .single();

    if (existingWorkflow) {
      return NextResponse.json({ 
        error: 'Já existe um workflow com este nome' 
      }, { status: 409 });
    }

    // Criar workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        agency_id: profile.agency_id,
        name,
        description,
        type,
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
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar workflow:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Criar etapas do workflow
    const steps = workflow_schema.map((step: any, index: number) => ({
      workflow_id: workflow.id,
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
        console.error('Erro ao criar etapas do workflow:', stepsError);
        // Remover workflow criado em caso de erro
        await supabase.from('workflows').delete().eq('id', workflow.id);
        return NextResponse.json({ error: 'Erro ao criar etapas do workflow' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      data: workflow
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na API de workflows:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}