import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é o admin principal por email OU tem permissões admin
    const isMainAdmin = user.email === 'franco@fvstudios.com.br'
    
    if (!isMainAdmin) {
      const { data: permissions } = await supabase
        .from('user_agency_permissions')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!permissions || !['admin', 'agency_owner'].includes(permissions.role)) {
        return NextResponse.json({ 
          error: 'Acesso negado. Apenas o admin principal ou usuários com permissões admin podem listar agências.' 
        }, { status: 403 })
      }
    }

    console.log('🏢 Buscando agências...')
    
    const adminClient = supabaseAdmin()
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const search = url.searchParams.get('search') || ''

    // Buscar agências
    let query = adminClient
      .from('agencies')
      .select(`
        id,
        name,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        website,
        description,
        status,
        created_at,
        updated_at,
        created_by
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtro de busca se fornecido
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: agencies, error: agenciesError } = await query
      .range(offset, offset + limit - 1)

    if (agenciesError) {
      console.error('❌ Erro ao buscar agências:', agenciesError)
      return NextResponse.json({ 
        error: 'Erro ao buscar agências',
        details: agenciesError.message
      }, { status: 500 })
    }

    console.log(`✅ Encontradas ${agencies?.length || 0} agências`)

    // Buscar estatísticas das agências (quantidade de usuários por agência)
    const agencyIds = agencies?.map(a => a.id) || []
    const { data: userCounts } = await adminClient
      .from('user_agency_permissions')
      .select('agency_id')
      .in('agency_id', agencyIds)

    // Contar usuários por agência
    const userCountsByAgency = userCounts?.reduce((acc, item) => {
      acc[item.agency_id] = (acc[item.agency_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Enriquecer dados das agências
    const enrichedAgencies = agencies?.map(agency => ({
      ...agency,
      user_count: userCountsByAgency[agency.id] || 0
    })) || []

    // Estatísticas gerais
    const stats = {
      total_agencies: agencies?.length || 0,
      active_agencies: agencies?.filter(a => a.status === 'active').length || 0,
      total_users_in_agencies: Object.values(userCountsByAgency).reduce((sum, count) => sum + count, 0)
    }

    return NextResponse.json({
      success: true,
      agencies: enrichedAgencies,
      total: agencies?.length || 0,
      stats,
      pagination: {
        offset,
        limit,
        has_more: (agencies?.length || 0) === limit
      }
    })

  } catch (error) {
    console.error('❌ Erro na listagem de agências:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}