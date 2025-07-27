import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: queues, error } = await supabase
      .from('job_queues')
      .select('*')
      .order('name')

    if (error) {
      console.error('Erro ao buscar filas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar filas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: queues
    })

  } catch (error) {
    console.error('Erro ao listar filas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const {
      name,
      display_name,
      description,
      is_active = true,
      max_workers = 5,
      max_jobs_per_worker = 10,
      rate_limit_per_minute = 60,
      rate_limit_per_hour = 3600,
      default_max_attempts = 3,
      default_timeout_seconds = 300,
      retry_delay_base_seconds = 60,
      retry_delay_max_seconds = 3600,
      dead_letter_queue_name,
      dead_letter_after_attempts = 5,
      allowed_priorities = ['low', 'normal', 'high', 'critical'],
      retention_completed_hours = 168,
      retention_failed_hours = 720
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da fila é obrigatório' },
        { status: 400 }
      )
    }

    const { data: queue, error } = await supabase
      .from('job_queues')
      .insert({
        name,
        display_name,
        description,
        is_active,
        max_workers,
        max_jobs_per_worker,
        rate_limit_per_minute,
        rate_limit_per_hour,
        default_max_attempts,
        default_timeout_seconds,
        retry_delay_base_seconds,
        retry_delay_max_seconds,
        dead_letter_queue_name,
        dead_letter_after_attempts,
        allowed_priorities,
        retention_completed_hours,
        retention_failed_hours
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar fila:', error)
      return NextResponse.json(
        { error: 'Erro ao criar fila' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: queue
    })

  } catch (error) {
    console.error('Erro ao criar fila:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}