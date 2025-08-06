import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  console.log('🚀 API create-invite-client iniciada')
  
  try {
    const supabase = await supabaseServer()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissões (mesmo que create-direct)
    const isMainAdmin = user.email === 'franco@fvstudios.com.br'
    
    if (!isMainAdmin) {
      const { data: agencyPermissions } = await supabase
        .from('user_agency_permissions')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('can_manage_team, role, agency_id')
        .eq('id', user.id)
        .maybeSingle()

      const hasAgencyPermissions = agencyPermissions && ['admin', 'agency_owner'].includes(agencyPermissions.role)
      const canManageTeam = profile?.can_manage_team === true
      const isAgencyManager = profile && ['agency_owner', 'agency_manager'].includes(profile.role)

      if (!hasAgencyPermissions && !canManageTeam && !isAgencyManager) {
        return NextResponse.json({ 
          error: 'Acesso negado. Você precisa ter permissões para criar clientes.' 
        }, { status: 403 })
      }
    }

    const body = await request.json()
    const { 
      email, 
      name, 
      company, 
      phone, 
      position, 
      website, 
      address, 
      notes,
      welcome_message,
      // Campos financeiros
      contract_value,
      contract_duration,
      contract_start_date,
      payment_frequency,
      contract_currency
    } = body

    // Validações básicas
    if (!email || !name) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: email, name' 
      }, { status: 400 })
    }

    // Verificar se email já existe
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email)
    if (existingUser?.user) {
      return NextResponse.json({ 
        error: 'Já existe um usuário com este email' 
      }, { status: 409 })
    }

    // Buscar informações do usuário atual (para agency_id)
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('agency_id, name')
      .eq('id', user.id)
      .single()

    if (!currentProfile?.agency_id) {
      return NextResponse.json({ 
        error: 'Usuário deve estar vinculado a uma agência para criar clientes' 
      }, { status: 400 })
    }

    // Verificar se já existe convite pendente
    const { data: existingInvite } = await supabase
      .from('user_invitations')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingInvite) {
      return NextResponse.json({ 
        error: 'Já existe um convite pendente para este email' 
      }, { status: 409 })
    }

    // 1. Criar registro de cliente primeiro
    console.log('🏢 Criando registro de cliente...')
    
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        agency_id: currentProfile.agency_id,
        created_by: user.id,
        name: name,
        email: email.toLowerCase(),
        phone: phone || null,
        company: company || null,
        website: website || null,
        address: address || null,
        notes: notes || null,
        status: 'pending', // Status pendente até aceitar convite
        // Campos financeiros
        contract_value: contract_value ? parseFloat(contract_value) : null,
        contract_duration: contract_duration ? parseInt(contract_duration) : null,
        contract_start_date: contract_start_date || null,
        payment_frequency: payment_frequency || 'monthly',
        contract_currency: contract_currency || 'BRL'
      })
      .select()
      .single()

    if (clientError) {
      console.error('❌ Erro ao criar cliente:', clientError)
      return NextResponse.json({ 
        error: 'Erro ao criar registro de cliente: ' + clientError.message 
      }, { status: 500 })
    }

    // 2. Criar convite
    console.log('✉️ Criando convite...')
    
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expira em 7 dias

    const { data: invitation, error: inviteError } = await supabase
      .from('user_invitations')
      .insert({
        email: email.toLowerCase(),
        name: name,
        role: 'agency_client',
        agency_id: currentProfile.agency_id,
        company: company || null,
        phone: phone || null,
        welcome_message: welcome_message || `Olá ${name}! Você foi convidado para acessar o portal do cliente da nossa agência.`,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        client_id: client.id // Vincular ao cliente criado
      })
      .select()
      .single()

    if (inviteError) {
      console.error('❌ Erro ao criar convite:', inviteError)
      
      // Limpar cliente criado se convite falhar
      await supabase
        .from('clients')
        .delete()
        .eq('id', client.id)
      
      return NextResponse.json({ 
        error: 'Erro ao criar convite: ' + inviteError.message 
      }, { status: 500 })
    }

    // 3. Log da ação
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_user_id: user.id,
        action: 'create_client_invitation',
        target_email: email,
        details: {
          name,
          company,
          phone,
          has_login_access: true,
          creation_mode: 'invitation',
          invitation_id: invitation.id,
          client_id: client.id,
          expires_at: expiresAt.toISOString()
        }
      })

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        status: 'pending',
        has_login: true,
        created_at: client.created_at
      },
      invitation: {
        id: invitation.id,
        expires_at: invitation.expires_at
      },
      message: 'Convite enviado com sucesso! O cliente receberá um email para criar sua conta.'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erro crítico no endpoint de convite de cliente:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}