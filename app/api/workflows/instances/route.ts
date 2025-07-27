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
    const workflowId = searchParams.get('workflow_id');
    const status = searchParams.get('status');
    const assignedToMe = searchParams.get('assigned_to_me') === 'true';
    const createdByMe = searchParams.get('created_by_me') === 'true';
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabase
      .from('workflow_instances')
      .select(`
        id,
        title,
        description,
        reference_id,
        reference_type,
        status,
        current_step,
        total_steps,
        progress_percentage,
        context_data,
        priority,
        started_at,
        due_date,
        completed_at,
        final_decision,
        created_at,
        updated_at,
        workflows(
          id,
          name,
          type,
          workflow_schema
        )
      `)
      .eq('agency_id', profile.agency_id);

    // Aplicar filtros
    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (assignedToMe) {
      query = query.contains('current_approvers', [session.user.id]);
    }

    if (createdByMe) {
      query = query.eq('created_by', session.user.id);
    }

    // Aplicar paginação e ordenação
    const { data: instances, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao buscar instâncias de workflow:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Contar total de itens
    let countQuery = supabase
      .from('workflow_instances')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id);

    if (workflowId) countQuery = countQuery.eq('workflow_id', workflowId);
    if (status) countQuery = countQuery.eq('status', status);
    if (priority) countQuery = countQuery.eq('priority', priority);
    if (assignedToMe) countQuery = countQuery.contains('current_approvers', [session.user.id]);
    if (createdByMe) countQuery = countQuery.eq('created_by', session.user.id);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Erro ao contar instâncias:', countError);
    }

    return NextResponse.json({
      success: true,
      data: instances,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Erro na API de instâncias de workflow:', error);
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

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const {
      workflow_id,
      title,
      description,
      reference_id,
      reference_type,
      context_data = {},
      form_data = {},
      priority = 'medium'
    } = body;

    // Validações básicas
    if (!workflow_id || !title) {
      return NextResponse.json({ 
        error: 'ID do workflow e título são obrigatórios' 
      }, { status: 400 });
    }

    // Usar função do banco para iniciar workflow
    const { data: instanceData, error } = await supabase
      .rpc('start_workflow_instance', {
        p_workflow_id: workflow_id,
        p_title: title,
        p_description: description,
        p_reference_id: reference_id,
        p_reference_type: reference_type,
        p_context_data: context_data,
        p_form_data: form_data,
        p_priority: priority
      });

    if (error) {
      console.error('Erro ao iniciar instância de workflow:', error);
      return NextResponse.json({ 
        error: error.message || 'Erro ao iniciar workflow' 
      }, { status: 500 });
    }

    // Buscar instância criada com dados completos
    const { data: instance } = await supabase
      .from('workflow_instances')
      .select(`
        id,
        title,
        description,
        reference_id,
        reference_type,
        status,
        current_step,
        total_steps,
        progress_percentage,
        context_data,
        form_data,
        priority,
        started_at,
        due_date,
        current_approvers,
        created_at,
        workflows(
          id,
          name,
          type
        )
      `)
      .eq('id', instanceData)
      .single();

    return NextResponse.json({
      success: true,
      data: instance
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na API de instâncias de workflow:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}