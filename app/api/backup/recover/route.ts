import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { backupRecoveryManager } from '@/lib/backup-recovery-system'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Iniciar processo de recuperação
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

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Verificar permissões (apenas owners e admins podem fazer recovery)
    const allowedRoles = ['admin', 'agency_owner']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para executar recuperação' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      backup_id, 
      recovery_type, 
      tables_to_restore, 
      target_timestamp,
      confirm_overwrite = false 
    } = body

    // Validações
    if (!backup_id) {
      return NextResponse.json({ error: 'ID do backup é obrigatório' }, { status: 400 })
    }

    if (!recovery_type || !['full_restore', 'partial_restore', 'point_in_time'].includes(recovery_type)) {
      return NextResponse.json({ 
        error: 'Tipo de recuperação inválido. Use: full_restore, partial_restore, ou point_in_time' 
      }, { status: 400 })
    }

    if (recovery_type === 'partial_restore' && (!tables_to_restore || !Array.isArray(tables_to_restore))) {
      return NextResponse.json({ 
        error: 'Lista de tabelas é obrigatória para recuperação parcial' 
      }, { status: 400 })
    }

    if (!confirm_overwrite) {
      return NextResponse.json({ 
        error: 'Confirmação de sobrescrita é obrigatória (confirm_overwrite: true)' 
      }, { status: 400 })
    }

    // Verificar se já existe recuperação em execução
    const { data: runningRecoveries } = await supabase
      .from('recovery_points')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('status', 'running')
      .limit(1)

    if (runningRecoveries && runningRecoveries.length > 0) {
      return NextResponse.json({ 
        error: 'Já existe uma recuperação em execução para esta agência' 
      }, { status: 409 })
    }

    // Verificar se o backup existe e está completo
    const { data: backup, error: backupError } = await supabase
      .from('backup_records')
      .select('id, backup_type, status, started_at')
      .eq('id', backup_id)
      .eq('agency_id', profile.agency_id)
      .single()

    if (backupError || !backup) {
      return NextResponse.json({ 
        error: 'Backup não encontrado ou não pertence a esta agência' 
      }, { status: 404 })
    }

    if (backup.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Backup não está completo ou falhou' 
      }, { status: 400 })
    }

    // Preparar opções de recuperação
    const recoveryOptions: any = {
      confirmOverwrite: confirm_overwrite
    }

    if (recovery_type === 'partial_restore') {
      recoveryOptions.tablesToRestore = tables_to_restore
    }

    if (recovery_type === 'point_in_time' && target_timestamp) {
      recoveryOptions.targetTimestamp = new Date(target_timestamp)
    }

    // Iniciar processo de recuperação
    const recoveryId = await backupRecoveryManager.initiateRecovery(
      backup_id,
      profile.agency_id,
      recovery_type,
      user.id,
      recoveryOptions
    )

    if (!recoveryId) {
      return NextResponse.json({ 
        error: 'Erro ao iniciar processo de recuperação' 
      }, { status: 500 })
    }

    // Log da ação
    console.log(`Recuperação ${recovery_type} iniciada por ${profile.role} ${user.id} para backup ${backup_id}`)

    // Registrar ação para auditoria
    await supabase
      .from('system_logs')
      .insert({
        user_id: user.id,
        agency_id: profile.agency_id,
        action: 'recovery_initiated',
        details: {
          recovery_id: recoveryId,
          backup_id,
          recovery_type,
          tables_to_restore,
          target_timestamp,
          timestamp: new Date().toISOString()
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      })
      .catch(error => console.warn('Erro ao registrar log:', error))

    return NextResponse.json({
      success: true,
      message: `Recuperação ${recovery_type} iniciada com sucesso`,
      recovery_id: recoveryId,
      backup_id,
      recovery_type,
      status: 'pending'
    })

  } catch (error) {
    console.error('Erro ao iniciar recuperação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}