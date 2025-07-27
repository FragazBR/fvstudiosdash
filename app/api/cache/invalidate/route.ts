import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { redisCache } from '@/lib/redis-cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Invalidar cache por padrão ou tags
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

    // Verificar permissões
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para invalidar cache' }, { status: 403 })
    }

    const body = await request.json()
    const { pattern, tags, key } = body

    let invalidatedCount = 0

    if (key) {
      // Invalidar chave específica
      const success = await redisCache.delete(key)
      invalidatedCount = success ? 1 : 0
    } else if (tags && Array.isArray(tags)) {
      // Invalidar por tags
      invalidatedCount = await redisCache.invalidateByTags(tags)
    } else if (pattern) {
      // Invalidar por padrão (apenas para admins)
      if (profile.role !== 'admin') {
        return NextResponse.json({ 
          error: 'Apenas administradores podem invalidar por padrão' 
        }, { status: 403 })
      }
      
      // Implementar invalidação por padrão se necessário
      // Por segurança, limitamos alguns padrões específicos
      const allowedPatterns = [
        `fvstudios:agency:${profile.agency_id}:*`,
        `fvstudios:user:${user.id}:*`,
        'fvstudios:external:*',
        'fvstudios:metrics:*'
      ]
      
      if (!allowedPatterns.some(allowed => pattern.startsWith(allowed.replace('*', '')))) {
        return NextResponse.json({ 
          error: 'Padrão de invalidação não permitido' 
        }, { status: 400 })
      }
      
      // Para este exemplo, invalidar cache da agência
      if (pattern.includes('agency')) {
        invalidatedCount = await redisCache.invalidateAgency(profile.agency_id)
      }
    } else {
      return NextResponse.json({ 
        error: 'Especifique key, tags ou pattern para invalidação' 
      }, { status: 400 })
    }

    // Log da ação
    console.log(`Cache invalidation por ${profile.role} ${user.id}: ${JSON.stringify({ pattern, tags, key, invalidatedCount })}`)

    // Registrar ação para auditoria
    await supabase
      .from('system_logs')
      .insert({
        user_id: user.id,
        agency_id: profile.agency_id,
        action: 'cache_invalidation',
        details: {
          pattern,
          tags,
          key,
          invalidated_count: invalidatedCount,
          timestamp: new Date().toISOString()
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      })
      .catch(error => console.warn('Erro ao registrar log:', error))

    return NextResponse.json({
      success: true,
      message: `Cache invalidado: ${invalidatedCount} ${invalidatedCount === 1 ? 'chave removida' : 'chaves removidas'}`,
      invalidated_count: invalidatedCount
    })

  } catch (error) {
    console.error('Erro na invalidação do cache:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}