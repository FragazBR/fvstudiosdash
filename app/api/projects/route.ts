import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GET - Listar projetos do usuário
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const client_id = searchParams.get('client_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Buscar perfil do usuário para pegar agency_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('projects')
      .select(`
        *,
        client:client_id(id, name, email, company),
        creator:created_by(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (status) {
      query = query.eq('status', status);
    }
    
    if (client_id) {
      query = query.eq('client_id', client_id);
    }
    
    const { data: projects, error } = await query;
    
    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Criar novo projeto
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      client_id,
      budget_total,
      start_date,
      end_date,
      priority = 'medium',
      tags = [],
      color = '#3b82f6'
    } = body;

    // Validação básica
    if (!name) {
      return NextResponse.json({ 
        error: 'Project name is required' 
      }, { status: 400 });
    }

    // Buscar agency_id do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        agency_id: profile?.agency_id,
        client_id,
        created_by: user.id,
        budget_total,
        start_date,
        end_date,
        priority,
        tags,
        color
      })
      .select(`
        *,
        client:client_id(id, name, email),
        creator:created_by(id, name)
      `)
      .single();
      
    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    // Criar notificação para o cliente (se especificado)
    if (client_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: client_id,
          title: `Novo projeto criado: ${name}`,
          message: `Um novo projeto foi criado para você.`,
          type: 'info',
          category: 'project',
          related_id: project.id,
          related_type: 'project'
        });
    }
    
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Projects POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}