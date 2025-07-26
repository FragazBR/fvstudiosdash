// ==================================================
// FVStudios Dashboard - OAuth para LinkedIn Ads
// Fluxo de autenticação para LinkedIn Marketing API
// ==================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { TokenEncryption } from '@/lib/encryption'

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || ''
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || ''
const LINKEDIN_REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL + '/api/oauth/linkedin/callback'

// GET - Iniciar fluxo OAuth com LinkedIn
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

    // Construir URL de autorização do LinkedIn
    const scopes = [
      'r_liteprofile',
      'r_emailaddress',
      'r_ads',
      'rw_ads',
      'r_ads_reporting'
    ].join(' ')

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    authUrl.searchParams.append('client_id', LINKEDIN_CLIENT_ID)
    authUrl.searchParams.append('redirect_uri', LINKEDIN_REDIRECT_URI)
    authUrl.searchParams.append('scope', scopes)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('state', state || '')

    return NextResponse.redirect(authUrl.toString())

  } catch (error) {
    console.error('Erro no OAuth LinkedIn:', error)
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
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        grant_type: 'authorization_code',
        code,
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

    const tokenData = await tokenResponse.json()

    // Obter informações do perfil
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress)', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    })

    const profileData = await profileResponse.json()

    // Obter contas de anúncios acessíveis
    const adAccountsResponse = await fetch('https://api.linkedin.com/v2/adAccountsV2?q=search&search.type.values[0]=BUSINESS&search.status.values[0]=ACTIVE', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    })

    let adAccounts = []
    if (adAccountsResponse.ok) {
      const adAccountsData = await adAccountsResponse.json()
      adAccounts = adAccountsData.elements || []
    }

    // Criptografar tokens
    const encryptedToken = TokenEncryption.encryptOAuthToken({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 5184000), // LinkedIn tokens duram 60 dias por padrão
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
          user_id: profileData.id,
          first_name: profileData.firstName?.localized?.en_US || '',
          last_name: profileData.lastName?.localized?.en_US || '',
          email: profileData.emailAddress,
          ad_accounts: adAccounts
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
      user: profileData,
      adAccounts
    })

  } catch (error) {
    console.error('Erro no callback OAuth LinkedIn:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}