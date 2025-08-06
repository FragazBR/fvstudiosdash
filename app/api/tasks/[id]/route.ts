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

    // Buscar perfil do usuário para filtro de agência
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.agency_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:project_id(id, name, status, client_id, agency_id),
        assigned_to:assigned_to(id, full_name, email, avatar_url),
        creator:created_by(id, full_name, email)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching task:', error);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verificar se a task pertence à agência do usuário
    if (task?.project?.agency_id !== userProfile.agency_id) {
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

// PATCH - Atualizar tarefa parcialmente
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log(`🔧 PATCH API called for task ${id}`)
    
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar perfil do usuário para filtro de agência
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.agency_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    const body = await request.json();
    console.log(`🔧 PATCH body:`, body)
    console.log(`🔧 User profile:`, userProfile)
    
    // Buscar dados atuais da tarefa (testando se progress existe)
    let currentTask, taskError;
    
    // Primeiro, testar sem progress
    const taskResult = await supabase
      .from('tasks')
      .select(`
        status, assigned_to, due_date, project_id, title
      `)
      .eq('id', id)
      .single();
    
    currentTask = taskResult.data;
    taskError = taskResult.error;
    
    // Se funcionou, tentar adicionar progress
    if (!taskError && currentTask) {
      console.log('✅ Task found without progress, trying with progress...')
      const taskWithProgressResult = await supabase
        .from('tasks')
        .select(`
          status, progress, assigned_to, due_date, project_id, title
        `)
        .eq('id', id)
        .single();
        
      if (!taskWithProgressResult.error) {
        console.log('✅ Progress column exists, using full data')
        currentTask = taskWithProgressResult.data;
        taskError = taskWithProgressResult.error;
      } else {
        console.log('❌ Progress column issue:', taskWithProgressResult.error)
        // Usar dados sem progress
      }
    }

    console.log(`PATCH Task ${id}: currentTask =`, currentTask, 'error =', taskError)

    if (taskError || !currentTask) {
      console.error('Task not found or error fetching:', taskError)
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Buscar projeto para verificar a agência
    if (currentTask.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('agency_id')
        .eq('id', currentTask.project_id)
        .single();

      console.log(`🔧 Project ${currentTask.project_id}:`, project)

      // Verificar se a task pertence à agência do usuário
      if (project?.agency_id !== userProfile.agency_id) {
        console.error(`Task ${id} belongs to agency ${project?.agency_id}, but user belongs to ${userProfile.agency_id}`)
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
    }

    const updates: any = { ...body };

    // Se marcou como completed, adicionar timestamp
    if (body.status === 'completed' && currentTask.status !== 'completed') {
      updates.completed_at = new Date().toISOString();
      if (!updates.progress) updates.progress = 100; // Agora pode atualizar progress
    }

    // Se desmarcou completed, remover timestamp
    if (body.status && body.status !== 'completed' && currentTask.status === 'completed') {
      updates.completed_at = null;
    }

    console.log('🔧 Updates to be applied:', updates)

    // Tentar update com progress primeiro
    let task, error;
    const updateResult = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        project:project_id(id, name, client_id, agency_id),
        assigned_to:assigned_to(id, full_name, email, avatar_url),
        creator:created_by(id, full_name)
      `)
      .single();
      
    task = updateResult.data;
    error = updateResult.error;
    
    // Se falhou e progress está no updates, tentar sem progress
    if (error && 'progress' in updates) {
      console.log('❌ Update failed with progress, trying without progress:', error)
      const updatesWithoutProgress = { ...updates };
      delete updatesWithoutProgress.progress;
      
      const fallbackResult = await supabase
        .from('tasks')
        .update(updatesWithoutProgress)
        .eq('id', id)
        .select(`
          *,
          project:project_id(id, name, client_id, agency_id),
          assigned_to:assigned_to(id, full_name, email, avatar_url),
          creator:created_by(id, full_name)
        `)
        .single();
        
      task = fallbackResult.data;
      error = fallbackResult.error;
      console.log('🔄 Fallback result:', { task: !!task, error })
    }
      
    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Notificações se tarefa foi completada
    if (body.status === 'completed' && currentTask.status !== 'completed') {
      // Notificar cliente do projeto se existe
      if (task.project?.client_id) {
        await supabase
          .from('notifications')
          .insert({
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
    
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Task PATCH error:', error);
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