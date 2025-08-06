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

    // Buscar perfil do usuário para filtro de agência
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.agency_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    // Buscar client básico primeiro (SCHEMA PADRONIZADO WORKSTATION)
    const { data: contact, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('agency_id', userProfile.agency_id)
      .single();
      
    if (error) {
      console.error('Error fetching contact:', error);
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Buscar dados relacionados opcionalmente (SCHEMA PADRONIZADO)
    const { data: creator } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
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

    // Buscar perfil do usuário para filtro de agência
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.agency_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    // Buscar dados atuais do client (SCHEMA PADRONIZADO)
    const { data: currentContact } = await supabase
      .from('clients')
      .select('status, type')
      .eq('id', id)
      .eq('agency_id', userProfile.agency_id)
      .single();

    const { data: contact, error } = await supabase
      .from('clients')
      .update({
        contact_name: name, // USAR CONTACT_NAME PADRONIZADO
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
      .eq('agency_id', userProfile.agency_id)
      .select(`
        *,
        creator:created_by(id, full_name)
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

    // Buscar perfil do usuário para filtro de agência  
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.agency_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('agency_id', userProfile.agency_id);
      
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