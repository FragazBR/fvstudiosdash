import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GET - Analytics gerais do usuário/agência
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // dias
    const metric_type = searchParams.get('metric_type');
    
    // Buscar perfil do usuário para contexto
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // Base para filtros de contexto
    const contextFilter = profile?.agency_id 
      ? { agency_id: profile.agency_id }
      : { created_by: user.id };

    // Analytics de Projetos
    const { data: projectStats } = await supabase
      .from('projects')
      .select('status, budget_total, budget_spent, created_at')
      .match(contextFilter)
      .gte('created_at', startDate.toISOString());

    // Analytics de Tarefas  
    const { data: taskStats } = await supabase
      .from('tasks')
      .select(`
        status, priority, completed_at, estimated_hours, actual_hours, created_at,
        project:project_id(id, agency_id, created_by)
      `)
      .gte('created_at', startDate.toISOString());

    // Analytics de Contatos
    const { data: contactStats } = await supabase
      .from('contacts')
      .select('type, status, created_at, last_interaction')
      .match(contextFilter)
      .gte('created_at', startDate.toISOString());

    // Analytics de Receita
    const { data: revenueStats } = await supabase
      .from('projects')
      .select('budget_total, budget_spent, status, created_at')
      .match(contextFilter)
      .gte('created_at', startDate.toISOString());

    // Compilar estatísticas
    const analytics = {
      projects: {
        total: projectStats?.length || 0,
        active: projectStats?.filter((p: any) => p.status === 'active').length || 0,
        completed: projectStats?.filter((p: any) => p.status === 'completed').length || 0,
        revenue: {
          total: projectStats?.reduce((sum, p) => sum + (p.budget_total || 0), 0) || 0,
          spent: projectStats?.reduce((sum, p) => sum + (p.budget_spent || 0), 0) || 0
        }
      },
      tasks: {
        total: taskStats?.length || 0,
        completed: taskStats?.filter((t: any) => t.status === 'completed').length || 0,
        in_progress: taskStats?.filter((t: any) => t.status === 'in_progress').length || 0,
        overdue: 0, // TODO: Implementar lógica de overdue baseada em due_date das tasks
        hours: {
          estimated: taskStats?.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) || 0,
          actual: taskStats?.reduce((sum, t) => sum + (t.actual_hours || 0), 0) || 0
        }
      },
      contacts: {
        total: contactStats?.length || 0,
        leads: contactStats?.filter((c: any) => c.type === 'lead').length || 0,
        clients: contactStats?.filter((c: any) => c.type === 'client').length || 0,
        active: contactStats?.filter((c: any) => c.status === 'active').length || 0
      },
      period_days: parseInt(period)
    };

    // Métricas por período (últimos 7 dias)
    const dailyMetrics = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayProjects = projectStats?.filter((p: any) => 
        p.created_at.startsWith(dateStr)
      ).length || 0;
      
      const dayTasks = taskStats?.filter((t: any) => 
        t.completed_at && t.completed_at.startsWith(dateStr)
      ).length || 0;
      
      dailyMetrics.push({
        date: dateStr,
        projects_created: dayProjects,
        tasks_completed: dayTasks
      });
    }

    const response = {
      analytics,
      daily_metrics: dailyMetrics,
      generated_at: new Date().toISOString()
    };

    if (metric_type) {
      // Retornar apenas métrica específica
      return NextResponse.json({ 
        [metric_type]: analytics[metric_type as keyof typeof analytics] 
      });
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}