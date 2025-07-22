import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Buscar contato específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: contact, error } = await supabase
      .from('contacts')
      .select(`
        *,
        creator:created_by(id, name, email),
        projects:projects(id, name, status, created_at, budget_total),
        interactions:contact_interactions(
          id, type, date, notes, outcome, next_action, 
          created_at, created_by(id, name)
        )
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching contact:', error);
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Contact GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Atualizar contato
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name,
      email,
      phone,
      company,
      position,
      type,
      status,
      source,
      tags,
      notes,
      address,
      website,
      social_media,
      custom_fields
    } = body;

    // Buscar dados atuais do contato
    const { data: currentContact } = await supabase
      .from('contacts')
      .select('status, type')
      .eq('id', id)
      .single();

    const { data: contact, error } = await supabase
      .from('contacts')
      .update({
        name,
        email,
        phone,
        company,
        position,
        type,
        status,
        source,
        tags,
        notes,
        address,
        website,
        social_media,
        custom_fields
      })
      .eq('id', id)
      .select(`
        *,
        creator:created_by(id, name)
      `)
      .single();
      
    if (error) {
      console.error('Error updating contact:', error);
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }

    // Criar interação automática se status ou tipo mudou
    const statusChanged = status !== currentContact?.status;
    const typeChanged = type !== currentContact?.type;
    
    if (statusChanged || typeChanged) {
      let notes = 'Contato atualizado: ';
      if (statusChanged) notes += `Status: ${currentContact?.status} → ${status}. `;
      if (typeChanged) notes += `Tipo: ${currentContact?.type} → ${type}.`;

      await supabase
        .from('contact_interactions')
        .insert({
          contact_id: id,
          type: 'note',
          notes,
          outcome: 'completed',
          created_by: user.id
        });
    }
    
    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Contact PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Deletar contato
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se contato tem projetos ativos
    const { data: activeProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', id)
      .in('status', ['active', 'on_hold']);

    if (activeProjects && activeProjects.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete contact with active projects' 
      }, { status: 409 });
    }

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting contact:', error);
      return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}