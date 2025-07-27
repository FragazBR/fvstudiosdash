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
    const category = searchParams.get('category');
    const isPublic = searchParams.get('is_public');
    const isFeatured = searchParams.get('is_featured');

    // Construir query - templates da agência + templates públicos
    let query = supabase
      .from('report_templates')
      .select(`
        id,
        name,
        description,
        category,
        data_sources,
        query_config,
        layout_config,
        chart_config,
        styling_config,
        usage_count,
        is_public,
        is_featured,
        created_at,
        updated_at,
        created_by
      `)
      .or(`agency_id.eq.${profile.agency_id},is_public.eq.true`);

    // Aplicar filtros
    if (category) {
      query = query.eq('category', category);
    }

    if (isPublic !== null) {
      query = query.eq('is_public', isPublic === 'true');
    }

    if (isFeatured !== null) {
      query = query.eq('is_featured', isFeatured === 'true');
    }

    const { data: templates, error } = await query
      .order('is_featured', { ascending: false })
      .order('usage_count', { ascending: false })
      .order('name');

    if (error) {
      console.error('Erro ao buscar templates de relatórios:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Erro na API de templates de relatórios:', error);
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

    // Obter perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin', 'agency_owner', 'agency_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      data_sources,
      query_config,
      layout_config = {},
      chart_config = {},
      styling_config = {},
      filters_config = {},
      allowed_roles = [],
      allowed_users = [],
      is_public = false
    } = body;

    // Validações básicas
    if (!name || !category || !data_sources || !query_config) {
      return NextResponse.json({ 
        error: 'Nome, categoria, fontes de dados e configuração de query são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se nome já existe na agência
    const { data: existingTemplate } = await supabase
      .from('report_templates')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('name', name)
      .single();

    if (existingTemplate) {
      return NextResponse.json({ 
        error: 'Já existe um template com este nome' 
      }, { status: 409 });
    }

    // Criar template
    const { data: template, error } = await supabase
      .from('report_templates')
      .insert({
        agency_id: profile.agency_id,
        name,
        description,
        category,
        data_sources,
        query_config,
        layout_config,
        chart_config,
        styling_config,
        filters_config,
        allowed_roles,
        allowed_users,
        is_public,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar template de relatório:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: template
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na API de templates de relatórios:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}