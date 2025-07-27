import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

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

    const { data: insight, error } = await supabase
      .from('ml_insights')
      .select(`
        *,
        ml_models!related_model_id (
          name,
          model_type,
          prediction_type
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Erro ao buscar insight:', error)
      return NextResponse.json(
        { error: 'Insight não encontrado' },
        { status: 404 }
      )
    }

    // Incrementar contador de visualizações
    await supabase
      .from('ml_insights')
      .update({ view_count: (insight.view_count || 0) + 1 })
      .eq('id', params.id)

    return NextResponse.json({
      success: true,
      data: insight
    })

  } catch (error) {
    console.error('Erro ao buscar insight:', error)
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
    const { action } = body

    if (action === 'dismiss') {
      // Dispensar insight
      const { error } = await supabase
        .from('ml_insights')
        .update({
          is_dismissed: true,
          dismissed_by: user.id,
          dismissed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) {
        console.error('Erro ao dispensar insight:', error)
        return NextResponse.json(
          { error: 'Erro ao dispensar insight' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Insight dispensado com sucesso'
      })

    } else if (action === 'like') {
      // Curtir insight
      const { data: currentInsight } = await supabase
        .from('ml_insights')
        .select('like_count')
        .eq('id', params.id)
        .single()

      const { error } = await supabase
        .from('ml_insights')
        .update({
          like_count: (currentInsight?.like_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) {
        console.error('Erro ao curtir insight:', error)
        return NextResponse.json(
          { error: 'Erro ao curtir insight' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Insight curtido com sucesso'
      })

    } else if (action === 'share') {
      // Compartilhar insight
      const { data: currentInsight } = await supabase
        .from('ml_insights')
        .select('share_count')
        .eq('id', params.id)
        .single()

      const { error } = await supabase
        .from('ml_insights')
        .update({
          share_count: (currentInsight?.share_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) {
        console.error('Erro ao compartilhar insight:', error)
        return NextResponse.json(
          { error: 'Erro ao compartilhar insight' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Insight compartilhado com sucesso'
      })

    } else if (action === 'feature') {
      // Destacar insight (apenas admins)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['admin', 'agency_owner'].includes(profile.role)) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }

      const { error } = await supabase
        .from('ml_insights')
        .update({
          is_featured: body.is_featured || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) {
        console.error('Erro ao destacar insight:', error)
        return NextResponse.json(
          { error: 'Erro ao destacar insight' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Insight ${body.is_featured ? 'destacado' : 'removido dos destaques'} com sucesso`
      })

    } else {
      // Atualização geral do insight
      const { error } = await supabase
        .from('ml_insights')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) {
        console.error('Erro ao atualizar insight:', error)
        return NextResponse.json(
          { error: 'Erro ao atualizar insight' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Insight atualizado com sucesso'
      })
    }

  } catch (error) {
    console.error('Erro ao atualizar insight:', error)
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

    // Verificar se é admin ou owner
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'agency_owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { error } = await supabase
      .from('ml_insights')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Erro ao deletar insight:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar insight' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Insight deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar insight:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}