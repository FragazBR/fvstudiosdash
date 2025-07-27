import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auditSystem } from '@/lib/audit-system'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Listar relatórios de compliance
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
      return NextResponse.json({ error: 'Sem permissão para acessar relatórios de compliance' }, { status: 403 })
    }

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const report_type = searchParams.get('report_type')
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // Buscar relatórios
    let query = supabase
      .from('compliance_reports')
      .select(`
        id,
        report_type,
        period_start,
        period_end,
        status,
        findings,
        remediation_actions,
        created_at,
        profiles!generated_by(email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filtrar por agência se não for admin
    if (profile.role !== 'admin') {
      query = query.eq('agency_id', profile.agency_id)
    }

    // Aplicar filtros
    if (report_type) {
      query = query.eq('report_type', report_type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: reports, error } = await query

    if (error) {
      console.error('Erro ao buscar relatórios de compliance:', error)
      return NextResponse.json({ error: 'Erro ao buscar relatórios' }, { status: 500 })
    }

    // Formatar relatórios
    const formattedReports = (reports || []).map(report => ({
      id: report.id,
      report_type: report.report_type,
      period: {
        start: report.period_start,
        end: report.period_end
      },
      status: report.status,
      findings_count: Array.isArray(report.findings) ? report.findings.length : 0,
      failed_findings: Array.isArray(report.findings) 
        ? report.findings.filter((f: any) => f.status === 'fail').length 
        : 0,
      remediation_actions_count: Array.isArray(report.remediation_actions) 
        ? report.remediation_actions.length 
        : 0,
      created_at: report.created_at,
      generated_by: {
        email: report.profiles?.email,
        name: report.profiles?.full_name
      }
    }))

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      pagination: {
        limit,
        total: formattedReports.length
      }
    })

  } catch (error) {
    console.error('Erro ao listar relatórios de compliance:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Gerar novo relatório de compliance
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
      return NextResponse.json({ error: 'Sem permissão para gerar relatórios de compliance' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      report_type = 'custom', 
      period_start, 
      period_end
    } = body

    // Validações
    if (!period_start || !period_end) {
      return NextResponse.json({ 
        error: 'Período obrigatório: period_start e period_end' 
      }, { status: 400 })
    }

    const validReportTypes = ['gdpr', 'lgpd', 'sox', 'iso27001', 'custom']
    if (!validReportTypes.includes(report_type)) {
      return NextResponse.json({ 
        error: 'Tipo de relatório inválido' 
      }, { status: 400 })
    }

    // Verificar se as datas são válidas
    const startDate = new Date(period_start)
    const endDate = new Date(period_end)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ 
        error: 'Datas inválidas' 
      }, { status: 400 })
    }

    if (startDate >= endDate) {
      return NextResponse.json({ 
        error: 'Data de início deve ser anterior à data de fim' 
      }, { status: 400 })
    }

    // Gerar relatório
    const reportId = await auditSystem.generateComplianceReport(
      report_type,
      period_start,
      period_end,
      profile.role !== 'admin' ? profile.agency_id : undefined,
      user.id
    )

    if (!reportId) {
      return NextResponse.json({ 
        error: 'Erro ao gerar relatório de compliance' 
      }, { status: 500 })
    }

    // Registrar ação para auditoria
    await auditSystem.logAudit(
      'compliance_reports',
      reportId,
      'INSERT',
      {
        newValues: { report_type, period_start, period_end },
        userId: user.id,
        agencyId: profile.agency_id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Relatório de compliance gerado com sucesso',
      report_id: reportId
    })

  } catch (error) {
    console.error('Erro ao gerar relatório de compliance:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}