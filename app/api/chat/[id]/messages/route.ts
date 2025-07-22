import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Buscar mensagens da conversa
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Para paginação
    
    // Verificar se usuário é participante da conversa
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('participants')
      .eq('id', id)
      .contains('participants', [user.id])
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    let query = supabase
      .from('chat_messages')
      .select(`
        *,
        sender:sender_id(id, name, email, avatar_url)
      `)
      .eq('conversation_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (before) {
      query = query.lt('created_at', before);
    }
    
    const { data: messages, error } = await query;
    
    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
    
    // Reverter ordem para exibir cronologicamente
    const orderedMessages = messages.reverse();
    
    return NextResponse.json({ messages: orderedMessages });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Enviar nova mensagem
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      content,
      message_type = 'text',
      attachments = [],
      reply_to
    } = body;

    // Validação básica
    if (!content && attachments.length === 0) {
      return NextResponse.json({ 
        error: 'Content or attachments are required' 
      }, { status: 400 });
    }

    // Verificar se usuário é participante da conversa
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('participants, name')
      .eq('id', id)
      .contains('participants', [user.id])
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: id,
        sender_id: user.id,
        content,
        message_type,
        attachments,
        reply_to
      })
      .select(`
        *,
        sender:sender_id(id, name, email, avatar_url)
      `)
      .single();
      
    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Atualizar timestamp da conversa
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    // Criar notificações para outros participantes
    const otherParticipants = conversation.participants.filter((p: string) => p !== user.id);
    if (otherParticipants.length > 0) {
      const { data: senderProfile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const notifications = otherParticipants.map((participant_id: string) => ({
        user_id: participant_id,
        title: `Nova mensagem em ${conversation.name}`,
        message: `${senderProfile?.name || 'Alguém'}: ${content?.substring(0, 50)}${content?.length > 50 ? '...' : ''}`,
        type: 'info',
        category: 'chat',
        related_id: id,
        related_type: 'chat_conversation',
        action_url: `/chat/${id}`
      }));

      await supabase
        .from('notifications')
        .insert(notifications);
    }
    
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}