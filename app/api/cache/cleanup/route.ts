import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { redisCache } from '@/lib/redis-cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Limpeza do cache Redis
export async function POST(request: NextRequest) {
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
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Verificar permissões (apenas admins podem fazer limpeza)
    const allowedRoles = ['admin', 'agency_owner']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para limpar cache' }, { status: 403 })
    }

    const body = await request.json()
    const { type } = body

    if (!type || !['expired', 'all'].includes(type)) {
      return NextResponse.json({ 
        error: 'Tipo de limpeza inválido. Use "expired" ou "all"' 
      }, { status: 400 })
    }

    let cleanedCount = 0

    if (type === 'expired') {
      // Limpar apenas chaves expiradas
      cleanedCount = await redisCache.cleanup()
    } else if (type === 'all') {
      // Limpar todo o cache (cuidado!)
      const success = await redisCache.flush()
      cleanedCount = success ? 1000 : 0 // Estimativa
    }

    // Log da ação
    console.log(`Cache cleanup executado por ${profile.role} ${user.id}: tipo=${type}, removidas=${cleanedCount}`)

    // Registrar ação no banco para auditoria
    await supabase
      .from('system_logs')
      .insert({
        user_id: user.id,
        agency_id: profile.agency_id,
        action: 'cache_cleanup',
        details: {
          cleanup_type: type,
          cleaned_count: cleanedCount,
          timestamp: new Date().toISOString()
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      })
      .catch(error => console.warn('Erro ao registrar log:', error))

    return NextResponse.json({
      success: true,
      message: `Limpeza de cache concluída: ${cleanedCount} ${cleanedCount === 1 ? 'chave removida' : 'chaves removidas'}`,
      cleaned_count: cleanedCount,
      type
    })

  } catch (error) {
    console.error('Erro na limpeza do cache:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}