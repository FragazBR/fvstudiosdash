import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getMLEngine } from '@/lib/ml-prediction-engine'

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

    const mlEngine = getMLEngine()
    const model = await mlEngine.getModel(params.id)

    if (!model) {
      return NextResponse.json(
        { error: 'Modelo não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: model
    })

  } catch (error) {
    console.error('Erro ao buscar modelo ML:', error)
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

    const { error } = await supabase
      .from('ml_models')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      console.error('Erro ao atualizar modelo:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar modelo' },
        { status: 500 }
      )
    }

    const mlEngine = getMLEngine()
    const updatedModel = await mlEngine.getModel(params.id)

    return NextResponse.json({
      success: true,
      data: updatedModel
    })

  } catch (error) {
    console.error('Erro ao atualizar modelo ML:', error)
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

    // Verificar se é admin ou owner do modelo
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'agency_owner', 'agency_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { error } = await supabase
      .from('ml_models')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Erro ao deletar modelo:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar modelo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Modelo deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar modelo ML:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}