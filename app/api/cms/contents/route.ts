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
    const status = searchParams.get('status');
    const categoryId = searchParams.get('category_id');
    const tagId = searchParams.get('tag_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabase
      .from('cms_contents')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        custom_fields,
        status,
        visibility,
        published_at,
        scheduled_at,
        expires_at,
        parent_id,
        menu_order,
        seo_title,
        seo_description,
        seo_keywords,
        seo_og_image,
        featured_image_url,
        featured_image_alt,
        view_count,
        like_count,
        share_count,
        version,
        created_at,
        updated_at,
        cms_content_types(
          id,
          name,
          slug,
          icon
        ),
        cms_content_categories(
          cms_categories(
            id,
            name,
            slug,
            color
          )
        ),
        cms_content_tags(
          cms_tags(
            id,
            name,
            slug,
            color
          )
        )
      `)
      .eq('agency_id', profile.agency_id);

    // Aplicar filtros
    if (contentTypeId) {
      query = query.eq('content_type_id', contentTypeId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.textSearch('title,content', search);
    }

    // Filtro por categoria (através da junction table)
    if (categoryId) {
      const { data: categoryContents } = await supabase
        .from('cms_content_categories')
        .select('content_id')
        .eq('category_id', categoryId);
      
      if (categoryContents) {
        const contentIds = categoryContents.map(cc => cc.content_id);
        query = query.in('id', contentIds);
      }
    }

    // Filtro por tag (através da junction table)
    if (tagId) {
      const { data: tagContents } = await supabase
        .from('cms_content_tags')
        .select('content_id')
        .eq('tag_id', tagId);
      
      if (tagContents) {
        const contentIds = tagContents.map(ct => ct.content_id);
        query = query.in('id', contentIds);
      }
    }

    // Aplicar paginação e ordenação
    const { data: contents, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao buscar conteúdos:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Contar total de itens
    let countQuery = supabase
      .from('cms_contents')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id);

    if (contentTypeId) countQuery = countQuery.eq('content_type_id', contentTypeId);
    if (status) countQuery = countQuery.eq('status', status);
    if (search) countQuery = countQuery.textSearch('title,content', search);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Erro ao contar conteúdos:', countError);
    }

    return NextResponse.json({
      success: true,
      data: contents,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Erro na API de conteúdos:', error);
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

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const {
      content_type_id,
      title,
      slug,
      excerpt,
      content,
      custom_fields = {},
      status = 'draft',
      visibility = 'public',
      password,
      published_at,
      scheduled_at,
      expires_at,
      parent_id,
      menu_order = 0,
      seo_title,
      seo_description,
      seo_keywords,
      seo_og_image,
      seo_canonical_url,
      featured_image_url,
      featured_image_alt,
      categories = [],
      tags = []
    } = body;

    // Validações básicas
    if (!content_type_id || !title) {
      return NextResponse.json({ 
        error: 'Tipo de conteúdo e título são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se o tipo de conteúdo existe
    const { data: contentType } = await supabase
      .from('cms_content_types')
      .select('id, permission_roles')
      .eq('id', content_type_id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (!contentType) {
      return NextResponse.json({ error: 'Tipo de conteúdo não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    if (!contentType.permission_roles.includes(profile.role)) {
      return NextResponse.json({ error: 'Permissão negada para este tipo de conteúdo' }, { status: 403 });
    }

    // Gerar slug se não fornecido
    const finalSlug = slug || title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Verificar se slug já existe
    const { data: existingContent } = await supabase
      .from('cms_contents')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('slug', finalSlug)
      .neq('status', 'deleted')
      .single();

    if (existingContent) {
      return NextResponse.json({ 
        error: 'Já existe um conteúdo com este slug' 
      }, { status: 409 });
    }

    // Criar conteúdo
    const { data: newContent, error } = await supabase
      .from('cms_contents')
      .insert({
        agency_id: profile.agency_id,
        content_type_id,
        title,
        slug: finalSlug,
        excerpt,
        content,
        custom_fields,
        status,
        visibility,
        password,
        published_at: status === 'published' ? (published_at || new Date().toISOString()) : published_at,
        scheduled_at,
        expires_at,
        parent_id,
        menu_order,
        seo_title,
        seo_description,
        seo_keywords,
        seo_og_image,
        seo_canonical_url,
        featured_image_url,
        featured_image_alt,
        created_by: session.user.id,
        updated_by: session.user.id,
        published_by: status === 'published' ? session.user.id : null
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar conteúdo:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Associar categorias
    if (categories.length > 0) {
      const categoryAssociations = categories.map((categoryId: string) => ({
        content_id: newContent.id,
        category_id: categoryId
      }));

      await supabase
        .from('cms_content_categories')
        .insert(categoryAssociations);
    }

    // Associar tags
    if (tags.length > 0) {
      const tagAssociations = tags.map((tagId: string) => ({
        content_id: newContent.id,
        tag_id: tagId
      }));

      await supabase
        .from('cms_content_tags')
        .insert(tagAssociations);
    }

    return NextResponse.json({
      success: true,
      data: newContent
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na API de conteúdos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}