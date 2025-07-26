// ==================================================
// FVStudios Dashboard - API de Validação de Tokens
// Endpoint para validar tokens de integrações
// ==================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { TokenEncryption } from '@/lib/encryption'
import { TokenValidationManager, ValidationLogger } from '@/lib/api-validators'

// POST - Validar token de uma integração
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = await supabaseServer()
    const { integration_id, force_refresh } = await request.json()

    if (!integration_id) {
      return NextResponse.json(
        { error: 'integration_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados da integração
    const { data: integration, error: fetchError } = await supabase
      .from('api_integrations')
      .select('*')
      .eq('id', integration_id)
      .single()

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'Integração não encontrada' },
        { status: 404 }
      )
    }

    // Descriptografar tokens se existirem
    let access_token = null
    let refresh_token = null

    try {
      if (integration.access_token_encrypted) {
        const tokenData = TokenEncryption.decryptOAuthToken(integration.access_token_encrypted)
        access_token = tokenData.access_token
        refresh_token = tokenData.refresh_token
      }
    } catch (decryptError) {
      console.error('Erro ao descriptografar token:', decryptError)
      return NextResponse.json(
        { error: 'Token inválido ou corrompido' },
        { status: 400 }
      )
    }

    if (!access_token) {
      return NextResponse.json(
        { error: 'Token de acesso não encontrado' },
        { status: 400 }
      )
    }

    // Configurar validação
    const validationConfig = {
      provider: integration.provider,
      integration_id: integration.id,
      access_token,
      refresh_token,
      account_id: integration.provider_config?.account_id,
      base_url: integration.base_url,
      api_version: integration.api_version
    }

    // Executar validação
    const validationResult = await TokenValidationManager.validateToken(validationConfig)
    
    const duration = Date.now() - startTime

    // Log da validação
    await ValidationLogger.logValidation(integration_id, validationResult, duration)

    // Atualizar status da integração no banco
    const updateData: any = {
      is_valid: validationResult.isValid,
      last_validated_at: new Date().toISOString(),
      validation_error: validationResult.error || null,
      updated_at: new Date().toISOString()
    }

    // Atualizar rate limits se disponíveis
    if (validationResult.rateLimits) {
      updateData.rate_limit_remaining = validationResult.rateLimits.remaining
      updateData.rate_limit_reset_at = validationResult.rateLimits.resetAt.toISOString()
    }

    // Atualizar status baseado na validação
    if (validationResult.isValid) {
      updateData.status = 'active'
    } else {
      updateData.status = 'error'
    }

    const { error: updateError } = await supabase
      .from('api_integrations')
      .update(updateData)
      .eq('id', integration_id)

    if (updateError) {
      console.error('Erro ao atualizar status da integração:', updateError)
    }

    // Se a validação falhou e temos um refresh token, tentar renovar
    if (!validationResult.isValid && refresh_token && force_refresh) {
      try {
        const refreshResult = await TokenValidationManager.refreshToken(
          integration.provider,
          refresh_token,
          integration.client_id || '',
          integration.client_secret ? TokenEncryption.decrypt(
            JSON.parse(Buffer.from(integration.client_secret_encrypted, 'base64').toString('utf8'))
          ) : ''
        )

        if (refreshResult) {
          // Criptografar novo token e salvar
          const newTokenEncrypted = TokenEncryption.encryptOAuthToken({
            access_token: refreshResult.access_token,
            refresh_token: refreshResult.refresh_token || refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + refreshResult.expires_in,
            token_type: refreshResult.token_type || 'Bearer'
          })

          await supabase
            .from('api_integrations')
            .update({
              access_token_encrypted: newTokenEncrypted,
              status: 'active',
              is_valid: true,
              last_validated_at: new Date().toISOString(),
              validation_error: null
            })
            .eq('id', integration_id)

          return NextResponse.json({
            ...validationResult,
            isValid: true,
            refreshed: true,
            message: 'Token renovado com sucesso'
          })
        }
      } catch (refreshError) {
        console.error('Erro ao renovar token:', refreshError)
      }
    }

    return NextResponse.json(validationResult)

  } catch (error) {
    const duration = Date.now() - startTime
    
    console.error('Erro na validação de token:', error)
    
    // Log do erro
    try {
      await ValidationLogger.logValidation(
        request.json().then(body => body.integration_id).catch(() => 'unknown'),
        {
          isValid: false,
          provider: 'unknown',
          validatedAt: new Date(),
          error: 'Erro interno do servidor'
        },
        duration
      )
    } catch (logError) {
      console.error('Erro ao fazer log:', logError)
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Validar múltiplas integrações de uma agência
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')

    if (!agencyId) {
      return NextResponse.json(
        { error: 'agency_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar todas as integrações ativas da agência
    const { data: integrations, error } = await supabase
      .from('api_integrations')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('status', 'active')

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar integrações' },
        { status: 500 }
      )
    }

    // Preparar configurações para validação em lote
    const validationConfigs = []

    for (const integration of integrations) {
      try {
        if (integration.access_token_encrypted) {
          const tokenData = TokenEncryption.decryptOAuthToken(integration.access_token_encrypted)
          
          validationConfigs.push({
            provider: integration.provider,
            integration_id: integration.id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            account_id: integration.provider_config?.account_id,
            base_url: integration.base_url,
            api_version: integration.api_version
          })
        }
      } catch (decryptError) {
        console.error(`Erro ao descriptografar token da integração ${integration.id}:`, decryptError)
      }
    }

    // Executar validação em lote
    const healthCheckResult = await TokenValidationManager.healthCheck(validationConfigs)

    // Atualizar status das integrações baseado nos resultados
    for (const result of healthCheckResult.details) {
      try {
        const updateData = {
          is_valid: result.isValid,
          last_validated_at: new Date().toISOString(),
          validation_error: result.error || null,
          status: result.isValid ? 'active' : 'error'
        }

        if (result.rateLimits) {
          updateData.rate_limit_remaining = result.rateLimits.remaining
          updateData.rate_limit_reset_at = result.rateLimits.resetAt.toISOString()
        }

        await supabase
          .from('api_integrations')
          .update(updateData)
          .eq('provider', result.provider)
          .eq('agency_id', agencyId)
      } catch (updateError) {
        console.error('Erro ao atualizar integração:', updateError)
      }
    }

    return NextResponse.json({
      summary: {
        healthy: healthCheckResult.healthy,
        unhealthy: healthCheckResult.unhealthy,
        expired: healthCheckResult.expired,
        total: integrations.length
      },
      details: healthCheckResult.details
    })

  } catch (error) {
    console.error('Erro no health check:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}