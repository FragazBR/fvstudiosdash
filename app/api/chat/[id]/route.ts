import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Buscar conversa específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        project:project_id(id, name, status),
        participants:participants(id, name, email, avatar_url),
        creator:created_by(id, name)
      `)
      .eq('id', id)
      .contains('participants', [user.id])
      .single();
      
    if (error) {
      console.error('Error fetching conversation:', error);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Conversation GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Atualizar conversa
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, participants } = body;

    // Verificar se usuário é participante da conversa
    const { data: currentConversation } = await supabase
      .from('chat_conversations')
      .select('participants, name')
      .eq('id', id)
      .contains('participants', [user.id])
      .single();

    if (!currentConversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (participants) updates.participants = participants;

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        project:project_id(id, name),
        participants:participants(id, name, email)
      `)
      .single();
      
    if (error) {
      console.error('Error updating conversation:', error);
      return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }

    // Notificar sobre mudanças se participantes foram alterados
    if (participants && participants !== currentConversation.participants) {
      const newParticipants = participants.filter(
        (p: string) => !currentConversation.participants.includes(p)
      );
      
      if (newParticipants.length > 0) {
        const notifications = newParticipants.map((participant_id: string) => ({
          user_id: participant_id,
          title: `Adicionado à conversa: ${conversation.name}`,
          message: `Você foi adicionado a uma conversa existente.`,
          type: 'info',
          category: 'chat',
          related_id: id,
          related_type: 'chat_conversation'
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }
    }
    
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Conversation PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Deletar conversa
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se usuário é o criador da conversa
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('created_by, participants')
      .eq('id', id)
      .single();

    if (!conversation || conversation.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this conversation' }, { status: 403 });
    }

    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting conversation:', error);
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Conversation DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}