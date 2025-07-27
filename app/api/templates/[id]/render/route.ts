import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'
import { getTemplateEngine } from '@/lib/advanced-template-engine'

interface RouteParams {
  params: {
    id: string
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
    const {
      variables = {},
      data_sources = {},
      render_type = 'preview',
      device_type = 'desktop',
      user_context = {},
      locale = 'pt-BR',
      timezone = 'America/Sao_Paulo'
    } = body

    const templateEngine = getTemplateEngine()
    const renderResult = await templateEngine.renderTemplate(
      params.id,
      {
        variables,
        data_sources,
        user_context,
        device_type,
        locale,
        timezone
      },
      render_type
    )

    return NextResponse.json({
      success: renderResult.success,
      data: renderResult.success ? {
        content: renderResult.content,
        format: renderResult.format,
        metadata: renderResult.metadata,
        render_time_ms: renderResult.render_time_ms,
        data_fetch_time_ms: renderResult.data_fetch_time_ms
      } : null,
      error: renderResult.error,
      error_details: renderResult.error_details
    })

  } catch (error) {
    console.error('Erro ao renderizar template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}