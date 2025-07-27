import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { alertSystem } from '@/lib/alert-system'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Listar regras de alerta
export async function GET(request: NextRequest) {
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

    // Verificar permissões
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para acessar regras de alerta' }, { status: 403 })
    }

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    const is_active = searchParams.get('is_active')

    // Buscar regras
    let query = supabase
      .from('alert_rules')
      .select(`
        id,
        name,
        description,
        type,
        severity,
        conditions,
        notification_channels,
        cooldown_minutes,
        is_active,
        created_at,
        updated_at,
        profiles!created_by(email, full_name)
      `)
      .order('created_at', { ascending: false })

    // Filtrar por agência se não for admin
    if (profile.role !== 'admin') {
      query = query.eq('agency_id', profile.agency_id)
    }

    // Aplicar filtros
    if (type) {
      query = query.eq('type', type)
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true')
    }

    const { data: rules, error } = await query

    if (error) {
      console.error('Erro ao buscar regras de alerta:', error)
      return NextResponse.json({ error: 'Erro ao buscar regras' }, { status: 500 })
    }

    // Buscar estatísticas
    const statistics = await alertSystem.getAlertStatistics(
      profile.role !== 'admin' ? profile.agency_id : undefined
    )

    return NextResponse.json({
      success: true,
      rules: rules || [],
      statistics
    })

  } catch (error) {
    console.error('Erro ao listar regras de alerta:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Criar nova regra de alerta
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

    // Verificar permissões
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para criar regras de alerta' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      type, 
      severity = 'warning', 
      conditions = [], 
      notification_channels = ['dashboard'],
      cooldown_minutes = 60,
      is_active = true
    } = body

    // Validações
    if (!name || !description || !type) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: name, description, type' 
      }, { status: 400 })
    }

    const validTypes = ['performance', 'security', 'system', 'business', 'compliance', 'custom']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: 'Tipo de alerta inválido' 
      }, { status: 400 })
    }

    const validSeverities = ['info', 'warning', 'error', 'critical']
    if (!validSeverities.includes(severity)) {
      return NextResponse.json({ 
        error: 'Severidade inválida' 
      }, { status: 400 })
    }

    if (!Array.isArray(conditions) || conditions.length === 0) {
      return NextResponse.json({ 
        error: 'Pelo menos uma condição é obrigatória' 
      }, { status: 400 })
    }

    // Validar condições
    for (const condition of conditions) {
      if (!condition.metric || !condition.operator || condition.value === undefined) {
        return NextResponse.json({ 
          error: 'Condições devem ter metric, operator e value' 
        }, { status: 400 })
      }
    }

    // Criar regra
    const ruleId = await alertSystem.createAlertRule({
      name,
      description,
      type,
      severity,
      conditions,
      notification_channels,
      cooldown_minutes,
      is_active,
      agency_id: profile.role !== 'admin' ? profile.agency_id : undefined,
      created_by: user.id
    })

    if (!ruleId) {
      return NextResponse.json({ 
        error: 'Erro ao criar regra de alerta' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Regra de alerta criada com sucesso',
      rule_id: ruleId
    })

  } catch (error) {
    console.error('Erro ao criar regra de alerta:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}