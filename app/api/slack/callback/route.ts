import { NextRequest, NextResponse } from 'next/server'
import { slackIntegration } from '@/lib/slack-integration'

// GET - Callback OAuth do Slack
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Verificar se houve erro na autorização
    if (error) {
      const errorMessage = searchParams.get('error_description') || 'Erro na autorização'
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/slack?error=${encodeURIComponent(errorMessage)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/slack?error=Código de autorização ou state inválido`
      )
    }

    // Decodificar state para obter agency_id
    let agencyId: string
    try {
      const decodedState = Buffer.from(state, 'base64').toString('utf8')
      agencyId = decodedState.split(':')[0]
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/slack?error=State inválido`
      )
    }

    // Trocar código por tokens
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/slack/callback`
    const oauthData = await slackIntegration.exchangeCodeForTokens(code, redirectUri)

    if (!oauthData) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/slack?error=Falha ao obter tokens de acesso`
      )
    }

    // Instalar workspace na agência
    // TODO: Obter user_id do contexto da sessão
    const installedBy = 'current-user-id' // Implementar quando tiver contexto de auth
    const workspaceId = await slackIntegration.installWorkspace(
      agencyId,
      oauthData,
      installedBy
    )

    if (!workspaceId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/slack?error=Falha ao instalar workspace`
      )
    }

    // Redirecionar com sucesso
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/slack?success=Slack integrado com sucesso&workspace_id=${workspaceId}`
    )

  } catch (error) {
    console.error('Erro no callback OAuth:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/slack?error=Erro interno do servidor`
    )
  }
}