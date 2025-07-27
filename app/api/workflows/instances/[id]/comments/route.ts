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

    // Buscar comentários da instância
    const { data: comments, error } = await supabase
      .from('workflow_comments')
      .select(`
        id,
        comment_text,
        is_internal,
        attachments,
        parent_comment_id,
        mentioned_users,
        created_at,
        updated_at,
        author_id
      `)
      .eq('workflow_instance_id', params.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar comentários:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Buscar informações dos autores
    const authorIds = comments?.map(c => c.author_id).filter(Boolean) || [];
    const { data: authors } = await supabase
      .from('user_profiles')
      .select('id, name, email, avatar_url, role')
      .in('id', authorIds);

    // Mapear comentários com dados dos autores
    const commentsWithAuthors = comments?.map(comment => ({
      ...comment,
      author: authors?.find(a => a.id === comment.author_id)
    }));

    // Organizar comentários em threads
    const rootComments = commentsWithAuthors?.filter(c => !c.parent_comment_id) || [];
    const replies = commentsWithAuthors?.filter(c => c.parent_comment_id) || [];

    const threaded = rootComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_comment_id === comment.id)
    }));

    return NextResponse.json({
      success: true,
      data: threaded
    });

  } catch (error) {
    console.error('Erro na API de comentários:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(
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

    const body = await request.json();
    const {
      comment_text,
      is_internal = false,
      attachments = [],
      parent_comment_id,
      mentioned_users = []
    } = body;

    // Validações básicas
    if (!comment_text || comment_text.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Texto do comentário é obrigatório' 
      }, { status: 400 });
    }

    // Verificar se instância existe e se usuário tem acesso
    const { data: instance } = await supabase
      .from('workflow_instances')
      .select('id, agency_id, created_by, assigned_users, current_approvers')
      .eq('id', params.id)
      .single();

    if (!instance) {
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 });
    }

    if (instance.agency_id !== profile.agency_id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Verificar se usuário pode comentar
    const canComment = 
      instance.created_by === session.user.id ||
      instance.assigned_users.includes(session.user.id) ||
      instance.current_approvers.includes(session.user.id) ||
      ['admin', 'agency_owner', 'agency_manager'].includes(profile.role);

    if (!canComment) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para comentar nesta instância' 
      }, { status: 403 });
    }

    // Criar comentário
    const { data: comment, error } = await supabase
      .from('workflow_comments')
      .insert({
        workflow_instance_id: params.id,
        author_id: session.user.id,
        comment_text,
        is_internal,
        attachments,
        parent_comment_id,
        mentioned_users
      })
      .select(`
        id,
        comment_text,
        is_internal,
        attachments,
        parent_comment_id,
        mentioned_users,
        created_at,
        author_id
      `)
      .single();

    if (error) {
      console.error('Erro ao criar comentário:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Buscar dados do autor
    const { data: author } = await supabase
      .from('user_profiles')
      .select('id, name, email, avatar_url, role')
      .eq('id', session.user.id)
      .single();

    // Registrar atividade no histórico
    await supabase
      .from('workflow_history')
      .insert({
        workflow_instance_id: params.id,
        action_type: 'comment_added',
        action_description: is_internal ? 'Comentário interno adicionado' : 'Comentário adicionado',
        performed_by: session.user.id,
        action_data: {
          comment_id: comment.id,
          is_internal,
          has_attachments: attachments.length > 0,
          mentioned_users_count: mentioned_users.length
        }
      });

    return NextResponse.json({
      success: true,
      data: {
        ...comment,
        author
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na API de comentários:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}