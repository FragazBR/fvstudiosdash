import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  console.log('🚀 API create-direct-client iniciada')
  
  try {
    const supabase = await supabaseServer()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Erro de autenticação:', authError)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    

    // Buscar perfil do usuário para verificar permissões e agency_id
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('❌ Erro ao buscar perfil:', profileError)
      console.log('Profile encontrado:', !!profile)
      return NextResponse.json({ 
        error: 'Perfil de usuário não encontrado' 
      }, { status: 400 })
    }
    

    // Verificar permissões simplificadas (sem can_manage_team que não existe)
    const canCreateClients = [
      'admin', 
      'agency_owner', 
      'agency_manager', 
      'agency_staff'
    ].includes(profile.role)

    
    if (!canCreateClients) {
      console.log('❌ Permissão negada para role:', profile.role)
      return NextResponse.json({ 
        error: 'Você não tem permissão para criar clientes' 
      }, { status: 403 })
    }

    if (!profile.agency_id) {
      console.log('❌ Agency_id não encontrado')
      return NextResponse.json({ 
        error: 'Usuário deve estar vinculado a uma agência' 
      }, { status: 400 })
    }
    

    const body = await request.json()
    
    const { 
      email, 
      password, 
      name, 
      company, 
      phone, 
      position, 
      website, 
      address, 
      notes,
      // Campos financeiros
      contract_value,
      contract_duration,
      contract_start_date,
      payment_frequency,
      contract_currency
    } = body


    // Validações básicas
    
    if (!email || !password || !name) {
      console.log('❌ Campos obrigatórios faltando')
      return NextResponse.json({ 
        error: 'Campos obrigatórios: email, password, name' 
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Senha deve ter pelo menos 6 caracteres' 
      }, { status: 400 })
    }

    // Usar o profile já carregado para agency_id

    // 1. Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('user_profiles') 
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ 
        error: `Email ${email} já está cadastrado no sistema` 
      }, { status: 400 })
    }

    // 2. Criar usuário no Supabase Auth
    console.log('🔐 Criando usuário no Supabase Auth...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const userPayload = {
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: 'agency_client',
        created_by: 'admin'
      }
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userPayload)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ Erro ao criar usuário via API:', responseData)
      return NextResponse.json({ 
        error: 'Erro ao criar usuário: ' + (responseData.error_description || responseData.message || 'Unknown error'),
        details: responseData
      }, { status: 500 })
    }
    
    const newUser = responseData
    console.log('✅ Usuário criado via API:', newUser.id)

    // 3. Criar perfil do usuário (ou atualizar se já existir)
    console.log('📝 Criando/atualizando perfil do usuário...')
    console.log('🏢 Agency ID será:', profile.agency_id)
    
    const { error: profileInsertError } = await supabase
      .from('user_profiles')
      .upsert({
        id: newUser.id,
        email: email.toLowerCase(),
        name: name,
        role: 'agency_client',
        agency_id: profile.agency_id, // Sempre usar a agency do usuário logado
        // Permissões serão definidas pelo role
      })
      
    if (profileInsertError) {
      console.error('❌ Erro ao criar perfil:', profileInsertError)
      // Tentar deletar o usuário criado no auth se falhar
      try {
        await fetch(`${supabaseUrl}/auth/v1/admin/users/${newUser.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        })
      } catch (cleanupError) {
        console.error('Erro na limpeza do usuário:', cleanupError)
      }
      
      return NextResponse.json({ 
        error: 'Erro ao criar perfil do cliente' 
      }, { status: 500 })
    }

    // 4. Criar registro na tabela clients
    console.log('🏢 Criando registro de cliente...')
    
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        id: newUser.id, // Usar o mesmo ID do usuário
        agency_id: profile.agency_id,
        created_by: user.id,
        name: name,
        email: email.toLowerCase(),
        phone: phone || null,
        company: company || null,
        website: website || null,
        address: address || null,
        notes: notes || null,
        status: 'active',
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

    // 5. Log da ação
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_user_id: user.id,
        action: 'create_client_with_account',
        target_user_id: newUser.id,
        target_email: email,
        details: {
          name,
          company,
          phone,
          has_login_access: true,
          creation_mode: 'direct'
        }
      })

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        has_login: true,
        created_at: client.created_at
      },
      message: 'Cliente criado com sucesso! Login disponível imediatamente.'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erro crítico no endpoint de criação de cliente:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}