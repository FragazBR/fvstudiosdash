import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auditSystem } from '@/lib/audit-system'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Buscar trilha de auditoria
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
      return NextResponse.json({ error: 'Sem permissão para acessar trilha de auditoria' }, { status: 403 })
    }

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const table_name = searchParams.get('table_name')
    const record_id = searchParams.get('record_id')
    const action = searchParams.get('action') as 'INSERT' | 'UPDATE' | 'DELETE' | null
    const user_id = searchParams.get('user_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Buscar trilha de auditoria
    const auditEntries = await auditSystem.searchAudit({
      table_name: table_name || undefined,
      record_id: record_id || undefined,
      action: action || undefined,
      user_id: user_id || undefined,
      agency_id: profile.role !== 'admin' ? profile.agency_id : undefined,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      limit,
      offset
    })

    // Formatar entradas
    const formattedEntries = auditEntries.map((entry: any) => ({
      id: entry.id,
      table_name: entry.table_name,
      record_id: entry.record_id,
      action: entry.action,
      changed_fields: entry.changed_fields || [],
      old_values: entry.old_values || {},
      new_values: entry.new_values || {},
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      created_at: entry.created_at,
      user: entry.profiles ? {
        id: entry.user_id,
        email: entry.profiles.email,
        name: entry.profiles.full_name
      } : null
    }))

    // Buscar estatísticas de auditoria
    const auditStats = await auditSystem.getAuditStats(
      profile.role !== 'admin' ? profile.agency_id : undefined,
      30
    )

    return NextResponse.json({
      success: true,
      audit_entries: formattedEntries,
      statistics: auditStats,
      pagination: {
        limit,
        offset,
        total: formattedEntries.length,
        has_more: formattedEntries.length === limit
      }
    })

  } catch (error) {
    console.error('Erro ao buscar trilha de auditoria:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}