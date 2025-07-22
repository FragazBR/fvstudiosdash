import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Listar interações do contato
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query = supabase
      .from('contact_interactions')
      .select(`
        *,
        creator:created_by(id, name, email, avatar_url)
      `)
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data: interactions, error } = await query;
    
    if (error) {
      console.error('Error fetching interactions:', error);
      return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
    }
    
    return NextResponse.json({ interactions });
  } catch (error) {
    console.error('Interactions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Criar nova interação
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
      type,
      date,
      notes,
      outcome,
      next_action,
      next_action_date,
      attachments = []
    } = body;

    // Validação básica
    if (!type || !notes) {
      return NextResponse.json({ 
        error: 'Type and notes are required' 
      }, { status: 400 });
    }

    const { data: interaction, error } = await supabase
      .from('contact_interactions')
      .insert({
        contact_id: id,
        type,
        date: date || new Date().toISOString(),
        notes,
        outcome,
        next_action,
        next_action_date,
        attachments,
        created_by: user.id
      })
      .select(`
        *,
        creator:created_by(id, name)
      `)
      .single();
      
    if (error) {
      console.error('Error creating interaction:', error);
      return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 });
    }

    // Atualizar última interação no contato
    await supabase
      .from('contacts')
      .update({ 
        last_interaction: new Date().toISOString(),
        last_interaction_type: type
      })
      .eq('id', id);

    // Criar evento no calendário se há next_action_date
    if (next_action_date && next_action) {
      // Buscar dados do contato para o título do evento
      const { data: contact } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', id)
        .single();

      await supabase
        .from('calendar_events')
        .insert({
          title: `📞 ${next_action} - ${contact?.name}`,
          description: `Ação de follow-up: ${next_action}`,
          user_id: user.id,
          start_date: next_action_date,
          end_date: next_action_date,
          event_type: 'follow_up',
          color: '#10b981'
        });
    }
    
    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    console.error('Interactions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}