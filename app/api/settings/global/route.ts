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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const publicOnly = searchParams.get('public') === 'true'

    // Verificar permissões
    if (!publicOnly && profile.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas administradores podem ver configurações não-públicas.' 
      }, { status: 403 })
    }

    // Buscar configurações globais
    const settings = await globalSettings.getAllGlobalSettings(category || undefined, publicOnly)

    return NextResponse.json({
      success: true,
      settings,
      category: category || 'all',
      public_only: publicOnly
    })

  } catch (error) {
    console.error('Erro ao buscar configurações globais:', error)
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Verificar permissões (apenas admins podem alterar configurações globais)
    if (profile.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas administradores podem alterar configurações globais.' 
      }, { status: 403 })
    }

    // Ler dados do body
    const body = await request.json()
    const { key, value, category, description, data_type, is_public, is_encrypted, validation_rules } = body

    if (!key || value === undefined) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: key, value' 
      }, { status: 400 })
    }

    // Definir configuração global
    const success = await globalSettings.setGlobalSetting(key, value, {
      category: category || 'system',
      description,
      data_type: data_type || 'string',
      is_public: is_public || false,
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
      key,
      value
    })

  } catch (error) {
    console.error('Erro ao salvar configuração global:', error)
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Verificar permissões (apenas admins podem alterar configurações globais)
    if (profile.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas administradores podem alterar configurações globais.' 
      }, { status: 403 })
    }

    // Ler dados do body (update em lote)
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ 
        error: 'Campo obrigatório: settings (objeto)' 
      }, { status: 400 })
    }

    // Atualizar configurações em lote
    const promises = []
    for (const [key, config] of Object.entries(settings as Record<string, any>)) {
      promises.push(
        globalSettings.setGlobalSetting(key, config.value, {
          category: config.category,
          description: config.description,
          data_type: config.data_type,
          is_public: config.is_public,
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
      total: results.length,
      successful: successCount
    })

  } catch (error) {
    console.error('Erro ao atualizar configurações globais:', error)
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Verificar permissões (apenas admins podem deletar configurações globais)
    if (profile.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas administradores podem deletar configurações globais.' 
      }, { status: 403 })
    }

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ 
        error: 'Parâmetro obrigatório: key' 
      }, { status: 400 })
    }

    // Deletar configuração global
    const success = await globalSettings.deleteGlobalSetting(key)

    if (!success) {
      return NextResponse.json({ 
        error: 'Erro ao deletar configuração' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração deletada com sucesso',
      key
    })

  } catch (error) {
    console.error('Erro ao deletar configuração global:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}