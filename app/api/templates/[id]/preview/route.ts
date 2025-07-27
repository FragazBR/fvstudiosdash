import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getTemplateEngine } from '@/lib/advanced-template-engine'

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

    const templateEngine = getTemplateEngine()
    const previewResult = await templateEngine.previewTemplate(params.id)

    return NextResponse.json({
      success: previewResult.success,
      data: previewResult.success ? {
        content: previewResult.content,
        format: previewResult.format,
        metadata: previewResult.metadata,
        render_time_ms: previewResult.render_time_ms
      } : null,
      error: previewResult.error,
      error_details: previewResult.error_details
    })

  } catch (error) {
    console.error('Erro ao gerar preview do template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { sample_data = {} } = body

    const templateEngine = getTemplateEngine()
    const previewResult = await templateEngine.previewTemplate(params.id, sample_data)

    return NextResponse.json({
      success: previewResult.success,
      data: previewResult.success ? {
        content: previewResult.content,
        format: previewResult.format,
        metadata: previewResult.metadata,
        render_time_ms: previewResult.render_time_ms
      } : null,
      error: previewResult.error,
      error_details: previewResult.error_details
    })

  } catch (error) {
    console.error('Erro ao gerar preview do template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}