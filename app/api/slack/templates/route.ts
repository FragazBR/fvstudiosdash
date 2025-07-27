import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Listar templates de mensagem
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')
    const eventType = searchParams.get('event_type')
    const includeSystem = searchParams.get('include_system') === 'true'

    let query = supabase
      .from('slack_message_templates')
      .select('*')
      .eq('is_active', true)
      .order('is_system_template', { ascending: true })
      .order('name', { ascending: true })

    if (agencyId && !includeSystem) {
      query = query.eq('agency_id', agencyId)
    } else if (agencyId && includeSystem) {
      query = query.or(`agency_id.eq.${agencyId},is_system_template.eq.true`)
    } else if (includeSystem) {
      query = query.eq('is_system_template', true)
    }

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar template de mensagem
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      agency_id,
      name,
      description,
      event_type,
      message_format,
      template_text,
      template_blocks,
      use_threading,
      mention_users,
      mention_channels,
      created_by
    } = body

    // Validação básica
    if (!name || !event_type || !message_format) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios: name, event_type, message_format' },
        { status: 400 }
      )
    }

    if (message_format === 'blocks' && !template_blocks) {
      return NextResponse.json(
        { success: false, error: 'template_blocks é obrigatório para message_format = blocks' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('slack_message_templates')
      .insert({
        agency_id,
        name,
        description,
        event_type,
        message_format,
        template_text,
        template_blocks,
        use_threading: use_threading || false,
        mention_users: mention_users || [],
        mention_channels: mention_channels || [],
        is_system_template: false,
        created_by
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar template:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}