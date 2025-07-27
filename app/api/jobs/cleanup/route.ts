import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'
import { getJobQueue } from '@/lib/job-queue'

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const jobQueue = getJobQueue()
    const deletedCount = await jobQueue.cleanupOldJobs()

    return NextResponse.json({
      success: true,
      data: {
        deleted_jobs: deletedCount,
        message: `${deletedCount} jobs antigos foram removidos`
      }
    })

  } catch (error) {
    console.error('Erro ao executar limpeza:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}