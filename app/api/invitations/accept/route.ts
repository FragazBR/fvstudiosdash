import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ 
        error: 'Token e senha são obrigatórios' 
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Senha deve ter pelo menos 6 caracteres' 
      }, { status: 400 })
    }

    const supabase = await supabaseServer()

    // Buscar convite
    const { data: invitation, error: inviteError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('id', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 })
    }

    // Verificar se o convite ainda é válido
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Convite já foi utilizado' }, { status: 400 })
    }

    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: 'Convite expirado' }, { status: 400 })
    }

    // Verificar se já existe usuário com este email
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const existingUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    })

    if (existingUserResponse.ok) {
      const existingUsers = await existingUserResponse.json()
      const userExists = existingUsers.users?.some((user: any) => 
        user.email === invitation.email.toLowerCase()
      )

      if (userExists) {
        return NextResponse.json({ 
          error: 'Já existe um usuário com este email' 
        }, { status: 409 })
      }
    }

    // 1. Criar usuário no Supabase Auth
    console.log('🔐 Criando usuário no Supabase Auth...')

    const userPayload = {
      email: invitation.email.toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        name: invitation.name,
        role: invitation.role,
        created_from: 'invitation'
      }
    }

    const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userPayload)
    })

    const responseData = await createUserResponse.json()

    if (!createUserResponse.ok) {
      console.error('❌ Erro ao criar usuário via API:', responseData)
      return NextResponse.json({ 
        error: 'Erro ao criar usuário: ' + (responseData.error_description || responseData.message || 'Erro desconhecido')
      }, { status: 500 })
    }

    const newUser = responseData
    console.log('✅ Usuário criado via API:', newUser.id)

    try {
      // 2. Criar perfil do usuário
      console.log('📝 Criando perfil do usuário...')

      const profileData = {
        id: newUser.id,
        email: invitation.email.toLowerCase(),
        name: invitation.name,
        role: invitation.role,
        agency_id: invitation.agency_id,
        company: invitation.company || null,
        phone: invitation.phone || null
      }

      // Definir permissões baseadas no role
      if (invitation.role === 'agency_client') {
        profileData.can_manage_team = false
        profileData.can_assign_tasks = false
        profileData.can_view_team_metrics = false
      } else if (['agency_owner', 'agency_manager'].includes(invitation.role)) {
        profileData.can_manage_team = true
        profileData.can_assign_tasks = true
        profileData.can_view_team_metrics = true
      } else {
        profileData.can_manage_team = false
        profileData.can_assign_tasks = true
        profileData.can_view_team_metrics = true
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileData)

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError)
        // Tentar limpar usuário criado
        await fetch(`${supabaseUrl}/auth/v1/admin/users/${newUser.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        })
        throw new Error('Erro ao criar perfil do usuário')
      }

      // 3. Se for cliente, atualizar registro na tabela clients
      if (invitation.role === 'agency_client' && invitation.client_id) {
        await supabase
          .from('clients')
          .update({ 
            status: 'active' // Ativar cliente quando aceitar convite
          })
          .eq('id', invitation.client_id)
      }

      // 4. Marcar convite como aceito
      await supabase
        .from('user_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      // 5. Log da ação
      await supabase
        .from('admin_action_logs')
        .insert({
          admin_user_id: invitation.invited_by,
          action: 'invitation_accepted',
          target_user_id: newUser.id,
          target_email: invitation.email,
          details: {
            invitation_id: invitation.id,
            role: invitation.role,
            accepted_at: new Date().toISOString()
          }
        })

      return NextResponse.json({
        success: true,
        message: 'Conta criada com sucesso!',
        user: {
          id: newUser.id,
          email: newUser.email,
          role: invitation.role
        }
      })

    } catch (error) {
      // Limpar usuário criado em caso de erro
      try {
        await fetch(`${supabaseUrl}/auth/v1/admin/users/${newUser.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        })
      } catch (cleanupError) {
        console.error('Erro na limpeza:', cleanupError)
      }
      throw error
    }

  } catch (error) {
    console.error('Erro ao aceitar convite:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }, { status: 500 })
  }
}