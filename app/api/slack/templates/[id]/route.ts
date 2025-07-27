import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar template específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('slack_message_templates')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Erro ao buscar template:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      message_format,
      template_text,
      template_blocks,
      use_threading,
      mention_users,
      mention_channels,
      is_active
    } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (message_format !== undefined) updateData.message_format = message_format
    if (template_text !== undefined) updateData.template_text = template_text
    if (template_blocks !== undefined) updateData.template_blocks = template_blocks
    if (use_threading !== undefined) updateData.use_threading = use_threading
    if (mention_users !== undefined) updateData.mention_users = mention_users
    if (mention_channels !== undefined) updateData.mention_channels = mention_channels
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('slack_message_templates')
      .update(updateData)
      .eq('id', params.id)
      .eq('is_system_template', false) // Apenas templates customizados podem ser editados
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Erro ao atualizar template:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('slack_message_templates')
      .delete()
      .eq('id', params.id)
      .eq('is_system_template', false) // Apenas templates customizados podem ser deletados

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar template' },
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
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}