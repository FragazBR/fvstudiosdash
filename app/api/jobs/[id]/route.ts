import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getJobQueue } from '@/lib/job-queue'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const jobQueue = getJobQueue()
    const job = await jobQueue.getJob(params.id)

    if (!job) {
      return NextResponse.json(
        { error: 'Job não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: job
    })

  } catch (error) {
    console.error('Erro ao buscar job:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    const jobQueue = getJobQueue()

    if (action === 'cancel') {
      const success = await jobQueue.cancelJob(params.id)
      
      if (!success) {
        return NextResponse.json(
          { error: 'Erro ao cancelar job' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Job cancelado com sucesso'
      })

    } else if (action === 'retry') {
      const success = await jobQueue.retryJob(params.id)
      
      if (!success) {
        return NextResponse.json(
          { error: 'Erro ao retentar job' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Job reagendado para retry'
      })

    } else {
      return NextResponse.json(
        { error: 'Ação não suportada' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erro ao atualizar job:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Cancelar job (não deletamos fisicamente por auditoria)
    const jobQueue = getJobQueue()
    const success = await jobQueue.cancelJob(params.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao deletar job' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Job deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar job:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}