import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { globalSettings } from '@/lib/global-settings'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const { template_id, agency_id, scope } = body

    if (!template_id) {
      return NextResponse.json({ 
        error: 'Campo obrigatório: template_id' 
      }, { status: 400 })
    }

    // Determinar o escopo (global ou agency)
    const isGlobalScope = scope === 'global'
    const targetAgencyId = agency_id || profile.agency_id

    // Verificar permissões
    if (isGlobalScope) {
      // Apenas admins podem aplicar templates globalmente
      if (profile.role !== 'admin') {
        return NextResponse.json({ 
          error: 'Acesso negado. Apenas administradores podem aplicar templates globalmente.' 
        }, { status: 403 })
      }
    } else {
      // Para agency scope, verificar se tem permissão na agência
      if (!targetAgencyId) {
        return NextResponse.json({ error: 'ID da agência é obrigatório para escopo de agência' }, { status: 400 })
      }

      const canApply = profile.role === 'admin' || 
                      (profile.agency_id === targetAgencyId && 
                       ['agency_owner', 'agency_manager'].includes(profile.role))

      if (!canApply) {
        return NextResponse.json({ 
          error: 'Acesso negado para aplicar template nesta agência' 
        }, { status: 403 })
      }
    }

    // Verificar se o template existe
    const { data: template, error: templateError } = await supabase
      .from('settings_templates')
      .select('*')
      .eq('id', template_id)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ 
        error: 'Template não encontrado ou inativo' 
      }, { status: 404 })
    }

    // Aplicar o template
    const success = await globalSettings.applyTemplate(
      template_id, 
      isGlobalScope ? undefined : targetAgencyId
    )

    if (!success) {
      return NextResponse.json({ 
        error: 'Erro ao aplicar template' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Template "${template.name}" aplicado com sucesso`,
      template: {
        id: template.id,
        name: template.name,
        category: template.category
      },
      scope: isGlobalScope ? 'global' : 'agency',
      agency_id: isGlobalScope ? null : targetAgencyId
    })

  } catch (error) {
    console.error('Erro ao aplicar template:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}