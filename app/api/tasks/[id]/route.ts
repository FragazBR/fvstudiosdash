import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Buscar tarefa específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:project_id(id, name, status, client_id),
        assigned_to:assigned_to(id, name, email, avatar_url),
        creator:created_by(id, name, email)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching task:', error);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Task GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Atualizar tarefa
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title,
      description,
      status,
      priority,
      progress,
      assigned_to,
      estimated_hours,
      actual_hours,
      due_date,
      tags,
      position
    } = body;

    // Buscar dados atuais da tarefa
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('status, progress, assigned_to, due_date, project_id')
      .eq('id', id)
      .single();

    const updates: any = {
      title,
      description,
      status,
      priority,
      progress,
      assigned_to,
      estimated_hours,
      actual_hours,
      due_date,
      tags,
      position
    };

    // Se marcou como completed, adicionar timestamp
    if (status === 'completed' && currentTask?.status !== 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.progress = 100;
    }

    // Se desmarcou completed, remover timestamp
    if (status !== 'completed' && currentTask?.status === 'completed') {
      updates.completed_at = null;
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        project:project_id(id, name, client_id),
        assigned_to:assigned_to(id, name, email),
        creator:created_by(id, name)
      `)
      .single();
      
    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Notificações baseadas em mudanças
    const notifications = [];

    // Se assignee mudou
    if (assigned_to && assigned_to !== currentTask?.assigned_to && assigned_to !== user.id) {
      notifications.push({
        user_id: assigned_to,
        title: `Tarefa atribuída: ${task.title}`,
        message: `Uma tarefa foi atribuída a você.`,
        type: 'info',
        category: 'task',
        related_id: id,
        related_type: 'task'
      });
    }

    // Se tarefa foi completada
    if (status === 'completed' && currentTask?.status !== 'completed') {
      // Notificar cliente do projeto
      if (task.project?.client_id) {
        notifications.push({
          user_id: task.project.client_id,
          title: `Tarefa concluída: ${task.title}`,
          message: `Uma tarefa do seu projeto foi finalizada.`,
          type: 'success',
          category: 'task',
          related_id: id,
          related_type: 'task'
        });
      }
    }

    // Atualizar evento no calendário se due_date mudou
    if (due_date !== currentTask?.due_date) {
      if (due_date) {
        // Upsert evento no calendário
        await supabase
          .from('calendar_events')
          .upsert({
            title: `📋 ${task.title}`,
            description: `Prazo da tarefa: ${task.title}`,
            user_id: assigned_to || user.id,
            project_id: task.project_id,
            task_id: id,
            start_date: due_date,
            end_date: due_date,
            event_type: 'deadline',
            color: '#ef4444'
          });
      } else {
        // Remover evento se due_date foi removido
        await supabase
          .from('calendar_events')
          .delete()
          .eq('task_id', id);
      }
    }

    // Criar notificações
    if (notifications.length > 0) {
      await supabase
        .from('notifications')
        .insert(notifications);
    }
    
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Task PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Deletar tarefa
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remover eventos do calendário relacionados
    await supabase
      .from('calendar_events')
      .delete()
      .eq('task_id', id);

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}