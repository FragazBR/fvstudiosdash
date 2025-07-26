// ==================================================
// FVStudios Dashboard - OAuth para Google Ads
// Fluxo de autenticação para Google Ads API
// ==================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { TokenEncryption } from '@/lib/encryption'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL + '/api/oauth/google/callback'

// GET - Iniciar fluxo OAuth com Google
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

    // Construir URL de autorização do Google
    const scopes = [
      'https://www.googleapis.com/auth/adwords',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ')

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI)
    authUrl.searchParams.append('scope', scopes)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('access_type', 'offline')
    authUrl.searchParams.append('prompt', 'consent')
    authUrl.searchParams.append('state', state || '')

    return NextResponse.redirect(authUrl.toString())

  } catch (error) {
    console.error('Erro no OAuth Google:', error)
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
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
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

    // Obter informações do usuário
    const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`)
    const userData = await userResponse.json()

    // Verificar contas acessíveis do Google Ads
    const customerResponse = await fetch('https://googleads.googleapis.com/v14/customers:listAccessibleCustomers', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
        'Content-Type': 'application/json'
      }
    })

    let customers = []
    if (customerResponse.ok) {
      const customerData = await customerResponse.json()
      customers = customerData.resourceNames || []
    }

    // Criptografar tokens
    const encryptedToken = TokenEncryption.encryptOAuthToken({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
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
          user_id: userData.id,
          user_name: userData.name,
          user_email: userData.email,
          accessible_customers: customers
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
      customers
    })

  } catch (error) {
    console.error('Erro no callback OAuth Google:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}