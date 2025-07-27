import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Buscar logs com filtros avançados
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

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')?.split(',') // error,warn,info
    const category = searchParams.get('category')?.split(',') // api,auth,system
    const search = searchParams.get('search')
    const user_id = searchParams.get('user_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir query base
    let query = supabase
      .from('system_logs')
      .select(`
        id,
        level,
        category,
        message,
        details,
        user_id,
        agency_id,
        session_id,
        ip_address,
        user_agent,
        request_id,
        duration_ms,
        stack_trace,
        created_at,
        profiles!user_id(email, full_name)
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros de segurança (RLS não funciona com service role key)
    if (profile.role !== 'admin') {
      query = query.eq('agency_id', profile.agency_id)
    }

    // Aplicar filtros
    if (level && level.length > 0) {
      query = query.in('level', level)
    }

    if (category && category.length > 0) {
      query = query.in('category', category)
    }

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    if (start_date) {
      query = query.gte('created_at', start_date)
    }

    if (end_date) {
      query = query.lte('created_at', end_date)
    }

    if (search) {
      query = query.or(`message.ilike.%${search}%,details->>'error'.ilike.%${search}%`)
    }

    // Aplicar paginação
    if (offset > 0) {
      query = query.range(offset, offset + limit - 1)
    } else {
      query = query.limit(limit)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('Erro ao buscar logs:', error)
      return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 })
    }

    // Buscar contagem total para paginação
    let countQuery = supabase
      .from('system_logs')
      .select('id', { count: 'exact' })

    if (profile.role !== 'admin') {
      countQuery = countQuery.eq('agency_id', profile.agency_id)
    }

    if (level && level.length > 0) {
      countQuery = countQuery.in('level', level)
    }

    if (category && category.length > 0) {
      countQuery = countQuery.in('category', category)
    }

    if (user_id) {
      countQuery = countQuery.eq('user_id', user_id)
    }

    if (start_date) {
      countQuery = countQuery.gte('created_at', start_date)
    }

    if (end_date) {
      countQuery = countQuery.lte('created_at', end_date)
    }

    if (search) {
      countQuery = countQuery.or(`message.ilike.%${search}%,details->>'error'.ilike.%${search}%`)
    }

    const { count } = await countQuery

    // Formatar logs
    const formattedLogs = (logs || []).map(log => ({
      id: log.id,
      level: log.level,
      category: log.category,
      message: log.message,
      details: log.details,
      duration_ms: log.duration_ms,
      session_id: log.session_id,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      request_id: log.request_id,
      stack_trace: log.stack_trace,
      created_at: log.created_at,
      user: log.profiles ? {
        id: log.user_id,
        email: log.profiles.email,
        name: log.profiles.full_name
      } : null
    }))

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        limit,
        offset,
        total: count || 0,
        has_more: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Erro ao buscar logs:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}