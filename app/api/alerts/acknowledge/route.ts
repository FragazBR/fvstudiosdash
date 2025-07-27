import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { alertSystem } from '@/lib/alert-system'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Reconhecer ou resolver alerta
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    const body = await request.json()
    const { alert_id, action } = body

    // Validações
    if (!alert_id) {
      return NextResponse.json({ 
        error: 'ID do alerta é obrigatório' 
      }, { status: 400 })
    }

    if (!action || !['acknowledge', 'resolve'].includes(action)) {
      return NextResponse.json({ 
        error: 'Ação inválida. Use: acknowledge ou resolve' 
      }, { status: 400 })
    }

    // Verificar se o alerta existe e pertence à agência
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('id, rule_name, severity, agency_id, status')
      .eq('id', alert_id)
      .single()

    if (alertError || !alert) {
      return NextResponse.json({ 
        error: 'Alerta não encontrado' 
      }, { status: 404 })
    }

    // Verificar permissões de agência
    if (profile.role !== 'admin' && alert.agency_id !== profile.agency_id) {
      return NextResponse.json({ 
        error: 'Sem permissão para acessar este alerta' 
      }, { status: 403 })
    }

    // Verificar se o alerta pode ser alterado
    if (alert.status === 'resolved') {
      return NextResponse.json({ 
        error: 'Alerta já foi resolvido' 
      }, { status: 400 })
    }

    if (action === 'acknowledge' && alert.status === 'acknowledged') {
      return NextResponse.json({ 
        error: 'Alerta já foi reconhecido' 
      }, { status: 400 })
    }

    // Executar ação
    let success = false
    if (action === 'acknowledge') {
      success = await alertSystem.acknowledgeAlert(alert_id, user.id)
    } else if (action === 'resolve') {
      success = await alertSystem.resolveAlert(alert_id, user.id)
    }

    if (!success) {
      return NextResponse.json({ 
        error: `Erro ao ${action === 'acknowledge' ? 'reconhecer' : 'resolver'} alerta` 
      }, { status: 500 })
    }

    const actionMessage = action === 'acknowledge' ? 'reconhecido' : 'resolvido'

    return NextResponse.json({
      success: true,
      message: `Alerta ${actionMessage} com sucesso`,
      alert_id,
      action,
      performed_by: user.id
    })

  } catch (error) {
    console.error('Erro ao processar alerta:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}