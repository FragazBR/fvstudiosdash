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

    // SCHEMA PADRONIZADO WORKSTATION - Buscar apenas da tabela 'clients'
    let clientsQuery = supabase
      .from('clients')
      .select(`
        *,
        projects:projects(id, name, status, budget_cents)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filtrar por contexto do usuário
    if (profile?.agency_id) {
      clientsQuery = clientsQuery.eq('agency_id', profile.agency_id);
    } else {
      clientsQuery = clientsQuery.eq('created_by', user.id);
    }
      
    if (search) {
      clientsQuery = clientsQuery.or(`contact_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }
    
    if (status) {
      clientsQuery = clientsQuery.eq('status', status);
    }
    
    // Executar apenas uma query para evitar duplicatas
    const { data: clients, error: clientsError } = await clientsQuery;

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    // Converter clientes para formato de contatos
    const allContacts = (clients || []).map(client => ({
      ...client,
      type: 'client',
      source: 'client_system'
    }));
    
    // Process contacts to add calculated fields - SCHEMA WORKSTATION
    const processedContacts = allContacts.map(contact => ({
      ...contact,
      active_projects: contact.projects?.filter((p: any) => p.status === 'active' || p.status === 'in_progress').length || 0,
      total_project_value: contact.projects?.reduce((sum: number, p: any) => sum + (p.budget_cents ? p.budget_cents / 100 : 0), 0) || contact.contract_value || 0,
      last_interaction: contact.updated_at // Usar updated_at como última interação por enquanto
    }));
    
    // Ordenar por data de criação (mais recente primeiro)
    const sortedContacts = processedContacts.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return NextResponse.json({ contacts: sortedContacts });
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

// DELETE - Excluir contato ou cliente
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('id');
    
    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    // Buscar perfil do usuário para verificar permissões
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'User not associated with agency' }, { status: 400 });
    }

    // Verificar se é um cliente da tabela clients
    const { data: client } = await supabase
      .from('clients')
      .select('id, agency_id, email')
      .eq('id', contactId)
      .eq('agency_id', profile.agency_id)
      .maybeSingle();

    if (client) {
      // Excluir cliente
      const { error: deleteClientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', contactId);

      if (deleteClientError) {
        console.error('Error deleting client:', deleteClientError);
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
      }

      // Deletar o perfil do usuário se existir
      await supabase
        .from('user_profiles')
        .delete()
        .eq('email', client.email);

      // Tentar deletar da auth
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        });
        
        if (authResponse.ok) {
          const { users } = await authResponse.json();
          const authUser = users.find((u: any) => u.email === client.email);
          
          if (authUser) {
            await fetch(`${supabaseUrl}/auth/v1/admin/users/${authUser.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
              }
            });
          }
        }
      } catch (authDeleteError) {
        console.warn('Warning: Could not delete auth user:', authDeleteError);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Client deleted successfully' 
      });
    }

    // Se não é cliente, verificar se é contato
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, agency_id')
      .eq('id', contactId)
      .eq('agency_id', profile.agency_id)
      .maybeSingle();

    if (contact) {
      // Excluir contato
      const { error: deleteContactError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (deleteContactError) {
        console.error('Error deleting contact:', deleteContactError);
        return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Contact deleted successfully' 
      });
    }

    return NextResponse.json({ error: 'Contact or client not found' }, { status: 404 });
  } catch (error) {
    console.error('Contacts DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}