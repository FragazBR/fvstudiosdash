import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verificar status de backup ou recuperação
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
    const backup_id = searchParams.get('backup_id')
    const recovery_id = searchParams.get('recovery_id')

    if (!backup_id && !recovery_id) {
      return NextResponse.json({ 
        error: 'Especifique backup_id ou recovery_id para verificar status' 
      }, { status: 400 })
    }

    let result: any = {}

    // Verificar status de backup
    if (backup_id) {
      const { data: backup, error: backupError } = await supabase
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
          profiles!created_by(email, full_name)
        `)
        .eq('id', backup_id)
        .eq('agency_id', profile.agency_id)
        .single()

      if (backupError || !backup) {
        return NextResponse.json({ error: 'Backup não encontrado' }, { status: 404 })
      }

      // Calcular progresso estimado baseado no tempo
      let progress_percentage = 0
      if (backup.status === 'running') {
        const startTime = new Date(backup.started_at).getTime()
        const currentTime = Date.now()
        const elapsedMinutes = (currentTime - startTime) / (1000 * 60)
        
        // Estimativa baseada no tipo de backup
        const estimatedMinutes = backup.backup_type === 'full' ? 15 : 
                               backup.backup_type === 'incremental' ? 5 : 10
        
        progress_percentage = Math.min(Math.round((elapsedMinutes / estimatedMinutes) * 100), 95)
      } else if (backup.status === 'completed') {
        progress_percentage = 100
      } else if (backup.status === 'failed') {
        progress_percentage = 0
      }

      result.backup = {
        id: backup.id,
        backup_type: backup.backup_type,
        file_size: backup.file_size,
        file_size_mb: backup.file_size ? Math.round(backup.file_size / 1024 / 1024 * 100) / 100 : 0,
        status: backup.status,
        progress_percentage,
        started_at: backup.started_at,
        completed_at: backup.completed_at,
        duration_seconds: backup.completed_at 
          ? Math.round((new Date(backup.completed_at).getTime() - new Date(backup.started_at).getTime()) / 1000)
          : null,
        error_message: backup.error_message,
        metadata: backup.metadata,
        created_by: {
          email: backup.profiles?.email,
          name: backup.profiles?.full_name
        }
      }
    }

    // Verificar status de recuperação
    if (recovery_id) {
      const { data: recovery, error: recoveryError } = await supabase
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
        .eq('id', recovery_id)
        .eq('agency_id', profile.agency_id)
        .single()

      if (recoveryError || !recovery) {
        return NextResponse.json({ error: 'Ponto de recuperação não encontrado' }, { status: 404 })
      }

      result.recovery = {
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
      }
    }

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}