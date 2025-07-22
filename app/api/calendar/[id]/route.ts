import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Buscar evento específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: event, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        project:project_id(id, name, color, status),
        task:task_id(id, title, status, priority, progress),
        creator:user_id(id, name, email, avatar_url)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      console.error('Error fetching calendar event:', error);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    return NextResponse.json({ event });
  } catch (error) {
    console.error('Calendar event GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Atualizar evento
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      title,
      description,
      start_date,
      end_date,
      event_type,
      color,
      attendees,
      location,
      is_all_day,
      recurrence_rule
    } = body;

    // Buscar dados atuais do evento
    const { data: currentEvent } = await supabase
      .from('calendar_events')
      .select('attendees, start_date')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    const { data: event, error } = await supabase
      .from('calendar_events')
      .update({
        title,
        description,
        start_date,
        end_date,
        event_type,
        color,
        attendees,
        location,
        is_all_day,
        recurrence_rule
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        project:project_id(id, name),
        task:task_id(id, title)
      `)
      .single();
      
    if (error) {
      console.error('Error updating calendar event:', error);
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }

    // Notificar sobre mudanças de horário se data/hora mudou
    if (start_date !== currentEvent?.start_date && attendees && attendees.length > 0) {
      const notifications = attendees
        .filter((attendee_id: string) => attendee_id !== user.id)
        .map((attendee_id: string) => ({
          user_id: attendee_id,
          title: `Evento alterado: ${title}`,
          message: `O horário do evento foi alterado para ${new Date(start_date).toLocaleDateString('pt-BR')}.`,
          type: 'warning',
          category: 'calendar',
          related_id: id,
          related_type: 'calendar_event'
        }));

      if (notifications.length > 0) {
        await supabase
          .from('notifications')
          .insert(notifications);
      }
    }

    // Notificar novos attendees
    if (attendees && currentEvent?.attendees) {
      const newAttendees = attendees.filter(
        (attendee_id: string) => 
          !currentEvent.attendees.includes(attendee_id) && attendee_id !== user.id
      );

      if (newAttendees.length > 0) {
        const newNotifications = newAttendees.map((attendee_id: string) => ({
          user_id: attendee_id,
          title: `Convidado para evento: ${title}`,
          message: `Você foi adicionado a um evento em ${new Date(start_date).toLocaleDateString('pt-BR')}.`,
          type: 'info',
          category: 'calendar',
          related_id: id,
          related_type: 'calendar_event'
        }));

        await supabase
          .from('notifications')
          .insert(newNotifications);
      }
    }
    
    return NextResponse.json({ event });
  } catch (error) {
    console.error('Calendar event PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Deletar evento
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Buscar dados do evento para notificar attendees
    const { data: eventData } = await supabase
      .from('calendar_events')
      .select('title, attendees, start_date')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) {
      console.error('Error deleting calendar event:', error);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    // Notificar attendees sobre cancelamento
    if (eventData?.attendees && eventData.attendees.length > 0) {
      const notifications = eventData.attendees
        .filter((attendee_id: string) => attendee_id !== user.id)
        .map((attendee_id: string) => ({
          user_id: attendee_id,
          title: `Evento cancelado: ${eventData.title}`,
          message: `O evento agendado para ${new Date(eventData.start_date).toLocaleDateString('pt-BR')} foi cancelado.`,
          type: 'warning',
          category: 'calendar',
          related_id: id,
          related_type: 'calendar_event'
        }));

      if (notifications.length > 0) {
        await supabase
          .from('notifications')
          .insert(notifications);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar event DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}