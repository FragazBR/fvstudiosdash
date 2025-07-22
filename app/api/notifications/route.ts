import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GET - Buscar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (unreadOnly) {
      query = query.eq('read', false);
    }
    
    const { data: notifications, error } = await query;
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
    
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      user_id, 
      title, 
      message, 
      type = 'info', 
      category = 'general',
      related_id,
      related_type,
      action_url 
    } = body;

    // Validação básica
    if (!user_id || !title) {
      return NextResponse.json({ 
        error: 'user_id and title are required' 
      }, { status: 400 });
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        category,
        related_id,
        related_type,
        action_url
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
    
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Marcar notificação como lida
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, mark_all = false } = body;

    let query = supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id);
      
    if (!mark_all && notification_ids && notification_ids.length > 0) {
      query = query.in('id', notification_ids);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error updating notifications:', error);
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}