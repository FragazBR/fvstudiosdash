import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GET - Buscar eventos do calendário
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const project_id = searchParams.get('project_id');
    const event_type = searchParams.get('event_type');
    
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        project:project_id(id, name, color),
        task:task_id(id, title, status, priority),
        creator:user_id(id, name, email)
      `)
      .eq('user_id', user.id)
      .order('start_date', { ascending: true });
      
    if (start_date && end_date) {
      query = query
        .gte('start_date', start_date)
        .lte('end_date', end_date);
    }
    
    if (project_id) {
      query = query.eq('project_id', project_id);
    }
    
    if (event_type) {
      query = query.eq('event_type', event_type);
    }
    
    const { data: events, error } = await query;
    
    if (error) {
      console.error('Error fetching calendar events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Criar novo evento
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title,
      description,
      start_date,
      end_date,
      event_type = 'meeting',
      project_id,
      task_id,
      color = '#3b82f6',
      attendees = [],
      location,
      is_all_day = false,
      recurrence_rule
    } = body;

    // Validação básica
    if (!title || !start_date) {
      return NextResponse.json({ 
        error: 'Title and start_date are required' 
      }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        title,
        description,
        user_id: user.id,
        project_id,
        task_id,
        start_date,
        end_date: end_date || start_date,
        event_type,
        color,
        attendees,
        location,
        is_all_day,
        recurrence_rule
      })
      .select(`
        *,
        project:project_id(id, name),
        task:task_id(id, title)
      `)
      .single();
      
    if (error) {
      console.error('Error creating calendar event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // Criar notificações para attendees
    if (attendees && attendees.length > 0) {
      const notifications = attendees
        .filter((attendee_id: string) => attendee_id !== user.id)
        .map((attendee_id: string) => ({
          user_id: attendee_id,
          title: `Novo evento: ${title}`,
          message: `Você foi convidado para um evento em ${new Date(start_date).toLocaleDateString('pt-BR')}.`,
          type: 'info',
          category: 'calendar',
          related_id: event.id,
          related_type: 'calendar_event'
        }));

      if (notifications.length > 0) {
        await supabase
          .from('notifications')
          .insert(notifications);
      }
    }
    
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Calendar POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}