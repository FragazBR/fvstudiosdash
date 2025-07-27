import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Buscar templates de notificação
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
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Parâmetros da URL
    const url = new URL(request.url)
    const notificationType = url.searchParams.get('type')
    const onlyActive = url.searchParams.get('active') === 'true'

    // Buscar templates
    let query = supabase
      .from('notification_templates')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .order('created_at', { ascending: false })

    if (notificationType) {
      query = query.eq('notification_type', notificationType)
    }

    if (onlyActive) {
      query = query.eq('is_active', true)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Erro ao buscar templates:', error)
      return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
      total: templates?.length || 0
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Criar novo template
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

    const body = await request.json()
    const { 
      template_name, 
      notification_type, 
      title_template, 
      message_template, 
      variables = {}, 
      is_active = true, 
      is_default = false 
    } = body

    // Validações
    if (!template_name || !notification_type || !title_template || !message_template) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: template_name, notification_type, title_template, message_template' 
      }, { status: 400 })
    }

    // Verificar se já existe um template com o mesmo nome na agência
    const { data: existingTemplate } = await supabase
      .from('notification_templates')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .eq('template_name', template_name)
      .single()

    if (existingTemplate) {
      return NextResponse.json({ 
        error: 'Já existe um template com este nome' 
      }, { status: 400 })
    }

    // Se for marcado como padrão, desmarcar outros templates padrão do mesmo tipo
    if (is_default) {
      await supabase
        .from('notification_templates')
        .update({ is_default: false })
        .eq('agency_id', profile.agency_id)
        .eq('notification_type', notification_type)
    }

    // Criar template
    const { data: template, error } = await supabase
      .from('notification_templates')
      .insert({
        agency_id: profile.agency_id,
        template_name,
        notification_type,
        title_template,
        message_template,
        variables,
        is_active,
        is_default,
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
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Atualizar template existente
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
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      id,
      template_name, 
      notification_type, 
      title_template, 
      message_template, 
      variables, 
      is_active, 
      is_default 
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do template é obrigatório' }, { status: 400 })
    }

    // Verificar se o template pertence à agência
    const { data: existingTemplate } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .eq('agency_id', profile.agency_id)
      .single()

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Se estiver marcando como padrão, desmarcar outros do mesmo tipo
    if (is_default && !existingTemplate.is_default) {
      await supabase
        .from('notification_templates')
        .update({ is_default: false })
        .eq('agency_id', profile.agency_id)
        .eq('notification_type', notification_type || existingTemplate.notification_type)
        .neq('id', id)
    }

    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (template_name !== undefined) updateData.template_name = template_name
    if (notification_type !== undefined) updateData.notification_type = notification_type
    if (title_template !== undefined) updateData.title_template = title_template
    if (message_template !== undefined) updateData.message_template = message_template
    if (variables !== undefined) updateData.variables = variables
    if (is_active !== undefined) updateData.is_active = is_active
    if (is_default !== undefined) updateData.is_default = is_default

    // Atualizar template
    const { data: template, error } = await supabase
      .from('notification_templates')
      .update(updateData)
      .eq('id', id)
      .eq('agency_id', profile.agency_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar template:', error)
      return NextResponse.json({ error: 'Erro ao atualizar template' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Template atualizado com sucesso',
      template
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Excluir template
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
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do template é obrigatório' }, { status: 400 })
    }

    // Verificar se o template pertence à agência e não está sendo usado
    const { data: template } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .eq('agency_id', profile.agency_id)
      .single()

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Verificar se o template está sendo usado (opcional - para segurança)
    if (template.usage_count > 0) {
      // Pode decidir se permite exclusão ou não
      // Por agora, vamos permitir mas avisar
    }

    // Excluir template
    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', id)
      .eq('agency_id', profile.agency_id)

    if (error) {
      console.error('Erro ao excluir template:', error)
      return NextResponse.json({ error: 'Erro ao excluir template' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Template excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}