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

    // Buscar contact básico primeiro
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching contact:', error);
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Buscar dados relacionados opcionalmente
    const { data: creator } = await supabase
      .from('user_profiles')
      .select('id, name, email')
      .eq('id', contact.created_by)
      .single();

    // Buscar projetos relacionados (se existir client_id)
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, status, created_at')
      .eq('client_id', id)
      .limit(10);

    // Montar resposta com dados disponíveis
    const contactWithRelations = {
      ...contact,
      creator: creator || null,
      projects: projects || [],
      interactions: [] // Por enquanto vazio até criar tabela contact_interactions
    };
    
    return NextResponse.json({ contact: contactWithRelations });
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

    // TODO: Criar interação automática quando implementar contact_interactions
    // const statusChanged = status !== currentContact?.status;
    // const typeChanged = type !== currentContact?.type;
    
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