// ==================================================
// FVStudios Dashboard - API de Gerenciamento de Integrações
// Endpoints para CRUD de integrações com APIs externas
// ==================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { TokenEncryption } from '@/lib/encryption'
import { TokenValidationManager } from '@/lib/api-validators'

// GET - Listar integrações de um cliente específico
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'client_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar integrações do cliente
    const { data: integrations, error } = await supabase
      .from('api_integrations')
      .select(`
        id,
        client_id,
        name,
        provider,
        provider_type,
        description,
        status,
        is_valid,
        last_validated_at,
        validation_error,
        auto_sync,
        sync_frequency,
        last_sync_at,
        next_sync_at,
        rate_limit_per_hour,
        rate_limit_remaining,
        rate_limit_reset_at,
        provider_config,
        created_at,
        updated_at
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar integrações:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ integrations })

  } catch (error) {
    console.error('Erro na API de integrações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova integração
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const body = await request.json()

    const {
      client_id,
      agency_id,
      created_by,
      name,
      provider,
      provider_type,
      description,
      auth_type,
      oauth_client_id,
      client_secret,
      access_token,
      refresh_token,
      api_key,
      api_version,
      base_url,
      scopes,
      provider_config,
      auto_sync,
      sync_frequency,
      rate_limit_per_hour
    } = body

    // Validações básicas
    if (!client_id || !created_by || !name || !provider || !provider_type) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: client_id, created_by, name, provider, provider_type' },
        { status: 400 }
      )
    }

    // Criptografar dados sensíveis
    let client_secret_encrypted = null
    let access_token_encrypted = null
    let refresh_token_encrypted = null
    let api_key_encrypted = null

    if (client_secret) {
      const encrypted = TokenEncryption.encrypt(client_secret)
      client_secret_encrypted = Buffer.from(JSON.stringify(encrypted)).toString('base64')
    }

    if (access_token) {
      access_token_encrypted = TokenEncryption.encryptOAuthToken({
        access_token,
        refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hora padrão
        token_type: 'Bearer'
      })
    }

    if (refresh_token) {
      const encrypted = TokenEncryption.encrypt(refresh_token)
      refresh_token_encrypted = Buffer.from(JSON.stringify(encrypted)).toString('base64')
    }

    if (api_key) {
      const encrypted = TokenEncryption.encrypt(api_key)
      api_key_encrypted = Buffer.from(JSON.stringify(encrypted)).toString('base64')
    }

    // Criar integração
    const { data: integration, error } = await supabase
      .from('api_integrations')
      .insert({
        client_id,
        agency_id,
        created_by,
        name,
        provider,
        provider_type,
        description,
        auth_type: auth_type || 'oauth2',
        oauth_client_id, // OAuth client ID do provider
        client_secret_encrypted,
        access_token_encrypted,
        refresh_token_encrypted,
        api_key_encrypted,
        api_version,
        base_url,
        scopes,
        provider_config: provider_config || {},
        auto_sync: auto_sync !== false,
        sync_frequency: sync_frequency || 'hourly',
        rate_limit_per_hour: rate_limit_per_hour || 1000,
        status: 'inactive',
        is_valid: false
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar integração:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Se foi fornecido um token, validar imediatamente
    if (access_token) {
      try {
        const validationResult = await TokenValidationManager.validateToken({
          provider,
          integration_id: integration.id,
          access_token,
          refresh_token,
          base_url,
          api_version
        })

        // Atualizar status da integração com resultado da validação
        await supabase
          .from('api_integrations')
          .update({
            is_valid: validationResult.isValid,
            status: validationResult.isValid ? 'active' : 'error',
            last_validated_at: new Date().toISOString(),
            validation_error: validationResult.error || null
          })
          .eq('id', integration.id)

        integration.is_valid = validationResult.isValid
        integration.status = validationResult.isValid ? 'active' : 'error'
        integration.validation_error = validationResult.error || null
      } catch (validationError) {
        console.error('Erro na validação inicial:', validationError)
      }
    }

    return NextResponse.json({ integration }, { status: 201 })

  } catch (error) {
    console.error('Erro na criação de integração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar integração existente
export async function PUT(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID da integração é obrigatório' },
        { status: 400 }
      )
    }

    // Criptografar novos dados sensíveis se fornecidos
    const encryptedFields: any = {}

    if (updateData.client_secret) {
      const encrypted = TokenEncryption.encrypt(updateData.client_secret)
      encryptedFields.client_secret_encrypted = Buffer.from(JSON.stringify(encrypted)).toString('base64')
      delete updateData.client_secret
    }

    if (updateData.access_token) {
      encryptedFields.access_token_encrypted = TokenEncryption.encryptOAuthToken({
        access_token: updateData.access_token,
        refresh_token: updateData.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'Bearer'
      })
      delete updateData.access_token
    }

    if (updateData.refresh_token) {
      const encrypted = TokenEncryption.encrypt(updateData.refresh_token)
      encryptedFields.refresh_token_encrypted = Buffer.from(JSON.stringify(encrypted)).toString('base64')
      delete updateData.refresh_token
    }

    if (updateData.api_key) {
      const encrypted = TokenEncryption.encrypt(updateData.api_key)
      encryptedFields.api_key_encrypted = Buffer.from(JSON.stringify(encrypted)).toString('base64')
      delete updateData.api_key
    }

    // Atualizar integração
    const { data: integration, error } = await supabase
      .from('api_integrations')
      .update({
        ...updateData,
        ...encryptedFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar integração:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ integration })

  } catch (error) {
    console.error('Erro na atualização de integração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover integração
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da integração é obrigatório' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('api_integrations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao remover integração:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro na remoção de integração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}