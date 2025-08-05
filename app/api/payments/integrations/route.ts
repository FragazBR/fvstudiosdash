import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { initializePaymentIntegration } from '@/lib/payment-integration-engine'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const agencyId = url.searchParams.get('agency_id')

    if (!agencyId) {
      return NextResponse.json({ error: 'agency_id é obrigatório' }, { status: 400 })
    }

    // Verificar permissões
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role, permissions')
      .eq('user_id', user.id)
      .eq('agency_id', agencyId)
      .single()

    if (!permissions) {
      return NextResponse.json({ error: 'Sem permissão para esta agência' }, { status: 403 })
    }

    // Buscar integrações de pagamento
    const { data: integrations, error } = await supabase
      .from('payment_integrations')
      .select(`
        *,
        payment_integration_stats(
          total_payments,
          total_revenue,
          successful_payments,
          failed_payments
        )
      `)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar integrações:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Remover chaves sensíveis
    const sanitizedIntegrations = integrations.map(integration => ({
      ...integration,
      api_key_encrypted: undefined,
      secret_key_encrypted: undefined,
      webhook_secret_encrypted: undefined,
      api_key_preview: integration.api_key_encrypted ? '***' + integration.api_key_encrypted.slice(-4) : null
    }))

    return NextResponse.json({
      integrations: sanitizedIntegrations,
      total: integrations.length
    })

  } catch (error) {
    console.error('Erro no endpoint de integrações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      agency_id,
      platform,
      name,
      description,
      api_key,
      secret_key,
      webhook_secret,
      sandbox_mode = true,
      supported_currencies = ['BRL', 'USD'],
      config = {}
    } = body

    // Validação
    if (!agency_id || !platform || !name || !api_key || !secret_key) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: agency_id, platform, name, api_key, secret_key' 
      }, { status: 400 })
    }

    // Verificar permissões
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role, permissions')
      .eq('user_id', user.id)
      .eq('agency_id', agency_id)
      .single()

    if (!permissions || (permissions.role !== 'admin' && permissions.permissions?.manage_payments !== 'true')) {
      return NextResponse.json({ error: 'Sem permissão para gerenciar pagamentos' }, { status: 403 })
    }

    // Verificar se já existe integração para esta plataforma
    const { data: existingIntegration } = await supabase
      .from('payment_integrations')
      .select('id')
      .eq('agency_id', agency_id)
      .eq('platform', platform)
      .eq('name', name)
      .single()

    if (existingIntegration) {
      return NextResponse.json({ 
        error: 'Já existe uma integração com este nome para esta plataforma' 
      }, { status: 409 })
    }

    // Inicializar integração
    const integrationConfig = {
      platform,
      apiKey: api_key,
      secretKey: secret_key,
      webhookSecret: webhook_secret,
      sandboxMode: sandbox_mode,
      supportedCurrencies: supported_currencies,
      config
    }

    const success = await initializePaymentIntegration(agency_id, integrationConfig)
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Falha ao inicializar integração' 
      }, { status: 500 })
    }

    // Buscar a integração criada
    const { data: newIntegration, error: fetchError } = await supabase
      .from('payment_integrations')
      .select('*')
      .eq('agency_id', agency_id)
      .eq('platform', platform)
      .eq('name', name)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar integração criada:', fetchError)
      return NextResponse.json({ error: 'Erro ao criar integração' }, { status: 500 })
    }

    // Remover chaves sensíveis
    delete newIntegration.api_key_encrypted
    delete newIntegration.secret_key_encrypted
    delete newIntegration.webhook_secret_encrypted

    return NextResponse.json({
      integration: newIntegration,
      message: 'Integração criada com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar integração:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID da integração é obrigatório' }, { status: 400 })
    }

    // Buscar integração existente
    const { data: integration, error: fetchError } = await supabase
      .from('payment_integrations')
      .select('agency_id')
      .eq('id', id)
      .single()

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 })
    }

    // Verificar permissões
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role, permissions')
      .eq('user_id', user.id)
      .eq('agency_id', integration.agency_id)
      .single()

    if (!permissions || (permissions.role !== 'admin' && permissions.permissions?.manage_payments !== 'true')) {
      return NextResponse.json({ error: 'Sem permissão para gerenciar pagamentos' }, { status: 403 })
    }

    // Atualizar integração
    const { data: updatedIntegration, error: updateError } = await supabase
      .from('payment_integrations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar integração:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar integração' }, { status: 500 })
    }

    // Remover chaves sensíveis
    delete updatedIntegration.api_key_encrypted
    delete updatedIntegration.secret_key_encrypted
    delete updatedIntegration.webhook_secret_encrypted

    return NextResponse.json({
      integration: updatedIntegration,
      message: 'Integração atualizada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar integração:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID da integração é obrigatório' }, { status: 400 })
    }

    // Buscar integração existente
    const { data: integration, error: fetchError } = await supabase
      .from('payment_integrations')
      .select('agency_id, name, platform')
      .eq('id', id)
      .single()

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 })
    }

    // Verificar permissões
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role, permissions')
      .eq('user_id', user.id)
      .eq('agency_id', integration.agency_id)
      .single()

    if (!permissions || (permissions.role !== 'admin' && permissions.permissions?.manage_payments !== 'true')) {
      return NextResponse.json({ error: 'Sem permissão para gerenciar pagamentos' }, { status: 403 })
    }

    // Verificar se há pagamentos ativos
    const { data: activePayments, error: paymentsError } = await supabase
      .from('payments')
      .select('id')
      .eq('integration_id', id)
      .in('status', ['pending', 'processing'])
      .limit(1)

    if (paymentsError) {
      console.error('Erro ao verificar pagamentos ativos:', paymentsError)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    if (activePayments && activePayments.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir integração com pagamentos ativos' 
      }, { status: 409 })
    }

    // Excluir integração
    const { error: deleteError } = await supabase
      .from('payment_integrations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao excluir integração:', deleteError)
      return NextResponse.json({ error: 'Erro ao excluir integração' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Integração ${integration.name} (${integration.platform}) excluída com sucesso`
    })

  } catch (error) {
    console.error('Erro ao excluir integração:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}