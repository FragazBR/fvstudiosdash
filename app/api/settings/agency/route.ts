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
    const agencyId = searchParams.get('agency_id') || profile.agency_id
    const category = searchParams.get('category')

    // Verificar permissões
    if (!agencyId) {
      return NextResponse.json({ error: 'ID da agência é obrigatório' }, { status: 400 })
    }

    const canAccess = profile.role === 'admin' || 
                     (profile.agency_id === agencyId && 
                      ['agency_owner', 'agency_manager', 'agency_staff'].includes(profile.role))

    if (!canAccess) {
      return NextResponse.json({ 
        error: 'Acesso negado para esta agência' 
      }, { status: 403 })
    }

    // Buscar configurações da agência (incluindo fallbacks globais)
    const settings = await globalSettings.getAllAgencySettings(agencyId, category || undefined)

    return NextResponse.json({
      success: true,
      settings,
      agency_id: agencyId,
      category: category || 'all'
    })

  } catch (error) {
    console.error('Erro ao buscar configurações da agência:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

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
      .from('user_profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Ler dados do body
    const body = await request.json()
    const { agency_id, key, value, category, description, data_type, is_encrypted, validation_rules } = body

    const agencyId = agency_id || profile.agency_id

    if (!agencyId) {
      return NextResponse.json({ error: 'ID da agência é obrigatório' }, { status: 400 })
    }

    if (!key || value === undefined) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: key, value' 
      }, { status: 400 })
    }

    // Verificar permissões (admins ou owners/managers da agência)
    const canModify = profile.role === 'admin' || 
                     (profile.agency_id === agencyId && 
                      ['agency_owner', 'agency_manager'].includes(profile.role))

    if (!canModify) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas proprietários ou gerentes da agência podem alterar configurações.' 
      }, { status: 403 })
    }

    // Definir configuração da agência
    const success = await globalSettings.setAgencySetting(agencyId, key, value, {
      category: category || 'branding',
      description,
      data_type: data_type || 'string',
      is_encrypted: is_encrypted || false,
      validation_rules
    })

    if (!success) {
      return NextResponse.json({ 
        error: 'Erro ao salvar configuração' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração salva com sucesso',
      agency_id: agencyId,
      key,
      value
    })

  } catch (error) {
    console.error('Erro ao salvar configuração da agência:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    // Ler dados do body (update em lote)
    const body = await request.json()
    const { agency_id, settings } = body

    const agencyId = agency_id || profile.agency_id

    if (!agencyId) {
      return NextResponse.json({ error: 'ID da agência é obrigatório' }, { status: 400 })
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ 
        error: 'Campo obrigatório: settings (objeto)' 
      }, { status: 400 })
    }

    // Verificar permissões (admins ou owners/managers da agência)
    const canModify = profile.role === 'admin' || 
                     (profile.agency_id === agencyId && 
                      ['agency_owner', 'agency_manager'].includes(profile.role))

    if (!canModify) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas proprietários ou gerentes da agência podem alterar configurações.' 
      }, { status: 403 })
    }

    // Atualizar configurações em lote
    const promises = []
    for (const [key, config] of Object.entries(settings as Record<string, any>)) {
      promises.push(
        globalSettings.setAgencySetting(agencyId, key, config.value, {
          category: config.category,
          description: config.description,
          data_type: config.data_type,
          is_encrypted: config.is_encrypted,
          validation_rules: config.validation_rules
        })
      )
    }

    const results = await Promise.all(promises)
    const successCount = results.filter(result => result).length

    return NextResponse.json({
      success: true,
      message: `${successCount} configurações atualizadas com sucesso`,
      agency_id: agencyId,
      total: results.length,
      successful: successCount
    })

  } catch (error) {
    console.error('Erro ao atualizar configurações da agência:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
    const agencyId = searchParams.get('agency_id') || profile.agency_id
    const key = searchParams.get('key')

    if (!agencyId) {
      return NextResponse.json({ error: 'ID da agência é obrigatório' }, { status: 400 })
    }

    if (!key) {
      return NextResponse.json({ 
        error: 'Parâmetro obrigatório: key' 
      }, { status: 400 })
    }

    // Verificar permissões (admins ou owners/managers da agência)
    const canModify = profile.role === 'admin' || 
                     (profile.agency_id === agencyId && 
                      ['agency_owner', 'agency_manager'].includes(profile.role))

    if (!canModify) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas proprietários ou gerentes da agência podem deletar configurações.' 
      }, { status: 403 })
    }

    // Deletar configuração da agência
    const success = await globalSettings.deleteAgencySetting(agencyId, key)

    if (!success) {
      return NextResponse.json({ 
        error: 'Erro ao deletar configuração' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração deletada com sucesso',
      agency_id: agencyId,
      key
    })

  } catch (error) {
    console.error('Erro ao deletar configuração da agência:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}