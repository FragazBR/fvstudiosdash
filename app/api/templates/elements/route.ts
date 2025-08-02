import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('template_id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'template_id é obrigatório' },
        { status: 400 }
      )
    }

    const { data: elements, error } = await supabase
      .from('template_elements')
      .select('*')
      .eq('template_id', templateId)
      .order('element_order', { ascending: true })

    if (error) {
      console.error('Erro ao buscar elementos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar elementos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: elements
    })

  } catch (error) {
    console.error('Erro ao listar elementos:', error)
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
      template_id,
      parent_element_id,
      element_order = 0,
      element_path,
      element_type,
      element_name,
      content = {},
      properties = {},
      conditions,
      data_binding,
      variables_used,
      mobile_properties,
      tablet_properties,
      desktop_properties,
      validation_rules,
      is_required = false
    } = body

    if (!template_id || !element_type) {
      return NextResponse.json(
        { error: 'template_id e element_type são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: element, error } = await supabase
      .from('template_elements')
      .insert({
        template_id,
        parent_element_id,
        element_order,
        element_path,
        element_type,
        element_name,
        content,
        properties,
        conditions,
        data_binding,
        variables_used,
        mobile_properties,
        tablet_properties,
        desktop_properties,
        validation_rules,
        is_required
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar elemento:', error)
      return NextResponse.json(
        { error: 'Erro ao criar elemento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: element
    })

  } catch (error) {
    console.error('Erro ao criar elemento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}