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

    const { data: variables, error } = await supabase
      .from('template_variables')
      .select('*')
      .eq('template_id', templateId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Erro ao buscar variáveis:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar variáveis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: variables
    })

  } catch (error) {
    console.error('Erro ao listar variáveis:', error)
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
      variable_name,
      variable_key,
      description,
      data_type = 'string',
      default_value,
      is_required = false,
      validation_rules,
      possible_values,
      input_type = 'text',
      input_properties,
      category,
      group_name,
      display_order = 0
    } = body

    if (!template_id || !variable_name || !variable_key) {
      return NextResponse.json(
        { error: 'template_id, variable_name e variable_key são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: variable, error } = await supabase
      .from('template_variables')
      .insert({
        template_id,
        variable_name,
        variable_key,
        description,
        data_type,
        default_value,
        is_required,
        validation_rules,
        possible_values,
        input_type,
        input_properties,
        category,
        group_name,
        display_order,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar variável:', error)
      return NextResponse.json(
        { error: 'Erro ao criar variável' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: variable
    })

  } catch (error) {
    console.error('Erro ao criar variável:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}