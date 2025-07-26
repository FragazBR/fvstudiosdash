// ==================================================
// FVStudios Dashboard - OAuth para Meta (Facebook/Instagram)
// Fluxo de autenticação para Meta Business API
// ==================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { TokenEncryption } from '@/lib/encryption'

const META_CLIENT_ID = process.env.META_CLIENT_ID || ''
const META_CLIENT_SECRET = process.env.META_CLIENT_SECRET || ''
const META_REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL + '/api/oauth/meta/callback'

// GET - Iniciar fluxo OAuth com Meta
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

    // Construir URL de autorização do Meta
    const scopes = [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_show_list',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_content_publish'
    ].join(',')

    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    authUrl.searchParams.append('client_id', META_CLIENT_ID)
    authUrl.searchParams.append('redirect_uri', META_REDIRECT_URI)
    authUrl.searchParams.append('scope', scopes)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('state', state || '')

    return NextResponse.redirect(authUrl.toString())

  } catch (error) {
    console.error('Erro no OAuth Meta:', error)
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
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: META_CLIENT_ID,
        client_secret: META_CLIENT_SECRET,
        redirect_uri: META_REDIRECT_URI,
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

    // Obter token de longa duração
    const longLivedTokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    longLivedUrl.searchParams.append('grant_type', 'fb_exchange_token')
    longLivedUrl.searchParams.append('client_id', META_CLIENT_ID)
    longLivedUrl.searchParams.append('client_secret', META_CLIENT_SECRET)
    longLivedUrl.searchParams.append('fb_exchange_token', tokenData.access_token)

    const longLivedResponse = await fetch(longLivedUrl.toString())
    let finalTokenData = tokenData

    if (longLivedResponse.ok) {
      finalTokenData = await longLivedResponse.json()
    }

    // Obter informações do usuário
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${finalTokenData.access_token}&fields=id,name,email`)
    const userData = await userResponse.json()

    // Criptografar token
    const encryptedToken = TokenEncryption.encryptOAuthToken({
      access_token: finalTokenData.access_token,
      token_type: finalTokenData.token_type || 'Bearer',
      expires_at: Math.floor(Date.now() / 1000) + (finalTokenData.expires_in || 3600)
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
          user_email: userData.email
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
      user: userData
    })

  } catch (error) {
    console.error('Erro no callback OAuth Meta:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}