import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role, permissions')
      .eq('user_id', user.id)
      .single()

    if (!permissions || permissions.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas admins podem acessar.' 
      }, { status: 403 })
    }

    // Redirecionar para a API de listagem
    return NextResponse.redirect(new URL('/api/admin/users/list', request.url))

  } catch (error) {
    console.error('Erro na API de usuários admin:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      redirect: '/api/admin/users/list'
    }, { status: 500 })
  }
}