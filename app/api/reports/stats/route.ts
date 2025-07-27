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
    const daysBack = parseInt(searchParams.get('days_back') || '30');

    // Usar função de estatísticas do PostgreSQL
    const { data: stats, error } = await supabase
      .rpc('get_report_stats', {
        p_agency_id: profile.agency_id,
        p_days_back: daysBack
      });

    if (error) {
      console.error('Erro ao obter estatísticas de relatórios:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    const statsData = stats[0] || {};

    // Obter dados adicionais
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Relatórios recentes
    const { data: recentReports } = await supabase
      .from('reports')
      .select(`
        id,
        name,
        category,
        status,
        last_run_at,
        created_at,
        frequency
      `)
      .eq('agency_id', profile.agency_id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Execuções recentes
    const { data: recentExecutions } = await supabase
      .from('report_executions')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        duration_seconds,
        reports(name, category)
      `)
      .eq('agency_id', profile.agency_id)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false })
      .limit(20);

    // Templates mais usados
    const { data: topTemplates } = await supabase
      .from('report_templates')
      .select(`
        id,
        name,
        category,
        usage_count,
        is_public
      `)
      .or(`agency_id.eq.${profile.agency_id},is_public.eq.true`)
      .order('usage_count', { ascending: false })
      .limit(10);

    // Formatos mais utilizados
    const { data: formatUsage } = await supabase
      .from('report_files')
      .select('format')
      .eq('agency_id', profile.agency_id);

    const formatStats = formatUsage?.reduce((acc: any, file: any) => {
      acc[file.format] = (acc[file.format] || 0) + 1;
      return acc;
    }, {}) || {};

    // Performance média por categoria
    const { data: categoryPerformance } = await supabase
      .from('report_executions')
      .select(`
        duration_seconds,
        reports!inner(category)
      `)
      .eq('agency_id', profile.agency_id)
      .eq('status', 'completed')
      .gte('started_at', startDate.toISOString());

    const performanceByCategory = categoryPerformance?.reduce((acc: any, execution: any) => {
      const category = execution.reports.category;
      if (!acc[category]) {
        acc[category] = { total_duration: 0, count: 0, avg_duration: 0 };
      }
      
      acc[category].total_duration += execution.duration_seconds || 0;
      acc[category].count++;
      acc[category].avg_duration = acc[category].total_duration / acc[category].count;
      
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_reports: statsData.total_reports || 0,
          active_reports: statsData.active_reports || 0,
          total_executions: statsData.total_executions || 0,
          successful_executions: statsData.successful_executions || 0,
          failed_executions: statsData.failed_executions || 0,
          average_execution_time_seconds: Number(statsData.avg_execution_time_seconds) || 0,
          success_rate: statsData.total_executions > 0 ? 
            Math.round((statsData.successful_executions / statsData.total_executions) * 100) : 0
        },
        reports_by_category: statsData.reports_by_category || [],
        executions_by_day: statsData.executions_by_day || [],
        top_templates: topTemplates || [],
        recent_reports: recentReports || [],
        recent_executions: recentExecutions || [],
        format_usage: Object.entries(formatStats).map(([format, count]) => ({
          format,
          count
        })),
        performance_by_category: Object.entries(performanceByCategory).map(([category, stats]: [string, any]) => ({
          category,
          avg_duration_seconds: Math.round(stats.avg_duration),
          executions_count: stats.count
        })),
        period: {
          days_back: daysBack,
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Erro na API de estatísticas de relatórios:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}