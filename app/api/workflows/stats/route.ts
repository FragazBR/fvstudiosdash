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
    const daysBack = parseInt(searchParams.get('days_back') || '30');

    // Usar função de estatísticas do PostgreSQL
    const { data: stats, error } = await supabase
      .rpc('get_workflow_stats', {
        p_agency_id: profile.agency_id,
        p_workflow_id: workflowId,
        p_days_back: daysBack
      });

    if (error) {
      console.error('Erro ao obter estatísticas de workflow:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    const statsData = stats[0] || {};

    // Obter dados adicionais
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Instâncias recentes
    const { data: recentInstances } = await supabase
      .from('workflow_instances')
      .select(`
        id,
        title,
        status,
        priority,
        current_step,
        total_steps,
        progress_percentage,
        created_at,
        workflows(name, type)
      `)
      .eq('agency_id', profile.agency_id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Instâncias pendentes de aprovação
    const { data: pendingInstances } = await supabase
      .from('workflow_instances')
      .select(`
        id,
        title,
        priority,
        current_step,
        total_steps,
        due_date,
        created_at,
        workflows(name, type)
      `)
      .eq('agency_id', profile.agency_id)
      .contains('current_approvers', [session.user.id])
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true })
      .limit(10);

    // Performance por workflow
    const { data: workflowPerformance } = await supabase
      .from('workflow_instances')
      .select(`
        workflow_id,
        status,
        started_at,
        completed_at,
        workflows(name, type)
      `)
      .eq('agency_id', profile.agency_id)
      .gte('created_at', startDate.toISOString());

    // Processar performance por workflow
    const performanceByWorkflow = workflowPerformance?.reduce((acc: any, instance: any) => {
      const workflowId = instance.workflow_id;
      if (!acc[workflowId]) {
        acc[workflowId] = {
          workflow_name: instance.workflows?.name,
          workflow_type: instance.workflows?.type,
          total_instances: 0,
          completed_instances: 0,
          avg_completion_hours: 0,
          completion_rate: 0
        };
      }
      
      acc[workflowId].total_instances++;
      
      if (instance.status === 'approved' && instance.completed_at) {
        acc[workflowId].completed_instances++;
        const hours = (new Date(instance.completed_at).getTime() - new Date(instance.started_at).getTime()) / (1000 * 60 * 60);
        acc[workflowId].avg_completion_hours = 
          (acc[workflowId].avg_completion_hours * (acc[workflowId].completed_instances - 1) + hours) / 
          acc[workflowId].completed_instances;
      }
      
      acc[workflowId].completion_rate = 
        (acc[workflowId].completed_instances / acc[workflowId].total_instances) * 100;
      
      return acc;
    }, {}) || {};

    // Métricas de tempo de resposta
    const { data: responseTimeData } = await supabase
      .from('workflow_approvals')
      .select('response_time_hours, action_taken_at')
      .gte('action_taken_at', startDate.toISOString());

    const avgResponseTime = responseTimeData?.reduce((sum, approval) => 
      sum + (approval.response_time_hours || 0), 0) / (responseTimeData?.length || 1);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_workflows: statsData.total_workflows || 0,
          active_workflows: statsData.active_workflows || 0,
          total_instances: statsData.total_instances || 0,
          pending_instances: statsData.pending_instances || 0,
          in_progress_instances: statsData.in_progress_instances || 0,
          completed_instances: statsData.completed_instances || 0,
          average_completion_hours: Number(statsData.average_completion_hours) || 0,
          completion_rate: Number(statsData.completion_rate) || 0,
          average_response_time_hours: avgResponseTime
        },
        instances_by_status: statsData.instances_by_status || [],
        instances_by_type: statsData.instances_by_type || [],
        daily_activity: statsData.daily_activity || [],
        recent_instances: recentInstances || [],
        pending_approvals: pendingInstances || [],
        workflow_performance: Object.values(performanceByWorkflow),
        period: {
          days_back: daysBack,
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Erro na API de estatísticas de workflow:', error);
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

    const body = await request.json();
    const { action, workflow_id, instance_id, metric_data } = body;

    if (action === 'calculate_metrics') {
      // Calcular métricas para um workflow específico
      if (!workflow_id) {
        return NextResponse.json({ 
          error: 'ID do workflow é obrigatório para calcular métricas' 
        }, { status: 400 });
      }

      // Buscar instâncias do workflow
      const { data: instances } = await supabase
        .from('workflow_instances')
        .select(`
          id,
          status,
          started_at,
          completed_at,
          current_step,
          total_steps,
          workflow_approvals(
            response_time_hours,
            action_taken_at
          )
        `)
        .eq('workflow_id', workflow_id);

      // Calcular métricas
      const totalInstances = instances?.length || 0;
      const completedInstances = instances?.filter(i => i.status === 'approved').length || 0;
      const avgCompletionTime = instances?.reduce((sum, instance) => {
        if (instance.completed_at && instance.started_at) {
          return sum + (new Date(instance.completed_at).getTime() - new Date(instance.started_at).getTime()) / (1000 * 60 * 60);
        }
        return sum;
      }, 0) / (completedInstances || 1);

      const avgResponseTime = instances?.reduce((sum, instance) => {
        const approvalTimes = instance.workflow_approvals?.map((a: any) => a.response_time_hours || 0) || [];
        const avgForInstance = approvalTimes.reduce((a, b) => a + b, 0) / (approvalTimes.length || 1);
        return sum + avgForInstance;
      }, 0) / (totalInstances || 1);

      // Salvar métricas
      const { error: metricsError } = await supabase
        .from('workflow_metrics')
        .insert({
          workflow_id,
          total_duration_hours: avgCompletionTime,
          total_approvers: instances?.reduce((sum, i) => sum + (i.workflow_approvals?.length || 0), 0),
          approvals_received: instances?.reduce((sum, i) => 
            sum + (i.workflow_approvals?.filter((a: any) => a.decision === 'approved').length || 0), 0),
          average_response_time_hours: avgResponseTime,
          steps_completed: instances?.reduce((sum, i) => sum + (i.current_step || 0), 0),
          sla_met: avgCompletionTime <= 72, // Assumindo SLA de 72 horas
          sla_target_hours: 72,
          period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0]
        });

      if (metricsError) {
        console.error('Erro ao salvar métricas:', metricsError);
        return NextResponse.json({ error: 'Erro ao salvar métricas' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: {
          total_instances: totalInstances,
          completed_instances: completedInstances,
          completion_rate: (completedInstances / totalInstances) * 100,
          avg_completion_hours: avgCompletionTime,
          avg_response_hours: avgResponseTime
        }
      });
    }

    return NextResponse.json({
      error: 'Ação não reconhecida'
    }, { status: 400 });

  } catch (error) {
    console.error('Erro na API de estatísticas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}