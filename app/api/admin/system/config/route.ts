import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { getAdminConfig, checkServiceRoleKey } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é o admin principal
    if (user.email !== 'franco@fvstudios.com.br') {
      return NextResponse.json({ 
        error: 'Apenas o admin principal pode verificar configurações' 
      }, { status: 403 })
    }

    const config = getAdminConfig()
    
    // Testar conexão com service role se disponível
    let serviceRoleTest = null
    if (config.hasServiceRoleKey) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
        const adminClient = supabaseAdmin()
        
        // Teste simples: listar 1 usuário
        const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 })
        
        serviceRoleTest = {
          canListUsers: !error,
          userCount: data?.users?.length || 0,
          error: error?.message || null
        }
      } catch (error: any) {
        serviceRoleTest = {
          canListUsers: false,
          error: error.message
        }
      }
    }

    return NextResponse.json({
      success: true,
      config,
      serviceRoleTest,
      recommendations: config.hasServiceRoleKey ? [
        '✅ Service Role Key configurada',
        '✅ Cleanup completo disponível',
        '✅ Gerenciamento total de usuários habilitado'
      ] : [
        '⚠️ Service Role Key não configurada',
        '📝 Configure SUPABASE_SERVICE_ROLE_KEY no Vercel',
        '🔄 Redeploy após configurar',
        '⭐ Cleanup manual disponível como alternativa'
      ]
    })

  } catch (error) {
    console.error('Erro ao verificar configuração:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}