import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GET - Listar conversas do usuário
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query = supabase
      .from('chat_conversations')
      .select(`
        *,
        project:project_id(id, name, status),
        participants:participants(id, name, email, avatar_url),
        last_message:chat_messages(
          id, content, created_at, sender:sender_id(id, name)
        )
      `)
      .contains('participants', [user.id])
      .order('updated_at', { ascending: false })
      .limit(limit);
      
    if (project_id) {
      query = query.eq('project_id', project_id);
    }
    
    const { data: conversations, error } = await query;
    
    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
    
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Criar nova conversa
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
      project_id,
      participants = [],
      is_group = false
    } = body;

    // Validação básica
    if (!name || participants.length === 0) {
      return NextResponse.json({ 
        error: 'Name and participants are required' 
      }, { status: 400 });
    }

    // Adicionar o usuário atual aos participantes se não estiver
    const allParticipants = participants.includes(user.id) 
      ? participants 
      : [...participants, user.id];

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert({
        name,
        project_id,
        participants: allParticipants,
        is_group,
        created_by: user.id
      })
      .select(`
        *,
        project:project_id(id, name),
        participants:participants(id, name, email)
      `)
      .single();
      
    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Criar notificações para outros participantes
    const otherParticipants = allParticipants.filter((p: string) => p !== user.id);
    if (otherParticipants.length > 0) {
      const notifications = otherParticipants.map((participant_id: string) => ({
        user_id: participant_id,
        title: `Nova conversa: ${name}`,
        message: `Você foi adicionado a uma nova conversa.`,
        type: 'info',
        category: 'chat',
        related_id: conversation.id,
        related_type: 'chat_conversation'
      }));

      await supabase
        .from('notifications')
        .insert(notifications);
    }
    
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}