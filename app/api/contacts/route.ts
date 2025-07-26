import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GET - Listar contatos
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Buscar perfil do usuário para pegar agency_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('contacts')
      .select(`
        *,
        projects:projects(id, name, status, budget_total)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filtrar por contexto do usuário
    if (profile?.agency_id) {
      query = query.eq('agency_id', profile.agency_id);
    } else {
      query = query.eq('created_by', user.id);
    }
      
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: contacts, error } = await query;
    
    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }
    
    // Process contacts to add calculated fields
    const processedContacts = (contacts || []).map(contact => ({
      ...contact,
      active_projects: contact.projects?.filter((p: any) => p.status === 'active' || p.status === 'in_progress').length || 0,
      total_project_value: contact.projects?.reduce((sum: number, p: any) => sum + (p.budget_total || 0), 0) || 0,
      last_interaction: contact.updated_at // Usar updated_at como última interação por enquanto
    }));
    
    return NextResponse.json({ contacts: processedContacts });
  } catch (error) {
    console.error('Contacts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Criar novo contato
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
      email,
      phone,
      company,
      position,
      type = 'lead',
      status = 'active',
      source,
      tags = [],
      notes,
      address,
      website,
      social_media = {},
      custom_fields = {}
    } = body;

    // Validação básica
    if (!name || !email) {
      return NextResponse.json({ 
        error: 'Name and email are required' 
      }, { status: 400 });
    }

    // Verificar se email já existe
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .single();

    if (existingContact) {
      return NextResponse.json({ 
        error: 'Contact with this email already exists' 
      }, { status: 409 });
    }

    // Buscar agency_id do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
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
        custom_fields,
        agency_id: profile?.agency_id,
        created_by: user.id
      })
      .select(`
        *,
        creator:created_by(id, name)
      `)
      .single();
      
    if (error) {
      console.error('Error creating contact:', error);
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
    }

    // Criar interação inicial automática
    await supabase
      .from('contact_interactions')
      .insert({
        contact_id: contact.id,
        type: 'note',
        notes: `Contato criado no sistema. Fonte: ${source || 'Manual'}`,
        outcome: 'completed',
        created_by: user.id
      });
    
    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('Contacts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}