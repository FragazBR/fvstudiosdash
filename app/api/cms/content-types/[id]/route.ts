import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Obter tipo de conteúdo específico
    const { data: contentType, error } = await supabase
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
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (error || !contentType) {
      return NextResponse.json({ error: 'Tipo de conteúdo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: contentType
    });

  } catch (error) {
    console.error('Erro na API de tipo de conteúdo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      permission_roles
    } = body;

    // Verificar se o tipo de conteúdo existe
    const { data: existingType } = await supabase
      .from('cms_content_types')
      .select('id, is_system')
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (!existingType) {
      return NextResponse.json({ error: 'Tipo de conteúdo não encontrado' }, { status: 404 });
    }

    // Não permitir edição de tipos do sistema
    if (existingType.is_system) {
      return NextResponse.json({ 
        error: 'Tipos de conteúdo do sistema não podem ser editados' 
      }, { status: 403 });
    }

    // Verificar se novo slug já existe (se foi alterado)
    if (slug) {
      const { data: slugExists } = await supabase
        .from('cms_content_types')
        .select('id')
        .eq('agency_id', profile.agency_id)
        .eq('slug', slug)
        .neq('id', params.id)
        .single();

      if (slugExists) {
        return NextResponse.json({ 
          error: 'Já existe um tipo de conteúdo com este slug' 
        }, { status: 409 });
      }
    }

    // Atualizar tipo de conteúdo
    const { data: contentType, error } = await supabase
      .from('cms_content_types')
      .update({
        name,
        slug,
        description,
        icon,
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
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar tipo de conteúdo:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: contentType
    });

  } catch (error) {
    console.error('Erro na API de tipo de conteúdo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar se o tipo de conteúdo existe
    const { data: existingType } = await supabase
      .from('cms_content_types')
      .select('id, is_system')
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (!existingType) {
      return NextResponse.json({ error: 'Tipo de conteúdo não encontrado' }, { status: 404 });
    }

    // Não permitir exclusão de tipos do sistema
    if (existingType.is_system) {
      return NextResponse.json({ 
        error: 'Tipos de conteúdo do sistema não podem ser excluídos' 
      }, { status: 403 });
    }

    // Verificar se há conteúdos usando este tipo
    const { data: contentExists } = await supabase
      .from('cms_contents')
      .select('id')
      .eq('content_type_id', params.id)
      .limit(1);

    if (contentExists && contentExists.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir um tipo de conteúdo que possui conteúdos associados' 
      }, { status: 409 });
    }

    // Excluir tipo de conteúdo
    const { error } = await supabase
      .from('cms_content_types')
      .delete()
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id);

    if (error) {
      console.error('Erro ao excluir tipo de conteúdo:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tipo de conteúdo excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de tipo de conteúdo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}