import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  console.log('🚀 API create-direct iniciada')
  
  try {
    console.log('📡 Criando cliente Supabase...')
    const supabase = await supabaseServer()
    
    console.log('🔐 Verificando autenticação...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Erro de autenticação: ' + authError.message }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found in auth')
      return NextResponse.json({ error: 'Usuário não encontrado. Faça login primeiro.' }, { status: 401 })
    }

    // Verificar se é o admin principal por email OU tem permissões admin OU pode gerenciar equipe
    const isMainAdmin = user.email === 'franco@fvstudios.com.br'
    
    if (!isMainAdmin) {
      // Verificar permissões de agência
      const { data: agencyPermissions } = await supabase
        .from('user_agency_permissions')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      // Verificar permissões de perfil (can_manage_team)
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
          error: 'Acesso negado. Entre em contato com o administrador para configurar suas permissões de gerenciamento de equipe.',
          suggestion: 'Chame o endpoint POST /api/admin/setup-permissions para configurar automaticamente as permissões.',
          debug: {
            email: user.email,
            profileRole: profile?.role || 'no-profile',
            canManageTeam: profile?.can_manage_team || false,
            needsPermissionUpdate: true
          }
        }, { status: 403 })
      }
    }

    console.log('📝 Parseando dados do body...')
    const body = await request.json()
    console.log('✅ Body completo recebido:', JSON.stringify(body, null, 2))
    console.log('🔍 Role específico recebido:', { 
      role: body.role,
      typeof_role: typeof body.role,
      role_length: body.role?.length,
      email: body.email, 
      name: body.name, 
      role: body.role,
      create_new_agency: body.create_new_agency 
    })
    
    const { 
      email, 
      password, 
      name, 
      role, 
      agency_id, 
      company, 
      phone, 
      send_welcome_email,
      create_new_agency,
      new_agency_name,
      plan_id
    } = body

    // Validações básicas
    if (!email || !password || !name || !role) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: email, password, name, role' 
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Senha deve ter pelo menos 6 caracteres' 
      }, { status: 400 })
    }

    // Validar se precisa criar nova agência
    if (create_new_agency && !new_agency_name) {
      return NextResponse.json({ 
        error: 'Nome da nova agência é obrigatório' 
      }, { status: 400 })
    }

    if (role !== 'admin' && !agency_id && !create_new_agency) {
      return NextResponse.json({ 
        error: 'É necessário selecionar uma agência ou criar uma nova' 
      }, { status: 400 })
    }

    // Pular verificação de email existente (função não disponível na biblioteca)
    console.log('ℹ️ Pulando verificação de email - será tratado na criação')
    const adminClient = supabaseAdmin()

    let finalAgencyId = agency_id

    // Criar nova agência se necessário
    if (create_new_agency && new_agency_name) {
      console.log('🏢 Tentando criar nova agência:', new_agency_name)
      
      try {
        const { data: newAgency, error: agencyError } = await adminClient
          .from('agencies')
          .insert({
            name: new_agency_name,
            email: email, // Email do dono da agência
            phone: phone || null,
            status: 'active',
            created_by: user.id
          })
          .select()
          .single()

        if (agencyError) {
          console.error('❌ Erro detalhado ao criar agência:', {
            error: agencyError,
            message: agencyError.message,
            details: agencyError.details,
            hint: agencyError.hint,
            code: agencyError.code
          })
          
          return NextResponse.json({ 
            error: 'Erro ao criar agência - verifique se a estrutura da tabela está correta',
            details: agencyError.message,
            debug_info: {
              code: agencyError.code,
              hint: agencyError.hint,
              agency_name: new_agency_name,
              suggestion: 'Execute o script fix_agencies_table_structure.sql no banco de produção'
            }
          }, { status: 500 })
        }

        console.log('✅ Agência criada com sucesso:', newAgency)
        finalAgencyId = newAgency.id
      } catch (dbError) {
        console.error('❌ Erro de banco ao criar agência:', dbError)
        return NextResponse.json({ 
          error: 'Erro de conexão com banco de dados ao criar agência',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 })
      }
    }

    // Criar usuário usando REST API diretamente
    console.log('👤 Criando usuário via REST API:', { email, name, role })
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      
      const userPayload = {
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role,
          company: company || null,
          phone: phone || null,
          created_by_admin: true,
          created_by: user.id
        }
      }
      
      console.log('📡 Enviando requisição para criar usuário...')
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
      console.log('📥 Resposta da criação:', { status: response.status, data: responseData })
      
      if (!response.ok) {
        console.error('❌ Erro ao criar usuário via API:', responseData)
        return NextResponse.json({ 
          error: 'Erro ao criar usuário: ' + (responseData.error_description || responseData.message || 'Unknown error'),
          details: responseData
        }, { status: 500 })
      }
      
      const newUser = responseData
      if (!newUser.id) {
        console.error('❌ Usuário criado mas sem ID')
        return NextResponse.json({ 
          error: 'Usuário criado mas resposta inválida' 
        }, { status: 500 })
      }

      console.log('✅ Usuário criado via API:', newUser.id)

      // Criar perfil do usuário na tabela user_profiles
      console.log('📝 Criando perfil do usuário...')
    
    // Definir permissões baseadas no role
    const getPermissionsByRole = (userRole) => {
      switch (userRole) {
        case 'admin':
          return { can_manage_team: true, can_assign_tasks: true, can_view_team_metrics: true }
        case 'agency_owner':
          return { can_manage_team: true, can_assign_tasks: true, can_view_team_metrics: true }
        case 'agency_manager':
          return { can_manage_team: true, can_assign_tasks: true, can_view_team_metrics: true }
        case 'agency_staff':
          return { can_manage_team: false, can_assign_tasks: true, can_view_team_metrics: true }
        default:
          return { can_manage_team: false, can_assign_tasks: false, can_view_team_metrics: false }
      }
    }
    
    const permissions = getPermissionsByRole(role)
    
    console.log('🔍 Debug criação de perfil:', {
      role: role,
      permissions: permissions,
      email: email
    })
    
    const profileData = {
      id: newUser.id,
      email: email,
      name: name,
      role: role,
      agency_id: finalAgencyId,
      company: company || null,
      phone: phone || null,
      ...permissions
    }
    
    console.log('📝 Dados do perfil a serem inseridos:', profileData)
    
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .insert(profileData)
      
    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError)
      // Não falhar a criação do usuário por causa do perfil, mas alertar
      console.log('⚠️ Usuário criado mas perfil pode estar incompleto')
    } else {
      console.log('✅ Perfil do usuário criado com sucesso')
    }

    // Criar permissões do usuário se não for admin global
    if (role !== 'admin' && finalAgencyId) {
      const { error: permError } = await adminClient
        .from('user_agency_permissions')
        .insert({
          user_id: newUser.id,
          agency_id: finalAgencyId,
          role: role,
          permissions: getDefaultPermissions(role),
          granted_by: user.id
        })

      if (permError) {
        console.error('Erro ao criar permissões:', permError)
        // Não falhar a criação do usuário por causa das permissões
      }
    }

    // Criar assinatura do plano se fornecido
    if (plan_id && role !== 'admin') {
      const { error: subscriptionError } = await adminClient
        .from('user_subscriptions')
        .insert({
          user_id: newUser.id,
          agency_id: finalAgencyId,
          plan_id: plan_id,
          interval_type: 'monthly',
          price_paid: 0, // Será definido pelo admin posteriormente
          status: 'active',
          starts_at: new Date().toISOString(),
          auto_renew: false // Admin criado, não renovar automaticamente
        })

      if (subscriptionError) {
        console.error('Erro ao criar assinatura:', subscriptionError)
        // Não falhar a criação do usuário por causa da assinatura
      }
    }

    // Log da ação
    await adminClient
      .from('admin_action_logs')
      .insert({
        admin_user_id: user.id,
        action: 'create_user_directly',
        target_user_id: newUser.id,
        target_email: email,
        details: {
          name,
          role,
          agency_id: finalAgencyId,
          company,
          phone,
          created_new_agency: create_new_agency,
          new_agency_name: create_new_agency ? new_agency_name : null
        },
        ip_address: getClientIP(request)
      })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name,
        role,
        created_at: newUser.created_at
      },
      message: 'Usuário criado com sucesso!'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erro crítico no endpoint de criação direta:', error)
    
    // Retornar informações detalhadas do erro para debug
    const errorInfo = {
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      timestamp: new Date().toISOString(),
      endpoint: 'create-direct',
      user_email: 'hidden for security'
    }
    
    return NextResponse.json(errorInfo, { status: 500 })
  }
}

// Função para obter permissões padrão por role
function getDefaultPermissions(role: string) {
  const defaultPermissions = {
    admin: {
      manage_users: 'true',
      manage_agencies: 'true',
      manage_payments: 'true',
      view_analytics: 'true',
      manage_settings: 'true'
    },
    agency_owner: {
      manage_users: 'true',
      manage_projects: 'true',
      manage_payments: 'true',
      view_analytics: 'true',
      manage_settings: 'true'
    },
    agency_staff: {
      manage_projects: 'true',
      view_analytics: 'true',
      manage_clients: 'true'
    },
    client: {
      view_projects: 'true',
      view_reports: 'true'
    }
  }

  return defaultPermissions[role as keyof typeof defaultPermissions] || defaultPermissions.client
}

// Função para obter IP do cliente
function getClientIP(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}