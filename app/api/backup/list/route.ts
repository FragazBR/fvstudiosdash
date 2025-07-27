import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { backupRecoveryManager } from '@/lib/backup-recovery-system'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Listar backups da agência
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const status = searchParams.get('status')
    const backup_type = searchParams.get('backup_type')

    // Buscar backups com filtros
    let query = supabase
      .from('backup_records')
      .select(`
        id,
        backup_type,
        file_size,
        status,
        started_at,
        completed_at,
        error_message,
        metadata,
        created_by,
        profiles!created_by(email, full_name)
      `)
      .eq('agency_id', profile.agency_id)
      .order('started_at', { ascending: false })
      .limit(limit)

    // Aplicar filtros
    if (status && ['pending', 'running', 'completed', 'failed'].includes(status)) {
      query = query.eq('status', status)
    }

    if (backup_type && ['full', 'incremental', 'critical_only'].includes(backup_type)) {
      query = query.eq('backup_type', backup_type)
    }

    const { data: backups, error } = await query

    if (error) {
      console.error('Erro ao buscar backups:', error)
      return NextResponse.json({ error: 'Erro ao buscar backups' }, { status: 500 })
    }

    // Buscar estatísticas de backup
    const { data: stats } = await supabase
      .from('backup_statistics')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .single()

    // Formatar dados de backup
    const formattedBackups = (backups || []).map(backup => ({
      id: backup.id,
      backup_type: backup.backup_type,
      file_size: backup.file_size,
      file_size_mb: backup.file_size ? Math.round(backup.file_size / 1024 / 1024 * 100) / 100 : 0,
      status: backup.status,
      started_at: backup.started_at,
      completed_at: backup.completed_at,
      duration_seconds: backup.completed_at && backup.started_at 
        ? Math.round((new Date(backup.completed_at).getTime() - new Date(backup.started_at).getTime()) / 1000)
        : null,
      error_message: backup.error_message,
      metadata: backup.metadata,
      created_by: {
        email: backup.profiles?.email,
        name: backup.profiles?.full_name
      }
    }))

    return NextResponse.json({
      success: true,
      backups: formattedBackups,
      statistics: stats || {
        total_backups: 0,
        successful_backups: 0,
        failed_backups: 0,
        running_backups: 0,
        avg_duration_seconds: 0,
        total_backup_size: 0,
        last_backup_time: null,
        backups_last_7_days: 0,
        backups_last_30_days: 0
      },
      pagination: {
        limit,
        total: formattedBackups.length
      }
    })

  } catch (error) {
    console.error('Erro ao listar backups:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}