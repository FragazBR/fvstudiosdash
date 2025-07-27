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
    const reportId = searchParams.get('report_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    // Construir query
    let query = supabase
      .from('report_executions')
      .select(`
        id,
        report_id,
        execution_number,
        status,
        progress_percentage,
        started_at,
        completed_at,
        duration_seconds,
        error_message,
        output_files,
        performance_metrics,
        executed_by,
        execution_source,
        reports!inner(
          name,
          category
        )
      `)
      .eq('agency_id', profile.agency_id)
      .order('started_at', { ascending: false });

    // Aplicar filtros
    if (reportId) {
      query = query.eq('report_id', reportId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1);

    const { data: executions, error } = await query;

    if (error) {
      console.error('Erro ao buscar execuções de relatórios:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Obter contagem total para paginação
    let countQuery = supabase
      .from('report_executions')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id);

    if (reportId) {
      countQuery = countQuery.eq('report_id', reportId);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      success: true,
      data: executions,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Erro na API de execuções de relatórios:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Cancelar execução em andamento
export async function DELETE(request: NextRequest) {
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
    const { execution_id } = body;

    if (!execution_id) {
      return NextResponse.json({ 
        error: 'ID da execução é obrigatório' 
      }, { status: 400 });
    }

    // Verificar se execução existe e está em andamento
    const { data: execution, error: executionError } = await supabase
      .from('report_executions')
      .select('id, status, executed_by, agency_id')
      .eq('id', execution_id)
      .single();

    if (executionError || !execution) {
      return NextResponse.json({ 
        error: 'Execução não encontrada' 
      }, { status: 404 });
    }

    if (execution.agency_id !== profile.agency_id) {
      return NextResponse.json({ 
        error: 'Acesso negado' 
      }, { status: 403 });
    }

    if (!['generating', 'scheduled'].includes(execution.status)) {
      return NextResponse.json({ 
        error: 'Execução não pode ser cancelada (status atual: ' + execution.status + ')' 
      }, { status: 400 });
    }

    // Verificar permissões para cancelar
    const canCancel = 
      execution.executed_by === session.user.id ||
      ['admin', 'agency_owner', 'agency_manager'].includes(profile.role);

    if (!canCancel) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para cancelar esta execução' 
      }, { status: 403 });
    }

    // Cancelar execução
    const { error: updateError } = await supabase
      .from('report_executions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        error_message: `Cancelado por ${session.user.email}`
      })
      .eq('id', execution_id);

    if (updateError) {
      console.error('Erro ao cancelar execução:', updateError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Execução cancelada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao cancelar execução:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}