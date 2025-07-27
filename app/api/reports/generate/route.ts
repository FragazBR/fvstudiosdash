import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import AdvancedReportsGenerator from '@/lib/advanced-reports-generator';

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
    const { report_id } = body;

    // Validações básicas
    if (!report_id) {
      return NextResponse.json({ 
        error: 'ID do relatório é obrigatório' 
      }, { status: 400 });
    }

    // Buscar configuração do relatório
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        id,
        name,
        description,
        category,
        template_id,
        data_config,
        filter_values,
        date_range,
        output_formats,
        layout_settings,
        frequency,
        schedule_config,
        agency_id,
        created_by
      `)
      .eq('id', report_id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ 
        error: 'Relatório não encontrado' 
      }, { status: 404 });
    }

    // Verificar permissões
    const canGenerate = 
      report.created_by === session.user.id ||
      ['admin', 'agency_owner', 'agency_manager'].includes(profile.role);

    if (!canGenerate) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para gerar este relatório' 
      }, { status: 403 });
    }

    // Criar gerador de relatórios
    const generator = new AdvancedReportsGenerator();

    // Gerar relatório
    const result = await generator.generateReport(report);

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Erro na geração do relatório' 
      }, { status: 500 });
    }

    // Atualizar último run do relatório
    await supabase
      .from('reports')
      .update({
        last_run_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', report_id);

    return NextResponse.json({
      success: true,
      data: {
        execution_id: result.execution_id,
        files: result.files,
        performance: result.performance_metrics
      }
    });

  } catch (error) {
    console.error('Erro na geração de relatório:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// GET - Verificar status de geração em andamento
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const executionId = searchParams.get('execution_id');
    
    if (!executionId) {
      return NextResponse.json({ 
        error: 'ID da execução é obrigatório' 
      }, { status: 400 });
    }

    // Buscar status da execução
    const { data: execution, error } = await supabase
      .from('report_executions')
      .select(`
        id,
        status,
        progress_percentage,
        started_at,
        completed_at,
        duration_seconds,
        error_message,
        output_files,
        performance_metrics
      `)
      .eq('id', executionId)
      .single();

    if (error || !execution) {
      return NextResponse.json({ 
        error: 'Execução não encontrada' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: execution
    });

  } catch (error) {
    console.error('Erro ao verificar status de geração:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}