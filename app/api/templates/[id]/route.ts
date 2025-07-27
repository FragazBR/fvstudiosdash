import { createServerSupabaseClient } from '@/lib/supabaseServer'
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
    const template = await templateEngine.getTemplate(params.id)

    if (!template) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('Erro ao buscar template:', error)
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
    const templateEngine = getTemplateEngine()

    // Verificar se o template existe
    const existingTemplate = await templateEngine.getTemplate(params.id)
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    const success = await templateEngine.updateTemplate(params.id, body)

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao atualizar template' },
        { status: 500 }
      )
    }

    const updatedTemplate = await templateEngine.getTemplate(params.id)

    return NextResponse.json({
      success: true,
      data: updatedTemplate
    })

  } catch (error) {
    console.error('Erro ao atualizar template:', error)
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

    const templateEngine = getTemplateEngine()

    // Verificar se o template existe
    const existingTemplate = await templateEngine.getTemplate(params.id)
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    const success = await templateEngine.deleteTemplate(params.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao deletar template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}