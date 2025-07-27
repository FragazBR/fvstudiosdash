import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auditSystem } from '@/lib/audit-system'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Listar regras de compliance
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
      return NextResponse.json({ error: 'Sem permissão para acessar regras de compliance' }, { status: 403 })
    }

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const rule_type = searchParams.get('rule_type')
    const is_active = searchParams.get('is_active')
    const severity = searchParams.get('severity')

    // Buscar regras
    let query = supabase
      .from('compliance_rules')
      .select(`
        id,
        rule_name,
        rule_type,
        description,
        severity,
        conditions,
        actions,
        is_active,
        last_check,
        next_check,
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
    if (rule_type) {
      query = query.eq('rule_type', rule_type)
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true')
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data: rules, error } = await query

    if (error) {
      console.error('Erro ao buscar regras de compliance:', error)
      return NextResponse.json({ error: 'Erro ao buscar regras' }, { status: 500 })
    }

    // Buscar estatísticas
    const { data: dashboard } = await supabase
      .from('compliance_dashboard')
      .select('*')
      .eq(profile.role !== 'admin' ? 'agency_id' : 'id', profile.role !== 'admin' ? profile.agency_id : 'any')
      .single()

    return NextResponse.json({
      success: true,
      rules: rules || [],
      statistics: dashboard || {
        total_rules: 0,
        active_rules: 0,
        critical_rules: 0,
        overdue_checks: 0,
        avg_hours_since_check: 0
      }
    })

  } catch (error) {
    console.error('Erro ao listar regras de compliance:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Criar nova regra de compliance
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
    const allowedRoles = ['admin', 'agency_owner']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para criar regras de compliance' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      rule_name, 
      rule_type, 
      description, 
      severity = 'medium', 
      conditions = {}, 
      actions = {},
      is_active = true
    } = body

    // Validações
    if (!rule_name || !rule_type || !description) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: rule_name, rule_type, description' 
      }, { status: 400 })
    }

    const validRuleTypes = ['data_retention', 'access_control', 'data_protection', 'logging', 'backup']
    if (!validRuleTypes.includes(rule_type)) {
      return NextResponse.json({ 
        error: 'Tipo de regra inválido' 
      }, { status: 400 })
    }

    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (!validSeverities.includes(severity)) {
      return NextResponse.json({ 
        error: 'Severidade inválida' 
      }, { status: 400 })
    }

    // Criar regra
    const ruleId = await auditSystem.createComplianceRule({
      rule_name,
      rule_type,
      description,
      severity,
      conditions,
      actions,
      is_active
    })

    if (!ruleId) {
      return NextResponse.json({ 
        error: 'Erro ao criar regra de compliance' 
      }, { status: 500 })
    }

    // Registrar ação para auditoria
    await auditSystem.logAudit(
      'compliance_rules',
      ruleId,
      'INSERT',
      {
        newValues: { rule_name, rule_type, description, severity },
        userId: user.id,
        agencyId: profile.agency_id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Regra de compliance criada com sucesso',
      rule_id: ruleId
    })

  } catch (error) {
    console.error('Erro ao criar regra de compliance:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}