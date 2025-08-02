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
    const agencyId = searchParams.get('agency_id')

    // Buscar preferências do usuário
    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('agency_id', agencyId || null)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar preferências:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar preferências' },
        { status: 500 }
      )
    }

    // Se não existir, retornar preferências padrão
    if (!preferences) {
      const defaultPreferences = {
        user_id: user.id,
        agency_id: agencyId,
        enabled: true,
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        whatsapp_notifications: false,
        event_preferences: {},
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00:00',
        quiet_hours_end: '08:00:00',
        timezone: 'America/Sao_Paulo',
        digest_enabled: false,
        digest_frequency: 'daily',
        digest_time: '09:00:00'
      }

      return NextResponse.json({
        success: true,
        data: defaultPreferences
      })
    }

    return NextResponse.json({
      success: true,
      data: preferences
    })

  } catch (error) {
    console.error('Erro ao buscar preferências de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      agency_id,
      enabled,
      email_notifications,
      push_notifications,
      sms_notifications,
      whatsapp_notifications,
      event_preferences,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
      timezone,
      digest_enabled,
      digest_frequency,
      digest_time
    } = body

    // Upsert (insert ou update) das preferências
    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: user.id,
        agency_id: agency_id || null,
        enabled: enabled !== undefined ? enabled : true,
        email_notifications: email_notifications !== undefined ? email_notifications : true,
        push_notifications: push_notifications !== undefined ? push_notifications : true,
        sms_notifications: sms_notifications !== undefined ? sms_notifications : false,
        whatsapp_notifications: whatsapp_notifications !== undefined ? whatsapp_notifications : false,
        event_preferences: event_preferences || {},
        quiet_hours_enabled: quiet_hours_enabled !== undefined ? quiet_hours_enabled : false,
        quiet_hours_start: quiet_hours_start || '22:00:00',
        quiet_hours_end: quiet_hours_end || '08:00:00',
        timezone: timezone || 'America/Sao_Paulo',
        digest_enabled: digest_enabled !== undefined ? digest_enabled : false,
        digest_frequency: digest_frequency || 'daily',
        digest_time: digest_time || '09:00:00',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,agency_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar preferências:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar preferências' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: preferences,
      message: 'Preferências atualizadas com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar preferências de notificação:', error)
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
    const agencyId = searchParams.get('agency_id')

    // Deletar preferências do usuário
    const { error } = await supabase
      .from('user_notification_preferences')
      .delete()
      .eq('user_id', user.id)
      .eq('agency_id', agencyId || null)

    if (error) {
      console.error('Erro ao deletar preferências:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar preferências' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Preferências removidas com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar preferências de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}