import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { globalSettings } from '@/lib/global-settings'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const settingId = searchParams.get('setting_id')
    const agencyId = searchParams.get('agency_id') || profile.agency_id
    const settingType = searchParams.get('setting_type') as 'global' | 'agency' | undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

    // Verificar permissões
    const isAdmin = profile.role === 'admin'
    const canViewGlobal = isAdmin
    const canViewAgency = isAdmin || (agencyId && profile.agency_id === agencyId && 
                         ['agency_owner', 'agency_manager'].includes(profile.role))

    if (settingType === 'global' && !canViewGlobal) {
      return NextResponse.json({ 
        error: 'Acesso negado para histórico de configurações globais' 
      }, { status: 403 })
    }

    if (settingType === 'agency' && !canViewAgency) {
      return NextResponse.json({ 
        error: 'Acesso negado para histórico de configurações da agência' 
      }, { status: 403 })
    }

    // Se não especificou tipo, determinar baseado nas permissões
    let finalSettingType = settingType
    let finalAgencyId = agencyId

    if (!finalSettingType) {
      if (canViewGlobal && !agencyId) {
        finalSettingType = 'global'
        finalAgencyId = undefined
      } else if (canViewAgency) {
        finalSettingType = 'agency'
      }
    }

    // Buscar histórico de configurações
    const history = await globalSettings.getSettingsHistory(
      settingId || undefined,
      finalAgencyId || undefined,
      finalSettingType,
      limit
    )

    // Buscar informações dos usuários que fizeram as mudanças
    const userIds = [...new Set(history.map(h => h.changed_by).filter(Boolean))]
    let users: Record<string, any> = {}

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', userIds)

      if (usersData) {
        users = usersData.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as Record<string, any>)
      }
    }

    // Enriquecer dados do histórico com informações dos usuários
    const enrichedHistory = history.map(item => ({
      ...item,
      changed_by_user: item.changed_by ? users[item.changed_by] : null
    }))

    return NextResponse.json({
      success: true,
      history: enrichedHistory,
      filters: {
        setting_id: settingId,
        agency_id: finalAgencyId,
        setting_type: finalSettingType,
        limit
      },
      total: enrichedHistory.length
    })

  } catch (error) {
    console.error('Erro ao buscar histórico de configurações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}