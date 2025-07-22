import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Buscar projeto específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:client_id(id, name, email, phone, company),
        creator:created_by(id, name, email),
        tasks(
          id, title, description, status, priority, progress,
          due_date, completed_at, estimated_hours, actual_hours,
          assigned_to(id, name, email), position, tags
        ),
        project_metrics(
          total_hours_logged, total_hours_estimated,
          tasks_total, tasks_completed, tasks_in_progress, tasks_overdue,
          budget_utilization, metric_date
        )
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Project GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Atualizar projeto
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
      name, 
      description, 
      status,
      priority,
      budget_total,
      budget_spent,
      start_date,
      end_date,
      tags,
      color
    } = body;

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        name,
        description,
        status,
        priority,
        budget_total,
        budget_spent,
        start_date,
        end_date,
        tags,
        color
      })
      .eq('id', id)
      .select(`
        *,
        client:client_id(id, name, email),
        creator:created_by(id, name)
      `)
      .single();
      
    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    // Se status mudou para completed, criar notificação
    if (status === 'completed') {
      const { data: projectData } = await supabase
        .from('projects')
        .select('client_id, name')
        .eq('id', id)
        .single();

      if (projectData?.client_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: projectData.client_id,
            title: `Projeto concluído: ${projectData.name}`,
            message: `O projeto foi finalizado com sucesso!`,
            type: 'success',
            category: 'project',
            related_id: id,
            related_type: 'project'
          });
      }
    }
    
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Project PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Deletar projeto
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Project DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}