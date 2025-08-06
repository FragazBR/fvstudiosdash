import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GET - Listar tarefas
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');
    const status = searchParams.get('status');
    const assigned_to = searchParams.get('assigned_to');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Buscar perfil do usuário para filtro de agência
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.agency_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    let query = supabase
      .from('tasks')
      .select(`
        *,
        project:project_id(id, name, status),
        assigned_to:assigned_to(id, full_name, email),
        creator:created_by(id, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filtrar por agência através dos projetos
    if (project_id) {
      query = query.eq('project_id', project_id);
    } else {
      // Filtrar por projetos da agência do usuário
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('agency_id', userProfile.agency_id);
      
      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map(p => p.id);
        query = query.in('project_id', projectIds);
      }
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }
    
    const { data: tasks, error } = await query;
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
    
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Criar nova tarefa
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title,
      description,
      project_id,
      assigned_to,
      priority = 'medium',
      estimated_hours,
      due_date,
      tags = [],
      status = 'todo'
    } = body;

    // Validação básica
    if (!title || !project_id) {
      return NextResponse.json({ 
        error: 'Title and project_id are required' 
      }, { status: 400 });
    }

    // Buscar perfil do usuário para pegar agency_id
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.agency_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    // Calcular posição para nova tarefa
    const { data: lastTask } = await supabase
      .from('tasks')
      .select('position')
      .eq('project_id', project_id)
      .eq('status', status)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const position = (lastTask?.position || 0) + 1;

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        project_id,
        assigned_to,
        created_by: user.id,
        priority,
        estimated_hours,
        due_date,
        tags,
        status,
        position
      })
      .select(`
        *,
        project:project_id(id, name, status),
        assigned_to:assigned_to(id, full_name, email),
        creator:created_by(id, full_name)
      `)
      .single();
      
    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Criar notificação para o assignee (se diferente do criador)
    if (assigned_to && assigned_to !== user.id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: assigned_to,
          title: `Nova tarefa atribuída: ${title}`,
          message: `Uma nova tarefa foi atribuída a você.`,
          type: 'info',
          category: 'task',
          related_id: task.id,
          related_type: 'task',
          action_url: `/projects/${project_id}`
        });
    }

    // Criar evento no calendário se tem due_date
    if (due_date) {
      await supabase
        .from('calendar_events')
        .insert({
          title: `📋 ${title}`,
          description: `Prazo da tarefa: ${title}`,
          user_id: assigned_to || user.id,
          project_id,
          task_id: task.id,
          start_date: due_date,
          end_date: due_date,
          event_type: 'deadline',
          color: '#ef4444'
        });
    }
    
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}