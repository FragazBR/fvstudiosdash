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

    // Verificar se é admin - usar first() ao invés de single()
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role, agency_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    // Verificar se é o admin principal por email OU tem permissões admin
    const isMainAdmin = user.email === 'franco@fvstudios.com.br'
    const hasAdminPermissions = permissions && ['admin', 'agency_owner'].includes(permissions.role)
    
    if (!isMainAdmin && !hasAdminPermissions) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas admins podem acessar esta funcionalidade.',
        debug: {
          email: user.email,
          isMainAdmin,
          permissions: permissions?.role || 'none'
        }
      }, { status: 403 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const search = url.searchParams.get('search') || ''
    const role = url.searchParams.get('role') || ''
    const agency_id = url.searchParams.get('agency_id') || ''

    console.log('🔍 Buscando usuários do Supabase Auth via REST API...')
    
    // Buscar usuários usando REST API diretamente
    const adminClient = supabaseAdmin()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${Math.floor(offset / 50) + 1}&per_page=${Math.min(limit, 100)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Erro ao buscar usuários via API:', errorData)
      return NextResponse.json({ 
        error: 'Erro ao buscar usuários do sistema de autenticação', 
        details: errorData
      }, { status: 500 })
    }
    
    const authData = await response.json()
    const authUsers = { users: authData.users || [] }

    console.log(`✅ Encontrados ${authUsers.users.length} usuários no Auth`)

    // Buscar permissões dos usuários com tratamento de erro
    const userIds = authUsers.users.map(u => u.id)
    console.log(`🔍 Buscando permissões para ${userIds.length} usuários...`)
    
    const { data: userPermissions, error: permError } = await adminClient
      .from('user_agency_permissions')
      .select(`
        user_id,
        role,
        agency_id,
        agencies(name)
      `)
      .in('user_id', userIds)

    if (permError) {
      console.error('⚠️ Erro ao buscar permissões (continuando sem elas):', permError)
    }

    console.log(`✅ Encontradas ${userPermissions?.length || 0} permissões`)

    // Combinar dados
    let users = authUsers.users.map(authUser => {
      const permission = userPermissions?.find(p => p.user_id === authUser.id)
      const name = authUser.user_metadata?.name || authUser.email

      return {
        id: authUser.id,
        email: authUser.email,
        name,
        role: permission?.role || 'client',
        agency_id: permission?.agency_id || null,
        agency_name: permission?.agencies?.name || null,
        company: authUser.user_metadata?.company || null,
        phone: authUser.user_metadata?.phone || null,
        email_confirmed: !!authUser.email_confirmed_at,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        created_by_admin: authUser.user_metadata?.created_by_admin || false
      }
    })

    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase()
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.company && user.company.toLowerCase().includes(searchLower))
      )
    }

    if (role) {
      users = users.filter(user => user.role === role)
    }

    if (agency_id) {
      users = users.filter(user => user.agency_id === agency_id)
    }

    // Se não é admin global, mostrar apenas usuários da mesma agência
    if (permissions && permissions.role === 'agency_owner' && permissions.agency_id) {
      users = users.filter(user => 
        user.agency_id === permissions.agency_id || user.role === 'admin'
      )
    }

    // Estatísticas
    const stats = {
      total_users: users.length,
      active_users: users.filter(u => u.email_confirmed).length,
      by_role: users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recent_signups: users.filter(u => {
        const createdAt = new Date(u.created_at)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return createdAt > sevenDaysAgo
      }).length
    }

    return NextResponse.json({
      users: users.slice(offset, offset + limit),
      total: users.length,
      stats,
      pagination: {
        offset,
        limit,
        has_more: offset + limit < users.length
      }
    })

  } catch (error) {
    console.error('Erro no endpoint de listagem:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}