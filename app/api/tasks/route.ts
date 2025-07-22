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
    
    let query = supabase
      .from('tasks')
      .select(`
        *,
        project:project_id(id, name, status),
        assigned_to:assigned_to(id, name, email, avatar_url),
        creator:created_by(id, name)
      `)
      .order('position', { ascending: true })
      .limit(limit);
      
    if (project_id) {
      query = query.eq('project_id', project_id);
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
        project:project_id(id, name),
        assigned_to:assigned_to(id, name, email),
        creator:created_by(id, name)
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