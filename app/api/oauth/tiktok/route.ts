// ==================================================
// FVStudios Dashboard - OAuth para TikTok Business
// Fluxo de autenticação para TikTok Business API
// ==================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { TokenEncryption } from '@/lib/encryption'

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || ''
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || ''
const TIKTOK_REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL + '/api/oauth/tiktok/callback'

// GET - Iniciar fluxo OAuth com TikTok
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const integrationId = searchParams.get('integration_id')
    const state = searchParams.get('state') || integrationId

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integration_id é obrigatório' },
        { status: 400 }
      )
    }

    // Construir URL de autorização do TikTok
    const scopes = [
      'user.info.basic',
      'advertiser.read',
      'advertiser.write',
      'campaign.read',
      'campaign.write',
      'adgroup.read',
      'adgroup.write',
      'ad.read',
      'ad.write',
      'report.read'
    ].join(',')

    const authUrl = new URL('https://business-api.tiktok.com/open_api/v1.3/oauth2/authorize/')
    authUrl.searchParams.append('client_key', TIKTOK_CLIENT_KEY)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', scopes)
    authUrl.searchParams.append('redirect_uri', TIKTOK_REDIRECT_URI)
    authUrl.searchParams.append('state', state || '')

    return NextResponse.redirect(authUrl.toString())

  } catch (error) {
    console.error('Erro no OAuth TikTok:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Callback do OAuth
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { code, state, error: oauthError } = await request.json()

    if (oauthError) {
      return NextResponse.json(
        { error: `OAuth Error: ${oauthError}` },
        { status: 400 }
      )
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Código de autorização e state são obrigatórios' },
        { status: 400 }
      )
    }

    // Trocar código por token de acesso
    const tokenResponse = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        auth_code: code,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Erro ao trocar código por token:', errorData)
      return NextResponse.json(
        { error: 'Erro ao obter token de acesso' },
        { status: 400 }
      )
    }

    const tokenResult = await tokenResponse.json()

    if (tokenResult.code !== 0) {
      console.error('Erro na resposta do token:', tokenResult)
      return NextResponse.json(
        { error: tokenResult.message || 'Erro ao obter token' },
        { status: 400 }
      )
    }

    const tokenData = tokenResult.data

    // Obter informações do usuário
    const userResponse = await fetch('https://business-api.tiktok.com/open_api/v1.3/user/info/', {
      headers: {
        'Access-Token': tokenData.access_token,
        'Content-Type': 'application/json'
      }
    })

    const userResult = await userResponse.json()
    const userData = userResult.code === 0 ? userResult.data : {}

    // Obter contas de anunciante acessíveis
    const advertiserResponse = await fetch('https://business-api.tiktok.com/open_api/v1.3/advertiser/get/', {
      headers: {
        'Access-Token': tokenData.access_token,
        'Content-Type': 'application/json'
      }
    })

    let advertisers = []
    if (advertiserResponse.ok) {
      const advertiserResult = await advertiserResponse.json()
      if (advertiserResult.code === 0) {
        advertisers = advertiserResult.data?.list || []
      }
    }

    // Criptografar tokens
    const encryptedToken = TokenEncryption.encryptOAuthToken({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: 'Bearer',
      expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 86400),
      scope: tokenData.scope
    })

    // Atualizar integração com token
    const { data: integration, error: updateError } = await supabase
      .from('api_integrations')
      .update({
        access_token_encrypted: encryptedToken,
        status: 'active',
        is_valid: true,
        last_validated_at: new Date().toISOString(),
        validation_error: null,
        provider_config: {
          user_id: userData.user_id,
          display_name: userData.display_name,
          email: userData.email,
          advertisers: advertisers
        }
      })
      .eq('id', state)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar integração:', updateError)
      return NextResponse.json(
        { error: 'Erro ao salvar token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      integration,
      user: userData,
      advertisers
    })

  } catch (error) {
    console.error('Erro no callback OAuth TikTok:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}