import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GET - Gerar relatórios customizados
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const report_type = searchParams.get('report_type') || 'summary';
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const project_id = searchParams.get('project_id');
    const format = searchParams.get('format') || 'json';
    
    // Buscar perfil do usuário para contexto
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single();

    const contextFilter = profile?.agency_id 
      ? { agency_id: profile.agency_id }
      : { created_by: user.id };

    let reportData: any = {};

    switch (report_type) {
      case 'project_performance':
        reportData = await generateProjectPerformanceReport(
          supabase, contextFilter, start_date, end_date, project_id
        );
        break;
        
      case 'time_tracking':
        reportData = await generateTimeTrackingReport(
          supabase, contextFilter, start_date, end_date, project_id
        );
        break;
        
      case 'financial':
        reportData = await generateFinancialReport(
          supabase, contextFilter, start_date, end_date
        );
        break;
        
      case 'client_engagement':
        reportData = await generateClientEngagementReport(
          supabase, contextFilter, start_date, end_date
        );
        break;
        
      case 'productivity':
        reportData = await generateProductivityReport(
          supabase, contextFilter, start_date, end_date
        );
        break;
        
      default:
        reportData = await generateSummaryReport(
          supabase, contextFilter, start_date, end_date
        );
    }

    const response = {
      report_type,
      generated_at: new Date().toISOString(),
      period: { start_date, end_date },
      data: reportData
    };

    // TODO: Implementar exportação para PDF/Excel se format !== 'json'
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Relatório de Performance de Projetos
async function generateProjectPerformanceReport(
  supabase: any, 
  contextFilter: any, 
  startDate?: string | null, 
  endDate?: string | null,
  projectId?: string | null
) {
  let query = supabase
    .from('projects')
    .select(`
      id, name, status, priority, budget_total, budget_spent,
      start_date, end_date, created_at,
      client:client_id(name, email),
      tasks(id, status, estimated_hours, actual_hours, completed_at),
      project_metrics(*)
    `)
    .match(contextFilter);

  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  if (projectId) query = query.eq('id', projectId);

  const { data: projects, error } = await query;
  
  if (error) throw error;

  return projects?.map((project: any) => ({
    ...project,
    completion_rate: project.tasks.length > 0 
      ? Math.round((project.tasks.filter((t: any) => t.status === 'completed').length / project.tasks.length) * 100)
      : 0,
    budget_utilization: project.budget_total > 0 
      ? Math.round((project.budget_spent / project.budget_total) * 100)
      : 0,
    time_efficiency: project.tasks.reduce((sum: number, t: any) => sum + (t.estimated_hours || 0), 0) > 0
      ? Math.round((project.tasks.reduce((sum: number, t: any) => sum + (t.actual_hours || 0), 0) / 
          project.tasks.reduce((sum: number, t: any) => sum + (t.estimated_hours || 0), 0)) * 100)
      : 0
  })) || [];
}

// Relatório de Acompanhamento de Tempo
async function generateTimeTrackingReport(
  supabase: any, 
  contextFilter: any, 
  startDate?: string | null, 
  endDate?: string | null,
  projectId?: string | null
) {
  let query = supabase
    .from('tasks')
    .select(`
      id, title, status, estimated_hours, actual_hours, completed_at,
      assigned_to(name, email),
      project:project_id!inner(id, name, ${Object.keys(contextFilter).join(',')})
    `);

  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  if (projectId) query = query.eq('project_id', projectId);

  const { data: tasks, error } = await query;
  
  if (error) throw error;

  const summary = {
    total_estimated: tasks?.reduce((sum: number, t: any) => sum + (t.estimated_hours || 0), 0) || 0,
    total_actual: tasks?.reduce((sum: number, t: any) => sum + (t.actual_hours || 0), 0) || 0,
    completed_tasks: tasks?.filter((t: any) => t.status === 'completed').length || 0,
    efficiency_ratio: 0
  };

  summary.efficiency_ratio = summary.total_estimated > 0 
    ? Math.round((summary.total_actual / summary.total_estimated) * 100)
    : 0;

  return {
    summary,
    tasks: tasks || []
  };
}

// Relatório Financeiro
async function generateFinancialReport(
  supabase: any, 
  contextFilter: any, 
  startDate?: string | null, 
  endDate?: string | null
) {
  let query = supabase
    .from('projects')
    .select('budget_total, budget_spent, status, created_at, end_date')
    .match(contextFilter);

  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);

  const { data: projects, error } = await query;
  
  if (error) throw error;

  const revenue = {
    total_contracted: projects?.reduce((sum: number, p: any) => sum + (p.budget_total || 0), 0) || 0,
    total_received: projects?.reduce((sum: number, p: any) => sum + (p.budget_spent || 0), 0) || 0,
    pending: 0,
    by_status: {
      active: projects?.filter((p: any) => p.status === 'active').reduce((sum: number, p: any) => sum + (p.budget_total || 0), 0) || 0,
      completed: projects?.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + (p.budget_total || 0), 0) || 0,
      cancelled: projects?.filter((p: any) => p.status === 'cancelled').reduce((sum: number, p: any) => sum + (p.budget_total || 0), 0) || 0
    }
  };

  revenue.pending = revenue.total_contracted - revenue.total_received;

  return revenue;
}

// Relatório de Engajamento de Clientes
async function generateClientEngagementReport(
  supabase: any, 
  contextFilter: any, 
  startDate?: string | null, 
  endDate?: string | null
) {
  let contactQuery = supabase
    .from('contacts')
    .select(`
      id, name, type, last_interaction, created_at,
      interactions:contact_interactions(type, created_at),
      projects:projects(id, status, budget_total)
    `)
    .match(contextFilter);

  if (startDate) contactQuery = contactQuery.gte('created_at', startDate);
  if (endDate) contactQuery = contactQuery.lte('created_at', endDate);

  const { data: contacts, error } = await contactQuery;
  
  if (error) throw error;

  return contacts?.map((contact: any) => ({
    ...contact,
    interaction_count: contact.interactions?.length || 0,
    total_project_value: contact.projects?.reduce((sum: number, p: any) => sum + (p.budget_total || 0), 0) || 0,
    active_projects: contact.projects?.filter((p: any) => p.status === 'active').length || 0,
    last_interaction_days: contact.last_interaction 
      ? Math.floor((new Date().getTime() - new Date(contact.last_interaction).getTime()) / (1000 * 60 * 60 * 24))
      : null
  })) || [];
}

// Relatório de Produtividade
async function generateProductivityReport(
  supabase: any, 
  contextFilter: any, 
  startDate?: string | null, 
  endDate?: string | null
) {
  const endDateQuery = endDate || new Date().toISOString();
  const startDateQuery = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Buscar tarefas completadas no período
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select(`
      completed_at, estimated_hours, actual_hours,
      assigned_to(id, name),
      project:project_id(id, agency_id, created_by)
    `)
    .eq('status', 'completed')
    .gte('completed_at', startDateQuery)
    .lte('completed_at', endDateQuery);

  // Agrupar por usuário
  const userProductivity: any = {};
  completedTasks?.forEach((task: any) => {
    const userId = task.assigned_to?.id;
    if (!userId) return;

    if (!userProductivity[userId]) {
      userProductivity[userId] = {
        user: task.assigned_to,
        tasks_completed: 0,
        total_hours: 0,
        estimated_hours: 0,
        efficiency: 0
      };
    }

    userProductivity[userId].tasks_completed++;
    userProductivity[userId].total_hours += task.actual_hours || 0;
    userProductivity[userId].estimated_hours += task.estimated_hours || 0;
  });

  // Calcular eficiência
  Object.values(userProductivity).forEach((user: any) => {
    user.efficiency = user.estimated_hours > 0 
      ? Math.round((user.total_hours / user.estimated_hours) * 100)
      : 0;
  });

  return Object.values(userProductivity);
}

// Relatório Resumo
async function generateSummaryReport(
  supabase: any, 
  contextFilter: any, 
  startDate?: string | null, 
  endDate?: string | null
) {
  const endDateQuery = endDate || new Date().toISOString();
  const startDateQuery = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Buscar dados básicos
  const [projectsRes, tasksRes, contactsRes] = await Promise.all([
    supabase.from('projects').select('*').match(contextFilter).gte('created_at', startDateQuery).lte('created_at', endDateQuery),
    supabase.from('tasks').select('*, project:project_id(id, agency_id, created_by)').gte('created_at', startDateQuery).lte('created_at', endDateQuery),
    supabase.from('contacts').select('*').match(contextFilter).gte('created_at', startDateQuery).lte('created_at', endDateQuery)
  ]);

  return {
    projects: {
      total: projectsRes.data?.length || 0,
      active: projectsRes.data?.filter((p: any) => p.status === 'active').length || 0,
      completed: projectsRes.data?.filter((p: any) => p.status === 'completed').length || 0
    },
    tasks: {
      total: tasksRes.data?.length || 0,
      completed: tasksRes.data?.filter((t: any) => t.status === 'completed').length || 0,
      in_progress: tasksRes.data?.filter((t: any) => t.status === 'in_progress').length || 0
    },
    contacts: {
      total: contactsRes.data?.length || 0,
      leads: contactsRes.data?.filter((c: any) => c.type === 'lead').length || 0,
      clients: contactsRes.data?.filter((c: any) => c.type === 'client').length || 0
    }
  };
}