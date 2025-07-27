import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Listar pontos de recuperação da agência
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

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const status = searchParams.get('status')

    // Buscar pontos de recuperação
    let query = supabase
      .from('recovery_points')
      .select(`
        id,
        backup_id,
        recovery_type,
        target_timestamp,
        tables_to_restore,
        status,
        progress_percentage,
        estimated_completion,
        error_message,
        created_at,
        profiles!created_by(email, full_name)
      `)
      .eq('agency_id', profile.agency_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Aplicar filtro de status se fornecido
    if (status && ['pending', 'running', 'completed', 'failed'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: recoveryPoints, error } = await query

    if (error) {
      console.error('Erro ao buscar pontos de recuperação:', error)
      return NextResponse.json({ error: 'Erro ao buscar pontos de recuperação' }, { status: 500 })
    }

    // Formatar dados
    const formattedRecoveryPoints = (recoveryPoints || []).map(recovery => ({
      id: recovery.id,
      backup_id: recovery.backup_id,
      recovery_type: recovery.recovery_type,
      target_timestamp: recovery.target_timestamp,
      tables_to_restore: recovery.tables_to_restore,
      status: recovery.status,
      progress_percentage: recovery.progress_percentage,
      estimated_completion: recovery.estimated_completion,
      error_message: recovery.error_message,
      created_at: recovery.created_at,
      duration_seconds: recovery.estimated_completion 
        ? Math.round((new Date(recovery.estimated_completion).getTime() - new Date(recovery.created_at).getTime()) / 1000)
        : null,
      created_by: {
        email: recovery.profiles?.email,
        name: recovery.profiles?.full_name
      }
    }))

    return NextResponse.json({
      success: true,
      recovery_points: formattedRecoveryPoints,
      pagination: {
        limit,
        total: formattedRecoveryPoints.length
      }
    })

  } catch (error) {
    console.error('Erro ao listar pontos de recuperação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}