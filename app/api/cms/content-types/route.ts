import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Obter tipos de conteúdo
    const { data: contentTypes, error } = await supabase
      .from('cms_content_types')
      .select(`
        id,
        name,
        slug,
        description,
        icon,
        is_system,
        is_hierarchical,
        has_categories,
        has_tags,
        has_comments,
        has_seo,
        has_featured_image,
        url_pattern,
        list_url_pattern,
        field_schema,
        list_fields,
        search_fields,
        sortable_fields,
        permission_roles,
        created_at,
        updated_at
      `)
      .eq('agency_id', profile.agency_id)
      .order('name');

    if (error) {
      console.error('Erro ao buscar tipos de conteúdo:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: contentTypes
    });

  } catch (error) {
    console.error('Erro na API de tipos de conteúdo:', error);
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
      slug,
      description,
      icon,
      is_hierarchical = false,
      has_categories = false,
      has_tags = false,
      has_comments = false,
      has_seo = true,
      has_featured_image = true,
      url_pattern,
      list_url_pattern,
      field_schema = [],
      list_fields = ['title', 'status', 'created_at'],
      search_fields = ['title', 'content'],
      sortable_fields = ['title', 'created_at', 'updated_at'],
      permission_roles = ['admin', 'agency_owner', 'agency_manager']
    } = body;

    // Validações básicas
    if (!name || !slug) {
      return NextResponse.json({ 
        error: 'Nome e slug são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se slug já existe
    const { data: existingType } = await supabase
      .from('cms_content_types')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('slug', slug)
      .single();

    if (existingType) {
      return NextResponse.json({ 
        error: 'Já existe um tipo de conteúdo com este slug' 
      }, { status: 409 });
    }

    // Criar tipo de conteúdo
    const { data: contentType, error } = await supabase
      .from('cms_content_types')
      .insert({
        agency_id: profile.agency_id,
        name,
        slug,
        description,
        icon,
        is_system: false,
        is_hierarchical,
        has_categories,
        has_tags,
        has_comments,
        has_seo,
        has_featured_image,
        url_pattern,
        list_url_pattern,
        field_schema,
        list_fields,
        search_fields,
        sortable_fields,
        permission_roles,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar tipo de conteúdo:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: contentType
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na API de tipos de conteúdo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}