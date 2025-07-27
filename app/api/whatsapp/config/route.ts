import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Buscar configuração WhatsApp da agência
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Verificar se tem permissão (apenas roles de agência)
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager', 'agency_staff']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para acessar configurações' }, { status: 403 })
    }

    // Buscar configuração da agência
    const { data: config, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar configuração:', error)
      return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      config: config || null
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Criar nova configuração WhatsApp
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Verificar permissões
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para criar configurações' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      api_key, 
      phone_number, 
      business_name, 
      webhook_url,
      notifications_enabled = true,
      auto_responses_enabled = true,
      business_hours_only = false
    } = body

    // Validações
    if (!api_key || !phone_number || !business_name) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: api_key, phone_number, business_name' 
      }, { status: 400 })
    }

    // Verificar se já existe configuração para esta agência
    const { data: existingConfig } = await supabase
      .from('whatsapp_config')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .single()

    if (existingConfig) {
      return NextResponse.json({ 
        error: 'Configuração já existe. Use PUT para atualizar.' 
      }, { status: 400 })
    }

    // Criar configuração
    const { data: config, error } = await supabase
      .from('whatsapp_config')
      .insert({
        agency_id: profile.agency_id,
        api_key, // Em produção, criptografar esta chave
        phone_number,
        business_name,
        webhook_url: webhook_url || '',
        notifications_enabled,
        auto_responses_enabled,
        business_hours_only,
        is_active: true,
        webhook_verified: false,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar configuração:', error)
      return NextResponse.json({ error: 'Erro ao criar configuração' }, { status: 500 })
    }

    // Não retornar a API key na resposta
    const { api_key: _, ...configWithoutKey } = config

    return NextResponse.json({
      success: true,
      message: 'Configuração criada com sucesso',
      config: configWithoutKey
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Atualizar configuração existente
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Verificar permissões
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para atualizar configurações' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      api_key, 
      phone_number, 
      business_name, 
      webhook_url,
      notifications_enabled,
      auto_responses_enabled,
      business_hours_only,
      is_active
    } = body

    // Verificar se existe configuração
    const { data: existingConfig } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .single()

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (api_key !== undefined && api_key !== '') updateData.api_key = api_key
    if (phone_number !== undefined) updateData.phone_number = phone_number
    if (business_name !== undefined) updateData.business_name = business_name
    if (webhook_url !== undefined) updateData.webhook_url = webhook_url
    if (notifications_enabled !== undefined) updateData.notifications_enabled = notifications_enabled
    if (auto_responses_enabled !== undefined) updateData.auto_responses_enabled = auto_responses_enabled
    if (business_hours_only !== undefined) updateData.business_hours_only = business_hours_only
    if (is_active !== undefined) updateData.is_active = is_active

    // Se webhook_url mudou, marcar como não verificado
    if (webhook_url !== undefined && webhook_url !== existingConfig.webhook_url) {
      updateData.webhook_verified = false
    }

    // Atualizar configuração
    const { data: config, error } = await supabase
      .from('whatsapp_config')
      .update(updateData)
      .eq('agency_id', profile.agency_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar configuração:', error)
      return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 })
    }

    // Não retornar a API key na resposta
    const { api_key: _, ...configWithoutKey } = config

    return NextResponse.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      config: configWithoutKey
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Excluir configuração
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Verificar permissões (apenas owners podem excluir)
    if (!['admin', 'agency_owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para excluir configurações' }, { status: 403 })
    }

    // Verificar se existe
    const { data: existingConfig } = await supabase
      .from('whatsapp_config')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .single()

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 404 })
    }

    // Excluir configuração
    const { error } = await supabase
      .from('whatsapp_config')
      .delete()
      .eq('agency_id', profile.agency_id)

    if (error) {
      console.error('Erro ao excluir configuração:', error)
      return NextResponse.json({ error: 'Erro ao excluir configuração' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração excluída com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}