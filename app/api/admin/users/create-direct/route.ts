import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

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

    // Verificar se é o admin principal por email OU tem permissões admin
    const isMainAdmin = user.email === 'franco@fvstudios.com.br'
    
    if (!isMainAdmin) {
      const { data: permissions } = await supabase
        .from('user_agency_permissions')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!permissions || !['admin', 'agency_owner'].includes(permissions.role)) {
        return NextResponse.json({ 
          error: 'Acesso negado. Apenas o admin principal ou usuários com permissões admin podem criar usuários.',
          debug: {
            email: user.email,
            isMainAdmin,
            permissions: permissions?.role || 'none'
          }
        }, { status: 403 })
      }
    }

    console.log('📝 Parseando dados do body...')
    const body = await request.json()
    console.log('✅ Body parseado com sucesso:', { 
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

    // Verificar se email já existe
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email)
    if (existingUser?.user) {
      return NextResponse.json({ 
        error: 'Usuário já existe no sistema' 
      }, { status: 409 })
    }

    let finalAgencyId = agency_id

    // Criar nova agência se necessário
    if (create_new_agency && new_agency_name) {
      console.log('🏢 Tentando criar nova agência:', new_agency_name)
      
      try {
        const { data: newAgency, error: agencyError } = await supabase
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

    // Criar usuário no Supabase Auth
    console.log('👤 Criando usuário no Supabase Auth:', { email, name, role })
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        name,
        role,
        company: company || null,
        phone: phone || null,
        created_by_admin: true,
        created_by: user.id
      }
    })

    if (createError) {
      console.error('❌ Erro ao criar usuário no Auth:', {
        error: createError,
        message: createError.message,
        email: email
      })
      return NextResponse.json({ 
        error: 'Erro ao criar usuário no sistema de autenticação: ' + createError.message,
        details: createError
      }, { status: 500 })
    }

    if (!newUser.user) {
      console.error('❌ Usuário não foi criado - resposta vazia do Auth')
      return NextResponse.json({ 
        error: 'Falha ao criar usuário - resposta vazia do sistema de autenticação' 
      }, { status: 500 })
    }

    console.log('✅ Usuário criado no Auth:', newUser.user.id)

    // Criar permissões do usuário se não for admin global
    if (role !== 'admin' && finalAgencyId) {
      const { error: permError } = await supabase
        .from('user_agency_permissions')
        .insert({
          user_id: newUser.user.id,
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
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: newUser.user.id,
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
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_user_id: user.id,
        action: 'create_user_directly',
        target_user_id: newUser.user.id,
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
        id: newUser.user.id,
        email: newUser.user.email,
        name,
        role,
        created_at: newUser.user.created_at
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