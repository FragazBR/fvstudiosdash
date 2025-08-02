import { supabaseServer } from '@/lib/supabaseServer'
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
    const { new_name, new_category, agency_id } = body

    const templateEngine = getTemplateEngine()
    
    // Buscar template original
    const originalTemplate = await templateEngine.getTemplate(params.id)
    if (!originalTemplate) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    // Criar cópia do template
    const duplicatedTemplateId = await templateEngine.createTemplate({
      name: new_name || `${originalTemplate.name} (Cópia)`,
      description: originalTemplate.description,
      category: new_category || originalTemplate.category,
      tags: originalTemplate.tags,
      template_type: originalTemplate.template_type,
      structure: originalTemplate.structure,
      variables: originalTemplate.variables,
      styles: originalTemplate.styles,
      responsive_config: originalTemplate.responsive_config,
      email_settings: originalTemplate.email_settings,
      whatsapp_settings: originalTemplate.whatsapp_settings,
      slack_settings: originalTemplate.slack_settings,
      social_media_settings: originalTemplate.social_media_settings,
      is_public: false, // Cópias sempre começam como privadas
      created_by: user.id,
      agency_id: agency_id || originalTemplate.agency_id,
      parent_template_id: originalTemplate.id
    })

    if (!duplicatedTemplateId) {
      return NextResponse.json(
        { error: 'Erro ao duplicar template' },
        { status: 500 }
      )
    }

    const duplicatedTemplate = await templateEngine.getTemplate(duplicatedTemplateId)

    return NextResponse.json({
      success: true,
      data: duplicatedTemplate
    })

  } catch (error) {
    console.error('Erro ao duplicar template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}