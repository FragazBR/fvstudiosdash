import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'
import { pushNotificationManager } from '@/lib/realtime-notifications'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { subscription, device_info, agency_id } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Dados de subscription inválidos' },
        { status: 400 }
      )
    }

    // Registrar subscription usando o PushNotificationManager
    const subscriptionId = await pushNotificationManager.registerPushSubscription(
      user.id,
      agency_id || null,
      subscription,
      device_info
    )

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Erro ao registrar subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription_id: subscriptionId,
        message: 'Subscription registrada com sucesso'
      }
    })

  } catch (error) {
    console.error('Erro ao registrar push subscription:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Obter subscriptions do usuário
    const subscriptions = await pushNotificationManager.getUserSubscriptions(user.id)

    return NextResponse.json({
      success: true,
      data: subscriptions
    })

  } catch (error) {
    console.error('Erro ao buscar subscriptions:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscription_id')
    const endpoint = searchParams.get('endpoint')

    if (!subscriptionId && !endpoint) {
      return NextResponse.json(
        { error: 'subscription_id ou endpoint é obrigatório' },
        { status: 400 }
      )
    }

    // Desativar subscription
    let query = supabase
      .from('notification_subscriptions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (subscriptionId) {
      query = query.eq('id', subscriptionId)
    } else if (endpoint) {
      query = query.eq('endpoint', endpoint)
    }

    const { error } = await query

    if (error) {
      console.error('Erro ao desativar subscription:', error)
      return NextResponse.json(
        { error: 'Erro ao desativar subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription desativada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao desativar subscription:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}