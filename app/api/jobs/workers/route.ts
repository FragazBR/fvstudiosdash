import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const environment = searchParams.get('environment')

    let query = supabase
      .from('job_workers')
      .select('*')
      .order('last_heartbeat', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (environment) {
      query = query.eq('environment', environment)
    }

    const { data: workers, error } = await query

    if (error) {
      console.error('Erro ao buscar workers:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar workers' },
        { status: 500 }
      )
    }

    // Marcar workers como unhealthy se não enviaram heartbeat há mais de 2 minutos
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    const workersWithHealth = workers?.map(worker => ({
      ...worker,
      is_healthy: new Date(worker.last_heartbeat) > twoMinutesAgo
    })) || []

    return NextResponse.json({
      success: true,
      data: workersWithHealth
    })

  } catch (error) {
    console.error('Erro ao listar workers:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}