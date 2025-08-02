import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'
import { getTemplateEngine } from '@/lib/advanced-template-engine'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('template_type')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const isPublic = searchParams.get('is_public')
    const agencyId = searchParams.get('agency_id')
    const tags = searchParams.get('tags')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const templateEngine = getTemplateEngine()
    const templates = await templateEngine.listTemplates({
      template_type: templateType as any,
      status: status as any,
      category: category || undefined,
      is_public: isPublic !== null ? isPublic === 'true' : undefined,
      agency_id: agencyId || undefined,
      tags: tags || undefined,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: templates
    })

  } catch (error) {
    console.error('Erro ao listar templates:', error)
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
      name,
      description,
      category,
      tags,
      template_type,
      structure,
      variables,
      styles,
      responsive_config,
      email_settings,
      whatsapp_settings,
      slack_settings,
      social_media_settings,
      is_public = false,
      agency_id
    } = body

    if (!name || !template_type) {
      return NextResponse.json(
        { error: 'Nome e tipo de template são obrigatórios' },
        { status: 400 }
      )
    }

    const templateEngine = getTemplateEngine()
    const templateId = await templateEngine.createTemplate({
      name,
      description,
      category,
      tags,
      template_type,
      structure: structure || { elements: [] },
      variables: variables || [],
      styles: styles || {},
      responsive_config: responsive_config || {},
      email_settings,
      whatsapp_settings,
      slack_settings,
      social_media_settings,
      is_public,
      created_by: user.id,
      agency_id
    })

    if (!templateId) {
      return NextResponse.json(
        { error: 'Erro ao criar template' },
        { status: 500 }
      )
    }

    const template = await templateEngine.getTemplate(templateId)

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('Erro ao criar template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}