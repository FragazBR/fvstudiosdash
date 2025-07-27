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
    const contentTypeId = searchParams.get('content_type_id');
    const parentId = searchParams.get('parent_id');

    // Construir query
    let query = supabase
      .from('cms_categories')
      .select(`
        id,
        name,
        slug,
        description,
        color,
        icon,
        parent_id,
        sort_order,
        seo_title,
        seo_description,
        created_at,
        updated_at,
        cms_content_types(
          id,
          name,
          slug
        )
      `)
      .eq('agency_id', profile.agency_id);

    // Aplicar filtros
    if (contentTypeId) {
      query = query.eq('content_type_id', contentTypeId);
    }

    if (parentId === 'null' || parentId === '') {
      query = query.is('parent_id', null);
    } else if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    const { data: categories, error } = await query
      .order('sort_order')
      .order('name');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Erro na API de categorias:', error);
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

    if (!profile || !['admin', 'agency_owner', 'agency_manager', 'agency_staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const body = await request.json();
    const {
      content_type_id,
      name,
      slug,
      description,
      color,
      icon,
      parent_id,
      sort_order = 0,
      seo_title,
      seo_description
    } = body;

    // Validações básicas
    if (!content_type_id || !name) {
      return NextResponse.json({ 
        error: 'Tipo de conteúdo e nome são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se o tipo de conteúdo existe
    const { data: contentType } = await supabase
      .from('cms_content_types')
      .select('id, has_categories')
      .eq('id', content_type_id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (!contentType) {
      return NextResponse.json({ error: 'Tipo de conteúdo não encontrado' }, { status: 404 });
    }

    if (!contentType.has_categories) {
      return NextResponse.json({ 
        error: 'Este tipo de conteúdo não suporta categorias' 
      }, { status: 400 });
    }

    // Gerar slug se não fornecido
    const finalSlug = slug || name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Verificar se slug já existe
    const { data: existingCategory } = await supabase
      .from('cms_categories')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('content_type_id', content_type_id)
      .eq('slug', finalSlug)
      .single();

    if (existingCategory) {
      return NextResponse.json({ 
        error: 'Já existe uma categoria com este slug' 
      }, { status: 409 });
    }

    // Verificar se categoria pai existe (se especificada)
    if (parent_id) {
      const { data: parentCategory } = await supabase
        .from('cms_categories')
        .select('id')
        .eq('id', parent_id)
        .eq('agency_id', profile.agency_id)
        .eq('content_type_id', content_type_id)
        .single();

      if (!parentCategory) {
        return NextResponse.json({ 
          error: 'Categoria pai não encontrada' 
        }, { status: 400 });
      }
    }

    // Criar categoria
    const { data: category, error } = await supabase
      .from('cms_categories')
      .insert({
        agency_id: profile.agency_id,
        content_type_id,
        name,
        slug: finalSlug,
        description,
        color,
        icon,
        parent_id,
        sort_order,
        seo_title,
        seo_description,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: category
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na API de categorias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}