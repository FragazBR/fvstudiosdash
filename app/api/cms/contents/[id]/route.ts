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

    // Obter conteúdo específico
    const { data: content, error } = await supabase
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
        password,
        published_at,
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
          icon,
          field_schema
        ),
        cms_content_categories(
          cms_categories(
            id,
            name,
            slug,
            color,
            icon
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
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (error || !content) {
      return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });
    }

    // Incrementar contador de visualizações (apenas para conteúdo publicado)
    if (content.status === 'published') {
      await supabase
        .from('cms_contents')
        .update({ view_count: (content.view_count || 0) + 1 })
        .eq('id', params.id);
    }

    return NextResponse.json({
      success: true,
      data: content
    });

  } catch (error) {
    console.error('Erro na API de conteúdo:', error);
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

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Verificar se o conteúdo existe e se o usuário tem permissão
    const { data: existingContent } = await supabase
      .from('cms_contents')
      .select(`
        id,
        created_by,
        content_type_id,
        slug,
        status,
        cms_content_types(permission_roles)
      `)
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (!existingContent) {
      return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    const canEdit = existingContent.created_by === session.user.id ||
                   ['admin', 'agency_owner', 'agency_manager'].includes(profile.role) ||
                   existingContent.cms_content_types.permission_roles.includes(profile.role);

    if (!canEdit) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      custom_fields,
      status,
      visibility,
      password,
      published_at,
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
      categories = [],
      tags = []
    } = body;

    // Verificar se novo slug já existe (se foi alterado)
    if (slug && slug !== existingContent.slug) {
      const { data: slugExists } = await supabase
        .from('cms_contents')
        .select('id')
        .eq('agency_id', profile.agency_id)
        .eq('slug', slug)
        .neq('id', params.id)
        .neq('status', 'deleted')
        .single();

      if (slugExists) {
        return NextResponse.json({ 
          error: 'Já existe um conteúdo com este slug' 
        }, { status: 409 });
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      updated_by: session.user.id
    };

    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (custom_fields !== undefined) updateData.custom_fields = custom_fields;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (password !== undefined) updateData.password = password;
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (parent_id !== undefined) updateData.parent_id = parent_id;
    if (menu_order !== undefined) updateData.menu_order = menu_order;
    if (seo_title !== undefined) updateData.seo_title = seo_title;
    if (seo_description !== undefined) updateData.seo_description = seo_description;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords;
    if (seo_og_image !== undefined) updateData.seo_og_image = seo_og_image;
    if (seo_canonical_url !== undefined) updateData.seo_canonical_url = seo_canonical_url;
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url;
    if (featured_image_alt !== undefined) updateData.featured_image_alt = featured_image_alt;

    // Lidar com mudança de status
    if (status !== undefined && status !== existingContent.status) {
      updateData.status = status;
      
      if (status === 'published') {
        updateData.published_at = published_at || new Date().toISOString();
        updateData.published_by = session.user.id;
      }
    }

    // Atualizar conteúdo
    const { data: updatedContent, error } = await supabase
      .from('cms_contents')
      .update(updateData)
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar conteúdo:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Atualizar associações de categorias
    if (categories !== undefined) {
      // Remover associações existentes
      await supabase
        .from('cms_content_categories')
        .delete()
        .eq('content_id', params.id);

      // Adicionar novas associações
      if (categories.length > 0) {
        const categoryAssociations = categories.map((categoryId: string) => ({
          content_id: params.id,
          category_id: categoryId
        }));

        await supabase
          .from('cms_content_categories')
          .insert(categoryAssociations);
      }
    }

    // Atualizar associações de tags
    if (tags !== undefined) {
      // Remover associações existentes
      await supabase
        .from('cms_content_tags')
        .delete()
        .eq('content_id', params.id);

      // Adicionar novas associações
      if (tags.length > 0) {
        const tagAssociations = tags.map((tagId: string) => ({
          content_id: params.id,
          tag_id: tagId
        }));

        await supabase
          .from('cms_content_tags')
          .insert(tagAssociations);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedContent
    });

  } catch (error) {
    console.error('Erro na API de conteúdo:', error);
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

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Verificar se o conteúdo existe e se o usuário tem permissão
    const { data: existingContent } = await supabase
      .from('cms_contents')
      .select(`
        id,
        created_by,
        cms_content_types(permission_roles)
      `)
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id)
      .single();

    if (!existingContent) {
      return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    const canDelete = existingContent.created_by === session.user.id ||
                     ['admin', 'agency_owner', 'agency_manager'].includes(profile.role) ||
                     existingContent.cms_content_types.permission_roles.includes(profile.role);

    if (!canDelete) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Soft delete - marcar como deleted
    const { error } = await supabase
      .from('cms_contents')
      .update({ 
        status: 'deleted',
        updated_by: session.user.id
      })
      .eq('id', params.id)
      .eq('agency_id', profile.agency_id);

    if (error) {
      console.error('Erro ao excluir conteúdo:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Conteúdo excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de conteúdo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}