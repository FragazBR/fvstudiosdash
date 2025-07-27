import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getJobQueue } from '@/lib/job-queue'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queue = searchParams.get('queue')
    const status = searchParams.get('status')
    const jobType = searchParams.get('job_type')
    const agencyId = searchParams.get('agency_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const jobQueue = getJobQueue()
    const jobs = await jobQueue.listJobs({
      queue,
      status: status as any,
      jobType,
      agencyId,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: jobs
    })

  } catch (error) {
    console.error('Erro ao listar jobs:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      job_type,
      payload,
      queue = 'default',
      priority = 'normal',
      delay = 0,
      max_attempts = 3,
      timeout = 300,
      depends_on,
      parent_job_id,
      context,
      scheduled_at,
      agency_id
    } = body

    if (!job_type) {
      return NextResponse.json(
        { error: 'job_type é obrigatório' },
        { status: 400 }
      )
    }

    const jobQueue = getJobQueue()
    const jobId = await jobQueue.addJob(job_type, payload, {
      queue,
      priority,
      delay,
      maxAttempts: max_attempts,
      timeout,
      dependsOn: depends_on,
      parentJobId: parent_job_id,
      context,
      scheduledAt: scheduled_at ? new Date(scheduled_at) : undefined,
      createdBy: user.id,
      agencyId: agency_id
    })

    if (!jobId) {
      return NextResponse.json(
        { error: 'Erro ao criar job' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { id: jobId }
    })

  } catch (error) {
    console.error('Erro ao criar job:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}