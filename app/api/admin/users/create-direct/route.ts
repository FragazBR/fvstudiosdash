import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!permissions || !['admin', 'agency_owner'].includes(permissions.role)) {
      return NextResponse.json({ error: 'Sem permissão de admin' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, name, role, agency_id, company, phone, send_welcome_email } = body

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

    // Verificar se email já existe
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email)
    if (existingUser?.user) {
      return NextResponse.json({ 
        error: 'Usuário já existe no sistema' 
      }, { status: 409 })
    }

    // Criar usuário no Supabase Auth
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
      console.error('Erro ao criar usuário:', createError)
      return NextResponse.json({ 
        error: 'Erro ao criar usuário: ' + createError.message 
      }, { status: 500 })
    }

    if (!newUser.user) {
      return NextResponse.json({ 
        error: 'Falha ao criar usuário' 
      }, { status: 500 })
    }

    // Criar permissões do usuário se não for admin global
    if (role !== 'admin' && agency_id) {
      const { error: permError } = await supabase
        .from('user_agency_permissions')
        .insert({
          user_id: newUser.user.id,
          agency_id: agency_id,
          role: role,
          permissions: getDefaultPermissions(role),
          granted_by: user.id
        })

      if (permError) {
        console.error('Erro ao criar permissões:', permError)
        // Não falhar a criação do usuário por causa das permissões
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
          agency_id,
          company,
          phone
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
    console.error('Erro no endpoint de criação direta:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
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