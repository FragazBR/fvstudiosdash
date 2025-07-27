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

    // Verificar permissões (admins e agency owners/managers)
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Acesso negado para templates de configuração' 
      }, { status: 403 })
    }

    // Parâmetros da query
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Buscar templates de configuração
    const templates = await globalSettings.getSettingsTemplates(category || undefined)

    return NextResponse.json({
      success: true,
      templates,
      category: category || 'all'
    })

  } catch (error) {
    console.error('Erro ao buscar templates de configuração:', error)
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

    // Verificar permissões (apenas admins podem criar templates)
    if (profile.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas administradores podem criar templates.' 
      }, { status: 403 })
    }

    // Ler dados do body
    const body = await request.json()
    const { name, description, category, template_data, is_default } = body

    if (!name || !category || !template_data) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: name, category, template_data' 
      }, { status: 400 })
    }

    // Criar template
    const { data: template, error } = await supabase
      .from('settings_templates')
      .insert({
        name,
        description,
        category,
        template_data,
        is_default: is_default || false,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar template:', error)
      return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Template criado com sucesso',
      template
    })

  } catch (error) {
    console.error('Erro ao criar template de configuração:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}