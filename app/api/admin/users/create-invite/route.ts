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
    const { 
      email, 
      name, 
      role, 
      agency_id, 
      company, 
      phone, 
      welcome_message,
      create_new_agency,
      new_agency_name 
    } = body

    // Validações básicas
    if (!email || !name || !role) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: email, name, role' 
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

    // Verificar se já existe convite pendente
    const { data: existingInvite } = await supabase
      .from('user_invitations')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingInvite) {
      return NextResponse.json({ 
        error: 'Já existe um convite pendente para este email' 
      }, { status: 409 })
    }

    let finalAgencyId = agency_id

    // Criar nova agência se necessário
    if (create_new_agency && new_agency_name) {
      const { data: newAgency, error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name: new_agency_name,
          email: email, // Email do futuro dono da agência
          phone: phone || null,
          status: 'active',
          created_by: user.id
        })
        .select()
        .single()

      if (agencyError) {
        console.error('Erro ao criar agência:', agencyError)
        return NextResponse.json({ 
          error: 'Erro ao criar agência: ' + agencyError.message 
        }, { status: 500 })
      }

      finalAgencyId = newAgency.id
    }

    // Criar convite
    const { data: invitation, error: inviteError } = await supabase
      .from('user_invitations')
      .insert({
        email,
        name,
        role,
        agency_id: finalAgencyId,
        company: company || null,
        phone: phone || null,
        welcome_message: welcome_message || null,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Erro ao criar convite:', inviteError)
      return NextResponse.json({ 
        error: 'Erro ao criar convite: ' + inviteError.message 
      }, { status: 500 })
    }

    // Gerar URL do convite
    const invitationUrl = `${request.nextUrl.origin}/accept-invite?token=${invitation.id}`

    // Log da ação
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_user_id: user.id,
        action: 'create_invitation',
        target_email: email,
        details: {
          name,
          role,
          agency_id: finalAgencyId,
          company,
          phone,
          invitation_id: invitation.id,
          created_new_agency: create_new_agency,
          new_agency_name: create_new_agency ? new_agency_name : null
        },
        ip_address: getClientIP(request)
      })

    return NextResponse.json({
      success: true,
      invitation_id: invitation.id,
      invitation_url: invitationUrl,
      expires_at: invitation.expires_at,
      message: create_new_agency 
        ? `Convite criado e agência "${new_agency_name}" criada com sucesso!`
        : 'Convite criado com sucesso!'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar convite:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
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