import { NextRequest, NextResponse } from 'next/server'
import { slackIntegration } from '@/lib/slack-integration'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Redirecionar para autorização OAuth do Slack
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')
    
    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'Agency ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a agência existe e o usuário tem permissão
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar permissões do usuário
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || 
        (userProfile.role !== 'admin' && 
         userProfile.agency_id !== agencyId &&
         !['agency_owner', 'agency_manager'].includes(userProfile.role))) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para configurar Slack' },
        { status: 403 }
      )
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/slack/callback`
    const authUrl = slackIntegration.generateAuthUrl(agencyId, redirectUri)

    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('Erro ao iniciar OAuth Slack:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}