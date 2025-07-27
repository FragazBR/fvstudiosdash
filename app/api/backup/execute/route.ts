import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { backupRecoveryManager } from '@/lib/backup-recovery-system'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Executar backup manual ou agendado
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

    // Verificar permissões
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para executar backup' }, { status: 403 })
    }

    const body = await request.json()
    const { backup_type, manual = true } = body

    // Validar tipo de backup
    if (!backup_type || !['full', 'incremental', 'critical_only'].includes(backup_type)) {
      return NextResponse.json({ 
        error: 'Tipo de backup inválido. Use: full, incremental, ou critical_only' 
      }, { status: 400 })
    }

    // Verificar se já existe backup em execução
    const { data: runningBackups } = await supabase
      .from('backup_records')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('status', 'running')
      .limit(1)

    if (runningBackups && runningBackups.length > 0) {
      return NextResponse.json({ 
        error: 'Já existe um backup em execução para esta agência' 
      }, { status: 409 })
    }

    // Executar backup
    const backupId = await backupRecoveryManager.executeBackup(
      profile.agency_id,
      backup_type,
      user.id,
      manual
    )

    if (!backupId) {
      return NextResponse.json({ 
        error: 'Erro ao iniciar processo de backup' 
      }, { status: 500 })
    }

    // Log da ação
    console.log(`Backup ${backup_type} iniciado por ${profile.role} ${user.id} para agência ${profile.agency_id}`)

    // Registrar ação para auditoria
    await supabase
      .from('system_logs')
      .insert({
        user_id: user.id,
        agency_id: profile.agency_id,
        action: 'backup_initiated',
        details: {
          backup_id: backupId,
          backup_type,
          manual,
          timestamp: new Date().toISOString()
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      })
      .catch(error => console.warn('Erro ao registrar log:', error))

    return NextResponse.json({
      success: true,
      message: `Backup ${backup_type} iniciado com sucesso`,
      backup_id: backupId,
      backup_type,
      status: 'pending'
    })

  } catch (error) {
    console.error('Erro ao executar backup:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}